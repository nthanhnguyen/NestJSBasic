import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './user.interface';
import { Public, ResponseMessage, User } from 'src/auth/decorator/customize';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ResponseMessage("Create a new User")
  async create(
    @Body() createUserDto: CreateUserDto,
    @User() user: IUser
  ) {
    let newUser = await this.usersService.create(createUserDto, user)
    return {
      _id: newUser?._id,
      createdAt: newUser?.createdAt
    };
  }

  // @Get()
  // findAll() {
  //   return this.usersService.findAll();
  // }

  @Get()
  @ResponseMessage("Fetch list user with paginate")
  findAll(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @Query() qs: string
  ) {
    return this.usersService.findAll(+currentPage, +limit, qs);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // @Patch()
  // update(@Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(updateUserDto);
  // }

  @Patch()
  @ResponseMessage("Update a User")
  update(
    @Body() updateUserDto: UpdateUserDto,
    @User() user: IUser
  ) {
    return this.usersService.update(updateUserDto, user);
  }

  @Delete(':id')
  @ResponseMessage("Delete a User")
  remove(
    @Param('id') id: string,
    @User() user: IUser
  ) {
    return this.usersService.remove(id, user);
  }


}
