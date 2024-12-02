import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { CreateResumeDto, CreateUserCvDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
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

@Injectable()
export class ResumesService {

  constructor(
      @InjectModel(Resume.name) private resumeModel: SoftDeleteModel<ResumeDocument>,
      @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
  ) { }

  async create(createUserCvDto: CreateUserCvDto, user: IUser) {
    const { url, companyId, jobId, skillList } = createUserCvDto;
    const { email, _id } = user;

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

    const cleanedText = this.cleanText(fileContent);
    const skillsFound = this.countSkillsInText(cleanedText, skillList);
    const totalSkills = skillList.length;
    const relevancePercentage = (skillsFound / totalSkills) * 100;

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

  private cleanText(text: string): string {
    // Replace multiple spaces with a single space, remove newlines, and trim leading/trailing spaces
    let cleanedText = text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim().toLowerCase();

    // cleanedText = cleanedText.replace(/([a-zA-Z0-9])\s+([a-zA-Z0-9])/g, '$1$2');

    return cleanedText;
  }

  private countSkillsInText(text: string, skillsArray: string[]): number {
    // console.log('cleaned text with spaces :>> ', text);
    let skillsFound = 0;

    // Check each skill in the array and see if it exists in the cleaned text
    skillsArray.forEach(skill => {
      const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, 'gi'); // Create a case-insensitive regex
      if (regex.test(text)) {
        skillsFound++;
      }
    });

    return skillsFound;
  }

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
}
