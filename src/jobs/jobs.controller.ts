import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Response } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { IUser } from 'src/users/user.interface';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/auth/decorator/customize';
import { ApiTags } from '@nestjs/swagger';
import { GenerateJobMonthlyReportDto } from './dto/generate-job-monthly-report.dto';
import moment from 'moment-timezone';
import { Response as ExpressResponse } from 'express';
import { setExcelHeaders } from './excel.config';


@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

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

  // @Post('/update-date')
  // @Public()
  // @ResponseMessage("update date Job")
  // async updateDate(
  //   @Body("startDate") startDate: Date,
  //   @Body("endDate") endDate: Date,
  // ) {
  //   return await this.jobsService.updateDate(startDate, endDate)
  // }

  @Get('number-of-jobs')
  @ResponseMessage("Get number of jobs")
  getNumberOfJobs() {
    return this.jobsService.getNumberOfJobs();
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

  @Get('/employer/number-of-jobs')
  @ResponseMessage("Get number of jobs for Hr")
  getNumberOfJobsForHr(
    @User() user: IUser, 
  ) {
    const hrId = user._id;
    return this.jobsService.getNumberOfJobsForHr(hrId);
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

  @Post('jobMonthlyReport')
  @ResponseMessage("Export a job monthly report for admin")
  async generateJobMonthlyReport(
    @Body() { price, month, year }: GenerateJobMonthlyReportDto,
    @Response() res: ExpressResponse,
  ) {
    const workbook = await this.jobsService.generateJobMonthlyReport(price, month, year);
    setExcelHeaders(res, `job-monthly-report-${moment([year, month - 1]).format('YYYY-MM')}`);
    await workbook.xlsx.write(res);
    return res.end();
  }
}
