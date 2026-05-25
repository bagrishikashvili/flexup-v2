import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from '@/config/config.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';
import { HealthModule } from '@/health/health.module';
import { EmailModule } from '@/email/email.module';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { CompaniesModule } from '@/companies/companies.module';
import { CompanyMembersModule } from '@/company-members/company-members.module';
import { LocationsModule } from '@/locations/locations.module';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 100 },
    ]),
    PrismaModule,
    RedisModule,
    HealthModule,
    EmailModule,
    UsersModule,
    AuthModule,
    CompaniesModule,
    CompanyMembersModule,
    LocationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
