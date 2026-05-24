import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ApiErrorResponse, ErrorCode } from '@flexup/shared';
import type { Request, Response } from 'express';

const PRISMA_ERROR_MAP: Record<
  string,
  { statusCode: number; message: string; code: string }
> = {
  P2002: {
    statusCode: HttpStatus.CONFLICT,
    message: 'Resource already exists',
    code: ErrorCode.CONFLICT,
  },
  P2025: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Resource not found',
    code: ErrorCode.NOT_FOUND,
  },
  P2003: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Foreign key constraint failed',
    code: ErrorCode.VALIDATION_ERROR,
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
      code: ErrorCode.INTERNAL_ERROR,
    };

    this.logger.warn(`Prisma ${exception.code}: ${exception.message}`);

    const payload: ApiErrorResponse = {
      statusCode: mapped.statusCode,
      message: mapped.message,
      code: mapped.code,
      error: HttpStatus[mapped.statusCode]?.toString() ?? 'Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(mapped.statusCode).json(payload);
  }
}
