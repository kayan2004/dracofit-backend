import { Gender } from '../entities/user.entity';

export class CreateUserDto {
  username: string;
  fullname: string;
  email: string;
  dob: Date;
  password: string;
  gender: Gender;
  created_at: Date;
}
