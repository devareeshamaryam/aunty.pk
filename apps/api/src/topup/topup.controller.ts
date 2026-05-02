// src/topup/topup.controller.ts
import {
  Controller, Get, Post, Put, Delete, Patch,
  Param, Body, UseInterceptors, UploadedFile,
  HttpCode, HttpStatus, ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { TopUpService } from './topup.service';
import { CreateTopUpDto } from './dto/create-topup.dto';
import { UpdateTopUpDto } from './dto/update-topup.dto';
import { Public } from '../auth/decorators/public.decorator';

// Multer config — saves to uploads/topups/
const topUpStorage = diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/topups';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `topup_${unique}${extname(file.originalname)}`);
  },
});

const imageFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'), false);
};

@Controller()
export class TopUpController {
  constructor(private readonly topUpService: TopUpService) {}

  // ── PUBLIC ──────────────────────────────────────────────────────────────
  @Public()
  @Get('topup-items')
  async getPublic() {
    const items = await this.topUpService.findAllPublic();
    return { success: true, items };
  }

  // ── ADMIN ───────────────────────────────────────────────────────────────
  @Get('admin/topup-items')
  async getAll() {
    const items = await this.topUpService.findAll();
    return { success: true, items };
  }

  @Get('admin/topup-items/:id')
  async getOne(@Param('id') id: string) {
    const item = await this.topUpService.findOne(id);
    return { success: true, item };
  }

  @Post('admin/topup-items')
  @UseInterceptors(FileInterceptor('image', { storage: topUpStorage, fileFilter: imageFilter }))
  async create(
    @Body(new ValidationPipe({ transform: true })) dto: CreateTopUpDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const item = await this.topUpService.create(dto, file);
    return { success: true, item };
  }

  @Put('admin/topup-items/:id')
  @UseInterceptors(FileInterceptor('image', { storage: topUpStorage, fileFilter: imageFilter }))
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, skipMissingProperties: true })) dto: UpdateTopUpDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const item = await this.topUpService.update(id, dto, file);
    return { success: true, item };
  }

  @Patch('admin/topup-items/:id/toggle')
  async toggle(@Param('id') id: string) {
    const item = await this.topUpService.toggleAvailable(id);
    return { success: true, item };
  }

  @Delete('admin/topup-items/:id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.topUpService.remove(id);
    return { success: true, message: 'Item deleted' };
  }
}