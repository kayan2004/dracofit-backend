import { Gender } from '../entities/user.entity';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsDate,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsEmail()
  email: string;

  @IsDate()
  @Type(() => Date)
  dob: Date;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDate()
  @Type(() => Date)
  created_at: Date;

  @IsBoolean()
  @IsOptional()
  is_admin: boolean = false;
}
