import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsNotEmptyObject, IsObject, IsString, ValidateNested } from 'class-validator';
import mongoose, { Date } from 'mongoose';

class Company {
    @IsNotEmpty()
    _id: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    logo: string;
}

export class CreateJobDto {
    @IsNotEmpty({
        message: 'Name không được để trống',
    })
    name: string;

    @IsArray()
    @IsString({
        each: true,
        message: 'Skill định dạng là string',
    })
    @IsNotEmpty({
        message: 'Skills không được để trống',
    })
    skills: string[];

    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => Company)
    company: Company;

    @IsNotEmpty({
        message: 'Location không được để trống',
    })
    location: string;

    @IsNotEmpty({
        message: 'Salary không được để trống',
    })
    salary: number;

    @IsNotEmpty({
        message: 'Quantity không được để trống',
    })
    quantity: number;

    @IsNotEmpty({
        message: 'Level không được để trống',
    })
    level: string;

    @IsNotEmpty({
        message: 'Description không được để trống',
    })
    description: string;

    @IsDate({
        message: 'Start Date có định dạng là date',
    })
    @Transform(({ value }) => new Date(value))
    @IsNotEmpty({
        message: 'Start Date không được để trống',
    })
    startDate: Date;

    @IsDate({
        message: 'End Date có định dạng là date',
    })
    @Transform(({ value }) => new Date(value))
    @IsNotEmpty({
        message: 'End Date không được để trống',
    })
    endDate: Date;

    @IsNotEmpty({
        message: 'isActive không được để trống',
    })
    @IsBoolean({ message: 'isActive có định dạng boolean' })
    isActive: boolean;
}

