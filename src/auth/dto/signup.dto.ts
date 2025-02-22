import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsDate,
  IsEnum,
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
    message:
      'password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
  })
  password: string;

  @IsString()
  fullname: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Type(() => Date)
  @IsDate()
  dob: Date;

  @IsEnum(Gender)
  gender: Gender;
}
