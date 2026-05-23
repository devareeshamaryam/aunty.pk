import {
  Controller,
  Get,
  Param,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { join, basename, normalize } from 'path';
import { existsSync } from 'fs';
import { Public } from '../auth/decorators/public.decorator';

const ALLOWED_FILENAME_RE = /^[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif)$/i;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

/**
 * The API no longer accepts uploads — those go to the dedicated CDN service
 * (apps/cdn). This controller only serves any legacy files that were stored
 * locally before the CDN existed. Voice messages from order creation are
 * served via the static-assets middleware in main.ts.
 */
@Controller('uploads')
export class UploadsController {
  @Public()
  @Get(':imgpath')
  seeUploadedFile(@Param('imgpath') image: string, @Res() res: any) {
    const safeName = basename(image);
    if (!ALLOWED_FILENAME_RE.test(safeName)) {
      throw new BadRequestException('Invalid filename');
    }
    const root = join(process.cwd(), UPLOAD_DIR);
    const resolved = normalize(join(root, safeName));
    if (!resolved.startsWith(root)) {
      throw new BadRequestException('Invalid path');
    }
    if (!existsSync(resolved)) {
      throw new NotFoundException('File not found');
    }
    return res.sendFile(safeName, { root });
  }
}
