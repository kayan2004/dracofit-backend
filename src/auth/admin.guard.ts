import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    if (!user || !user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    return true;
  }
}
