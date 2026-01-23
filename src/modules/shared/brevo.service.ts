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
 * Contact data for Brevo CRM (Zawaya)
 */
export interface BrevoZawayaContactData {
  businessEmail: string;
  firstName: string;
  lastName: string;
  companyProfile?: string;
  companyWebsite?: string;
}

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
  private readonly listId: string | undefined; // Legacy - used for Blockyfy
  private readonly zawayadaoListId: string | undefined; // New - for Nextsense/Zawaya
  private readonly zawayadaoListName: string | undefined; // Optional list name

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    
    // Legacy list ID for Blockyfy
    this.listId = this.configService.get<string>('BREVO_LIST_ID');
    
    // New Zawaya-specific list configuration for Nextsense
    this.zawayadaoListId = this.configService.get<string>('ZAWAYA_CONTACT_ID');
    this.zawayadaoListName = this.configService.get<string>('ZAWAYA_CONTACT_LIST');

    if (this.isValidApiKey(apiKey)) {
      this.initializeBrevoClient(apiKey!);
    } else {
      this.logger.warn('Brevo API key not configured. Contact sync disabled.');
    }
    
    // Log configuration for debugging
    this.logger.log(`Brevo Lists - Blockyfy: ${this.listId || 'not set'}, Zawaya: ${this.zawayadaoListId || 'not set'}`);
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
   * Creates or updates a Zawaya contact in Brevo CRM
   *
   * @param contactData - Contact information to sync
   * @returns Brevo contact ID or null if sync fails
   */
  async createOrUpdateZawayaContact(
    contactData: BrevoZawayaContactData,
  ): Promise<string | null> {
    if (!this.contactsApi) {
      this.logger.warn('Brevo Contacts API not initialized. Skipping sync.');
      return null;
    }

    try {
      const contact = this.buildZawayaContactPayload(contactData);
      const response = await this.contactsApi.createContact(contact);

      this.logger.log(`Contact created/updated in Brevo: ${contactData.businessEmail}`);
      return this.extractContactId(response, contactData.businessEmail);
    } catch (error) {
      this.logError(error);

      if (this.isDuplicateError(error)) {
        this.logger.log(`Contact exists, updating: ${contactData.businessEmail}`);
        try {
          return await this.updateExistingZawayaContact(contactData);
        } catch (updateError) {
          this.logError(updateError, 'Error updating existing Zawaya contact in Brevo:');
          return contactData.businessEmail;
        }
      }

      this.logger.warn(
        `Using email as contact identifier due to error: ${contactData.businessEmail}`,
      );
      return contactData.businessEmail;
    }
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
   * Uses Zawaya-specific list ID (ZAWAYA_CONTACT_ID)
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

    // Add to Zawaya newsletter list if subscribed (uses new env var)
    if (contactData.newsletterSubscribed && this.zawayadaoListId) {
      contact.listIds = [parseInt(this.zawayadaoListId)];
      this.logger.log(`Adding contact to Zawaya list: ${this.zawayadaoListName || this.zawayadaoListId}`);
    }

    contact.updateEnabled = true;
    return contact;
  }

  /**
   * Builds the Brevo contact payload for Blockyfy
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
   * Builds the Brevo contact payload for Zawaya
   */
  private buildZawayaContactPayload(
    contactData: BrevoZawayaContactData,
  ): brevo.CreateContact {
    const contact = new brevo.CreateContact();

    contact.email = contactData.businessEmail;
    contact.attributes = {
      FIRSTNAME: contactData.firstName,
      LASTNAME: contactData.lastName,
      COMPANY_PROFILE: contactData.companyProfile || '',
      COMPANY_WEBSITE: contactData.companyWebsite || '',
    } as any;

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
   * Uses Zawaya-specific list ID (ZAWAYA_CONTACT_ID)
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
      'nextsense', // Specify form type for correct list ID
    );
  }

  /**
   * Updates an existing Blockyfy contact in Brevo
   * Uses legacy list ID (BREVO_LIST_ID)
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
      'blockyfy', // Specify form type for correct list ID
    );
  }

  /**
   * Updates an existing Zawaya contact in Brevo
   */
  private async updateExistingZawayaContact(
    contactData: BrevoZawayaContactData,
  ): Promise<string | null> {
    if (!this.contactsApi) {
      return contactData.businessEmail;
    }

    try {
      const updatePayload = new brevo.UpdateContact();
      updatePayload.attributes = {
        FIRSTNAME: contactData.firstName,
        LASTNAME: contactData.lastName,
        COMPANY_PROFILE: contactData.companyProfile || '',
        COMPANY_WEBSITE: contactData.companyWebsite || '',
      } as any;

      const response = await this.contactsApi.updateContact(
        contactData.businessEmail,
        updatePayload,
      );
      this.logger.log(`Zawaya contact updated in Brevo: ${contactData.businessEmail}`);

      return this.extractContactId(response, contactData.businessEmail);
    } catch (error) {
      this.logError(error, 'Error updating Zawaya contact in Brevo:');
      return contactData.businessEmail;
    }
  }

  /**
   * Generic method to update an existing contact in Brevo
   * @param formType - 'nextsense' uses Zawaya list, 'blockyfy' uses legacy list
   */
  private async updateContact(
    email: string,
    attributes: Record<string, string>,
    newsletterSubscribed: boolean,
    formType: 'nextsense' | 'blockyfy' = 'nextsense',
  ): Promise<string | null> {
    if (!this.contactsApi) {
      return email;
    }

    try {
      const updatePayload = new brevo.UpdateContact();
      updatePayload.attributes = attributes as any;

      // Use appropriate list ID based on form type
      if (newsletterSubscribed) {
        if (formType === 'nextsense' && this.zawayadaoListId) {
          updatePayload.listIds = [parseInt(this.zawayadaoListId)];
          this.logger.log(`Updating contact in Zawaya list: ${this.zawayadaoListName || this.zawayadaoListId}`);
        } else if (formType === 'blockyfy' && this.listId) {
          updatePayload.listIds = [parseInt(this.listId)];
          this.logger.log(`Updating contact in Blockyfy list: ${this.listId}`);
        }
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

