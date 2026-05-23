import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from '@/users/users.service';
import { UsersController } from '@/users/users.controller';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
