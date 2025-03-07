import { PartialType } from '@nestjs/mapped-types';
import { CreateUserTokenDto } from './create-user-token.dto';

export class UpdateUserTokenDto extends PartialType(CreateUserTokenDto) {}
