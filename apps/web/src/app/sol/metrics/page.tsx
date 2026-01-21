import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { TokenStats } from '../token-stats';
import { MarketData } from '../market-data';
import { TradingActivity } from '../trading-activity';
import { ExternalLink, Copy, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  formatCompactCurrency,
  formatPrecisionPrice,
} from '@bounty/ui/lib/utils';
import { ContractAddress } from './contract-address';

const BOUNTY_MINT = 'GZj4qMQFtwPpStknSaisn7shPJJ7Dv7wsuksEborBAGS';
const JUP_API_KEY = process.env.JUP_KEY || '';
const CACHE_REVALIDATE_SECONDS = 300;

export const metadata: Metadata = {
  title: '$BOUNTY Metrics | bounty.new',
  description:
    'Live analytics, market data, and trading metrics for the $BOUNTY token on Solana',
  openGraph: {
    title: '$BOUNTY Metrics | bounty.new',
    description:
      'Live analytics, market data, and trading metrics for the $BOUNTY token on Solana',
    url: 'https://bounty.new/sol/metrics',
  },
};

function getJupiterHeaders(): HeadersInit {
  const headers: HeadersInit = { accept: 'application/json' };
  if (JUP_API_KEY) {
    headers['x-api-key'] = JUP_API_KEY;
  }
  return headers;
}

interface SwapStats {
  priceChange: number | null;
  holderChange: number | null;
  liquidityChange: number | null;
  volumeChange: number | null;
  buyVolume: number | null;
  sellVolume: number | null;
  buyOrganicVolume: number | null;
  sellOrganicVolume: number | null;
  numBuys: number | null;
  numSells: number | null;
  numTraders: number | null;
}

interface JupiterTokenInfo {
  id: string;
  name: string;
  symbol: string;
  icon: string | null;
  decimals: number;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  circSupply: number | null;
  totalSupply: number | null;
  holderCount: number | null;
  fdv: number | null;
  mcap: number | null;
  usdPrice: number | null;
  liquidity: number | null;
  stats5m: SwapStats | null;
  stats1h: SwapStats | null;
  stats6h: SwapStats | null;
  stats24h: SwapStats | null;
  audit: {
    mintAuthorityDisabled: boolean | null;
    freezeAuthorityDisabled: boolean | null;
    topHoldersPercentage: number | null;
    devBalancePercentage: number | null;
  } | null;
  organicScore: number;
  organicScoreLabel: 'high' | 'medium' | 'low';
}

interface JupiterPriceResponse {
  [mint: string]: {
    decimals: number;
    usdPrice: number;
    priceChange24h: number | null;
  };
}

interface TokenData {
  price: number;
  priceChange24h: number;
  marketCap: number;
  fdv: number;
  volume24h: number;
  volumeChange24h: number;
  liquidity: number;
  liquidityChange24h: number;
  supply: number;
  circSupply: number;
  holders: number;
  holderChange24h: number;
  trades24h: number;
  numTraders24h: number;
  buyVolume24h: number;
  sellVolume24h: number;
  symbol: string;
  name: string;
}

const fetchJupiterTokenInfo = unstable_cache(
  async (): Promise<JupiterTokenInfo | null> => {
    try {
      const response = await fetch(
        `https://api.jup.ag/tokens/v2/search?query=${BOUNTY_MINT}`,
        {
          headers: getJupiterHeaders(),
          cache: 'force-cache',
        }
      );

      if (!response.ok) {
        console.warn(`Jupiter Tokens API returned ${response.status}`);
        return null;
      }

      const data: JupiterTokenInfo[] = await response.json();
      return (
        data.find((token) => token.id === BOUNTY_MINT) || data.at(0) || null
      );
    } catch (error) {
      console.error('Failed to fetch Jupiter token info:', error);
      return null;
    }
  },
  ['jupiter-token-info', BOUNTY_MINT],
  { revalidate: CACHE_REVALIDATE_SECONDS }
);

const fetchJupiterPrice = unstable_cache(
  async (): Promise<{ price: number; priceChange24h: number }> => {
    try {
      const response = await fetch(
        `https://api.jup.ag/price/v3?ids=${BOUNTY_MINT}`,
        {
          headers: getJupiterHeaders(),
          cache: 'force-cache',
        }
      );

      if (!response.ok) {
        console.warn(`Jupiter Price API returned ${response.status}`);
        return { price: 0, priceChange24h: 0 };
      }

      const data: JupiterPriceResponse = await response.json();
      const tokenData = data[BOUNTY_MINT];

      return {
        price: tokenData?.usdPrice || 0,
        priceChange24h: tokenData?.priceChange24h || 0,
      };
    } catch (error) {
      console.error('Failed to fetch Jupiter price:', error);
      return { price: 0, priceChange24h: 0 };
    }
  },
  ['jupiter-price', BOUNTY_MINT],
  { revalidate: CACHE_REVALIDATE_SECONDS }
);

function getSafeNumber(value: number | null | undefined, fallback = 0): number {
  return value ?? fallback;
}

function getSafeString(
  value: string | null | undefined,
  fallback: string
): string {
  return value ?? fallback;
}

async function fetchTokenData(): Promise<TokenData> {
  const [tokenInfo, priceData] = await Promise.all([
    fetchJupiterTokenInfo(),
    fetchJupiterPrice(),
  ]);

  const stats24h = tokenInfo?.stats24h;

  return {
    price: getSafeNumber(priceData.price || tokenInfo?.usdPrice),
    priceChange24h: getSafeNumber(
      priceData.priceChange24h || stats24h?.priceChange
    ),
    marketCap: getSafeNumber(tokenInfo?.mcap),
    fdv: getSafeNumber(tokenInfo?.fdv),
    volume24h:
      getSafeNumber(stats24h?.buyVolume) + getSafeNumber(stats24h?.sellVolume),
    volumeChange24h: getSafeNumber(stats24h?.volumeChange),
    liquidity: getSafeNumber(tokenInfo?.liquidity),
    liquidityChange24h: getSafeNumber(stats24h?.liquidityChange),
    supply: getSafeNumber(tokenInfo?.totalSupply),
    circSupply: getSafeNumber(tokenInfo?.circSupply),
    holders: getSafeNumber(tokenInfo?.holderCount),
    holderChange24h: getSafeNumber(stats24h?.holderChange),
    trades24h:
      getSafeNumber(stats24h?.numBuys) + getSafeNumber(stats24h?.numSells),
    numTraders24h: getSafeNumber(stats24h?.numTraders),
    buyVolume24h: getSafeNumber(stats24h?.buyVolume),
    sellVolume24h: getSafeNumber(stats24h?.sellVolume),
    symbol: getSafeString(tokenInfo?.symbol, 'BOUNTY'),
    name: getSafeString(tokenInfo?.name, 'Bounty'),
  };
}

export default async function SolMetricsPage() {
  const tokenData = await fetchTokenData();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />

      <section className="flex-1 px-8 pt-32 pb-24">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/sol"
              className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to $BOUNTY
            </Link>

            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-semibold text-white">
                ${tokenData.symbol} Metrics
              </h1>
            </div>
            <p className="text-[#888]">
              Real-time market data for {tokenData.name} on Solana
            </p>
          </div>

          {/* Contract Address & Actions */}
          <div className="flex flex-wrap items-center gap-2 mb-12">
            <ContractAddress address={BOUNTY_MINT} />
            <a
              href={`https://bags.fm/${BOUNTY_MINT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[29px] px-3 rounded-[7px] bg-[#303030] text-[13px] text-white hover:bg-[#3a3a3a] transition-colors flex items-center gap-1.5"
            >
              View on bags.fm
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={`https://jup.ag/swap/SOL-${BOUNTY_MINT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[29px] px-3 rounded-[7px] bg-[#303030] text-[13px] text-white hover:bg-[#3a3a3a] transition-colors flex items-center gap-1.5"
            >
              Trade on Jupiter
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Live Price */}
          <div className="mb-16">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-semibold text-white">
                {formatPrecisionPrice(tokenData.price)}
              </span>
              <span
                className={`text-sm font-medium ${
                  tokenData.priceChange24h >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {tokenData.priceChange24h >= 0 ? '+' : ''}
                {tokenData.priceChange24h.toFixed(2)}%
              </span>
              <span className="text-sm text-[#888]">24h</span>
            </div>
          </div>

          {/* Token Stats */}
          <div className="mb-16">
            <TokenStats
              marketCap={tokenData.marketCap}
              volume24h={tokenData.volume24h}
              volumeChange24h={tokenData.volumeChange24h}
              liquidity={tokenData.liquidity}
              supply={tokenData.supply}
              holders={tokenData.holders}
            />
          </div>

          {/* Market Data */}
          <div className="mb-16">
            <MarketData
              marketCap={tokenData.marketCap}
              volume24h={tokenData.volume24h}
              liquidity={tokenData.liquidity}
              price={tokenData.price}
            />
          </div>

          {/* Trading Activity */}
          <div>
            <TradingActivity
              trades24h={tokenData.trades24h}
              volume24h={tokenData.volume24h}
              buyVolume24h={tokenData.buyVolume24h}
              sellVolume24h={tokenData.sellVolume24h}
              numTraders24h={tokenData.numTraders24h}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
