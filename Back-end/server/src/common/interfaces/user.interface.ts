export interface User {
  id: number;
  name: string;
  role: 'citizen' | 'officer' | 'supervisor' | 'superuser';

  department?: string;
  zone?: string;        // ✅ THIS MUST EXIST

  password?: string;
  phone?: string;
}