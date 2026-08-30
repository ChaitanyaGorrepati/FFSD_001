export interface Case {
  id: number;
  title: string;
  description: string;

  status: 'open' | 'in-progress' | 'closed';

  citizenId: number;
  assignedOfficerId: number;

  department: string;
  category: string;
  zone: string;
  priority: 'low' | 'medium' | 'high';

  createdAt: Date;

  // ── CLOSURE ─────────────────────────
  closureRequested?: boolean;
  closureStatus?: 'pending' | 'approved' | 'rejected';

  // ── TRANSFER ────────────────────────
  transferRequested?: boolean;
  transferTo?: string;

  // 🔥 IMPORTANT: add "forwarded"
  transferStatus?: 'pending' | 'forwarded' | 'approved' | 'rejected';
}