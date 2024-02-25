import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage } from './decorator/customize';
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { Response, Request } from 'express';

@Controller("auth")
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('/login')
    @ResponseMessage("User Login")
    handleLogin(
        @Req() req,
        @Res({ passthrough: true }) response: Response) {
        return this.authService.login(req.user, response);
    }

    //@UseGuards(JwtAuthGuard)
    // @Get('profile')
    // getProfile(@Request() req) {
    //     return req.user;
    // }

    @Public()
    @ResponseMessage("Create a new User")
    @Post('/register')
    handleRegister(@Body() registerUserDto: RegisterUserDto) {
        return this.authService.register(registerUserDto);
    }
}
