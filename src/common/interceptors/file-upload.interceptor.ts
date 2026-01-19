import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

/**
 * Common file upload interceptor configuration
 * 
 * @param fieldName - The field name for file uploads (default: 'attachments')
 * @param maxCount - Maximum number of files allowed (default: 5)
 * @param destination - Destination directory for uploaded files (default: './uploads')
 * @param maxFileSize - Maximum file size in bytes (default: 5MB)
 * @returns FilesInterceptor instance with configured options
 */
export function FileUploadInterceptor(
  fieldName: string = 'attachments',
  maxCount: number = 5,
  destination: string = './uploads',
  maxFileSize: number = 5 * 1024 * 1024, // 5MB
) {
  return FilesInterceptor(fieldName, maxCount, {
    storage: diskStorage({
      destination,
      filename: (req, file, callback) => {
        const uniqueSuffix =
          Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
    limits: {
      fileSize: maxFileSize,
    },
  });
}

