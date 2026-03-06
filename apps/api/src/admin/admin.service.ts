import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUserResponse, SetRoleDto } from './dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async listUsers(search?: string): Promise<AdminUserResponse[]> {
    const where: any = {};

    if (search?.trim()) {
      where.OR = [
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { user: { displayName: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const accounts = await this.prisma.account.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return accounts.map(account => ({
      accountId: account.id,
      email: account.email,
      displayName: account.user?.displayName ?? null,
      accountType: account.accountType,
      status: account.status,
      emailVerified: account.emailVerified,
      onboardingComplete: account.user?.onboardingComplete ?? false,
      createdAt: account.createdAt,
    }));
  }

  async setRole(dto: SetRoleDto): Promise<AdminUserResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
      include: { user: true },
    });

    if (!account) {
      throw new NotFoundException({
        code: 'ACCOUNT_NOT_FOUND',
        message_en: 'Account not found',
        message_fr: 'Compte non trouvé',
      });
    }

    if (account.accountType === 'parent_managed') {
      throw new BadRequestException({
        code: 'CANNOT_CHANGE_MANAGED_ROLE',
        message_en: 'Cannot change role of parent-managed accounts',
        message_fr: 'Impossible de modifier le rôle des comptes gérés par un parent',
      });
    }

    await this.prisma.account.update({
      where: { id: dto.accountId },
      data: { accountType: dto.role },
    });

    return {
      accountId: account.id,
      email: account.email,
      displayName: account.user?.displayName ?? null,
      accountType: dto.role,
      status: account.status,
      emailVerified: account.emailVerified,
      onboardingComplete: account.user?.onboardingComplete ?? false,
      createdAt: account.createdAt,
    };
  }
}
