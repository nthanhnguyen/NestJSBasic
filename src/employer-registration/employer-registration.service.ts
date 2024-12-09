import { Injectable } from '@nestjs/common';
import { CreateEmployerRegistrationDto } from './dto/create-employer-registration.dto';
import { UpdateEmployerRegistrationDto } from './dto/update-employer-registration.dto';
import { InjectModel } from '@nestjs/mongoose';
import { EmployerRegistration, EmployerRegistrationDocument } from './schemas/employer-registration.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class EmployerRegistrationService {
  
  constructor(
    @InjectModel(EmployerRegistration.name) private companyModel: SoftDeleteModel<EmployerRegistrationDocument>,
    private mailService: MailService, 
  ) { }

  async create(createEmployerRegistrationDto: CreateEmployerRegistrationDto) {
    await this.mailService.sendEmployerRegistration(createEmployerRegistrationDto.email, createEmployerRegistrationDto.name);
    const newEmployerRegistration = await this.companyModel.create({
      ...createEmployerRegistrationDto,
    })
    return newEmployerRegistration;
  }

  findAll() {
    return `This action returns all employerRegistration`;
  }

  findOne(id: number) {
    return `This action returns a #${id} employerRegistration`;
  }

  update(id: number, updateEmployerRegistrationDto: UpdateEmployerRegistrationDto) {
    return `This action updates a #${id} employerRegistration`;
  }

  remove(id: number) {
    return `This action removes a #${id} employerRegistration`;
  }
}
