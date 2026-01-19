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
import { BlockyfyFormService } from './blockyfy-form.service';
import { CreateBlockyfyFormSubmissionDto } from '../../dto/create-blockyfy-form-submission.dto';
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
 * Controller for handling Blockyfy form submission endpoints
 */
@ApiTags('Blockyfy Form')
@Controller('blockyfy-form')
export class BlockyfyFormController {
  constructor(private readonly blockyfyFormService: BlockyfyFormService) {}

  /**
   * POST /blockyfy-form/submit - Handles form submission from frontend
   * Accepts multipart/form-data for file uploads
   * Saves data to MongoDB and syncs contact to Brevo
   */
  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileUploadInterceptor())
  @ApiOperation({
    summary: 'Submit Blockyfy form with file uploads',
    description:
      'Accepts multipart/form-data. Use the "attachments" field to upload files from your computer (max 5 files, 5MB each).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateBlockyfyFormSubmissionDto,
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
    @Body() formSubmissionDto: CreateBlockyfyFormSubmissionDto,
    @UploadedFiles() files: UploadedFile[],
  ) {
    return this.blockyfyFormService.createSubmission(formSubmissionDto, files);
  }

}

