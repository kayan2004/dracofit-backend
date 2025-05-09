// filepath: c:\Users\Lenovo\Desktop\UOB\sem6\Senior\dracofit\dracofit-backend\src\users\events\user-created.event.ts
export class UserCreatedEvent {
  constructor(
    public readonly userId: number,
    public readonly username: string,
    // You can add other relevant data like email if needed by listeners
  ) {}
}
