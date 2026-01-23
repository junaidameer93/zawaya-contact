import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for validating Zawaya contact form submission data
 * Ensures all required fields are present and properly formatted
 */
export class CreateNextsenseFormSubmissionDto {
  @ApiProperty({
    description: 'First name of the contact',
    example: 'Noah',
  })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    description: 'Last name of the contact',
    example: 'James',
  })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({
    description: 'Business email address of the contact',
    example: 'noah.james@company.com',
  })
  @IsEmail()
  businessEmail: string;

  @ApiPropertyOptional({
    description: 'Company profile information',
    example: 'Leading tech company specializing in AI solutions',
  })
  @IsOptional()
  @IsString()
  companyProfile?: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://www.company.com',
  })
  @IsOptional()
  @IsString()
  companyWebsite?: string;

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
