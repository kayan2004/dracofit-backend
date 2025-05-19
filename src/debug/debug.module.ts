import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller';
// TimeModule is global, so TimeService is available via its @Global decorator

@Module({
  controllers: [DebugController], // DebugController must be listed here
})
export class DebugModule {}
