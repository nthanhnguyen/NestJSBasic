// file dto
import { Type } from "class-transformer";
import { 
    IsMongoId, 
    IsNotEmpty, 
    IsOptional, 
    IsString, 
    IsArray, 
    IsBoolean, 
    ValidateNested 
} from "class-validator";
import mongoose from "mongoose";

class Experience {
    @IsString()
    @IsOptional()
    title: string;

    @IsString()
    @IsOptional()
    companyName: string;

    @IsString()
    @IsOptional()
    city: string;

    @IsString()
    @IsOptional()
    state: string;

    @IsString()
    @IsOptional()
    startDate: string;

    @IsString()
    @IsOptional()
    endDate: string;

    @IsBoolean()
    @IsOptional()
    currentlyWorking: boolean;

    @IsString()
    @IsOptional()
    workSummary: string;
}

class Education {
    @IsString()
    @IsOptional()
    universityName: string;

    @IsString()
    @IsOptional()
    startDate: string;

    @IsString()
    @IsOptional()
    endDate: string;

    @IsString()
    @IsOptional()
    degree: string;

    @IsString()
    @IsOptional()
    major: string;

    @IsString()
    @IsOptional()
    description: string;
}

class Skill {
    @IsString()
    @IsOptional()
    name: string;

    @IsOptional()
    rating: number;
}

export class CreateUserResumeDto {
    @IsNotEmpty({
        message: 'jobTitle không được để trống',
    })
    jobTitle: string;

    @IsMongoId()
    @IsOptional()
    userId: mongoose.Schema.Types.ObjectId;

    @IsString()
    @IsOptional()
    email: string;

    @IsString()
    @IsOptional()
    lastName: string;

    @IsString()
    @IsOptional()
    firstName: string;

    @IsString()
    @IsOptional()
    address: string;

    @IsString()
    @IsOptional()
    phone: string;

    @IsString()
    @IsOptional()
    themeColor: string;

    @IsString()
    @IsOptional()
    summary: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Experience)
    @IsOptional()
    experience: Experience[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Education)
    @IsOptional()
    education: Education[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Skill)
    @IsOptional()
    skills: Skill[];
}
