import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Request, Response } from 'express';

const PRISMA_ERROR_MAP: Record<
  string,
  { statusCode: number; message: string }
> = {
  P2002: {
    statusCode: HttpStatus.CONFLICT,
    message: 'Resource already exists',
  },
  P2025: { statusCode: HttpStatus.NOT_FOUND, message: 'Resource not found' },
  P2003: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Foreign key constraint failed',
  },
};

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const mapped = PRISMA_ERROR_MAP[exception.code] ?? {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error',
    };

    this.logger.warn(`Prisma ${exception.code}: ${exception.message}`);

    response.status(mapped.statusCode).json({
      statusCode: mapped.statusCode,
      message: mapped.message,
      error: HttpStatus[mapped.statusCode] ?? 'Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
