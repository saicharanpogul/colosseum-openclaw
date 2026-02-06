// Colosseum API client

const COLOSSEUM_API = 'https://agents.colosseum.com/api';
const PAGE_SIZE = 20;

export async function fetchProjects(includeDrafts = false): Promise<any[]> {
  const allProjects: any[] = [];
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const url = `${COLOSSEUM_API}/projects?offset=${offset}${includeDrafts ? '&includeDrafts=true' : ''}`;
      const res = await fetch(url, { 
        next: { revalidate: 300 },
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) {
        console.error(`Failed to fetch offset ${offset}:`, res.status);
        break;
      }
      
      const data = await res.json();
      const projects = data.projects || [];
      
      allProjects.push(...projects);
      
      // Use the hasMore flag from API
      hasMore = data.hasMore === true && projects.length > 0;
      offset += PAGE_SIZE;
      
      // Safety limit (200 pages = 4000 projects max)
      if (offset > 4000) {
        console.warn('Hit offset limit (4000), stopping');
        break;
      }
    } catch (error) {
      console.error(`Error fetching offset ${offset}:`, error);
      break;
    }
  }
  
  console.log(`Fetched ${allProjects.length} projects from Colosseum`);
  return allProjects;
}

export async function fetchProject(slug: string): Promise<any> {
  const res = await fetch(`${COLOSSEUM_API}/projects/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Project not found');
  return res.json();
}

export async function fetchLeaderboard(): Promise<any> {
  const res = await fetch(`${COLOSSEUM_API}/leaderboard`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function fetchActiveHackathon(): Promise<any> {
  const res = await fetch(`${COLOSSEUM_API}/hackathons/active`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('No active hackathon');
  return res.json();
}
