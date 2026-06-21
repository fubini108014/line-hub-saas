import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  getMenu(merchantId: string) {
    return this.prisma.productCategory.findMany({
      where: { merchantId },
      include: {
        products: {
          where: { isAvailable: true },
          include: { variants: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findAllProducts(merchantId: string) {
    return this.prisma.product.findMany({
      where: { merchantId },
      include: { category: true, variants: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  createCategory(merchantId: string, data: { name: string; sortOrder?: number }) {
    return this.prisma.productCategory.create({ data: { merchantId, ...data } });
  }

  createProduct(merchantId: string, data: any) {
    const { variants, ...rest } = data;
    return this.prisma.product.create({
      data: {
        merchantId,
        ...rest,
        variants: variants ? { create: variants } : undefined,
      },
      include: { variants: true },
    });
  }

  updateProduct(id: string, data: any) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async createOrder(
    merchantId: string,
    lineUserId: string,
    data: { items: { productId: string; quantity: number; options?: any }[]; note?: string; pickupTime?: string },
  ) {
    const member = await this.prisma.member.upsert({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
      create: { merchantId, lineUserId },
      update: {},
    });

    const productIds = data.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      subtotal += Number(product.price) * item.quantity;
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        options: item.options ?? null,
      };
    });

    return this.prisma.order.create({
      data: {
        merchantId,
        memberId: member.id,
        orderNumber: `ORD-${Date.now()}`,
        subtotal,
        note: data.note,
        pickupTime: data.pickupTime,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });
  }

  findOrders(merchantId: string) {
    return this.prisma.order.findMany({
      where: { merchantId },
      include: { member: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateOrderStatus(id: string, status: string) {
    return this.prisma.order.update({ where: { id }, data: { status: status as any } });
  }

  async getMyOrders(merchantId: string, lineUserId: string) {
    const member = await this.prisma.member.findUnique({
      where: { merchantId_lineUserId: { merchantId, lineUserId } },
    });
    if (!member) return [];
    return this.prisma.order.findMany({
      where: { merchantId, memberId: member.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
