import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './schemas/job.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { Subscriber, SubscriberSchema } from 'src/subscribers/schemas/subscriber.shema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Job.name, schema: JobSchema },
    { name: User.name, schema: UserSchema },
    { name: Subscriber.name, schema: SubscriberSchema }
  ])],
  controllers: [JobsController],
  providers: [JobsService]
})
export class JobsModule { }
