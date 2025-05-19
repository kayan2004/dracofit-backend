import { Module, Global } from '@nestjs/common';
import { TimeService } from './time.service';

@Global() // Make TimeService available globally without importing TimeModule everywhere
@Module({
  providers: [TimeService],
  exports: [TimeService],
})
export class TimeModule {}
