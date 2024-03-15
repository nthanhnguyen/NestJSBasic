import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateCompanyDto {
    @IsNotEmpty({
        message: 'Name ko đc để trống',
    })
    name: string;

    @IsNotEmpty({
        message: 'address ko đc để trống',
    })
    address: string;

    @IsNotEmpty({
        message: 'Description ko đc để trống',
    })
    description: string;

    @IsNotEmpty({
        message: 'Logo ko đc để trống',
    })
    logo: string;


}
