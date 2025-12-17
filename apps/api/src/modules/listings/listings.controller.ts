import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto } from './dto';

@Controller('listings')
export class ListingsController {
  constructor(private svc: ListingsService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post()
  create(@Body() dto: CreateListingDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Post(':id/assess-hug')
  assess(@Param('id') id: string, @Body() body: { officialPrice?: number }) {
    return this.svc.assess(id, body?.officialPrice);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() body: { content: string }) {
    return this.svc.addNote(id, body.content);
  }
}
