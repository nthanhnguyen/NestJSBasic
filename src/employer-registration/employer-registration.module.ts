import { Module } from '@nestjs/common';
import { EmployerRegistrationService } from './employer-registration.service';
import { EmployerRegistrationController } from './employer-registration.controller';
import { EmployerRegistration, EmployerRegistrationSchema } from './schemas/employer-registration.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [MailModule, MongooseModule.forFeature([{ name: EmployerRegistration.name, schema: EmployerRegistrationSchema }])],
  controllers: [EmployerRegistrationController],
  providers: [EmployerRegistrationService]
})
export class EmployerRegistrationModule {}
