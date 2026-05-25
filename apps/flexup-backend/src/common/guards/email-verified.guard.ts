import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    if (user.role === 'COMPANY_USER' && !user.emailVerified) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email to access this resource',
      });
    }

    return true;
  }
}
