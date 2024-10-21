import { PartialType } from '@nestjs/swagger';
import { CreateUserResumeDto } from './create-user-resume.dto';

export class UpdateUserResumeDto extends PartialType(CreateUserResumeDto) {}
