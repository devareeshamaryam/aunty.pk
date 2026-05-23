import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderEtaDto } from './dto/order.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // === Public (guest) endpoints ===

  @Public()
  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user?.sub;
    return this.ordersService.create(userId, dto);
  }

  /** Public order tracking - requires guestId query param to authenticate. */
  @Public()
  @Get('track/:id')
  trackOne(@Param('id') id: string, @Query('guestId') guestId: string) {
    if (!guestId) throw new BadRequestException('guestId is required');
    return this.ordersService.trackForGuest(id, guestId);
  }

  /** Public: list a guest's orders. */
  @Public()
  @Get('by-guest/:guestId')
  listByGuest(@Param('guestId') guestId: string) {
    if (!guestId || guestId.length < 8) {
      throw new BadRequestException('Invalid guestId');
    }
    return this.ordersService.listForGuest(guestId);
  }

  // === Admin endpoints ===

  @UseGuards(AdminGuard)
  @Get('stats')
  getStats() {
    return this.ordersService.getStats();
  }

  /** Recent unseen orders shown on the dashboard home. */
  @UseGuards(AdminGuard)
  @Get('unseen')
  listUnseen(@Query('limit') limit?: string) {
    return this.ordersService.listUnseen(limit ? parseInt(limit) : 10);
  }

  @UseGuards(AdminGuard)
  @Get('unseen/count')
  unseenCount() {
    return this.ordersService.unseenCount().then((count) => ({ count }));
  }

  @UseGuards(AdminGuard)
  @Put(':id/seen')
  markSeen(@Param('id') id: string) {
    return this.ordersService.markSeen(id);
  }

  @UseGuards(AdminGuard)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
    });
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @UseGuards(AdminGuard)
  @Put(':id/eta')
  updateEta(@Param('id') id: string, @Body() dto: UpdateOrderEtaDto) {
    return this.ordersService.updateEta(id, dto);
  }
}
