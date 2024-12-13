import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EmployerRegistrationService } from './employer-registration.service';
import { CreateEmployerRegistrationDto } from './dto/create-employer-registration.dto';
import { UpdateEmployerRegistrationDto } from './dto/update-employer-registration.dto';
import { Public, ResponseMessage, User } from 'src/auth/decorator/customize';
import { IUser } from 'src/users/user.interface';

@Controller('employer-registration')
export class EmployerRegistrationController {
  constructor(private readonly employerRegistrationService: EmployerRegistrationService) {}

  @Post()
  @Public()
  @ResponseMessage("Create a new employer registration with paginate")
  async create(@Body() createEmployerRegistrationDto: CreateEmployerRegistrationDto) {
    let newEmployerRegistration = await this.employerRegistrationService.create(createEmployerRegistrationDto);
    return {
      _id: newEmployerRegistration?._id,
      createdAt: newEmployerRegistration?.createdAt
    };
  }

  @Get()
  @Public()
  @ResponseMessage("Fetch list employer registration with paginate")
  findAll(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @Query() qs: string,
  ) {
    return this.employerRegistrationService.findAll(+currentPage, +limit, qs);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employerRegistrationService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage("Update status employer registration")
  update(@Param('id') id: string, @Body('status') status: string, @User() user: IUser) {
    return this.employerRegistrationService.update(id, status, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employerRegistrationService.remove(+id);
  }
}
