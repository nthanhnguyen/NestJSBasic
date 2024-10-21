import { Injectable } from '@nestjs/common';
import { CreateUserResumeDto } from './dto/create-user-resume.dto';
import { UpdateUserResumeDto } from './dto/update-user-resume.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UserResume, UserResumeDocument } from './entities/user-resume.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/user.interface';
import aqp from 'api-query-params';

@Injectable()
export class UserResumesService {

  constructor(@InjectModel(UserResume.name) private resumeModel: SoftDeleteModel<UserResumeDocument>) { }

  async create(createUserResumeDto: CreateUserResumeDto, user: IUser) {
    const { jobTitle } = createUserResumeDto;
    const { email, _id } = user

    const newCV = await this.resumeModel.create({
      // firstName: '',
      // lastName: '',
      // address: '',
      // email: '',
      // themeColor: '',
      // summary:'',
      jobTitle,
      userId: _id,
      userEmail: email,
      createdBy: {
        _id,
        email
      }
    })
    return {
      _id: newCV?._id,
      title: newCV?.jobTitle,
      createdAt: newCV?.createdAt
    }
  }

  async findAll(currentPage: number, limit: number, qs: string, user: IUser) {
    const { _id: userId } = user;
    const { filter, sort, population } = aqp(qs);

    // Ensure that the query only fetches results for the specific user.
    filter.userId = userId;

    // Clean up any unnecessary parameters from the filter.
    delete filter.current;
    delete filter.pageSize;

    // Calculate pagination values.
    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    // Get the total number of items matching the filter.
    const totalItems = await this.resumeModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    // Fetch the filtered and paginated results.
    const result = await this.resumeModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .exec();

    // Return metadata along with the results.
    return {
      meta: {
        current: currentPage, // Current page number.
        pageSize: limit, // Number of records per page.
        pages: totalPages, // Total pages based on the filter.
        total: totalItems // Total items matching the filter.
      },
      result // Query results.
    };
}


  findOne(id: number) {
    return `This action returns a #${id} userResume`;
  }

  async update(id: string, updateUserResumeDto: UpdateUserResumeDto, user: IUser) {
    return await this.resumeModel.updateOne({ _id: id },
      {
        ...updateUserResumeDto,
        updatedBy: {
          _id: user._id,
          email: user.email
        }
      });
  }

  remove(id: number) {
    return `This action removes a #${id} userResume`;
  }
}
