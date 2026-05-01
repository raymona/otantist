import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SubmitInviteRequestDto, ReviewInviteRequestDto, InviteRequestResponse } from './dto';

const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = 'REQ-';
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
  }
  return code;
}

@Injectable()
export class InviteRequestService {
  private readonly logger = new Logger(InviteRequestService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async submit(dto: SubmitInviteRequestDto): Promise<{ submitted: boolean }> {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    // Check for existing pending request — silently succeed to prevent email enumeration
    const existing = await this.prisma.inviteRequest.findFirst({
      where: { email, status: 'pending' },
    });

    if (existing) {
      return { submitted: true };
    }

    await this.prisma.inviteRequest.create({
      data: {
        name,
        email,
        context: dto.context,
        message: dto.message?.trim() || null,
        language: (dto.language as any) || 'fr',
      },
    });

    this.logger.log(`New invite request from ${email}`);
    return { submitted: true };
  }

  async listRequests(status?: string): Promise<InviteRequestResponse[]> {
    const where: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status;
    }

    const requests = await this.prisma.inviteRequest.findMany({
      where,
      include: { inviteCode: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return requests.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      context: r.context,
      message: r.message,
      language: r.language,
      status: r.status,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      inviteCode: r.inviteCode?.code ?? null,
    }));
  }

  async countPending(): Promise<number> {
    return this.prisma.inviteRequest.count({
      where: { status: 'pending' },
    });
  }

  async review(dto: ReviewInviteRequestDto): Promise<InviteRequestResponse> {
    const request = await this.prisma.inviteRequest.findUnique({
      where: { id: dto.requestId },
    });

    if (!request) {
      throw new NotFoundException({
        code: 'REQUEST_NOT_FOUND',
        message_en: 'Invite request not found',
        message_fr: "Demande d'invitation non trouvée",
      });
    }

    if (request.status !== 'pending') {
      throw new BadRequestException({
        code: 'REQUEST_ALREADY_REVIEWED',
        message_en: 'This request has already been reviewed',
        message_fr: 'Cette demande a déjà été examinée',
      });
    }

    if (dto.decision === 'approved') {
      return this.approveRequest(request);
    }

    // Reject
    const updated = await this.prisma.inviteRequest.update({
      where: { id: request.id },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
      },
    });

    this.logger.log(`Invite request rejected: ${request.email}`);

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      context: updated.context,
      message: updated.message,
      language: updated.language,
      status: updated.status,
      createdAt: updated.createdAt,
      reviewedAt: updated.reviewedAt,
      inviteCode: null,
    };
  }

  private async approveRequest(request: any): Promise<InviteRequestResponse> {
    // Generate a unique invite code
    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      const exists = await this.prisma.inviteCode.findUnique({ where: { code } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new BadRequestException({
        code: 'CODE_GENERATION_FAILED',
        message_en: 'Failed to generate a unique invite code. Please try again.',
        message_fr: "Impossible de générer un code d'invitation unique. Veuillez réessayer.",
      });
    }

    // Create invite code and update request in a transaction
    const [inviteCode, updated] = await this.prisma.$transaction([
      this.prisma.inviteCode.create({
        data: {
          code,
          maxUses: 1,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      }),
      this.prisma.inviteRequest.update({
        where: { id: request.id },
        data: {
          status: 'approved',
          reviewedAt: new Date(),
        },
      }),
    ]);

    // Link the invite code to the request
    await this.prisma.inviteRequest.update({
      where: { id: request.id },
      data: { inviteCodeId: inviteCode.id },
    });

    // Send invite code email (non-fatal)
    try {
      await this.emailService.sendInviteCodeEmail(
        request.email,
        code,
        request.language as 'fr' | 'en'
      );
      this.logger.log(`Invite code emailed to ${request.email}`);
    } catch (err) {
      this.logger.error(`Failed to email invite code to ${request.email}`, err);
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      context: updated.context,
      message: updated.message,
      language: updated.language,
      status: updated.status,
      createdAt: updated.createdAt,
      reviewedAt: updated.reviewedAt,
      inviteCode: code,
    };
  }
}
