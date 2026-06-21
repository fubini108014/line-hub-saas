import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  findAll(merchantId: string) {
    return this.prisma.formTemplate.findMany({
      where: { merchantId, isActive: true },
      include: { _count: { select: { responses: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.formTemplate.findUnique({ where: { id } });
  }

  create(merchantId: string, data: { title: string; description?: string; fields: any[] }) {
    return this.prisma.formTemplate.create({ data: { merchantId, ...data } });
  }

  update(id: string, data: any) {
    return this.prisma.formTemplate.update({ where: { id }, data });
  }

  async submitResponse(data: {
    formId: string;
    merchantId: string;
    lineUserId?: string;
    answers: Record<string, any>;
  }) {
    const form = await this.prisma.formTemplate.findUnique({ where: { id: data.formId } });
    if (!form) throw new NotFoundException('Form not found');

    let memberId: string | undefined;
    if (data.lineUserId) {
      const member = await this.prisma.member.findUnique({
        where: { merchantId_lineUserId: { merchantId: data.merchantId, lineUserId: data.lineUserId } },
      });
      memberId = member?.id;
    }

    return this.prisma.formResponse.create({
      data: { formId: data.formId, merchantId: data.merchantId, memberId, answers: data.answers },
    });
  }

  getResponses(merchantId: string, formId: string) {
    return this.prisma.formResponse.findMany({
      where: { formId, merchantId },
      include: { member: true },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
