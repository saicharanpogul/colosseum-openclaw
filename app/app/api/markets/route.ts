import { NextResponse } from 'next/server';
import { fetchProjects } from '@/lib/colosseum';
import { syncMarketsFromProjects, getAllMarkets } from '@/lib/markets';
import { ColosseumProject } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch projects from Colosseum
    const projects = await fetchProjects(true);
    
    // Filter to submitted projects only for markets
    const submittedProjects = projects.filter(
      (p: ColosseumProject) => p.status === 'submitted'
    );
    
    // Sync markets with projects
    syncMarketsFromProjects(submittedProjects);
    
    // Return all markets
    const markets = getAllMarkets();
    
    return NextResponse.json({
      success: true,
      markets,
      projectCount: submittedProjects.length,
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
