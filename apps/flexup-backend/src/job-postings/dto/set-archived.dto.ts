import { IsBoolean } from 'class-validator';

export class SetArchivedDto {
  @IsBoolean()
  isArchived: boolean;
}
