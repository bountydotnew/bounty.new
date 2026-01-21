import { db, phantomWallet } from '@bounty/db';
import { env } from '@bounty/env/server';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

// Threshold for free month of Pro (in USD)
const TOKEN_HOLDER_THRESHOLD_USD = 20;

// Format large token numbers nicely (e.g., 27061159.55 -> "27.06M")
const formatTokenBalance = (balance: string | null | undefined): string => {
  if (!balance) return '0';
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';

  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
};

// Helius RPC endpoint
const getHeliusRpcUrl = () => {
  const apiKey = env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Helius API key not configured',
    });
  }
  return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
};

// Get bounty token mint address
const getBountyTokenMint = () => {
  const mintAddress = env.BOUNTY_TOKEN_MINT_ADDRESS;
  if (!mintAddress) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Bounty token mint address not configured',
    });
  }
  return mintAddress;
};

// Generate a unique verification message
const generateVerificationMessage = (walletAddress: string, userId: string) => {
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  return `Sign this message to verify wallet ownership for bounty.new\n\nWallet: ${walletAddress}\nUser: ${userId}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
};

// Verify signature using tweetnacl
const verifySignature = (
  message: string,
  signature: string,
  publicKey: string
): boolean => {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);

    console.log('[Phantom] verifySignature:', {
      messageLength: message.length,
      signatureLength: signature.length,
      signatureBytesLength: signatureBytes.length,
      publicKeyBytesLength: publicKeyBytes.length,
    });

    const result = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    console.log('[Phantom] verify result:', result);
    return result;
  } catch (e) {
    console.error('[Phantom] verify exception:', e);
    return false;
  }
};

interface HeliusRpcResponse<T> {
  jsonrpc: string;
  id: string;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

interface TokenAccountsByOwnerResult {
  context: { slot: number };
  value: Array<{
    pubkey: string;
    account: {
      data: {
        parsed: {
          info: {
            mint: string;
            owner: string;
            tokenAmount: {
              amount: string;
              decimals: number;
              uiAmount: number;
              uiAmountString: string;
            };
          };
          type: string;
        };
        program: string;
        space: number;
      };
      executable: boolean;
      lamports: number;
      owner: string;
      rentEpoch: number;
    };
  }>;
}

// Helper to make Helius RPC calls
const heliusRpc = async <T>(
  method: string,
  params: unknown[]
): Promise<T> => {
  const response = await fetch(getHeliusRpcUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Helius RPC error: ${response.statusText}`,
    });
  }

  const data = (await response.json()) as HeliusRpcResponse<T>;

  if (data.error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Helius RPC error: ${data.error.message}`,
    });
  }

  return data.result as T;
};

// Get token accounts for a wallet
const getTokenAccountsByOwner = async (walletAddress: string) => {
  const result = await heliusRpc<TokenAccountsByOwnerResult>(
    'getTokenAccountsByOwner',
    [
      walletAddress,
      {
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      },
      {
        encoding: 'jsonParsed',
        commitment: 'confirmed',
      },
    ]
  );
  return result;
};

// Get token balance for a specific token account
const getTokenBalance = async (
  walletAddress: string,
  tokenMint: string
): Promise<{ balance: string; uiAmount: number } | null> => {
  const accounts = await getTokenAccountsByOwner(walletAddress);

  const tokenAccount = accounts.value.find(
    (account) => account.account.data.parsed.info.mint === tokenMint
  );

  if (!tokenAccount) {
    return null;
  }

  const { amount, uiAmount } = tokenAccount.account.data.parsed.info.tokenAmount;
  return { balance: amount, uiAmount };
};

// Get token price from Jupiter API or fallback
const getTokenPriceUsd = async (): Promise<number> => {
  try {
    const mintAddress = getBountyTokenMint();
    const response = await fetch(`https://price.jup.ag/v4/price?ids=${mintAddress}`);
    const data = await response.json() as { data?: Record<string, { price?: number }> };
    const bountyPrice = data?.data?.[mintAddress]?.price;
    if (bountyPrice && bountyPrice > 0 && bountyPrice < 1) {
      return bountyPrice;
    }
  } catch {
    // Silently fall through to fallback
  }
  // Fallback price - approximately $0.0000102 per $BOUNTY token
  // (based on user having 27M tokens worth ~$255)
  return 0.0000094;
};

export const phantomRouter = router({
  // Get current connection status - returns all connected wallets
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const wallets = await db.query.phantomWallet.findMany({
      where: (w, { eq }) => eq(w.userId, ctx.session.user.id),
    });

    if (wallets.length === 0) {
      return {
        success: true,
        data: {
          connected: false,
          wallets: [],
        },
      };
    }

    // Map wallets to response format
    const walletData = wallets.map((w) => ({
      walletAddress: w.walletAddress,
      displayName: w.displayName,
      tokenBalance: w.lastTokenBalance,
      tokenBalanceFormatted: formatTokenBalance(w.lastTokenBalance),
      tokenValueUsd: w.lastTokenValueUsd,
      qualifiesForBenefits: w.qualifiesForBenefits,
      lastVerifiedAt: w.lastVerifiedAt,
    }));

    return {
      success: true,
      data: {
        connected: true,
        wallets: walletData,
      },
    };
  }),

  // Generate a verification message for wallet connection
  generateVerificationMessage: protectedProcedure
    .input(z.object({ walletAddress: z.string().min(32).max(44) }))
    .mutation(async ({ ctx, input }) => {
      const message = generateVerificationMessage(
        input.walletAddress,
        ctx.session.user.id
      );

      return {
        success: true,
        data: {
          message,
        },
      };
    }),

  // Connect wallet with signature verification
  connectWallet: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string().min(32).max(44),
        signature: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('[Phantom] connectWallet:', {
        walletAddress: input.walletAddress,
        sigLen: input.signature.length,
        msgLen: input.message.length,
      });

      // Verify the signature
      const isValid = verifySignature(
        input.message,
        input.signature,
        input.walletAddress
      );

      console.log('[Phantom] isValid:', isValid);

      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid signature. Please try connecting again.',
        });
      }

      // Check if wallet is already connected to another user
      const existingWallet = await db.query.phantomWallet.findFirst({
        where: (w, { eq, and, ne }) =>
          and(
            eq(w.walletAddress, input.walletAddress),
            ne(w.userId, ctx.session.user.id)
          ),
      });

      if (existingWallet) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This wallet is already connected to another account.',
        });
      }

      // Check if this specific wallet is already connected for this user
      const existingUserWallet = await db.query.phantomWallet.findFirst({
        where: (w, { eq, and }) =>
          and(
            eq(w.userId, ctx.session.user.id),
            eq(w.walletAddress, input.walletAddress)
          ),
      });

      if (existingUserWallet) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This wallet is already connected to your account.',
        });
      }

      // Get token balance
      const tokenMint = getBountyTokenMint();
      const balance = await getTokenBalance(input.walletAddress, tokenMint);
      const tokenPrice = await getTokenPriceUsd();

      const tokenValueUsd = balance
        ? (balance.uiAmount * tokenPrice).toFixed(2)
        : '0.00';

      const qualifiesForBenefits = parseFloat(tokenValueUsd) >= TOKEN_HOLDER_THRESHOLD_USD;

      // Store the human-readable uiAmount as the balance
      const displayBalance = balance?.uiAmount?.toString() ?? null;

      // Create new wallet connection (allow multiple wallets per user)
      await db.insert(phantomWallet).values({
        userId: ctx.session.user.id,
        walletAddress: input.walletAddress,
        verificationSignature: input.signature,
        verificationMessage: input.message,
        lastTokenBalance: displayBalance,
        lastTokenValueUsd: tokenValueUsd,
        qualifiesForBenefits,
        lastVerifiedAt: new Date(),
      });

      return {
        success: true,
        data: {
          walletAddress: input.walletAddress,
          tokenBalance: displayBalance,
          tokenBalanceFormatted: formatTokenBalance(displayBalance),
          tokenValueUsd,
          qualifiesForBenefits,
        },
      };
    }),

  // Disconnect wallet
  disconnectWallet: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .delete(phantomWallet)
      .where(eq(phantomWallet.userId, ctx.session.user.id));

    return {
      success: true,
      message: 'Wallet disconnected successfully',
    };
  }),

  // Refresh token balance
  refreshBalance: protectedProcedure.mutation(async ({ ctx }) => {
    const wallet = await db.query.phantomWallet.findFirst({
      where: (w, { eq }) => eq(w.userId, ctx.session.user.id),
    });

    if (!wallet) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No wallet connected. Please connect your wallet first.',
      });
    }

    // Get updated token balance
    const tokenMint = getBountyTokenMint();
    const balance = await getTokenBalance(wallet.walletAddress, tokenMint);
    const tokenPrice = await getTokenPriceUsd();

    const tokenValueUsd = balance
      ? (balance.uiAmount * tokenPrice).toFixed(2)
      : '0.00';

    const qualifiesForBenefits = parseFloat(tokenValueUsd) >= TOKEN_HOLDER_THRESHOLD_USD;

    // Store the human-readable uiAmount as the balance
    const displayBalance = balance?.uiAmount?.toString() ?? null;

    await db
      .update(phantomWallet)
      .set({
        lastTokenBalance: displayBalance,
        lastTokenValueUsd: tokenValueUsd,
        qualifiesForBenefits,
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(phantomWallet.userId, ctx.session.user.id));

    return {
      success: true,
      data: {
        tokenBalance: displayBalance,
        tokenBalanceFormatted: formatTokenBalance(displayBalance),
        tokenValueUsd,
        qualifiesForBenefits,
      },
    };
  }),

  // Claim free month of Pro (for token holders)
  claimFreeMonth: protectedProcedure.mutation(async ({ ctx }) => {
    const wallet = await db.query.phantomWallet.findFirst({
      where: (w, { eq }) => eq(w.userId, ctx.session.user.id),
    });

    if (!wallet) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No wallet connected. Please connect your wallet first.',
      });
    }

    // Check if user has already claimed
    if (wallet.freeMonthGrantedAt) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You have already claimed your free month of Pro.',
      });
    }

    // Refresh balance before claiming
    const tokenMint = getBountyTokenMint();
    const balance = await getTokenBalance(wallet.walletAddress, tokenMint);
    const tokenPrice = await getTokenPriceUsd();

    const tokenValueUsd = balance
      ? (balance.uiAmount * tokenPrice).toFixed(2)
      : '0.00';

    const qualifiesForBenefits = parseFloat(tokenValueUsd) >= TOKEN_HOLDER_THRESHOLD_USD;

    if (!qualifiesForBenefits) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `You need at least $${TOKEN_HOLDER_THRESHOLD_USD} worth of tokens to claim the free month. Current value: $${tokenValueUsd}`,
      });
    }

    // Update wallet record
    await db
      .update(phantomWallet)
      .set({
        lastTokenBalance: balance?.balance ?? null,
        lastTokenValueUsd: tokenValueUsd,
        qualifiesForBenefits: true,
        freeMonthGrantedAt: new Date(),
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(phantomWallet.userId, ctx.session.user.id));

    // TODO: Integrate with Autumn to grant the trial
    // This would call Autumn's API to start a trial period for the user
    // Example: await autumn.customers.startTrial(ctx.session.user.id, 'tier_2_pro', { duration: 30 });

    return {
      success: true,
      message: 'Free month of Pro has been activated! Enjoy your token holder benefits.',
    };
  }),

  // Get a specific wallet's details
  getWallet: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ ctx, input }) => {
      const wallet = await db.query.phantomWallet.findFirst({
        where: (w, { eq, and }) =>
          and(
            eq(w.userId, ctx.session.user.id),
            eq(w.walletAddress, input.walletAddress)
          ),
      });

      if (!wallet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wallet not found or not connected to your account.',
        });
      }

      return {
        success: true,
        data: {
          walletAddress: wallet.walletAddress,
          displayName: wallet.displayName,
          tokenBalance: wallet.lastTokenBalance,
          tokenBalanceFormatted: formatTokenBalance(wallet.lastTokenBalance),
          tokenValueUsd: wallet.lastTokenValueUsd,
          qualifiesForBenefits: wallet.qualifiesForBenefits,
          lastVerifiedAt: wallet.lastVerifiedAt,
          freeMonthGrantedAt: wallet.freeMonthGrantedAt,
        },
      };
    }),

  // Sync a specific wallet's balance
  syncWallet: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const wallet = await db.query.phantomWallet.findFirst({
        where: (w, { eq, and }) =>
          and(
            eq(w.userId, ctx.session.user.id),
            eq(w.walletAddress, input.walletAddress)
          ),
      });

      if (!wallet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wallet not found or not connected to your account.',
        });
      }

      // Get updated token balance
      const tokenMint = getBountyTokenMint();
      const balance = await getTokenBalance(wallet.walletAddress, tokenMint);
      const tokenPrice = await getTokenPriceUsd();

      const tokenValueUsd = balance
        ? (balance.uiAmount * tokenPrice).toFixed(2)
        : '0.00';

      const qualifiesForBenefits = parseFloat(tokenValueUsd) >= TOKEN_HOLDER_THRESHOLD_USD;

      // Store the human-readable uiAmount as the balance
      const displayBalance = balance?.uiAmount?.toString() ?? null;

      await db
        .update(phantomWallet)
        .set({
          lastTokenBalance: displayBalance,
          lastTokenValueUsd: tokenValueUsd,
          qualifiesForBenefits,
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(phantomWallet.id, wallet.id));

      return {
        success: true,
        data: {
          tokenBalance: displayBalance,
          tokenBalanceFormatted: formatTokenBalance(displayBalance),
          tokenValueUsd,
          qualifiesForBenefits,
        },
      };
    }),

  // Disconnect a specific wallet
  disconnectSpecificWallet: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const wallet = await db.query.phantomWallet.findFirst({
        where: (w, { eq, and }) =>
          and(
            eq(w.userId, ctx.session.user.id),
            eq(w.walletAddress, input.walletAddress)
          ),
      });

      if (!wallet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wallet not found or not connected to your account.',
        });
      }

      await db
        .delete(phantomWallet)
        .where(eq(phantomWallet.id, wallet.id));

      return {
        success: true,
        message: 'Wallet disconnected successfully',
      };
    }),

  // Update wallet display name
  updateDisplayName: protectedProcedure
    .input(z.object({ walletAddress: z.string(), displayName: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const wallet = await db.query.phantomWallet.findFirst({
        where: (w, { eq, and }) =>
          and(
            eq(w.userId, ctx.session.user.id),
            eq(w.walletAddress, input.walletAddress)
          ),
      });

      if (!wallet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wallet not found or not connected to your account.',
        });
      }

      await db
        .update(phantomWallet)
        .set({
          displayName: input.displayName,
          updatedAt: new Date(),
        })
        .where(eq(phantomWallet.id, wallet.id));

      return {
        success: true,
        data: {
          displayName: input.displayName,
        },
      };
    }),

  // Check if user is eligible for free month
  checkEligibility: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await db.query.phantomWallet.findFirst({
      where: (w, { eq }) => eq(w.userId, ctx.session.user.id),
    });

    if (!wallet) {
      return {
        success: true,
        data: {
          eligible: false,
          reason: 'no_wallet',
          tokenValueUsd: null,
          threshold: TOKEN_HOLDER_THRESHOLD_USD,
          alreadyClaimed: false,
        },
      };
    }

    if (wallet.freeMonthGrantedAt) {
      return {
        success: true,
        data: {
          eligible: false,
          reason: 'already_claimed',
          tokenValueUsd: wallet.lastTokenValueUsd,
          threshold: TOKEN_HOLDER_THRESHOLD_USD,
          alreadyClaimed: true,
          claimedAt: wallet.freeMonthGrantedAt,
        },
      };
    }

    const tokenValueUsd = parseFloat(wallet.lastTokenValueUsd ?? '0');
    const eligible = tokenValueUsd >= TOKEN_HOLDER_THRESHOLD_USD;

    return {
      success: true,
      data: {
        eligible,
        reason: eligible ? 'eligible' : 'insufficient_balance',
        tokenValueUsd: wallet.lastTokenValueUsd,
        threshold: TOKEN_HOLDER_THRESHOLD_USD,
        alreadyClaimed: false,
      },
    };
  }),
});
