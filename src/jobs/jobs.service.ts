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

@Injectable()
export class JobsService {

  constructor(
    @InjectModel(Job.name) private jobModel: SoftDeleteModel<JobDocument>,
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
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

  async findJobForHr(currentPage: number, limit: number, qs: string, hrId: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;
    delete filter.hrId;

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

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return 'Not found Job'
    return await this.jobModel.findOne({ _id: id });
  }


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
}
