import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import mongoose from 'mongoose';

export class CreateSubscriberDto {
    @IsNotEmpty({
        message: 'Email ko đc để trống',
    })
    email: string;

    @IsNotEmpty({
        message: 'Name ko đc để trống',
    })
    name: string;

    @IsArray({ message: 'Skill định dạng là array' })
    @IsString({
        each: true,
        message: 'Skill định dạng là string',
    })
    @IsNotEmpty({
        message: 'Skills không được để trống',
    })
    skills: string[];
}
