import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmployerRegistrationService } from './employer-registration.service';
import { CreateEmployerRegistrationDto } from './dto/create-employer-registration.dto';
import { UpdateEmployerRegistrationDto } from './dto/update-employer-registration.dto';
import { Public } from 'src/auth/decorator/customize';

@Controller('employer-registration')
export class EmployerRegistrationController {
  constructor(private readonly employerRegistrationService: EmployerRegistrationService) {}

  @Post()
  @Public()
  async create(@Body() createEmployerRegistrationDto: CreateEmployerRegistrationDto) {
    let newEmployerRegistration = await this.employerRegistrationService.create(createEmployerRegistrationDto);
    return {
      _id: newEmployerRegistration?._id,
      createdAt: newEmployerRegistration?.createdAt
    };
  }

  @Get()
  findAll() {
    return this.employerRegistrationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employerRegistrationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployerRegistrationDto: UpdateEmployerRegistrationDto) {
    return this.employerRegistrationService.update(+id, updateEmployerRegistrationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employerRegistrationService.remove(+id);
  }
}
