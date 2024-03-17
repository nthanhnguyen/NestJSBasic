import { PartialType } from '@nestjs/mapped-types';
import { CreateResumeDto } from './create-resume.dto';
import { IsArray, IsEmail, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class Updatedby {
    @IsNotEmpty()
    _id: Types.ObjectId;
    @IsNotEmpty()
    @IsEmail()
    email: string;
}

class History {
    @IsNotEmpty()
    status: string;

    @IsNotEmpty()
    updatedAt: Date

    @ValidateNested()
    @IsNotEmpty()
    @Type(() => Updatedby)
    updatedBy: Date
}

export class UpdateResumeDto extends PartialType(CreateResumeDto) {
    @IsNotEmpty({ message: 'history không được để trống', })
    @IsArray({ message: 'history có định dạng là array', })
    @ValidateNested()
    @Type(() => History)
    history: History[];

}
