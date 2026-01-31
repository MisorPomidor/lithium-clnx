export type Rank = 'Newbie' | 'Test' | 'Main';

export interface User {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar: string;
  highestRole: string;
  rank: Rank;
  isHighStaff: boolean;
  hasAccess: boolean;
  daysUntilNextRank?: number;
}

export interface Report {
  id: string;
  userId: string;
  type: 'video' | 'screenshot';
  url: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PromotionRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  currentRank: 'Newbie' | 'Test';
  targetRank: 'Test' | 'Main';
  date: string;
  reportsCount: number;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
}

export interface Member {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  rank: Rank;
  highestRole: string;
  reportsCount: number;
  hasPendingPromotion?: boolean;
}
