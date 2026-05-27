import { PartialType } from '@nestjs/mapped-types';
import { CreateJobPostingDto } from '@/job-postings/dto/create-job-posting.dto';

export class UpdateJobPostingDto extends PartialType(CreateJobPostingDto) {}
