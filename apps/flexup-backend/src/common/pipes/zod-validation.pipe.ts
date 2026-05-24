import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { ErrorCode, ValidationError } from '@flexup/shared';
import { ZodError, ZodSchema } from 'zod';

/**
 * Pipe that validates the value against a Zod schema. Use it together with
 * (or instead of) class-validator DTOs. Errors are emitted in the standardized
 * `{ code, message, details }` envelope and rendered by AllExceptionsFilter.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ValidationError[] = error.errors.map((issue) => ({
          field: issue.path.join('.') || '(root)',
          message: issue.message,
          code: issue.code,
        }));
        throw new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details,
        });
      }
      throw error;
    }
  }
}
