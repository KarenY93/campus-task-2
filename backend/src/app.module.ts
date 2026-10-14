import { Module } from '@nestjs/common';
import { TareasModule } from './tareas/tareas.module';
import { VersionController } from './version/version.controller';
@Module({
  imports: [TareasModule],
  controllers: [VersionController],
})
export class AppModule {}
