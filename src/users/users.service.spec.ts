// import { Test, TestingModule } from '@nestjs/testing';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { UsersService } from './users.service';
// import { User, Gender } from '../users/entities/user.entity';
// import { Repository } from 'typeorm';

// const userArray = [
//   {
//     id: 1,
//     username: 'testuser1',
//     fullname: 'Test User 1',
//     email: 'test1@example.com',
//     dob: new Date(),
//     password: 'password1',
//     gender: Gender.MALE,
//     created_at: new Date(),
//   },
//   {
//     id: 2,
//     username: 'testuser2',
//     fullname: 'Test User 2',
//     email: 'test2@example.com',
//     dob: new Date(),
//     password: 'password2',
//     gender: Gender.FEMALE,
//     created_at: new Date(),
//   },
// ];

// const oneUser = {
//   id: 1,
//   username: 'testuser1',
//   fullname: 'Test User 1',
//   email: 'test1@example.com',
//   dob: new Date(),
//   password: 'password1',
//   gender: Gender.MALE,
//   created_at: new Date(),
// };

// describe('UsersService', () => {
//   let service: UsersService;
//   let repository: Repository<User>;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         UsersService,
//         {
//           provide: getRepositoryToken(User),
//           useValue: {
//             find: jest.fn().mockResolvedValue(userArray),
//             findOne: jest.fn().mockResolvedValue(oneUser),
//             save: jest.fn().mockResolvedValue(oneUser),
//             update: jest.fn().mockResolvedValue({ affected: 1 }),
//             delete: jest.fn().mockResolvedValue(undefined),
//           },
//         },
//       ],
//     }).compile();

//     service = module.get<UsersService>(UsersService);
//     repository = module.get<Repository<User>>(getRepositoryToken(User));
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('create()', () => {
//     it('should successfully insert a user', async () => {
//       const createUserDto = {
//         username: 'testuser1',
//         fullname: 'Test User 1',
//         email: 'test1@example.com',
//         dob: new Date(),
//         password: 'password1',
//         gender: Gender.MALE,
//         created_at: new Date(),
//       };

//       expect(await service.create(createUserDto)).toEqual(oneUser);
//     });
//   });

//   describe('findAll()', () => {
//     it('should return an array of users', async () => {
//       const users = await service.findAll();
//       expect(users).toEqual(userArray);
//     });
//   });

//   describe('findOne()', () => {
//     it('should get a single user', async () => {
//       const user = await service.findOne(1);
//       expect(user).toEqual(oneUser);
//     });
//   });

//   // describe('update()', () => {
//   //   it('should update a user', async () => {
//   //     const updateUserDto = {
//   //       username: 'updateduser',
//   //       fullname: 'Updated User',
//   //       email: 'updated@example.com',
//   //       dob: new Date(),
//   //       password: 'newpassword',
//   //       gender: Gender.FEMALE,
//   //       created_at: new Date(),
//   //     };
//   //     const result = { id: 1, ...updateUserDto };

//   //     jest.spyOn(repository, 'update').mockResolvedValue(undefined);
//   //     jest.spyOn(repository, 'findOne').mockResolvedValue(result);

//   //     expect(await service.update(1, updateUserDto)).toEqual(result);
//   //     expect(repository.update).toHaveBeenCalledWith(({ id: 1}, updateUserDto) => ());
//   //     expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
//   //   });
//   // });

//   describe('remove()', () => {
//     it('should call remove with the passed value', async () => {
//       const removeSpy = jest.spyOn(repository, 'delete');
//       const retVal = await service.remove(1);
//       expect(removeSpy).toBeCalledWith(1);
//       expect(retVal).toBeUndefined();
//     });
//   });
// });
