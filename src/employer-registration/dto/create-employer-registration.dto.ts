import { IsNotEmpty } from "class-validator";

export class CreateEmployerRegistrationDto {
  @IsNotEmpty({
      message: 'Họ tên không được để trống',
  })
  name: string;

  @IsNotEmpty({
    message: 'Chức vụ không được để trống',
  })
  position: string;

  @IsNotEmpty({
    message: 'Email không được để trống',
  })
  email: string;

  @IsNotEmpty({
    message: 'Số điện thoại không được để trống',
  })
  phone: string;

  @IsNotEmpty({
      message: 'address không được để trống',
  })
  address: string;

  @IsNotEmpty({
    message: 'Tên công ty không được để trống',
  })
  companyName: string;

  @IsNotEmpty({
    message: 'Địa chỉ công ty không được để trống',
  })
  companyAddress: string;

  @IsNotEmpty({
    message: 'Website của công ty không được để trống',
  })
  companyUrl: string;

  @IsNotEmpty({
      message: 'Status không được để trống',
  })
  status: string;
}

