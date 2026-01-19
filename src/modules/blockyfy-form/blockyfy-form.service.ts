import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBlockyfyFormSubmissionDto } from '../../dto/create-blockyfy-form-submission.dto';
import { BlockyfyFormSubmission } from '../../schemas/blockyfy-form-submission.schema';
import { EmailService, ThankYouEmailSource } from '../email';
import { BrevoService } from '../shared/brevo.service';

// Type definition for uploaded files
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

/**
 * Service for handling Blockyfy form submission business logic
 *
 * Responsibilities:
 * - Persist form submissions to MongoDB
 * - Coordinate with BrevoService for CRM sync
 * - Coordinate with EmailService for notifications
 */
@Injectable()
export class BlockyfyFormService {
  private readonly logger = new Logger(BlockyfyFormService.name);

  constructor(
    @InjectModel(BlockyfyFormSubmission.name)
    private blockyfyFormSubmissionModel: Model<BlockyfyFormSubmission>,
    private brevoService: BrevoService,
    private emailService: EmailService,
  ) {}

  /**
   * Creates a new form submission entry in MongoDB
   * Triggers background sync to Brevo and email notifications
   *
   * @param formSubmissionDto - Validated form data
   * @param files - Uploaded files (if any)
   * @returns Success response with submission ID
   */
  async createSubmission(
    formSubmissionDto: CreateBlockyfyFormSubmissionDto,
    files: UploadedFile[],
  ) {
    try {
      const attachmentPaths = files?.map((file) => file.path) || [];

      const submission = new this.blockyfyFormSubmissionModel({
        ...formSubmissionDto,
        attachments: attachmentPaths,
      });

      const savedSubmission = await submission.save();
      this.logger.log(`Form submission saved with ID: ${savedSubmission._id}`);

      // Handle CRM sync and notifications in background
      this.processSubmissionAsync(savedSubmission).catch((error) => {
        this.logger.error('Background processing failed', error);
      });

      return {
        success: true,
        message: 'Form submitted successfully',
        submissionId: savedSubmission._id,
      };
    } catch (error) {
      this.logger.error('Error creating form submission', error);
      throw new InternalServerErrorException('Failed to submit form');
    }
  }

  /**
   * Handles background processing after form submission
   * - Syncs contact to Brevo CRM
   * - Sends thank you email to user
   * - Sends notification to admin
   */
  private async processSubmissionAsync(
    submission: BlockyfyFormSubmission,
  ): Promise<void> {
    try {
      // 1. Sync contact to Brevo CRM
      const brevoContactId = await this.syncContactToBrevo(submission);

      // 2. Update submission with sync status
      await this.updateSyncStatus(submission._id, brevoContactId);

      // 3. Send emails in parallel for better performance
      await this.sendNotificationEmails(submission);
    } catch (error) {
      this.logger.error('Failed to process submission', error);
      // Don't throw - we want form submission to succeed even if processing fails
    }
  }

  /**
   * Syncs contact data to Brevo CRM
   */
  private async syncContactToBrevo(
    submission: BlockyfyFormSubmission,
  ): Promise<string | null> {
    const contactId = await this.brevoService.createOrUpdateBlockyfyContact({
      email: submission.email,
      name: submission.name,
      source: submission.source,
      budget: submission.budget,
      message: submission.message,
      newsletterSubscribed: submission.newsletterSubscribed,
    });

    if (contactId) {
      this.logger.log(`Contact synced to Brevo: ${contactId}`);
    }

    return contactId;
  }

  /**
   * Updates submission document with Brevo sync status
   */
  private async updateSyncStatus(
    submissionId: any,
    brevoContactId: string | null,
  ): Promise<void> {
    await this.blockyfyFormSubmissionModel.findByIdAndUpdate(submissionId, {
      syncedToBrevo: true,
      brevoContactId: brevoContactId,
    });
  }

  /**
   * Sends thank you and admin notification emails
   */
  private async sendNotificationEmails(
    submission: BlockyfyFormSubmission,
  ): Promise<void> {
    // Extract first name from full name (or use full name as first name)
    const nameParts = submission.name.split(' ');
    const firstName = nameParts[0] || submission.name;
    const lastName = nameParts.slice(1).join(' ') || '';

    const [thankYouResult, adminResult] = await Promise.all([
      this.emailService.sendThankYouEmail({
        recipientEmail: submission.email,
        firstName: firstName,
        lastName: lastName,
        interests: [], // Blockyfy doesn't have interests
        source: 'blockyfy' as ThankYouEmailSource,
      }),
      this.emailService.sendAdminNotification({
        firstName: firstName,
        lastName: lastName,
        email: submission.email,
        interests: [], // Blockyfy doesn't have interests
        budget: submission.budget,
        message: submission.message,
        newsletterSubscribed: submission.newsletterSubscribed,
        submissionId: String(submission._id),
        attachments: submission.attachments,
      }),
    ]);

    if (!thankYouResult.success) {
      this.logger.warn(`Thank you email failed: ${thankYouResult.error}`);
    }

    if (!adminResult.success) {
      this.logger.warn(`Admin notification failed: ${adminResult.error}`);
    }
  }
}

