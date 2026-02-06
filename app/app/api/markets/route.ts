import { NextResponse } from 'next/server';
import { fetchProjects } from '@/lib/colosseum';
import { syncMarketsFromProjects, getAllMarkets, getAllProjectIds, updateMarketsWithOnChainData } from '@/lib/markets';
import { ColosseumProject } from '@/lib/types';
import { getMultipleMarketAccounts } from '@/lib/vapor-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch submitted projects from Colosseum (no drafts)
    const projects = await fetchProjects(false);
    
    // Sync markets with projects
    syncMarketsFromProjects(projects as ColosseumProject[]);
    
    // Get all project IDs and fetch on-chain state
    const projectIds = getAllProjectIds();
    const onChainData = await getMultipleMarketAccounts(projectIds);
    
    // Update markets with on-chain data (pools, volume)
    updateMarketsWithOnChainData(onChainData);
    
    // Return all markets
    const markets = getAllMarkets();
    
    return NextResponse.json({
      success: true,
      markets,
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
