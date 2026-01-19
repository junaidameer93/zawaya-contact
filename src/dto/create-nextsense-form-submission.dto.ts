import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for validating incoming form submission data
 * Ensures all required fields are present and properly formatted
 * Handles FormData transformations for arrays and booleans
 */
export class CreateNextsenseFormSubmissionDto {
  @ApiProperty({
    description: 'First name of the contact',
    example: 'John',
  })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    description: 'Last name of the contact',
    example: 'Doe',
  })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({
    description: 'Email address of the contact',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Optional message from the contact',
    example: 'I would like to discuss my project requirements.',
  })
  @IsOptional()
  @IsString()
  message?: string;

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
    description: 'Whether the contact accepted the privacy policy',
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
  privacyPolicyAccepted: boolean;

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
}
