import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express'; // Import NestExpressApplication
import { join } from 'path'; // Import join

async function bootstrap() {
  // Specify NestExpressApplication for static assets
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS (adjust origins as needed for production)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow frontend origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Use global prefix
  app.setGlobalPrefix('api');

  // Use global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTOs
      transform: true, // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    }),
  );

  // --- CONFIGURE STATIC ASSETS ---
  // Serve files from the 'uploads' directory at the '/uploads' route prefix
  // Adjust '..' based on main.ts location relative to 'uploads'
  const uploadsPath = join(__dirname, '..', 'uploads');
  console.log(`Serving static files from: ${uploadsPath} at /uploads`);
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/', // The URL prefix to access the files
  });
  // --- END STATIC ASSETS CONFIGURATION ---

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
