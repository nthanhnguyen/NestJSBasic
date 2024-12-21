import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserCvDto } from './dto/create-resume.dto';
import mongoose from 'mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from 'src/users/user.interface';
import aqp from 'api-query-params';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { join } from 'path';
import fs from "fs";
import mammoth from 'mammoth';  // For handling docx files
import pdfParse from 'pdf-parse'; 
import { AIChatSession } from './ai.config';
import { Job, JobDocument } from 'src/jobs/schemas/job.schema';

@Injectable()
export class ResumesService {

  constructor(
      @InjectModel(Resume.name) private resumeModel: SoftDeleteModel<ResumeDocument>,
      @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
      @InjectModel(Job.name) private jobModel: SoftDeleteModel<JobDocument>,

  ) { }

  async create(createUserCvDto: CreateUserCvDto, user: IUser) {
    const { url, companyId, jobId, skillList } = createUserCvDto;
    const { email, _id } = user;

    let fileContent = '';

    const filePath = join(process.cwd(), 'public/images/resume', url); 

    const fileExtension = url.split('.').pop()?.toLowerCase();
    if (fileExtension === 'pdf') {
      fileContent = await this.extractTextFromPDF(filePath);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      fileContent = await this.extractTextFromWord(filePath);
    } else {
      throw new Error('Unsupported file format');
    }
    // console.log('fileContent :>> ', fileContent);

    const job = await this.jobModel.findById(jobId);

    const promptTemplate = `Based on the Job description and the content of the CV provided on below, please indicate the level of suitability of the CV with that Job description. Only give a specific number from 1 to 100 and say nothing more. 
    Job description: ${job.description} - end Job description. File content: ${fileContent}`;

    const result = await AIChatSession.sendMessage(promptTemplate);

    if (!result) {
      throw new BadRequestException('Quá trình ứng tuyển có lỗi xảy ra, vui lòng thử lại!');
    }
    const parsedResult = JSON.parse(await result.response.text());
    console.log('parsedResult for creating:>> ', parsedResult);

    // const cleanedText = this.cleanText(fileContent);
    // const skillsFound = this.countSkillsInText(cleanedText, skillList);
    // const totalSkills = skillList.length;
    // const relevancePercentage = (skillsFound / totalSkills) * 100;
    const relevancePercentage = parsedResult.suitability_score;


    const newCV = await this.resumeModel.create({
      url,
      companyId,
      jobId,
      email,
      userId: _id,
      status: "PENDING",
      relevancePercentage: Number(relevancePercentage.toFixed(2)),
      history: {
        status: "PENDING",
        updatedAt: new Date,
        updatedby: {
          _id: user._id,
          email: user.email
        }

      },
      createdBy: {
        _id,
        email
      }
    })
    return {
      _id: newCV?._id,
      createdAt: newCV?.createdAt
    }
  }

  private async extractTextFromPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    try {
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error('Failed to parse PDF');
    }
  }

  private async extractTextFromWord(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const docxBuffer = fs.readFileSync(filePath);
      mammoth.extractRawText({ buffer: docxBuffer })
        .then(result => resolve(result.value))
        .catch(err => reject(err));
    });
  }

  // private cleanText(text: string): string {
  //   // Replace multiple spaces with a single space, remove newlines, and trim leading/trailing spaces
  //   let cleanedText = text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim().toLowerCase();

  //   // cleanedText = cleanedText.replace(/([a-zA-Z0-9])\s+([a-zA-Z0-9])/g, '$1$2');

  //   return cleanedText;
  // }

  // private countSkillsInText(text: string, skillsArray: string[]): number {
  //   // console.log('cleaned text with spaces :>> ', text);
  //   let skillsFound = 0;

  //   // Check each skill in the array and see if it exists in the cleaned text
  //   skillsArray.forEach(skill => {
  //     const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, 'gi'); // Create a case-insensitive regex
  //     if (regex.test(text)) {
  //       skillsFound++;
  //     }
  //   });

  //   return skillsFound;
  // }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population, projection } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;
    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.resumeModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.resumeModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .select(projection as any)
      .exec();

    return {
      meta: {
        current: currentPage, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems // tổng số phần tử (số bản ghi)
      },
      result //kết quả query
    }
  }

  async getNumberOfResumes() {
    const totalItems = (await this.resumeModel.find()).length;
    return {totalItems};
  }

  async getNumberOfApprovedResumes() {
    const totalItems = (await this.resumeModel.find({ status: 'APPROVED' })).length;
    return {totalItems};
  }

  async getNumberOfResumesForHr(hrId: string) {
    const hr = await this.userModel.findById(hrId);
    if (!hr) {
      throw new BadRequestException('Tài khoản không tồn tại!');
    }
    const companyId = hr?.company?._id;
    if (!companyId) {
      throw new BadRequestException('Công ty của người dùng không tồn tại!');
    }
    const totalItems = (await this.resumeModel.find({ companyId: companyId })).length;
    return {totalItems};
  }

  async getNumberOfApprovedResumesForHr(hrId: string) {
    const hr = await this.userModel.findById(hrId);
    if (!hr) {
      throw new BadRequestException('Tài khoản không tồn tại!')
    }
    const companyId = hr?.company?._id;
    if (!companyId) {
      throw new BadRequestException('Công ty của người dùng không tồn tại!');
    }
    const totalItems = (await this.resumeModel.find({ companyId: companyId, status: 'APPROVED' })).length;
    return {totalItems};
  }

  async findJobForHr(currentPage: number, limit: number, qs: string, hrId: string) {
    const { filter, sort, population, projection } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const hr = await this.userModel.findById(hrId);
    if (!hr) {
      throw new BadRequestException('Tài khoản không tồn tại!')
    }
    const companyId = hr?.company?._id;
    if (!companyId) {
      throw new BadRequestException('Công ty của người dùng không tồn tại!');
    }
  
    // Add company filter to the query
    filter['companyId'] = companyId;

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.resumeModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.resumeModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .select(projection as any)
      .exec();

    return {
      meta: {
        current: currentPage, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems // tổng số phần tử (số bản ghi)
      },
      result //kết quả query
    }
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new BadGatewayException('Not found resumes')
    return await this.resumeModel.findById(id);
  }

  async update(_id: string, status: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(_id))
      throw new BadGatewayException('Not found resumes')
    const updated = await this.resumeModel.updateOne(
      { _id },
      {
        status,
        updatedBy: {
          _id: user._id,
          email: user.email
        },
        $push: {
          history: {
            status,
            updatedAt: new Date,
            updatedBy: {
              _id: user._id,
              email: user.email
            }
          }
        }
      }
    );
    return updated;
  }

  async updateResumeFile(_id: string, url: string, user: IUser, skillList: string[]) {
    if (!mongoose.Types.ObjectId.isValid(_id))
      throw new BadGatewayException('Not found resumes');

    let fileContent = '';

    const filePath = join(process.cwd(), 'public/images/resume', url); 

    const fileExtension = url.split('.').pop()?.toLowerCase();
    if (fileExtension === 'pdf') {
      fileContent = await this.extractTextFromPDF(filePath);
      // console.log('fileContent :>> ', fileContent);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      fileContent = await this.extractTextFromWord(filePath);
    } else {
      throw new Error('Unsupported file format');
    }

    const oldResume =  await this.resumeModel.findById(_id);
    const job = await this.jobModel.findById(oldResume.jobId);

    const promptTemplate = `Based on the Job description and the content of the CV provided on below, please indicate the level of suitability of the CV with that Job description. Only give a specific number from 1 to 100 and say nothing more. 
    Job description: ${job.description} - end Job description. File content: ${fileContent}`;

    const result = await AIChatSession.sendMessage(promptTemplate);

    if (!result) {
      throw new BadRequestException('Quá trình ứng tuyển có lỗi xảy ra, vui lòng thử lại!');
    }
    const parsedResult = JSON.parse(await result.response.text());
    console.log('parsedResult for update:>> ', parsedResult);

    const relevancePercentage = parsedResult.suitability_score;

    // const cleanedText = this.cleanText(fileContent);
    // const skillsFound = this.countSkillsInText(cleanedText, skillList);
    // const totalSkills = skillList.length;
    // const relevancePercentage = (skillsFound / totalSkills) * 100;

    const updated = await this.resumeModel.updateOne(
      { _id },
      {
        url,
        relevancePercentage,
        updatedBy: {
          _id: user._id,
          email: user.email
        },
      }
    );
    return updated;
  }


  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new BadGatewayException('Not found resume')

    await this.resumeModel.updateOne({ _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email
        }
      });
    return this.resumeModel.softDelete({ _id: id });
  }

  async findByUsers(user: IUser) {
    return await this.resumeModel.find({ userId: user._id })
      .sort("-createdAt")
      .populate([
        {
          path: "companyId",
          select: { name: 1 }
        },
        {
          path: "jobId",
          select: { name: 1 }
        }
      ]);
  }

  async checkApplying(jobId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new BadGatewayException('Not found user')
    if (!mongoose.Types.ObjectId.isValid(jobId))
      throw new BadGatewayException('Not found job')
    const resume = await this.resumeModel.findOne({jobId, userId});
    if (resume) {
      if (resume.status === 'PENDING') {
        return {
          resumeId: resume._id,
          isApplied: true,
          isPending: true,
          url: resume.url,
        };
      } else return {
            resumeId: resume._id,
            isApplied: true,
            isPending: false,
            url: resume.url,
      };

    } else return {
          isApplied: false,
          isPending: false,
          url: '',
        };
  }

  
  // private formatHeaderRow(cell: ExcelJS.Cell): ExcelJS.Cell {
  //   cell.font = {
  //       bold: true,
  //   };
  //   cell.alignment = {
  //       vertical: 'bottom',
  //       horizontal: 'center',
  //       wrapText: true,
  //   };
  //   cell.border = {
  //       top: { style: 'thin' },
  //       left: { style: 'thin' },
  //       bottom: { style: 'thin' },
  //       right: { style: 'thin' },
  //   };
  //   return cell;
  // }

  // private formatCellRow(cell: ExcelJS.Cell): ExcelJS.Cell {
  //   // cell.font = {
  //   //     bold: true,
  //   // };
  //   cell.alignment = {
  //       vertical: 'bottom',
  //       horizontal: 'center',
  //       wrapText: true,
  //   };
  //   cell.border = {
  //       top: { style: 'thin' },
  //       left: { style: 'thin' },
  //       bottom: { style: 'thin' },
  //       right: { style: 'thin' },
  //   };
  //   return cell;
  // }

  // private formatCurrency(value: number): string {
  //   return `${(value + "").replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ`;
  // }

  // private async getJobReportSummary(
  //   price: number,
  //   month: number,
  //   year: number,
  // ): Promise<{
  //   companyName: string;
  //   totalJob: number;
  //   totalResume: number;
  //   approvedResume: number;
  //   // price: number;
  //   totalPrice: number;
  //   // transactionYear: number;
  //   // transactionMonth: number;
  // }[]> {
  //   // Aggregate query để lấy thông tin theo công ty
  //   return await this.resumeModel.aggregate([
  //     {
  //       $lookup: {
  //         from: 'jobs', // Tên collection của bảng Job
  //         localField: 'jobId',
  //         foreignField: '_id',
  //         as: 'jobDetails',
  //       },
  //     },
  //     {
  //       $match: {
  //         "jobDetails.startDate": {
  //           $gte: new Date(year, month - 1, 1), // Ngày đầu tiên của tháng
  //           $lt: new Date(year, month, 1), // Ngày đầu tiên của tháng sau
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: '$companyId',
  //         totalJob: { $sum: 1 },
  //         totalResume: { $sum: 1 },
  //         approvedResume: {
  //           $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] },
  //         },
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'companies', // Tên collection của bảng Company
  //         localField: '_id',
  //         foreignField: '_id',
  //         as: 'companyDetails',
  //       },
  //     },
  //     {
  //       $unwind: {
  //         path: '$companyDetails',
  //       },
  //     },
  //     {
  //       $project: {
  //         companyName: '$companyDetails.name', // Lấy tên công ty
  //         totalJob: 1,
  //         totalResume: 1,
  //         approvedResume: 1,
  //         // price: price, // Giá per job
  //         totalPrice: { $multiply: ['$totalJob', price] }, // Tính totalPrice
  //         // transactionMonth: month,
  //         // transactionYear: year,
  //       },
  //     },
  //   ]);
  // }

  // async generateJobMonthlyReport(price: number, month: number, year: number) {
  //   const workbook = new ExcelJS.Workbook();

  //   // The 'Report' worksheet
  //   const jobRecord = await this.getJobReportSummary(price, month, year);
  //   console.log('jobRecord :>> ', jobRecord);
  //   const reportWorksheet = workbook.addWorksheet('Report');
  //   reportWorksheet.properties.defaultRowHeight = 15;
  //   reportWorksheet.columns = [
  //       { key: 'companyName', header: 'Tên công ty', width: 50 },
  //       { key: 'totalJob', header: 'Số lượng Job', width: 20 },
  //       { key: 'totalResume', header: 'Số lượng ứng viên ứng tuyển', width: 20 },
  //       { key: 'approvedResume', header: 'Số lượng CV được Approved', width: 20 },
  //       { key: 'price', header: 'Phí cho 1 job', width: 30 },
  //       { key: 'totalPrice', header: 'Phí đăng tuyển', width: 30 },
  //       { key: 'month', header: 'Tháng giao dịch', width: 20 },
  //       { key: 'year', header: 'Năm giao dịch', width: 20 },
  //   ];
  //   reportWorksheet.getRow(1).eachCell(this.formatHeaderRow);
  //   console.log('jobRecord :>> ', jobRecord);
  //   jobRecord.forEach(({ companyName, totalJob, totalResume, approvedResume, totalPrice }) => {
  //       const formattedPrice = this.formatCurrency(price);
  //       const formattedTotalPrice = this.formatCurrency(totalPrice);

  //       const contentRow = reportWorksheet.addRow([
  //         companyName,
  //         totalJob,
  //         totalResume,
  //         approvedResume,
  //         formattedPrice,
  //         formattedTotalPrice,
  //         month,
  //         year,
  //       ]);
  //       contentRow.eachCell(this.formatCellRow);
  //   });

  //   return workbook;
  // }
}
