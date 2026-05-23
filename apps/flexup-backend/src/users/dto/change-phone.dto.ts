import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePhoneDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'newPhoneNumber must be in E.164 format',
  })
  newPhoneNumber: string;
}
