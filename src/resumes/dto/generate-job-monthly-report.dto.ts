import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class GenerateJobMonthlyReportDto {
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsNotEmpty()
    month: number;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsNotEmpty()
    year: number;
}
