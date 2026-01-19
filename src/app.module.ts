import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './modules/shared/shared.module';
import { NextsenseFormModule } from './modules/nextsense-form/nextsense-form.module';
import { BlockyfyFormModule } from './modules/blockyfy-form/blockyfy-form.module';
import { EmailModule } from './modules/email';

/**
 * Root application module
 * Configures MongoDB connection, environment variables, and imports feature modules
 */
@Module({
  imports: [
    // Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configure MongoDB connection using environment variable
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Global modules (available everywhere without importing)
    EmailModule,
    SharedModule,

    // Feature modules
    NextsenseFormModule,
    BlockyfyFormModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
