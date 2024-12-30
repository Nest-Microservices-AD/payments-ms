import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config';

async function bootstrap() {
  const logger = new Logger('PaymentsService');
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      // exceptionFactory: (validationErrors: ValidationError[] = []) => {
      //   return new RpcException({
      //     status: HttpStatus.BAD_REQUEST,
      //     message: validationErrors.map((error) => ({
      //       field: error.property,
      //       error: Object.values(error.constraints).join(', '),
      //     })),
      //   });
      // },
    }),
  );
  await app.listen(envs.PORT || 3000);
  logger.log(`Payments ms is running on: ${await app.getUrl()}`);
}
bootstrap();
