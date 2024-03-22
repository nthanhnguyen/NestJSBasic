import { IsNotEmpty } from 'class-validator';

export class CreatePermissionDto {
    @IsNotEmpty({
        message: 'Name ko đc để trống',
    })
    name: string;

    @IsNotEmpty({
        message: 'apiPath ko đc để trống',
    })
    apiPath: string;

    @IsNotEmpty({
        message: 'method ko đc để trống',
    })
    method: string;

    @IsNotEmpty({
        message: 'module ko đc để trống',
    })
    module: string;
}
