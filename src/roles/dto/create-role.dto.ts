import { IsArray, IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';
import mongoose from 'mongoose';

export class CreateRoleDto {
    @IsNotEmpty({
        message: 'Name ko đc để trống',
    })
    name: string;

    @IsNotEmpty({
        message: 'description ko đc để trống',
    })
    description: string;

    @IsNotEmpty({
        message: 'isActive không được để trống',
    })
    @IsBoolean({ message: 'isActive có định dạng boolean' })
    isActive: boolean;

    @IsNotEmpty({
        message: 'permissions ko đc để trống',
    })
    @IsMongoId({ each: true, message: "each permission là mongo object id" })
    @IsArray({ message: "permissions có định dạng là array" })
    permissions: mongoose.Schema.Types.ObjectId[];
}
