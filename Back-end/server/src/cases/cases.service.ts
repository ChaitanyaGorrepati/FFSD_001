import { Injectable, NotFoundException } from '@nestjs/common';
import { Case } from '../common/interfaces/case.interface';

@Injectable()
export class CasesService {
  private cases: Case[] = [];
  private nextId = 1;

  private users = [
    { id: 1, role: 'officer', department: 'water' },
    { id: 2, role: 'officer', department: 'road' },
    { id: 3, role: 'officer', department: 'electricity' },

    { id: 101, role: 'supervisor', department: 'water' },
    { id: 102, role: 'supervisor', department: 'road' },
    { id: 103, role: 'supervisor', department: 'electricity' },
  ];

  private normalizeDept(dept: string) {
    return dept?.toLowerCase().trim();
  }

  private assignOfficer(department: string, zone: string): number {
  if (department === 'water') return 1;
  if (department === 'road') return 2;
  if (department === 'electricity') return 3;

  return 0; // or throw error
}

  create(data: any): Case {
    const normalizedDept = this.normalizeDept(data.department);

    const newCase: Case = {
      id: this.nextId++,
      ...data,
      department: normalizedDept, // 🔥 normalize here
      status: 'open',
      assignedOfficerId: this.assignOfficer(normalizedDept, data.zone),
      createdAt: new Date(),
    };

    this.cases.push(newCase);

    console.log("NEW CASE:", newCase); // debug
    console.log("ALL CASES:", this.cases); // debug

    return newCase;
  }

  findAll(role: string, userId: number): Case[] {
    console.log("ROLE:", role, "USER:", userId);
    console.log("CASES:", this.cases);

    if (role === 'citizen') {
      return this.cases.filter(c => c.citizenId === userId);
    }

    if (role === 'officer') {
      return this.cases.filter(c => c.assignedOfficerId === userId);
    }

    if (role === 'supervisor') {
      const supervisor = this.users.find(
        u => u.id === userId && u.role === 'supervisor'
      );

      if (!supervisor) {
        console.log("SUPERVISOR NOT FOUND");
        return [];
      }

      const dept = this.normalizeDept(supervisor.department);

      const filtered = this.cases.filter(
        c => this.normalizeDept(c.department) === dept
      );

      console.log("SUPERVISOR DEPT:", dept);
      console.log("FILTERED:", filtered);

      return filtered;
    }

    if (role === 'superuser') {
      return this.cases;
    }

    return [];
  }

  findOne(id: number): Case {
    const c = this.cases.find((item) => item.id === id);
    if (!c) throw new NotFoundException('Case not found');
    return c;
  }

  updateStatus(id: number, status: string): Case {
    const c = this.findOne(id);
    c.status = status as any;
    return c;
  }

  assignCase(id: number, officerId: number): Case {
    const c = this.findOne(id);
    c.assignedOfficerId = officerId;
    return c;
  }


  requestClosure(id: number) {
  const c = this.findOne(id);

  c.closureRequested = true;
  c.closureStatus = 'pending';

  return c;
}

handleClosureDecision(id: number, decision: 'approved' | 'rejected') {
  const c = this.findOne(id);

  if (!c.closureRequested) {
    throw new NotFoundException('Closure not requested');
  }

  c.closureStatus = decision;

  if (decision === 'approved') {
    c.status = 'closed';
  }

  return c;
}
}