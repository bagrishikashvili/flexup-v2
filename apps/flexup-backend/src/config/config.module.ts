import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from '@/config/config.schema';
import { AppConfigService } from '@/config/config.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
