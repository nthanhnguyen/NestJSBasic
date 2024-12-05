import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { CreateResumeDto, CreateUserCvDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { IUser } from 'src/users/user.interface';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/auth/decorator/customize';
import { ApiTags } from '@nestjs/swagger';
import { Resume } from './schemas/resume.schema';

@ApiTags('resumes')
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) { }

  @Post()
  @ResponseMessage("Create a new resume")
  create(
    @Body() createUserCvDto: CreateUserCvDto,
    @User() user: IUser) {
    return this.resumesService.create(createUserCvDto, user);
  }

  @Get()
  @ResponseMessage("Fetch list resume with paginate")
  findAll(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @Query() qs: string
  ) {
    return this.resumesService.findAll(+currentPage, +limit, qs);
  }

  @Get('/employer')
  @ResponseMessage("Fetch list resume with paginate for Hr")
  findJobForHr(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @User() user: IUser, 
    @Query() qs: string
  ) {
    const hrId = user._id;
    return this.resumesService.findJobForHr(+currentPage, +limit, qs, hrId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resumesService.findOne(id);
  }

  @Get('check-applying/:jobId')
  @SkipCheckPermission()
  @ResponseMessage("Check applying job")
  async checkApplying(
    @Param('jobId') jobId: string,
    @User() user: IUser,
  ) {
    return await this.resumesService.checkApplying(jobId, user._id)
  }

  @Patch(':id')
  @ResponseMessage("Update status resume")
  updateStatus(@Param('id') id: string, @Body('status') status: string, @User() user: IUser) {
    return this.resumesService.update(id, status, user);
  }

  @Patch('update-file/:id')
  @SkipCheckPermission()
  @ResponseMessage("Update resume file")
  updateResumeFile(@Param('id') id: string, @Body('url') url: string, @Body('skillList') skillList: string[], @User() user: IUser) {
    return this.resumesService.updateResumeFile(id, url, user, skillList);
  }

  @Post('/update-statuses')
  @ResponseMessage("Update many statuses for resume")
  updateManyStatus(@Body('ids') ids: string[], @Body('status') status: string, @User() user: IUser) {
    const updatedResumes: any[] = [];
    ids.forEach((id)=>{
      const resume = this.resumesService.update(id, status, user);
      updatedResumes.push(resume);
    })
    return updatedResumes;
  }
  

  @Delete(':id')
  @ResponseMessage("Delete a resume")
  remove(
    @Param('id') id: string,
    @User() user: IUser
  ) {
    return this.resumesService.remove(id, user);
  }

  @Post('by-user')
  @ResponseMessage("Get Resumes by User")
  findOneByUser(@User() user: IUser) {
    return this.resumesService.findByUsers(user);
  }
}
