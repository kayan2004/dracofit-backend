import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { TimeService } from '../common/time.service';
import { IsString, IsNumber, IsOptional, IsISO8601 } from 'class-validator'; // Import decorators

// Define DTO with class-validator decorators
class TimeControlDto {
  @IsOptional() // Mark as optional
  @IsISO8601() // Validate as an ISO8601 date string
  date?: string;

  @IsOptional() // Mark as optional
  @IsNumber() // Validate as a number
  days?: number;
}

@Controller('debug')
export class DebugController {
  constructor() {} // TimeService methods are static, no need to inject instance for these

  @Post('set-time')
  @HttpCode(HttpStatus.OK)
  setFakeTime(@Body() body: TimeControlDto) {
    // ValidationPipe will now correctly validate 'body' against TimeControlDto
    if (body.date) {
      TimeService.setFakeDate(body.date);
      return { message: `Fake date set to: ${body.date}` };
    }
    // If only 'days' is provided, or if 'date' is invalid and stripped, this path might be hit.
    // Consider if you need to handle cases where 'date' is expected but not validly provided.
    return {
      message: 'No valid date provided to set, or date property was missing.',
    };
  }

  @Post('advance-days')
  @HttpCode(HttpStatus.OK)
  advanceTime(@Body() body: TimeControlDto) {
    // ValidationPipe will now correctly validate 'body' against TimeControlDto
    if (typeof body.days === 'number') {
      // body.days will be a number if valid and present
      TimeService.advanceDays(body.days);
      return { message: `Time advanced by ${body.days} days.` };
    }
    return {
      message:
        'No valid days provided to advance, or days property was missing.',
    };
  }

  @Post('reset-time')
  @HttpCode(HttpStatus.OK)
  resetFakeTime() {
    TimeService.resetFakeDate();
    return { message: 'Fake date reset to real time.' };
  }

  @Get('current-time')
  @HttpCode(HttpStatus.OK)
  getCurrentTime() {
    const now = new TimeService().getNow(); // Get instance to call getNow
    const today = new TimeService().getToday();
    return {
      effectiveNow: now.toISOString(),
      effectiveToday: today.toISOString(),
      isFaked: TimeService['fakeDate'] !== null, // Access static private for info
    };
  }
}
