import { Injectable, NotFoundException } from '@nestjs/common';
import { Case } from '../common/interfaces/case.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class CasesService {
  constructor(private usersService: UsersService) {} // ✅ INJECT

  private cases: Case[] = [];
  private nextId = 1;

  // ── HELPERS ───────────────────────────────────
  private normalizeDept(dept?: string) {
    return dept ? dept.toLowerCase().trim() : "";
  }

  // ✅ NOW USE USERS SERVICE
private assignOfficer(department: string, zone?: string): number {
  const normalizedDept = this.normalizeDept(department);
  
  const allUsers = this.usersService.findAll();
const normalizedZone = zone
  ? zone.toLowerCase().replace("zone", "").trim()
  : null;

let officers = allUsers.filter(u =>
  u.role === 'officer' &&
  u.department &&
  this.normalizeDept(u.department) === normalizedDept &&
  u.zone &&
  u.zone.toLowerCase().replace("zone", "").trim() === normalizedZone
);

  // 2️⃣ Fallback: ANY officer in department
  if (officers.length === 0) {
    officers = allUsers.filter(u =>
      u.role === 'officer' &&
      u.department &&
      this.normalizeDept(u.department) === normalizedDept
    );
  }

  if (officers.length === 0) {
    console.log("⚠️ No officer found for dept:", department);
    return 0;
  }

  return officers[0].id;
}

  // ── CREATE ────────────────────────────────────
  create(data: any): Case {
    const normalizedDept = this.normalizeDept(data.department);

    const newCase: Case = {
      id: this.nextId++,
      ...data,
      department: normalizedDept,
      status: 'open',
      assignedOfficerId: this.assignOfficer(normalizedDept, data.zone),
      createdAt: new Date(),

      transferRequested: false,
      transferTo: undefined,
      transferStatus: undefined,
    };

    this.cases.push(newCase);
    return newCase;
  }

  // ── READ ──────────────────────────────────────
  findAll(role: string, userId: number): Case[] {
    if (role === 'citizen') {
      return this.cases.filter(c => c.citizenId === userId);
    }

    if (role === 'officer') {
      return this.cases.filter(c => c.assignedOfficerId === userId);
    }

    if (role === 'supervisor') {
      const supervisor = this.usersService.findAll().find(
        u => u.id === userId && u.role === 'supervisor'
      );

      if (!supervisor) return [];

      const dept = this.normalizeDept(supervisor.department || "");

      return this.cases.filter(c => {
        const currentDept = this.normalizeDept(c.department);
        const targetDept = c.transferTo
          ? this.normalizeDept(c.transferTo)
          : null;

        return (
          currentDept === dept ||
          (
            c.transferRequested === true &&
            c.transferStatus === "forwarded" &&
            targetDept === dept
          )
        );
      });
    }

    if (role === 'superuser') {
      return this.cases;
    }

    return [];
  }

  findOne(id: number): Case {
    const c = this.cases.find(item => item.id === id);
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

  // ── CLOSURE ───────────────────────────────────
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

  // ── TRANSFER ──────────────────────────────────
  requestTransfer(id: number, toDepartment: string): Case {
    const c = this.findOne(id);

    c.transferRequested = true;
    c.transferTo = this.normalizeDept(toDepartment);
    c.transferStatus = 'pending';

    return c;
  }

  transferDecision(id: number, decision: string, userId: number): Case {
    const c = this.findOne(id);

    const supervisor = this.usersService.findAll().find(
      u => u.id === userId && u.role === 'supervisor'
    );

    if (!supervisor) {
      throw new NotFoundException("Supervisor not found");
    }

    const currentDept = this.normalizeDept(c.department);
    const supervisorDept = this.normalizeDept(supervisor.department || "");
    const targetDept = c.transferTo
      ? this.normalizeDept(c.transferTo)
      : undefined;

    if (supervisorDept === currentDept) {
      if (decision === "approved") {
        c.transferStatus = "forwarded";
      } else {
        c.transferStatus = "rejected";
        c.transferRequested = false;
      }
    }

    else if (targetDept && supervisorDept === targetDept) {
      if (decision === "approved") {
        c.department = targetDept;
        c.transferStatus = "approved";
        c.transferRequested = false;

        // 🔥 dynamic reassignment from real users
        c.assignedOfficerId = this.assignOfficer(targetDept, c.zone);
      } else {
        c.transferStatus = "rejected";
        c.transferRequested = false;
      }
    }

    return c;
  }
}