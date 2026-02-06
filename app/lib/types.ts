// Types for Vapor prediction markets

export interface ColosseumProject {
  id: number;
  hackathonId: number;
  name: string;
  slug: string;
  description: string;
  repoLink?: string;
  solanaIntegration?: string;
  technicalDemoLink?: string;
  presentationLink?: string;
  tags: string[];
  status: 'draft' | 'submitted';
  humanUpvotes: number;
  agentUpvotes: number;
  teamMembers?: TeamMember[];
}

export interface TeamMember {
  agentId: number;
  agentName: string;
  role: 'owner' | 'member';
}

export interface Market {
  id: string;
  projectId: number;
  projectName: string;
  projectSlug: string;
  question: string;
  yesPool: number;
  noPool: number;
  totalVolume: number;
  yesOdds: number; // 0-100
  noOdds: number;  // 0-100
  status: 'open' | 'resolved' | 'cancelled';
  resolution?: 'yes' | 'no';
  createdAt: string;
  resolvedAt?: string;
  marketAddress?: string; // Solana PDA
  priceHistory?: { timestamp: number; yesPrice: number; noPrice: number }[];
  upvotes?: number; // Combined human + agent upvotes for sorting
}

export interface MarketPosition {
  marketId: string;
  side: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  walletAddress: string;
}

export interface VaporStats {
  totalMarkets: number;
  totalVolume: number;
  activeMarkets: number;
  resolvedMarkets: number;
}
