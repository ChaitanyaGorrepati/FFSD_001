import { Injectable } from '@nestjs/common';

@Injectable()
export class DepartmentsService {
  private departments = [
    { id: 1, name: 'road' },
    { id: 2, name: 'water' },
    { id: 3, name: 'electricity' },
    { id: 4, name: 'sanitation' },
  ];

  findAll() {
    return this.departments;
  }
}