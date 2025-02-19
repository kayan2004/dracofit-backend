// import { Test, TestingModule } from '@nestjs/testing';
// import { UsersController } from './users.controller';
// import { UsersService } from './users.service';
// // import { CreateUserDto } from './dto/create-user.dto';
// // import { UpdateUserDto } from './dto/update-user.dto';
// // import { User, Gender } from './entities/user.entity';

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

// describe('UsersController', () => {
//   let controller: UsersController;
//   let service: UsersService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [UsersController],
//       providers: [
//         {
//           provide: UsersService,
//           useValue: {
//             create: jest.fn().mockResolvedValue(oneUser),
//             findAll: jest.fn().mockResolvedValue(userArray),
//             findOne: jest.fn().mockResolvedValue(oneUser),
//             update: jest.fn().mockResolvedValue(oneUser),
//             remove: jest.fn().mockResolvedValue(undefined),
//           },
//         },
//       ],
//     }).compile();

//     controller = module.get<UsersController>(UsersController);
//     service = module.get<UsersService>(UsersService);
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });

// describe('create()', () => {
//   it('should create a user', async () => {
//     const createUserDto: CreateUserDto = {
//       username: 'testuser1',
//       fullname: 'Test User 1',
//       email: 'test1@example.com',
//       dob: new Date(),
//       password: 'password1',
//       gender: Gender.MALE,
//       created_at: new Date(),
//     };

//     expect(await controller.create(createUserDto)).toEqual(oneUser);
//     expect(service.create).toHaveBeenCalledWith(createUserDto);
//   });
// });

// describe('findAll()', () => {
//   it('should return an array of users', async () => {
//     expect(await controller.findAll()).toEqual(userArray);
//     expect(service.findAll).toHaveBeenCalled();
//   });
// });

// describe('findOne()', () => {
//   it('should return a single user', async () => {
//     expect(await controller.findOne('1')).toEqual(oneUser);
//     expect(service.findOne).toHaveBeenCalledWith(1);
//   });
// });

// describe('update()', () => {
//   it('should update a user', async () => {
//     const updateUserDto: UpdateUserDto = {
//       username: 'updateduser',
//       fullname: 'Updated User',
//       email: 'updated@example.com',
//       dob: new Date(),
//       password: 'newpassword',
//       gender: Gender.FEMALE,
//       created_at: new Date(),
//     };

//     expect(await controller.update('1', updateUserDto)).toEqual(oneUser);
//     expect(service.update).toHaveBeenCalledWith(1, updateUserDto);
//   });
// });

// describe('remove()', () => {
//   it('should remove a user', async () => {
//     expect(await controller.remove('1')).toBeUndefined();
//     expect(service.remove).toHaveBeenCalledWith(1);
//   });
// });
// });
