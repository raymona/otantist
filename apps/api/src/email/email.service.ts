import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'localhost'),
      port: parseInt(this.configService.get('SMTP_PORT', '1025'), 10),
      secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
      ...(this.configService.get('SMTP_USER') && {
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      }),
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const fromName = this.configService.get('EMAIL_FROM_NAME', 'Otantist');
    const fromEmail = this.configService.get('EMAIL_FROM', 'noreply@otantist.com');

    const maxAttempts = 3;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        return; // Success — exit immediately
      } catch (error: any) {
        lastError = error;
        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s
          this.logger.warn(
            `Email send attempt ${attempt}/${maxAttempts} failed (to: ${options.to}), retrying in ${delay}ms: ${error.message}`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(
      `Email send failed after ${maxAttempts} attempts (to: ${options.to}): ${lastError?.message}`
    );
    throw lastError;
  }

  async sendVerificationEmail(to: string, token: string, language: 'fr' | 'en'): Promise<void> {
    const baseUrl = this.configService.get('WEB_URL', 'http://localhost:3000');
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    const content = {
      fr: {
        subject: 'Vérifiez votre adresse courriel - Otantist',
        heading: 'Bienvenue sur Otantist!',
        body: 'Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse courriel.',
        button: 'Vérifier mon courriel',
        expiry: 'Ce lien expirera dans 24 heures.',
        ignore: "Si vous n'avez pas créé de compte, vous pouvez ignorer ce courriel.",
      },
      en: {
        subject: 'Verify your email - Otantist',
        heading: 'Welcome to Otantist!',
        body: 'Please click the button below to verify your email address.',
        button: 'Verify my email',
        expiry: 'This link will expire in 24 hours.',
        ignore: "If you didn't create an account, you can ignore this email.",
      },
    };

    const c = content[language];

    await this.sendEmail({
      to,
      subject: c.subject,
      html: this.emailTemplate({
        heading: c.heading,
        body: c.body,
        buttonText: c.button,
        buttonUrl: verifyUrl,
        footer: `${c.expiry}<br><br>${c.ignore}`,
      }),
    });
  }

  async sendPasswordResetEmail(to: string, token: string, language: 'fr' | 'en'): Promise<void> {
    const baseUrl = this.configService.get('WEB_URL', 'http://localhost:3000');
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const content = {
      fr: {
        subject: 'Réinitialisation de mot de passe - Otantist',
        heading: 'Réinitialisation de mot de passe',
        body: 'Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.',
        button: 'Réinitialiser mon mot de passe',
        expiry: 'Ce lien expirera dans 1 heure.',
        ignore:
          "Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer ce courriel.",
      },
      en: {
        subject: 'Password Reset - Otantist',
        heading: 'Password Reset',
        body: 'You requested a password reset. Click the button below to create a new password.',
        button: 'Reset my password',
        expiry: 'This link will expire in 1 hour.',
        ignore: "If you didn't request this reset, you can ignore this email.",
      },
    };

    const c = content[language];

    await this.sendEmail({
      to,
      subject: c.subject,
      html: this.emailTemplate({
        heading: c.heading,
        body: c.body,
        buttonText: c.button,
        buttonUrl: resetUrl,
        footer: `${c.expiry}<br><br>${c.ignore}`,
      }),
    });
  }

  async sendFeedbackEmail(opts: {
    name: string;
    message: string;
    category: string;
    fromEmail: string;
  }): Promise<void> {
    const to = this.configService.get('FEEDBACK_EMAIL', 'info@otantist.com');
    await this.sendEmail({
      to,
      subject: `[Feedback] ${opts.category} — from ${opts.name}`,
      html: `
        <p><strong>From:</strong> ${opts.name} (${opts.fromEmail})</p>
        <p><strong>Category:</strong> ${opts.category}</p>
        <hr>
        <p style="white-space:pre-wrap">${opts.message}</p>
      `.trim(),
      text: `From: ${opts.name} (${opts.fromEmail})\nCategory: ${opts.category}\n\n${opts.message}`,
    });
  }

  private emailTemplate(options: {
    heading: string;
    body: string;
    buttonText: string;
    buttonUrl: string;
    footer: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; border-radius: 8px; padding: 32px; text-align: center;">
    <h1 style="color: #2563eb; margin-bottom: 24px;">${options.heading}</h1>
    <p style="margin-bottom: 24px; font-size: 16px;">${options.body}</p>
    <a href="${options.buttonUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600;">${options.buttonText}</a>
    <p style="margin-top: 32px; font-size: 14px; color: #666;">${options.footer}</p>
  </div>
</body>
</html>
    `.trim();
  }
}
