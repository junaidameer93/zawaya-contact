import {
  IsEmail,
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ThankYouEmailSource } from 'src/modules/email';

/**
 * DTO for validating incoming form submission data
 * Ensures all required fields are present and properly formatted
 * Handles FormData transformations for arrays and booleans
 */
export class CreateBlockyfyFormSubmissionDto {
  @ApiProperty({
    description: 'name of the contact',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Email address of the contact',
    example: 'john.doe@yopmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number of the contact in international format',
    example: '+923034498123',
  })
  @IsString()
  @MinLength(1)
  phone_number: string;

  @ApiProperty({
    description: 'Budget range selected by the contact',
    example: '$10,000 - $50,000',
  })
  @IsString()
  @MinLength(1)
  budget: string;

  @ApiPropertyOptional({
    description: 'Optional message from the contact',
    example: 'I would like to discuss my project requirements.',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description:
      'Optional file attachments (max 5 files, 5MB each). Click "Choose Files" to upload files from your computer.',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: false,
  })
  @IsOptional()
  attachments?: any; // Not validated - files are handled by FileUploadInterceptor. Type is 'any' to avoid validation issues.

  @ApiProperty({
    description: 'Whether the contact subscribed to newsletter',
    example: true,
    default: false,
  })
  @IsBoolean()
  @Transform(({ value }) => {
    // Handle FormData booleans - they come as strings "true" or "false"
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  newsletterSubscribed: boolean;

  @ApiProperty({
    description: 'How did you hear about us?',
    example: 'Google',
  })
  @IsString()
  @MinLength(1)
  source: string;
}
