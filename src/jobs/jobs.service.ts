import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { IUser } from 'src/users/user.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import mongoose from 'mongoose';
import aqp from 'api-query-params';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { Subscriber } from 'rxjs';
import { SubscriberDocument } from 'src/subscribers/schemas/subscriber.shema';
import * as ExcelJS from 'exceljs';

@Injectable()
export class JobsService {

  constructor(
    @InjectModel(Job.name) private jobModel: SoftDeleteModel<JobDocument>,
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    @InjectModel(Subscriber.name) private subscriberModel: SoftDeleteModel<SubscriberDocument>,
  ) { }

  async create(createJobDto: CreateJobDto, user: IUser) {
    const { name, skills, company, location, salary, quantity,
      level, description, startDate, endDate, isActive } = createJobDto;
    let newJob = await this.jobModel.create({
      name,
      skills,
      company,
      location,
      salary,
      quantity,
      level,
      description,
      startDate,
      endDate,
      isActive,
      createdBy: {
        _id: user._id,
        email: user.email
      }
    })
    return newJob;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;
    
    if (filter.excludeJobId) {
      filter._id = { $ne: filter.excludeJobId };
      delete filter.excludeJobId;
    }
    
    // Xử lý excludeNotActive
    if (filter.excludeNotActive) {
      filter.isActive = true; // Loại các job có isActive = false
      delete filter.excludeNotActive;
    }

    // Xử lý excludeByStartEndDate
    if (filter.excludeByStartEndDate) {
      const currentDate = new Date();
      filter.startDate = { $lte: currentDate };  // Chỉ lấy những job có startDate trước hoặc bằng hiện tại
      filter.endDate = { $gte: currentDate };    // Chỉ lấy những job có endDate sau hoặc bằng hiện tại
      delete filter.excludeByStartEndDate;
    }

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.jobModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.jobModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
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

  async getNumberOfJobs() {
    const totalItems = (await this.jobModel.find()).length;
    return {totalItems};
  }

  // async findRelatedJob(qs: string) {
  //   const { filter, sort, population } = aqp(qs);

  //   const totalItems = (await this.jobModel.find(filter)).length;

  //   const result = await this.jobModel.find(filter)
  //     .sort(sort as any)
  //     .populate(population)
  //     .exec();

  //   return {
  //     meta: {
  //       total: totalItems // tổng số phần tử (số bản ghi)
  //     },
  //     result //kết quả query
  //   }
  // }

  async findJobForHr(currentPage: number, limit: number, qs: string, hrId: string) {
    const { filter, sort, population } = aqp(qs);
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
    filter['company._id'] = companyId;

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.jobModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);


    const result = await this.jobModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
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

  async findJobsForCompany(companyId: string, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.companyId;

    if (!mongoose.Types.ObjectId.isValid(companyId))
      throw new BadGatewayException('Not found company')
  
    // Add company filter to the query
    filter['company._id'] = companyId;

    const totalItems = (await this.jobModel.find(filter)).length;

    const result = await this.jobModel.find(filter)
      .sort(sort as any)
      .populate(population)
      .exec();
    return {
      meta: {
        total: totalItems // tổng số phần tử (số bản ghi)
      },
      result //kết quả query
    }
  }

  async findSubscriberJob(currentPage: number, limit: number, qs: string, user: IUser) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const subscriber = await this.subscriberModel.findOne({email: user.email});

    if (!subscriber) {

      return {
        meta: {
          current: currentPage, //trang hiện tại
          pageSize: limit, //số lượng bản ghi đã lấy
          pages: 0, //tổng số trang với điều kiện query
          total: 0 // tổng số phần tử (số bản ghi)
        },
        result: [] //kết quả query
      }

    }

    filter['skills'] = { $in: subscriber.skills };

    // Xử lý excludeNotActive
    if (filter.excludeNotActive) {
      filter.isActive = true; // Loại các job có isActive = false
      delete filter.excludeNotActive;
    }

    // Xử lý excludeByStartEndDate
    if (filter.excludeByStartEndDate) {
      const currentDate = new Date();
      filter.startDate = { $lte: currentDate };  // Chỉ lấy những job có startDate trước hoặc bằng hiện tại
      filter.endDate = { $gte: currentDate };    // Chỉ lấy những job có endDate sau hoặc bằng hiện tại
      delete filter.excludeByStartEndDate;
    }

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.jobModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.jobModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
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

  // async findSubscriberJob(currentPage: number, limit: number, qs: string, user: IUser) {
  //   const { filter, sort, population } = aqp(qs);
  //   delete filter.current;
  //   delete filter.pageSize;
  
  //   let offset = (+currentPage - 1) * (+limit);
  //   let defaultLimit = +limit ? +limit : 10;
  
  //   const totalItems = (await this.jobModel.find(filter)).length;
  //   const totalPages = Math.ceil(totalItems / defaultLimit);
  
  //   let result = await this.jobModel.find(filter)
  //     .skip(offset)
  //     .limit(defaultLimit)
  //     .sort(sort as any)
  //     .populate(population)
  //     .exec();
  
  //   const subscriber = await this.subscriberModel.findOne({ email: user.email });
  
  //   if (subscriber) {
  //     console.log('user.skill :>> ', subscriber.skills);
  //     // console.log('result :>> ', result);
  
  //     // Thêm logic vào đây
  //     // Nếu subscriber có kỹ năng
  //     if (subscriber.skills && subscriber.skills.length > 0) {
  //       // Tạo một hàm tính mức độ liên quan của job với subscriber
  //       const calculateRelevance = (jobSkills: string[], subscriberSkills: string[]): number => {
  //         let relevance = 0;
  //         jobSkills.forEach(skill => {
  //           if (subscriberSkills.includes(skill)) {
  //             relevance += 1;
  //           }
  //         });
  //         return relevance;
  //       };
  
  //       // Thêm cấp độ (level) vào hàm tính độ liên quan
  //       const calculateRelevanceWithLevel = (job: any, subscriber: any): number => {
  //         let relevance = 0;
  //         // Tính độ liên quan từ kỹ năng
  //         relevance += calculateRelevance(job.skills, subscriber.skills);
  //         // Tính độ liên quan từ cấp độ
  //         if (job.level && subscriber.level) {
  //           if (job.level === subscriber.level) {
  //             relevance += 0.5; // Cấp độ trùng thì tăng thêm 0.5 điểm
  //           }
  //         }
  //         return relevance;
  //       };
  
  //       // Sắp xếp lại jobs theo mức độ liên quan giảm dần
  //       result = result.map((job: any) => {
  //         job.relevance = calculateRelevanceWithLevel(job, subscriber);
  //         return job;
  //       })
  //       .filter((job: any) => job.relevance > 0) // Lọc những job có độ liên quan > 0
  //       .sort((a: any, b: any) => b.relevance - a.relevance); // Sắp xếp giảm dần theo độ liên quan
  
  //       // Nếu không có job liên quan, trả về mảng rỗng
  //       if (result.length === 0) {
  //         result = [];
  //       }
  //     }
  //   }
  
  //   return {
  //     meta: {
  //       current: currentPage, //trang hiện tại
  //       pageSize: limit, //số lượng bản ghi đã lấy
  //       pages: totalPages, //tổng số trang với điều kiện query
  //       total: totalItems // tổng số phần tử (số bản ghi)
  //     },
  //     data: result
  //   };
  // }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return 'Not found Job'
    return await this.jobModel.findOne({ _id: id });
  }

  // async updateDate(startDate: Date, endDate: Date) {
  //   const jobs = await this.jobModel.find()
  //   jobs.forEach(async (job)=>{
  //     console.log('job._id :>> ', job._id);
  //     await this.jobModel.updateOne({ _id: job._id },
  //       {
  //         startDate,
  //         endDate,
  //       });
  //   })
  //   return true;
  // }

  async update(id: string, updateJobDto: UpdateJobDto, user: IUser) {
    return await this.jobModel.updateOne({ _id: id },
      {
        ...updateJobDto,
        updatedBy: {
          _id: user._id,
          email: user.email
        }
      });
  }

  async remove(id: string, user: IUser) {
    await this.jobModel.updateOne({ _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email
        }
      });
    return this.jobModel.softDelete({ _id: id });
  }

    private formatHeaderRow(cell: ExcelJS.Cell): ExcelJS.Cell {
      cell.font = {
          bold: true,
      };
      cell.alignment = {
          vertical: 'bottom',
          horizontal: 'center',
          wrapText: true,
      };
      cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
      };
      return cell;
    }
  
    private formatCellRow(cell: ExcelJS.Cell): ExcelJS.Cell {
      // cell.font = {
      //     bold: true,
      // };
      cell.alignment = {
          vertical: 'bottom',
          horizontal: 'center',
          wrapText: true,
      };
      cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
      };
      return cell;
    }
  
    private formatCurrency(value: number): string {
      return `${(value + "").replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ`;
    }

    private async getJobReportSummary(
      price: number,
      month: number,
      year: number,
    ): Promise<{
      companyName: string;
      totalJob: number;
      totalResume: number;
      approvedResume: number;
      totalPrice: number;
    }[]> {
      // Aggregate query để lấy thông tin theo công ty
      return await this.jobModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(year, month - 1, 1), // Ngày đầu tiên của tháng
              $lt: new Date(year, month, 1), // Ngày đầu tiên của tháng sau
            },
          },
        },
        {
          $lookup: {
            from: 'resumes', // Tên collection của bảng Resume
            localField: '_id',
            foreignField: 'jobId',
            as: 'resumeDetails',
          },
        },

        {
          $group: {
            _id: '$company._id', // Nhóm theo companyId
            totalJob: { $sum: 1 }, // Tính tổng số công việc
            totalResume: { $sum: { $size: '$resumeDetails' } }, // Tính tổng số resume của công ty
            approvedResume: {
              $sum: {
                $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0], // Đếm số lượng resume đã được approve
              },
            },
            companyName: { $first: '$company.name' }, // Lấy tên công ty từ trường company.name trong Job
          },
        },
        {
          $project: {
            companyName: 1, // Lấy tên công ty
            totalJob: 1,
            totalResume: 1,
            approvedResume: 1,
            totalPrice: { $multiply: ['$totalJob', price] }, // Tính totalPrice
          },
        },
      ]);
    }
    
    async generateJobMonthlyReport(price: number, month: number, year: number) {
      const workbook = new ExcelJS.Workbook();
  
      // The 'Report' worksheet
      const jobRecord = await this.getJobReportSummary(price, month, year);
      const reportWorksheet = workbook.addWorksheet('Report');
      reportWorksheet.properties.defaultRowHeight = 15;
      reportWorksheet.columns = [
          { key: 'companyName', header: 'Tên công ty', width: 50 },
          { key: 'totalJob', header: 'Số lượng Job', width: 20 },
          { key: 'totalResume', header: 'Số lượng ứng viên ứng tuyển', width: 20 },
          { key: 'approvedResume', header: 'Số lượng CV được Approved', width: 20 },
          { key: 'price', header: 'Phí cho 1 job', width: 30 },
          { key: 'totalPrice', header: 'Phí đăng tuyển', width: 30 },
          { key: 'month', header: 'Tháng giao dịch', width: 20 },
          { key: 'year', header: 'Năm giao dịch', width: 20 },
      ];
      reportWorksheet.getRow(1).eachCell(this.formatHeaderRow);
      jobRecord.forEach(({ companyName, totalJob, totalResume, approvedResume, totalPrice }) => {
          const formattedPrice = this.formatCurrency(price);
          const formattedTotalPrice = this.formatCurrency(totalPrice);
  
          const contentRow = reportWorksheet.addRow([
            companyName,
            totalJob,
            totalResume,
            approvedResume,
            formattedPrice,
            formattedTotalPrice,
            month,
            year,
          ]);
          contentRow.eachCell(this.formatCellRow);
      });
  
      return workbook;
    }
}
