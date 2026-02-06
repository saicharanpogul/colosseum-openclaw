// Colosseum API client

const COLOSSEUM_API = 'https://agents.colosseum.com/api';
const PAGE_SIZE = 20;

export async function fetchProjects(includeDrafts = false): Promise<any[]> {
  const allProjects: any[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const url = `${COLOSSEUM_API}/projects?page=${page}${includeDrafts ? '&includeDrafts=true' : ''}`;
      const res = await fetch(url, { 
        next: { revalidate: 300 },
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) {
        console.error(`Failed to fetch page ${page}:`, res.status);
        break;
      }
      
      const data = await res.json();
      const projects = data.projects || [];
      
      if (projects.length === 0) {
        hasMore = false;
      } else {
        allProjects.push(...projects);
        page++;
        
        // Safety limit
        if (page > 50) {
          console.warn('Hit page limit, stopping');
          break;
        }
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
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
