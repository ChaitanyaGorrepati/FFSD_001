export interface Case {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'closed';
  citizenId: number;
  assignedOfficerId: number;
  department: string;
  zone: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  closureRequested?: boolean;
closureStatus?: 'pending' | 'approved' | 'rejected';
}

