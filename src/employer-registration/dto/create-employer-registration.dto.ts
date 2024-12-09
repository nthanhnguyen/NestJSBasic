import { IsNotEmpty } from "class-validator";

export class CreateEmployerRegistrationDto {
  @IsNotEmpty({
      message: 'Name không được để trống',
  })
  name: string;

  @IsNotEmpty({
    message: 'Position không được để trống',
  })
  position: string;

  @IsNotEmpty({
    message: 'Email không được để trống',
  })
  email: string;

  @IsNotEmpty({
    message: 'Number phone không được để trống',
  })
  phone: string;

  @IsNotEmpty({
      message: 'address không được để trống',
  })
  address: string;

  @IsNotEmpty({
    message: 'Company address không được để trống',
  })
  companyAddress: string;

  @IsNotEmpty({
    message: 'Company url không được để trống',
  })
  companyUrl: string;

  @IsNotEmpty({
      message: 'Status không được để trống',
  })
  status: string;
}

