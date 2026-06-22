import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentMerchant() m: { id: string }) {
    return this.ordersService.findOrders(m.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('products')
  getProducts(@CurrentMerchant() m: { id: string }) {
    return this.ordersService.findAllProducts(m.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('categories')
  createCategory(@CurrentMerchant() m: { id: string }, @Body() body: any) {
    return this.ordersService.createCategory(m.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('products')
  createProduct(@CurrentMerchant() m: { id: string }, @Body() body: any) {
    return this.ordersService.createProduct(m.id, body);
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
