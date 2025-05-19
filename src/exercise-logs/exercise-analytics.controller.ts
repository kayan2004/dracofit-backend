import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExerciseLogsService } from './exercise-logs.service';
import { ExerciseLog } from './entities/exercise-log.entity';

@Controller('exercise-analytics')
@UseGuards(JwtAuthGuard)
export class ExerciseAnalyticsController {
  private readonly logger = new Logger(ExerciseAnalyticsController.name);

  constructor(private readonly exerciseLogsService: ExerciseLogsService) {}

  @Get('history/:exerciseId')
  async getExerciseHistory(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
  ): Promise<ExerciseLog[]> {
    this.logger.log(
      `User ${req.user.id} requesting history for exercise ID: ${exerciseId}`,
    );
    return this.exerciseLogsService.getExerciseHistory(req.user.id, exerciseId);
  }
}
