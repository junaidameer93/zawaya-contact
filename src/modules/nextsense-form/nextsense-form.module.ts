import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NextsenseFormController } from './nextsense-form.controller';
import { NextsenseFormService } from './nextsense-form.service';
import {
  NextsenseFormSubmission,
  NextsenseFormSubmissionSchema,
} from '../../schemas/nextsense-form-submission.schema';
import { SharedModule } from '../shared/shared.module';

/**
 * Nextsense form module that encapsulates Nextsense form handling functionality
 * Includes MongoDB persistence and Brevo integration
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: NextsenseFormSubmission.name,
        schema: NextsenseFormSubmissionSchema,
      },
    ]),
    SharedModule,
  ],
  controllers: [NextsenseFormController],
  providers: [NextsenseFormService],
})
export class NextsenseFormModule {}

