import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JwtStrategy.getSecret(configService),
    });
  }

  private static getSecret(configService: ConfigService): string {
    return configService.get<string>('JWT_SECRET')!;
  }

  async validate(payload: {
    sub: number;
    username: string;
    isAdmin: boolean;
  }): Promise<User> {
    const { sub: id } = payload;
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'email',
        'isAdmin',
        'isEmailVerified',
        'firstName',
        'lastName',
      ],
    });

    if (!user || !user.isEmailVerified) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
