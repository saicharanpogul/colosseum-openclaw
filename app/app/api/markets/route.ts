import { NextResponse } from 'next/server';
import { fetchProjects } from '@/lib/colosseum';
import { ColosseumProject } from '@/lib/types';
import { getMultipleMarketAccounts, deriveMarketPDA } from '@/lib/vapor-client';
import { supabase, upsertMarket, updateMarketFromChain, getMarketsFromDb } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Calculate odds from pools
function calculateOdds(yesPool: number, noPool: number) {
  const total = yesPool + noPool;
  if (total === 0) return { yesOdds: 50, noOdds: 50 };
  return {
    yesOdds: Math.round((noPool / total) * 100),
    noOdds: Math.round((yesPool / total) * 100),
  };
}

export async function GET() {
  try {
    // 1. Fetch projects from Colosseum
    const projects = await fetchProjects(false) as ColosseumProject[];
    
    // 2. Get existing markets from Supabase
    const existingMarkets = await getMarketsFromDb();
    const existingIds = new Set(existingMarkets.map(m => m.project_id));
    
    // 3. Create new markets in Supabase for new projects
    const newProjects = projects.filter(p => !existingIds.has(p.id));
    
    for (const project of newProjects) {
      const marketId = `vapor-market-${project.id}`;
      const [marketPDA] = deriveMarketPDA(project.id);
      const upvotes = (project.humanUpvotes || 0) + (project.agentUpvotes || 0);
      
      await upsertMarket({
        id: marketId,
        projectId: project.id,
        projectName: project.name,
        projectSlug: project.slug,
        question: `Will "${project.name}" win the Colosseum Agent Hackathon?`,
        yesPool: 1000000, // Initial liquidity
        noPool: 1000000,
        totalVolume: 0,
        yesOdds: 50,
        noOdds: 50,
        status: 'open',
        marketAddress: marketPDA.toBase58(),
        upvotes,
      });
    }
    
    // 4. Get all project IDs and fetch on-chain state
    const projectIds = projects.map(p => p.id);
    const onChainData = await getMultipleMarketAccounts(projectIds);
    
    // 5. Update Supabase with on-chain data
    for (const [projectId, data] of onChainData.entries()) {
      const marketId = `vapor-market-${projectId}`;
      await updateMarketFromChain(marketId, data.yesPool, data.noPool, data.totalVolume);
    }
    
    // 6. Get fresh markets from Supabase
    const markets = await getMarketsFromDb();
    
    // 7. Transform to frontend format
    const formattedMarkets = markets.map(m => {
      const isVapor = m.project_id === 341 || m.project_name.toLowerCase() === 'vapor';
      return {
        id: m.id,
        projectId: m.project_id,
        projectName: m.project_name,
        projectSlug: m.project_slug,
        question: m.question,
        yesPool: m.yes_pool,
        noPool: m.no_pool,
        totalVolume: m.total_volume,
        yesOdds: m.yes_odds,
        noOdds: m.no_odds,
        status: m.status,
        resolution: m.resolution,
        marketAddress: m.market_address,
        upvotes: m.upvotes,
        participants: m.participants || 0,
        createdAt: m.created_at,
        isVapor,
      };
    });
    
    // 9. Sort: Vapor first, then by volume
    formattedMarkets.sort((a, b) => {
      if (a.isVapor && !b.isVapor) return -1;
      if (!a.isVapor && b.isVapor) return 1;
      if (b.totalVolume !== a.totalVolume) return b.totalVolume - a.totalVolume;
      return (b.upvotes || 0) - (a.upvotes || 0);
    });
    
    return NextResponse.json({
      success: true,
      markets: formattedMarkets,
      projectCount: projects.length,
      onChainCount: onChainData.size,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch markets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}
