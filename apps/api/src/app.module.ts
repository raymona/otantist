import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PreferencesModule } from './preferences/preferences.module';
import { StateModule } from './state/state.module';
import { MessagingModule } from './messaging/messaging.module';
import { SafetyModule } from './safety/safety.module';
import { ModerationModule } from './moderation/moderation.module';
import { ParentDashboardModule } from './parent-dashboard/parent-dashboard.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Events
    EventEmitterModule.forRoot(),

    // Database
    PrismaModule,

    // Email
    EmailModule,

    // Feature modules
    AuthModule,
    UsersModule,
    PreferencesModule,
    StateModule,
    MessagingModule,
    SafetyModule,
    ModerationModule,
    ParentDashboardModule,
    GatewayModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
