// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { User } from 'src/users/entities/user.entity';
// import { JwtService } from '@nestjs/jwt';
// @Injectable()
// export class AuthService {
//   constructor(
//     @InjectRepository(User)
//     private readonly usersRepository: Repository<User>,
//     private readonly jwtService: JwtService,
//   ) {}

//   async validateUser(username: string, password: string): Promise<any> {
//     const user = await this.usersRepository.findOneBy({ username });
//     if (!user) {
//       throw new Error('User not found');
//     }
//     return user;
//   }
// }
