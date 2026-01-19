import { Module, Global } from '@nestjs/common';
import { BrevoService } from './brevo.service';

/**
 * Shared module for reusable services across the application
 * Marked as Global so it can be used without importing in other modules
 */
@Global()
@Module({
  providers: [BrevoService],
  exports: [BrevoService],
})
export class SharedModule {}

