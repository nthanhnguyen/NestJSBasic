import { BadGatewayException, Injectable } from '@nestjs/common';
import { CreateEmployerRegistrationDto } from './dto/create-employer-registration.dto';
import { UpdateEmployerRegistrationDto } from './dto/update-employer-registration.dto';
import { InjectModel } from '@nestjs/mongoose';
import { EmployerRegistration, EmployerRegistrationDocument } from './schemas/employer-registration.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { MailService } from 'src/mail/mail.service';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { IUser } from 'src/users/user.interface';

@Injectable()
export class EmployerRegistrationService {
  
  constructor(
    @InjectModel(EmployerRegistration.name) private employerRegistrationModel: SoftDeleteModel<EmployerRegistrationDocument>,
    private mailService: MailService, 
  ) { }

  async create(createEmployerRegistrationDto: CreateEmployerRegistrationDto) {
    await this.mailService.sendEmployerRegistration(createEmployerRegistrationDto.email, createEmployerRegistrationDto.name);
    const newEmployerRegistration = await this.employerRegistrationModel.create({
      ...createEmployerRegistrationDto,
    })
    return newEmployerRegistration;
  }
  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.employerRegistrationModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.employerRegistrationModel.find(filter)
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

  findOne(id: number) {
    return `This action returns a #${id} employerRegistration`;
  }

    async update(_id: string, status: string, user: IUser) {
      if (!mongoose.Types.ObjectId.isValid(_id))
        throw new BadGatewayException('Not found resumes')
      const updated = await this.employerRegistrationModel.updateOne(
        { _id },
        {
          status,
          updatedBy: {
            _id: user._id,
            email: user.email
          },
        }
      );
      return updated;
    }

  remove(id: number) {
    return `This action removes a #${id} employerRegistration`;
  }
}
