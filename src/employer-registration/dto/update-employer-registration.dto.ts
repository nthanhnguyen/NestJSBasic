import { PartialType } from '@nestjs/swagger';
import { CreateEmployerRegistrationDto } from './create-employer-registration.dto';

export class UpdateEmployerRegistrationDto extends PartialType(CreateEmployerRegistrationDto) {}
