import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<Omit<User, 'password'>> {
    const { username, password, fullname, email, dob, gender } = signUpDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      fullname,
      email,
      dob,
      gender,
      created_at: new Date(),
      is_admin: false,
    });

    try {
      const savedUser = await this.userRepository.save(user);
      // Remove password from response
      const { password: _, ...result } = savedUser;
      return result;
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL unique violation code
        if (error.detail.includes('username')) {
          throw new UnauthorizedException('Username already exists');
        }
        if (error.detail.includes('email')) {
          throw new UnauthorizedException('Email already exists');
        }
      }
      throw new UnauthorizedException('Error creating user');
    }
  }

  async signIn(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { username, password } = loginDto;
    const user = await this.userRepository.findOneBy({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const payload = { username };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken };
    }
    throw new UnauthorizedException('Invalid credentials');
  }
}
