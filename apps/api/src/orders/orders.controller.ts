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
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user?.sub;
    return this.ordersService.create(userId, dto);
  }

  @Get('my-orders')
  findMyOrders(@Req() req: any) {
    return this.ordersService.findUserOrders(req.user.sub, req.user.email);
  }

  @UseGuards(AdminGuard)
  @Get('stats')
  getStats() {
    return this.ordersService.getStats();
  }

  @UseGuards(AdminGuard)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('user') user?: string,
  ) {
    return this.ordersService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
      user,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // Note: In a real app, verify that the order belongs to the user or user is admin
    return this.ordersService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
