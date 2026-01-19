import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { NextsenseFormService } from './nextsense-form.service';
import { CreateNextsenseFormSubmissionDto } from '../../dto/create-nextsense-form-submission.dto';
import { FileUploadInterceptor } from '../../common/interceptors/file-upload.interceptor';

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
 * Controller for handling Nextsense form submission endpoints
 */
@ApiTags('Nextsense Form')
@Controller('nextsense-form')
export class NextsenseFormController {
  constructor(
    private readonly nextsenseFormService: NextsenseFormService,
  ) {}

  /**
   * POST /nextsense-form/submit - Handles form submission from frontend
   * Accepts multipart/form-data for file uploads
   * Saves data to MongoDB and syncs contact to Brevo
   */
  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileUploadInterceptor())
  @ApiOperation({
    summary: 'Submit Nextsense form with file uploads',
    description:
      'Accepts multipart/form-data. Use the "attachments" field to upload files from your computer (max 5 files, 5MB each).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateNextsenseFormSubmissionDto,
    description:
      'Form data with optional file attachments. Click on the "attachments" field to select files from your computer.',
  })
  @ApiResponse({
    status: 201,
    description: 'Form submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid input',
  })
  async submitForm(
    @Body() createFormSubmissionDto: CreateNextsenseFormSubmissionDto,
    @UploadedFiles() files: UploadedFile[],
  ) {
    return this.nextsenseFormService.createSubmission(
      createFormSubmissionDto,
      files,
    );
  }

  /**
   * POST /nextsense-form/submit-json - Alternative endpoint for JSON-only submissions (no file uploads)
   */
  @Post('submit-json')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit Nextsense form as JSON (no file uploads)' })
  @ApiBody({ type: CreateNextsenseFormSubmissionDto })
  @ApiResponse({
    status: 201,
    description: 'Form submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid input',
  })
  async submitFormJson(
    @Body() createFormSubmissionDto: CreateNextsenseFormSubmissionDto,
  ) {
    return this.nextsenseFormService.createSubmission(
      createFormSubmissionDto,
      [],
    );
  }
}

