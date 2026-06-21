import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentMerchant() merchantId: string) {
    return this.ordersService.findOrders(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('products')
  getProducts(@CurrentMerchant() merchantId: string) {
    return this.ordersService.findAllProducts(merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('categories')
  createCategory(@CurrentMerchant() merchantId: string, @Body() body: any) {
    return this.ordersService.createCategory(merchantId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('products')
  createProduct(@CurrentMerchant() merchantId: string, @Body() body: any) {
    return this.ordersService.createProduct(merchantId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.ordersService.updateProduct(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateOrderStatus(id, body.status);
  }
}
