import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
    @IsEmail({}, {
        message: 'Email ko đúng định dạng',
    })
    @IsNotEmpty({
        message: 'Email ko đc để trống',
    })
    email: string;

    @IsNotEmpty({
        message: 'Password ko đc để trống',
    })
    password: string;

    name: string;
    address: string
}
