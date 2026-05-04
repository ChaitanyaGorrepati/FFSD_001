// src/common/interfaces/user.interface.ts

export interface User {
  id: number;
  name: string;
  role: 'citizen' | 'officer' | 'supervisor' | 'superuser';
  departmentId?: number;
}