import * as brevo from '@getbrevo/brevo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateBlockyfyFormSubmissionDto } from 'src/dto/create-blockyfy-form-submission.dto';

/**
 * Contact data for Brevo CRM (Nextsense)
 */
export interface BrevoContactData {
  email: string;
  firstName: string;
  lastName: string;
  message?: string;
  newsletterSubscribed: boolean;
}

export type BrevoBlockyfyContactData = Omit<
  CreateBlockyfyFormSubmissionDto,
  'attachments' | 'phone_number'
>;

/**
 * Service for managing contacts in Brevo (formerly Sendinblue)
 *
 * Responsibilities:
 * - Create and update contacts in Brevo CRM
 * - Manage contact list subscriptions
 *
 * Note: Email sending has been moved to EmailService for better separation of concerns
 */
@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private contactsApi: brevo.ContactsApi | null = null;
  private readonly listId: string | undefined;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    this.listId = this.configService.get<string>('BREVO_LIST_ID');

    if (this.isValidApiKey(apiKey)) {
      this.initializeBrevoClient(apiKey!);
    } else {
      this.logger.warn('Brevo API key not configured. Contact sync disabled.');
    }
  }

  /**
   * Validates the API key is present and not a placeholder
   */
  private isValidApiKey(apiKey: string | undefined): boolean {
    return !!apiKey && apiKey !== 'your-brevo-api-key-here';
  }

  /**
   * Initializes the Brevo API client for contacts
   */
  private initializeBrevoClient(apiKey: string): void {
    try {
      // Brevo SDK v2+ - constructor takes optional basePath, then set API key via setApiKey method
      this.contactsApi = new brevo.ContactsApi();
      this.contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);
      this.logger.log('Brevo contacts client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Brevo client:', error);
      this.contactsApi = null;
    }
  }

  /**
   * Check if contacts service is available
   */
  isAvailable(): boolean {
    return this.contactsApi !== null;
  }

  /**
   * Creates or updates a contact in Brevo CRM
   *
   * @param contactData - Contact information to sync
   * @returns Brevo contact ID or null if sync fails
   */
  async createOrUpdateNextsenseContact(
    contactData: BrevoContactData,
  ): Promise<string | null> {
    return this.createOrUpdateContact(
      contactData,
      (data) => this.buildNextsenseContactPayload(data),
      (data) => this.updateExistingContact(data),
      contactData.email,
    );
  }

  /**
   * Creates or updates a Blockyfy contact in Brevo CRM
   *
   * @param contactData - Contact information to sync
   * @returns Brevo contact ID or null if sync fails
   */
  async createOrUpdateBlockyfyContact(
    contactData: BrevoBlockyfyContactData,
  ): Promise<string | null> {
    return this.createOrUpdateContact(
      contactData,
      (data) => this.buildBlockyfyContactPayload(data),
      (data) => this.updateExistingBlockyfyContact(data),
      contactData.email,
    );
  }

  /**
   * Generic method to create or update a contact in Brevo CRM
   */
  private async createOrUpdateContact<T extends { email: string }>(
    contactData: T,
    buildPayload: (data: T) => brevo.CreateContact,
    updateExisting: (data: T) => Promise<string | null>,
    email: string,
  ): Promise<string | null> {
    if (!this.contactsApi) {
      this.logger.warn('Brevo Contacts API not initialized. Skipping sync.');
      return null;
    }

    try {
      const contact = buildPayload(contactData);
      const response = await this.contactsApi.createContact(contact);

      this.logger.log(`Contact created/updated in Brevo: ${email}`);
      return this.extractContactId(response, email);
    } catch (error) {
      return this.handleContactError(error, contactData, updateExisting, email);
    }
  }

  /**
   * Extracts contact ID from Brevo API response
   */
  private extractContactId(response: any, email: string): string {
    if (!response?.body?.id) {
      this.logger.warn(
        response
          ? 'Brevo API response missing body property or ID'
          : 'Brevo API returned undefined response',
      );
      return email;
    }

    const contactId = response.body.id;
    if (contactId !== undefined && contactId !== null) {
      return String(contactId);
    }

    this.logger.warn(
      `Contact ID not found in response, using email as fallback: ${email}`,
    );
    return email;
  }

  /**
   * Builds the Brevo contact payload for Nextsense
   */
  private buildNextsenseContactPayload(
    contactData: BrevoContactData,
  ): brevo.CreateContact {
    const contact = new brevo.CreateContact();

    contact.email = contactData.email;
    contact.attributes = {
      FIRSTNAME: contactData.firstName,
      LASTNAME: contactData.lastName,
      MESSAGE: contactData.message || '',
    } as any;

    // Add to newsletter list if subscribed
    if (contactData.newsletterSubscribed && this.listId) {
      contact.listIds = [parseInt(this.listId)];
    }

    contact.updateEnabled = true;
    return contact;
  }

  /**
   * Builds the Brevo contact payload
   */
  private buildBlockyfyContactPayload(
    contactData: BrevoBlockyfyContactData,
  ): brevo.CreateContact {
    const contact = new brevo.CreateContact();

    contact.email = contactData.email;
    contact.attributes = {
      NAME: contactData.name,
      BUDGET: contactData.budget,
      SOURCE: contactData.source,
      MESSAGE: contactData.message || '',
    } as any;

    // Add to newsletter list if subscribed
    if (contactData.newsletterSubscribed && this.listId) {
      contact.listIds = [parseInt(this.listId)];
    }

    contact.updateEnabled = true;
    return contact;
  }

  /**
   * Handles errors during contact creation
   */
  private async handleContactError<T extends { email: string }>(
    error: any,
    contactData: T,
    updateExisting: (data: T) => Promise<string | null>,
    email: string,
  ): Promise<string | null> {
    this.logError(error);

    if (this.isDuplicateError(error)) {
      this.logger.log(`Contact exists, updating: ${email}`);
      try {
        return await updateExisting(contactData);
      } catch (updateError) {
        this.logError(updateError, 'Error updating existing contact in Brevo:');
        return email;
      }
    }

    this.logger.warn(
      `Using email as contact identifier due to error: ${email}`,
    );
    return email;
  }

  /**
   * Logs error details for debugging
   */
  private logError(
    error: any,
    prefix = 'Error creating contact in Brevo:',
  ): void {
    this.logger.error(prefix, error);

    if (error instanceof Error) {
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(`Error name: ${error.name}`);

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
        this.logger.error(`Error Body: ${JSON.stringify(error.body, null, 2)}`);
      }

      if (error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
    } else {
      this.logger.error(
        `Unknown error type: ${JSON.stringify(error, null, 2)}`,
      );
    }
  }

  /**
   * Checks if the error is a duplicate contact error
   */
  private isDuplicateError(error: any): boolean {
    return (
      error.response?.statusCode === 400 &&
      error.response?.body?.code === 'duplicate_parameter'
    );
  }

  /**
   * Updates an existing Nextsense contact in Brevo
   */
  private async updateExistingContact(
    contactData: BrevoContactData,
  ): Promise<string | null> {
    return this.updateContact(
      contactData.email,
      {
        FIRSTNAME: contactData.firstName,
        LASTNAME: contactData.lastName,
        MESSAGE: contactData.message || '',
      },
      contactData.newsletterSubscribed,
    );
  }

  /**
   * Updates an existing Blockyfy contact in Brevo
   */
  private async updateExistingBlockyfyContact(
    contactData: BrevoBlockyfyContactData,
  ): Promise<string | null> {
    return this.updateContact(
      contactData.email,
      {
        NAME: contactData.name,
        BUDGET: contactData.budget,
        SOURCE: contactData.source,
        MESSAGE: contactData.message || '',
      },
      contactData.newsletterSubscribed,
    );
  }

  /**
   * Generic method to update an existing contact in Brevo
   */
  private async updateContact(
    email: string,
    attributes: Record<string, string>,
    newsletterSubscribed: boolean,
  ): Promise<string | null> {
    if (!this.contactsApi) {
      return email;
    }

    try {
      const updatePayload = new brevo.UpdateContact();
      updatePayload.attributes = attributes as any;

      if (newsletterSubscribed && this.listId) {
        updatePayload.listIds = [parseInt(this.listId)];
      }

      const response = await this.contactsApi.updateContact(
        email,
        updatePayload,
      );
      this.logger.log(`Contact updated in Brevo: ${email}`);

      return this.extractContactId(response, email);
    } catch (error) {
      this.logError(error, 'Error updating contact in Brevo:');
      return email;
    }
  }
}

