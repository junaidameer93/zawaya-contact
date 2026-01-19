import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Global Email Module
 * 
 * Provides email functionality across the entire application.
 * Marked as @Global so it doesn't need to be imported in every module.
 * 
 * Usage:
 * 1. Import EmailModule in AppModule
 * 2. Inject EmailService in any service or controller
 * 
 * Example:
 * ```typescript
 * constructor(private emailService: EmailService) {}
 * 
 * await this.emailService.send({
 *   to: { email: 'user@example.com', name: 'John' },
 *   subject: 'Welcome!',
 *   htmlContent: '<h1>Welcome to our platform!</h1>',
 * });
 * ```
 */
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

