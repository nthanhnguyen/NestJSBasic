import { Response } from 'express';

export const EXCEL_CONTENT_TYPE =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const setExcelHeaders = (response: Response, filename: string): Response => {
    response.setHeader('Content-Type', EXCEL_CONTENT_TYPE);
    response.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    return response;
};

export const align = ['top', 'bottom'] as const;
export type Align = typeof align[number];
