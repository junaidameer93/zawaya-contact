import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CreateBlockyfyFormSubmissionDto } from 'src/dto/create-blockyfy-form-submission.dto';

/**
 * MongoDB schema for storing form submissions
 * This stores all contact form data including user interests, contact info, and message
 */
@Schema({ timestamps: true })
export class BlockyfyFormSubmission
  extends Document
  implements CreateBlockyfyFormSubmissionDto
{
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  phone_number: string;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  budget: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  message: string;

  @Prop({ type: [String] })
  attachments: string[];

  @Prop({ required: true })
  newsletterSubscribed: boolean;

  // Track if contact was successfully synced to Brevo
  @Prop({ default: false })
  syncedToBrevo: boolean;

  @Prop()
  brevoContactId: string;
}

export const BlockyfyFormSubmissionSchema = SchemaFactory.createForClass(
  BlockyfyFormSubmission,
);
