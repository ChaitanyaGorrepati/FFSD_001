
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../common/interfaces/user.interface';

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: 1, name: "Admin", role: "superuser", password: "admin123" },

    { id: 2, name: "Kiran", role: "supervisor", department: "electricity" },
    { id: 3, name: "Kishore", role: "supervisor", department: "sanitation" },

    { id: 4, name: "Ali", role: "officer", department: "electricity", zone: "A" },
    { id: 5, name: "John", role: "officer", department: "sanitation", zone: "B" }
  ];
  private nextId = 6;

  create(user: any): User {
    if (
      user.role === 'superuser' ||
      (user.role !== 'officer' && user.role !== 'supervisor' && user.role !== 'citizen')
    ) {
      throw new BadRequestException('Invalid user role. Superuser cannot be created via user management.');
    }

    const newUser: User = {
      id: this.nextId++,
      name: user.name,
      role: user.role,
      department: user.department,
      zone: user.zone,
      phone: user.phone,
      password: user.password
    };

    this.users.push(newUser);
    return newUser;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  update(id: number, data: Partial<Omit<User, 'id'>>): User {
    const user = this.findOne(id);

    if (data.role) {
      if (data.role === 'superuser' && user.role !== 'superuser') {
        throw new BadRequestException('Cannot escalate role to superuser');
      }
      if (user.role === 'superuser' && data.role !== 'superuser') {
        throw new BadRequestException('Cannot modify superuser role');
      }
      if (user.role === 'citizen' && data.role !== 'citizen') {
        throw new BadRequestException('Cannot modify citizen role');
      }
      if (
        (user.role === 'officer' || user.role === 'supervisor') &&
        data.role !== 'officer' &&
        data.role !== 'supervisor'
      ) {
        throw new BadRequestException('Invalid role transition for staff user');
      }
      user.role = data.role;
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.department !== undefined) user.department = data.department;
    if (data.zone !== undefined) user.zone = data.zone;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.password !== undefined && data.password.trim() !== '') {
      user.password = data.password;
    }

    return user;
  }

  remove(id: number): void {
    const index = this.users.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`User #${id} not found`);
    }
    if (this.users[index].role === 'superuser') {
      throw new BadRequestException('Superuser account cannot be deleted');
    }
    this.users.splice(index, 1);
  }
}
