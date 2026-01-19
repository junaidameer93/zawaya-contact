/**
 * Email recipient configuration
 */
export interface EmailRecipient {
  email: string;
  name?: string;
}

/**
 * Email sender configuration
 */
export interface EmailSender {
  email: string;
  name: string;
}

/**
 * Base email options that all emails must have
 */
export interface BaseEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
}

/**
 * Options for sending an email with HTML content
 */
export interface SendEmailOptions extends BaseEmailOptions {
  htmlContent: string;
  textContent?: string;
  sender?: EmailSender;
  replyTo?: EmailRecipient;
  attachments?: EmailAttachment[];
}

/**
 * Email attachment configuration
 */
export interface EmailAttachment {
  name: string;
  content: string; // Base64 encoded content
  contentType?: string;
}

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email template types for type-safe template selection
 */
export enum EmailTemplate {
  THANK_YOU = 'thank_you',
  ADMIN_NOTIFICATION = 'admin_notification',
}

export type ThankYouEmailSource = 'nextsense' | 'blockyfy';

/**
 * Data for thank you email template
 */
export interface ThankYouEmailData {
  recipientEmail: string;
  firstName: string;
  lastName: string;
  interests: string[];
  source: ThankYouEmailSource;
}

/**
 * Data for admin notification email template
 */
export interface AdminNotificationEmailData {
  firstName: string;
  lastName: string;
  email: string;
  interests: string[];
  budget: string;
  message?: string;
  newsletterSubscribed: boolean;
  submissionId: string;
  attachments?: string[];
}

