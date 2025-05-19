import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT }) // Or Scope.REQUEST if you need request-specific time, but DEFAULT is fine for this.
export class TimeService {
  private static fakeDate: Date | null = null;

  public getNow(): Date {
    return TimeService.fakeDate || new Date();
  }

  public getToday(): Date {
    const now = this.getNow();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  // --- Methods for testing ---
  public static setFakeDate(date: Date | string | null): void {
    if (date === null) {
      TimeService.fakeDate = null;
    } else {
      TimeService.fakeDate = new Date(date);
    }
    console.log(`Fake date set to: ${TimeService.fakeDate?.toISOString()}`);
  }

  public static advanceDays(days: number): void {
    if (TimeService.fakeDate) {
      TimeService.fakeDate.setDate(TimeService.fakeDate.getDate() + days);
    } else {
      // If no fake date is set, create one based on real time and advance it
      const newFakeDate = new Date();
      newFakeDate.setDate(newFakeDate.getDate() + days);
      TimeService.fakeDate = newFakeDate;
    }
    console.log(
      `Fake date advanced by ${days} days to: ${TimeService.fakeDate?.toISOString()}`,
    );
  }

  public static resetFakeDate(): void {
    TimeService.fakeDate = null;
    console.log('Fake date reset.');
  }
}
