// Colosseum API client

const COLOSSEUM_API = 'https://agents.colosseum.com/api';

export async function fetchProjects(includeDrafts = false): Promise<any[]> {
  const url = `${COLOSSEUM_API}/projects${includeDrafts ? '?includeDrafts=true' : ''}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return data.projects || [];
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
