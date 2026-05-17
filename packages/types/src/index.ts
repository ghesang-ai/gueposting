export type UserRole = 'user' | 'admin';
export type PostType = 'review' | 'photo' | 'video' | 'discussion';
export type GadgetCategory = 'smartphone' | 'laptop' | 'tablet' | 'wearable' | 'audio' | 'other';
export type CompareStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface GadgetSpecs {
  camera?: string;
  battery?: string;
  processor?: string;
  display?: string;
  ram?: string;
  storage?: string;
  os?: string;
  price?: number;
  [key: string]: unknown;
}

export interface CategoryScore {
  score: number;
  justification: string;
}

export interface GadgetCompareScore {
  overall: number;
  camera: CategoryScore;
  battery: CategoryScore;
  performance: CategoryScore;
  display: CategoryScore;
  ecosystem: CategoryScore;
  sentimentScore: number;
  topComplaints: string[];
  topPraises: string[];
}

export interface ComparisonScores {
  [gadgetId: string]: GadgetCompareScore;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
