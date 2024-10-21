import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserResumesService } from './user-resumes.service';
import { CreateUserResumeDto } from './dto/create-user-resume.dto';
import { UpdateUserResumeDto } from './dto/update-user-resume.dto';
import { Public, ResponseMessage, User } from 'src/auth/decorator/customize';
import { IUser } from 'src/users/user.interface';

@Controller('user-resumes')
export class UserResumesController {
  constructor(private readonly userResumesService: UserResumesService) {}

  @Post()
  @ResponseMessage("Create a new user resume")
  create(
    @Body() createUserResumeDto: CreateUserResumeDto,
    @User() user: IUser) {
      return this.userResumesService.create(createUserResumeDto, user);
  }

  @Get()
  @ResponseMessage("Fetch list user resumes with paginate")
  findAll(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @Query() qs: string,
    @User() user: IUser
  ) {
    return this.userResumesService.findAll(+currentPage, +limit, qs, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userResumesService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage("Update user resume")
  update(
    @Param('id') id: string,
    @Body() updateUserResumeDto: UpdateUserResumeDto,
    @User() user: IUser
  ) {
    console.log(updateUserResumeDto);
    return this.userResumesService.update(id, updateUserResumeDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userResumesService.remove(+id);
  }
}
