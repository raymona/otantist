import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManagedMemberResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  memberAccountId!: string;

  @ApiProperty()
  relationship!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  consentGivenAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  member!: {
    userId: string;
    displayName: string;
    accountStatus: string;
  };
}

export class MemberIndicatorResponse {
  @ApiProperty()
  recordedAt!: Date;

  @ApiPropertyOptional()
  socialEnergyAvg?: string | null;

  @ApiProperty()
  calmModeMinutes!: number;

  @ApiProperty()
  messagesSent!: number;

  @ApiProperty()
  messagesReceived!: number;
}

export class ParentAlertResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  alertType!: string;

  @ApiProperty()
  severity!: string;

  @ApiProperty()
  messageFr!: string;

  @ApiProperty()
  messageEn!: string;

  @ApiProperty()
  acknowledged!: boolean;

  @ApiPropertyOptional()
  acknowledgedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
