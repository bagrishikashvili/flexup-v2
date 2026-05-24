import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiErrorResponse, ErrorCode, ValidationError } from '@flexup/shared';
import { Request, Response } from 'express';

interface HttpExceptionBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  code?: string;
  details?: ValidationError[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let error: string = 'Internal Server Error';
    let message = 'An unexpected error occurred';
    let code: ErrorCode | string = ErrorCode.INTERNAL_ERROR;
    let codeOverridden = false;
    let details: ValidationError[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'string') {
        message = raw;
      } else if (raw !== null && typeof raw === 'object') {
        const body = raw as HttpExceptionBody;
        if (typeof body.message === 'string') {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          message = body.message.join('; ');
          // class-validator emits string[] in `message` — promote to details
          details = body.message.map((m) => ({ field: '', message: m }));
        }
        if (body.error) {
          error = body.error;
        }
        if (body.code) {
          code = body.code;
          codeOverridden = true;
        }
        if (body.details) {
          details = body.details;
        }
      }
      if (!codeOverridden) {
        code = this.statusToCode(statusCode);
      }
      if (statusCode >= 500) {
        this.logger.error(
          `${request.method} ${request.url} → ${statusCode}: ${message}`,
        );
      }
    } else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    if (!error || error === 'Internal Server Error') {
      error = this.statusToErrorName(statusCode);
    }

    const payload: ApiErrorResponse = {
      statusCode,
      error,
      message,
      code,
      ...(details && details.length > 0 ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(payload);
  }

  private statusToCode(status: number): string {
    const map: Record<number, ErrorCode> = {
      [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
      [HttpStatus.UNAUTHORIZED]: ErrorCode.TOKEN_INVALID,
      [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
      [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
      [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
      [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMIT_EXCEEDED,
    };
    return map[status] ?? ErrorCode.INTERNAL_ERROR;
  }

  private statusToErrorName(status: number): string {
    const name = HttpStatus[status];
    if (typeof name === 'string') {
      return name
        .toLowerCase()
        .split('_')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
    }
    return 'Error';
  }
}
