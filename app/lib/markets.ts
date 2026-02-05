// Simulated on-chain market state
// In production, this would be stored on Solana via a program

import { Market, ColosseumProject } from './types';
import { deriveMarketPDA } from './solana';

interface MarketStore {
  markets: Map<string, Market>;
  initialized: boolean;
}

const store: MarketStore = {
  markets: new Map(),
  initialized: false,
};

export function createMarketId(projectId: number): string {
  return `vapor-market-${projectId}`;
}

export function calculateOdds(yesPool: number, noPool: number): { yesOdds: number; noOdds: number } {
  const total = yesPool + noPool;
  if (total === 0) return { yesOdds: 50, noOdds: 50 };
  return {
    yesOdds: Math.round((noPool / total) * 100),
    noOdds: Math.round((yesPool / total) * 100),
  };
}

export function calculateSharesForBuy(
  pool: number,
  oppositePool: number,
  amount: number
): number {
  // CPMM formula
  const k = pool * oppositePool;
  const newOppositePool = oppositePool + amount;
  const newPool = k / newOppositePool;
  return pool - newPool;
}

export function createMarketFromProject(project: ColosseumProject): Market {
  const id = createMarketId(project.id);
  const [marketPDA] = deriveMarketPDA(project.id);
  
  // Initial liquidity
  const initialLiquidity = 1000;
  
  const market: Market = {
    id,
    projectId: project.id,
    projectName: project.name,
    projectSlug: project.slug,
    question: `Will "${project.name}" win the Colosseum Agent Hackathon?`,
    yesPool: initialLiquidity,
    noPool: initialLiquidity,
    totalVolume: 0,
    yesOdds: 50,
    noOdds: 50,
    status: 'open',
    createdAt: new Date().toISOString(),
    marketAddress: marketPDA.toBase58(),
  };
  
  store.markets.set(id, market);
  return market;
}

export function getMarket(id: string): Market | undefined {
  return store.markets.get(id);
}

export function getAllMarkets(): Market[] {
  return Array.from(store.markets.values()).sort((a, b) => {
    // Sort by total volume descending
    return b.totalVolume - a.totalVolume || b.yesOdds - a.yesOdds;
  });
}

export function buyShares(
  marketId: string,
  side: 'yes' | 'no',
  amount: number
): { market: Market; shares: number } | undefined {
  const market = store.markets.get(marketId);
  if (!market || market.status !== 'open') return undefined;
  
  let shares: number;
  
  if (side === 'yes') {
    shares = calculateSharesForBuy(market.yesPool, market.noPool, amount);
    market.noPool += amount;
    market.yesPool -= shares;
  } else {
    shares = calculateSharesForBuy(market.noPool, market.yesPool, amount);
    market.yesPool += amount;
    market.noPool -= shares;
  }
  
  market.totalVolume += amount;
  const odds = calculateOdds(market.yesPool, market.noPool);
  market.yesOdds = odds.yesOdds;
  market.noOdds = odds.noOdds;
  
  return { market, shares };
}

export function resolveMarket(id: string, winner: boolean): Market | undefined {
  const market = store.markets.get(id);
  if (!market) return undefined;
  
  market.status = 'resolved';
  market.resolution = winner ? 'yes' : 'no';
  market.resolvedAt = new Date().toISOString();
  
  return market;
}

export function syncMarketsFromProjects(projects: ColosseumProject[]): Market[] {
  const newMarkets: Market[] = [];
  
  for (const project of projects) {
    const marketId = createMarketId(project.id);
    if (!store.markets.has(marketId)) {
      const market = createMarketFromProject(project);
      newMarkets.push(market);
    }
  }
  
  store.initialized = true;
  return newMarkets;
}

export function getMarketStats() {
  const markets = getAllMarkets();
  return {
    totalMarkets: markets.length,
    activeMarkets: markets.filter(m => m.status === 'open').length,
    resolvedMarkets: markets.filter(m => m.status === 'resolved').length,
    totalVolume: markets.reduce((sum, m) => sum + m.totalVolume, 0),
  };
}
