import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CreateNextsenseFormSubmissionDto } from 'src/dto/create-nextsense-form-submission.dto';

/**
 * MongoDB schema for storing form submissions
 * This stores all contact form data including user interests, contact info, and message
 */
@Schema({ timestamps: true })
export class NextsenseFormSubmission
  extends Document
  implements CreateNextsenseFormSubmissionDto
{
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  message: string;

  @Prop({ default: false })
  newsletterSubscribed: boolean;

  @Prop({ default: false })
  privacyPolicyAccepted: boolean;

  @Prop({ type: [String] })
  attachments: string[];

  // Track if contact was successfully synced to Brevo
  @Prop({ default: false })
  syncedToBrevo: boolean;

  @Prop()
  brevoContactId: string;
}

export const NextsenseFormSubmissionSchema = SchemaFactory.createForClass(
  NextsenseFormSubmission,
);
