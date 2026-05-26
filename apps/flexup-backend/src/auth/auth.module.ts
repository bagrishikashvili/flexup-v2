import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfigModule } from '@/config/config.module';
import { AppConfigService } from '@/config/config.service';
import { UsersModule } from '@/users/users.module';
import { EmailVerificationModule } from '@/email-verification/email-verification.module';
import { AuthService } from '@/auth/auth.service';
import { PasswordResetService } from '@/auth/password-reset.service';
import { AuthController } from '@/auth/auth.controller';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';

@Module({
  imports: [
    AppConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwt.accessSecret,
        signOptions: { expiresIn: config.jwt.accessTtlSeconds },
      }),
    }),
    UsersModule,
    EmailVerificationModule,
  ],
  providers: [
    AuthService,
    PasswordResetService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
