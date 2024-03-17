import { Type } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsNotEmptyObject, IsObject, ValidateNested, isMongoId } from "class-validator";
import mongoose from "mongoose";

export class CreateResumeDto {
    @IsNotEmpty({
        message: 'email không được để trống',
    })
    email: string;

    @IsNotEmpty({
        message: 'userId không được để trống',
    })
    userId: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty({
        message: 'url không được để trống',
    })
    url: string;

    @IsNotEmpty({
        message: 'Status không được để trống',
    })
    status: string;

    @IsNotEmpty({
        message: 'companyId không được để trống',
    })
    companyId: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty({
        message: 'jobId không được để trống',
    })
    jobId: mongoose.Schema.Types.ObjectId;
}

export class CreateUserCvDto {
    @IsNotEmpty({
        message: 'url không được để trống',
    })
    url: string;

    @IsNotEmpty({
        message: 'companyId không được để trống',
    })
    @IsMongoId({
        message: 'companyId is a mongo id',
    })
    companyId: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty({
        message: 'jobId không được để trống',
    })
    @IsMongoId({
        message: 'jobId is a job id',
    })
    jobId: mongoose.Schema.Types.ObjectId;
}