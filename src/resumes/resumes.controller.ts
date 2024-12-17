import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Response } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { CreateUserCvDto } from './dto/create-resume.dto';
import { IUser } from 'src/users/user.interface';
import { ResponseMessage, SkipCheckPermission, User } from 'src/auth/decorator/customize';
import { ApiTags } from '@nestjs/swagger';
// import { GenerateJobMonthlyReportDto } from './dto/generate-job-monthly-report.dto';
// import { Response as ExpressResponse } from 'express';
// import { setExcelHeaders } from './excel.config';
// import moment from 'moment-timezone';

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

  @Get('number-of-resumes')
  @ResponseMessage("Get number of resumes")
  getNumberOfResumes() {
    return this.resumesService.getNumberOfResumes();
  }

  @Get('number-of-approved-resumes')
  @ResponseMessage("Get number of approved resumes")
  getNumberOfApprovedResumes() {
    return this.resumesService.getNumberOfApprovedResumes();
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

  // @Post('jobMonthlyReport')
  // @SkipCheckPermission()
  // @ResponseMessage("Export a job monthly report for admin")
  // async generateJobMonthlyReport(
  //   @Body() { price, month, year }: GenerateJobMonthlyReportDto,
  //   @Response() res: ExpressResponse,
  // ) {
  //   const workbook = await this.resumesService.generateJobMonthlyReport(price, month, year);
  //   setExcelHeaders(res, `job-monthly-report-${moment([year, month - 1]).format('YYYY-MM')}`);
  //   await workbook.xlsx.write(res);
  //   return res.end();
  // }
}
