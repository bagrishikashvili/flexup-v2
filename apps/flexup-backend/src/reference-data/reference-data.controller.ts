import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { ReferenceDataService } from '@/reference-data/reference-data.service';

@ApiTags('reference')
@Controller('reference')
export class ReferenceDataController {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  @Get('sections')
  @Public()
  @Header('Cache-Control', 'public, max-age=300')
  getSections() {
    return this.referenceDataService.getSections();
  }

  @Get('categories')
  @Public()
  @Header('Cache-Control', 'public, max-age=300')
  getCategories(@Query('sectionId') sectionId?: string) {
    return this.referenceDataService.getCategories(sectionId);
  }

  @Get('skills')
  @Public()
  @Header('Cache-Control', 'public, max-age=300')
  getSkills() {
    return this.referenceDataService.getSkills();
  }

  @Get('appearances')
  @Public()
  @Header('Cache-Control', 'public, max-age=300')
  getAppearances() {
    return this.referenceDataService.getAppearances();
  }

  @Get('languages')
  @Public()
  @Header('Cache-Control', 'public, max-age=300')
  getLanguages() {
    return this.referenceDataService.getLanguages();
  }
}
