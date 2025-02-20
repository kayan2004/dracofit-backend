import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsDate,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '../../users/entities/user.entity';

export class SignUpDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/(?:(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*)/, {
    message: 'password too weak',
  })
  password: string;

  @IsString()
  fullname: string;

  @IsEmail()
  email: string;

  @Type(() => Date)
  @IsDate()
  dob: Date;

  @IsEnum(Gender)
  gender: Gender;
}
