
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../common/interfaces/user.interface';
@Injectable()
export class UsersService {
private users: User[] = [
  { id: 1, name: "Admin", role: "superuser", password: "admin123" }
];
  private nextId = 6;

 create(user: any): User {
  const newUser: User = {
    id: this.nextId++,
    name: user.name,
    role: user.role,

    department: user.department,
    zone: user.zone,

    // 🔥 important  
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
    Object.assign(user, data);
    return user;
  }

  remove(id: number): void {
    const index = this.users.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`User #${id} not found`);
    }
    this.users.splice(index, 1);
  }
}
