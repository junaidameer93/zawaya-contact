import * as brevo from '@getbrevo/brevo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { newFormSubmissionTemplate } from '../../emails-template/new-form-submission';
import { thankyouTemplate } from '../../emails-template/thankyou';
import {
  AdminNotificationEmailData,
  SendEmailOptions,
  SendEmailResult,
  ThankYouEmailData,
} from './interfaces/email.interface';
import { blockyfyThankyouTemplate } from 'src/emails-template/blockyfy-thankyou';

/**
 * Default sender configurations
 */
const DEFAULT_SENDERS = {
  FEXEN: { name: 'Nextsense Team', email: 'noreply@nextsensesolution.com' },
  BLOCKYFY: {
    name: 'Blockyfy Software Solutions',
    email: 'noreply@blockyfy.com',
  },
  SYSTEM: { name: 'Form Handler System', email: 'noreply@formhandler.com' },
} as const;

/**
 * Reusable email service for sending transactional emails via Brevo
 *
 * Features:
 * - Generic email sending with full customization
 * - Pre-built methods for common email types
 * - Automatic error handling and logging
 * - Type-safe interfaces
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private emailApi: brevo.TransactionalEmailsApi | null = null;
  private readonly adminEmail: string | undefined;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    this.adminEmail = this.configService.get<string>('ADMIN_EMAIL');

    if (Boolean(apiKey)) {
      this.initializeBrevoClient(apiKey!);
    } else {
      this.logger.warn('Brevo API key not configured. Email sending disabled.');
    }
  }

  /**
   * Initializes the Brevo API client
   */
  private initializeBrevoClient(apiKey: string): void {
    try {
      // Brevo SDK v2+ - constructor takes optional basePath, then set API key via setApiKey method
      this.emailApi = new brevo.TransactionalEmailsApi();
      this.emailApi.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey,
        apiKey,
      );
      this.logger.log('Brevo email client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Brevo client:', error);
      this.emailApi = null;
    }
  }

  /**
   * Check if email service is available
   */
  isAvailable(): boolean {
    return this.emailApi !== null;
  }

  /**
   * Core method to send any email with full customization
   * All other email methods should use this internally
   *
   * @param options - Email configuration options
   * @returns Result indicating success or failure
   */
  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.emailApi) {
      this.logger.warn('Email API not initialized. Skipping email send.');
      return { success: false, error: 'Email service unavailable' };
    }

    try {
      const email = this.buildEmailPayload(options);
      const response = await this.emailApi.sendTransacEmail(email);

      this.logger.log(
        `Email sent successfully to: ${this.formatRecipients(options.to)}`,
      );

      return {
        success: true,
        messageId: response.body.messageId,
      };
    } catch (error) {
      // Log full error details for debugging
      this.logger.error('Failed to send email:', error);

      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error name: ${error.name}`);

        // Log additional error details if available (Brevo SDK errors)
        if ('response' in error && error.response) {
          const response = error.response as any;
          this.logger.error(
            `Brevo API Response Status: ${response.statusCode || response.status || 'N/A'}`,
          );

          if (response.body) {
            this.logger.error(
              `Brevo API Response Body: ${JSON.stringify(response.body, null, 2)}`,
            );
          } else if (response.data) {
            this.logger.error(
              `Brevo API Response Data: ${JSON.stringify(response.data, null, 2)}`,
            );
          }
        }

        if ('statusCode' in error) {
          this.logger.error(`HTTP Status Code: ${(error as any).statusCode}`);
        }

        if ('body' in error && error.body) {
          this.logger.error(
            `Error Body: ${JSON.stringify(error.body, null, 2)}`,
          );
        }

        // Log stack trace for debugging
        if (error.stack) {
          this.logger.error(`Stack trace: ${error.stack}`);
        }
      } else {
        this.logger.error(
          `Unknown error type: ${JSON.stringify(error, null, 2)}`,
        );
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Builds the Brevo email payload from options
   */
  private buildEmailPayload(options: SendEmailOptions): brevo.SendSmtpEmail {
    const email = new brevo.SendSmtpEmail();

    // Handle recipients - normalize to array
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    email.to = recipients.map((r) => ({
      email: r.email,
      ...(r.name && { name: r.name }),
    }));

    email.sender = options.sender || DEFAULT_SENDERS.FEXEN;
    email.subject = options.subject;
    email.htmlContent = options.htmlContent;

    if (options.textContent) {
      email.textContent = options.textContent;
    }

    if (options.replyTo) {
      email.replyTo = options.replyTo;
    }

    if (options.attachments?.length) {
      email.attachment = options.attachments.map((a) => ({
        name: a.name,
        content: a.content,
        ...(a.contentType && { contentType: a.contentType }),
      }));
    }

    return email;
  }

  /**
   * Formats recipients for logging
   */
  private formatRecipients(to: SendEmailOptions['to']): string {
    const recipients = Array.isArray(to) ? to : [to];
    return recipients.map((r) => r.email).join(', ');
  }

  // ============================================================
  // Pre-built Email Methods for Common Use Cases
  // ============================================================

  /**
   * Sends a thank you email to a user after form submission
   *
   * @param data - User data for the thank you email
   */
  async sendThankYouEmail(
    data: ThankYouEmailData,
  ): Promise<SendEmailResult> {
    const fullName = `${data.firstName} ${data.lastName}`;

    const sender =
      data.source === 'nextsense' ? DEFAULT_SENDERS.FEXEN : DEFAULT_SENDERS.BLOCKYFY;
    const renderedTemplate =
      data.source === 'nextsense' ? thankyouTemplate : blockyfyThankyouTemplate;

    return this.send({
      to: {
        email: data.recipientEmail,
        name: fullName,
      },
      subject: `Thank you, ${data.firstName}! We've received your submission`,
      htmlContent: renderedTemplate({ interests: data.interests }),
      sender: sender,
    });
  }

  async sendBlockyfyThankYouEmail(
    data: ThankYouEmailData,
  ): Promise<SendEmailResult> {
    const fullName = `${data.firstName} ${data.lastName}`;
    return this.send({
      to: {
        email: data.recipientEmail,
        name: fullName,
      },
      subject: `Thank you, ${data.firstName}! We've received your submission`,
      htmlContent: blockyfyThankyouTemplate({ interests: data.interests }),
      sender: DEFAULT_SENDERS.BLOCKYFY,
    });
  }

  /**
   * Sends a notification email to admin about a new form submission
   *
   * @param data - Form submission data for the notification
   */
  async sendAdminNotification(
    data: AdminNotificationEmailData,
  ): Promise<SendEmailResult> {
    if (!this.adminEmail) {
      this.logger.warn('Admin email not configured. Skipping notification.');
      return { success: false, error: 'Admin email not configured' };
    }

    return this.send({
      to: { email: this.adminEmail },
      subject: `New Form Submission from ${data.firstName} ${data.lastName}`,
      htmlContent: newFormSubmissionTemplate({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        interests: data.interests,
        budget: data.budget,
        message: data.message || '',
        newsletterSubscribed: data.newsletterSubscribed,
        submissionId: data.submissionId,
        attachments: data.attachments || [],
      }),
      sender: DEFAULT_SENDERS.SYSTEM,
    });
  }
}
