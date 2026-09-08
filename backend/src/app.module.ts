import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import path from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { StorageModule } from './modules/storage/storage.module';
import { ProductsModule } from './modules/products/products.module';
import { ExcelModule } from './modules/excel/excel.module';
import { ImportRunnerModule } from './modules/import-runner/import-runner.module';
import { ImportsModule } from './modules/imports/imports.module';
import { StockModule } from './modules/stock/stock.module';
import { SchemeModule } from './modules/scheme/scheme.module';
import { NewModelsModule } from './modules/new-models/new-models.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    // Local-disk product photos, served at /uploads/products/<file> —
    // matches the URL shape StorageService returns when S3 isn't configured.
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    RedisModule,
    AuditModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    StorageModule,
    ExcelModule,
    ImportsModule,
    ImportRunnerModule,
    ProductsModule,
    StockModule,
    SchemeModule,
    NewModelsModule,
    CatalogueModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Order matters: rate-limit first, then authenticate, then authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
