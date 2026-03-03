export type LeadStatus = 'Novo' | 'Contatado' | 'Respondeu' | 'Fechado' | 'Descartado';

export interface ScoreBreakdown {
  followers: number;
  bioKeywords: number;
  contactInBio: number;
}

export interface Lead {
  id: number;
  username: string;
  fullName: string | null;
  bio: string | null;
  followers: number;
  following: number;
  postsCount: number;
  profileUrl: string;
  avatarUrl: string | null;
  nicho: string;
  location: string | null;
  score: number;
  scoreBreakdown: string;
  status: LeadStatus;
  statusUpdatedAt: Date | null;
  collectedAt: Date;
}

export interface Message {
  id: number;
  leadId: number;
  content: string;
  approved: boolean;
  createdAt: Date;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  updatedAt: Date;
}

export interface DashboardKPIs {
  totalLeads: number;
  newToday: number;
  pendingApprovals: number;
  responseRate: number;
  closedLeads: number;
  leadsPerDay: { date: string; count: number }[];
}

export interface ScoringConfig {
  followersWeight: number;
  bioWeight: number;
  contactWeight: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}
