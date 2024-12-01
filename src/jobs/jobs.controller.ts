import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { IUser } from 'src/users/user.interface';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/auth/decorator/customize';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  // @Post()
  // create(@Body() createJobDto: CreateJobDto) {
  //   return this.jobsService.create(createJobDto);
  // }

  @Post()
  @ResponseMessage("Create a new Job")
  async create(
    @Body() createJobDto: CreateJobDto,
    @User() user: IUser
  ) {
    let newJob = await this.jobsService.create(createJobDto, user)
    return {
      _id: newJob?._id,
      createdAt: newJob?.createdAt
    };
  }

  @Get()
  @Public()
  @ResponseMessage("Fetch list job with paginate")
  findAll(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @Query() qs: string,
  ) {
    return this.jobsService.findAll(+currentPage, +limit, qs);
  }

  // @Get('/related-job')
  // @Public()
  // @ResponseMessage("Fetch list related job")
  // findRelatedJob(
  //   @Query() qs: string,
  // ) {
  //   return this.jobsService.findRelatedJob(qs);
  // }

  @Get('/company')
  @Public()
  @ResponseMessage("Fetch list job for company")
  findAllJobsForCompany(
    @Query("companyId") companyId: string,
    @Query() qs: string,
  ) {
    return this.jobsService.findJobsForCompany(companyId, qs);
  }

  @Get('/employer')
  @ResponseMessage("Fetch list job with paginate for Hr")
  findJobForHr(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @Query() qs: string,
    @User() user: IUser,
  ) {
    const hrId = user._id;
    return this.jobsService.findJobForHr(+currentPage, +limit, qs, hrId);
  }

  @Get('/subscriber-job')
  @SkipCheckPermission()
  @ResponseMessage("Fetch list subscriber jobs")
  findSubscriberJob(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @Query() qs: string,
    @User() user: IUser, 
  ) {
    return this.jobsService.findSubscriberJob(+currentPage, +limit, qs, user);
  }

  //@Public()
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @User() user: IUser
  ) {
    return this.jobsService.update(id, updateJobDto, user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @User() user: IUser
  ) {
    return this.jobsService.remove(id, user);
  }
}
