import { Module } from '@nestjs/common';
import { UserResumesService } from './user-resumes.service';
import { UserResumesController } from './user-resumes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserResume, UserResumeSchema } from './entities/user-resume.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserResume.name, schema: UserResumeSchema }])],
  controllers: [UserResumesController],
  providers: [UserResumesService]
})
export class UserResumesModule {}
