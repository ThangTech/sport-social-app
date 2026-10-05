export type CopyrightCase = {
  id: string;
  postId: string;
  postMediaId: string;
  assetTitle: string;
  rightsOwnerName: string;
  confidence: number;
  status: number;
  decisionNotes?: string | null;
  appealReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  appealDeadline?: string | null;
  canAppeal: boolean;
};

export type ExternalCopyrightScan = {
  id: string;
  postId: string;
  postMediaId: string;
  mediaType: number;
  provider: string;
  status: number;
  matchSummary?: string | null;
  errorMessage?: string | null;
  reviewNotes?: string | null;
  appealReason?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  reviewedAt?: string | null;
  appealedAt?: string | null;
  appealDeadline?: string | null;
  canAppeal: boolean;
};
