import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockyfyFormController } from './blockyfy-form.controller';
import { BlockyfyFormService } from './blockyfy-form.service';
import {
  BlockyfyFormSubmission,
  BlockyfyFormSubmissionSchema,
} from '../../schemas/blockyfy-form-submission.schema';
import { SharedModule } from '../shared/shared.module';

/**
 * Blockyfy form module that encapsulates Blockyfy form handling functionality
 * Includes MongoDB persistence and Brevo integration
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BlockyfyFormSubmission.name,
        schema: BlockyfyFormSubmissionSchema,
      },
    ]),
    SharedModule,
  ],
  controllers: [BlockyfyFormController],
  providers: [BlockyfyFormService],
})
export class BlockyfyFormModule {}

