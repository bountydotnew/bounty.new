import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { SolHero } from './sol-hero';

const BOUNTY_MINT = 'GZj4qMQFtwPpStknSaisn7shPJJ7Dv7wsuksEborBAGS';
const JUP_API_KEY = process.env.JUP_KEY || '';
const CACHE_REVALIDATE_SECONDS = 300;

export const metadata: Metadata = {
  title: '$BOUNTY Token | bounty.new',
  description:
    'Hold $BOUNTY tokens and get Bounty Pro free. Live analytics and market data for the $BOUNTY token on Solana',
  openGraph: {
    title: '$BOUNTY Token | bounty.new',
    description:
      'Hold $BOUNTY tokens and get Bounty Pro free. Live analytics and market data for the $BOUNTY token on Solana',
    url: 'https://bounty.new/sol',
  },
};

function getJupiterHeaders(): HeadersInit {
  const headers: HeadersInit = { accept: 'application/json' };
  if (JUP_API_KEY) {
    headers['x-api-key'] = JUP_API_KEY;
  }
  return headers;
}

interface JupiterTokenInfo {
  id: string;
  name: string;
  symbol: string;
  usdPrice: number | null;
  stats24h: {
    priceChange: number | null;
  } | null;
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
  symbol: string;
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

  return {
    price: priceData.price || tokenInfo?.usdPrice || 0,
    priceChange24h:
      priceData.priceChange24h || tokenInfo?.stats24h?.priceChange || 0,
    symbol: getSafeString(tokenInfo?.symbol, 'BOUNTY'),
  };
}

export default async function SolPage() {
  const tokenData = await fetchTokenData();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />

      <section className="flex-1 flex items-center justify-center min-h-screen">
        <SolHero
          price={tokenData.price}
          priceChange24h={tokenData.priceChange24h}
          symbol={tokenData.symbol}
        />
      </section>

      <Footer />
    </div>
  );
}
