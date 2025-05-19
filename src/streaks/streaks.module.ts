// filepath: c:\Users\Lenovo\Desktop\UOB\sem6\Senior\dracofit\dracofit-backend\src\streaks\streaks.module.ts
import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreaksService } from './streaks.service';
import { Pet } from '../user-pets/entities/user-pet.entity';
import { TimeService } from '../common/time.service';
import { UserScheduleModule } from '../user-schedule/user-schedule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet]),
    forwardRef(() => UserScheduleModule), // <--- Use forwardRef here
  ],
  providers: [StreaksService, TimeService], // Ensure TimeService is provided if not global
  exports: [StreaksService],
})
export class StreaksModule {}
