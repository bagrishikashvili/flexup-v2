import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateJobPostingDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(7500)
  briefing: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  addressLine: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsOptional()
  @MaxLength(2)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  contactPersonName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  contactPersonPhone: string;

  @IsArray()
  @IsString({ each: true })
  skillIds: string[] = [];

  @IsArray()
  @IsString({ each: true })
  appearanceIds: string[] = [];

  @IsArray()
  @IsString({ each: true })
  languageIds: string[] = [];
}
