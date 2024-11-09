import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/user.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { genSaltSync, hashSync } from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import ms from 'ms'
import { Response, response } from 'express';
import { RolesService } from 'src/roles/roles.service';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from 'src/mail/mail.service';
import { AccountStatus } from 'src/users/schemas/user.schema';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private rolesService: RolesService,
        private mailerService: MailerService, 
        private mailService: MailService, 
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByUsername(username);
        if (user) {
            const isValid = this.usersService.isValidPassword(pass, user.password)
            if (isValid === true) {
                const userRole = user.role as unknown as { _id: string; name: string }
                const temp = await this.rolesService.findOne(userRole._id);

                const objUser = {
                    ...user.toObject(),
                    permissions: temp?.permissions ?? []
                }
                return objUser;
            }
        }
        return null;
    }

    async login(user: IUser, response: Response) {
        const { _id, name, email, role, permissions, accountStatus } = user;
        const payload = {
            sub: "token login",
            iss: "from server",
            _id,
            name,
            email,
            role,
        };

        if (accountStatus !== AccountStatus.ACTIVATED) {
            throw new BadRequestException(`Tài khoản chưa dược kích hoạt!`)
        }

        const refresh_token = this.createRefreshToken(payload)

        // Update user with refresh token
        await this.usersService.updateUserToken(refresh_token, _id);

        //set refresh_token as cookies
        response.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            maxAge: ms(this.configService.get<string>("JWT_REFRESH_EXPIRE"))
        })
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                _id,
                name,
                email,
                role,
                permissions
            }
        };
    }

    getHashPassword = (password: string) => {
        var salt = genSaltSync(10);
        var hash = hashSync(password, salt);
        return hash;
    }

    async register(registerUser: RegisterUserDto) {
        // Generate an activation token
        const activationToken = this.generateCode(false, 60);

        // Hash the password before storing the user
        registerUser.password = this.getHashPassword(registerUser.password);
        registerUser['activationToken'] = activationToken; // Store the activation token in the user record

        // Save the user to the database
        let newUser = await this.usersService.register(registerUser);

        // Send confirmation email
        const activationUrl = `http://localhost:3000/activation/${activationToken}`;
        await this.mailService.sendRegisterMail(newUser.email, newUser.name, activationUrl);

        return {
            _id: newUser?._id,
            createdAt: newUser?.createdAt
        };
    }

    async activation(activationToken: string) {
        const user = await this.usersService.findUserByActivationToken(activationToken);
        if (!user) {
            throw new BadRequestException(`Activation Token không hợp lệ!`)
        }
        if (AccountStatus.PENDING_ACTIVATE === user.accountStatus) {
            // Only update accounts with pending status
            user.accountStatus = AccountStatus.ACTIVATED;
            user.activationToken = null;
            await this.usersService.save(user);
        }

        const { _id, name, email, role } = user;
        const payload = {
            sub: "token login",
            iss: "from server",
            _id,
            name,
            email,
            role,
        };

        const refresh_token = this.createRefreshToken(payload)

        // Update user with refresh token
        await this.usersService.updateUserToken(refresh_token, _id);

        //set refresh_token as cookies
        response.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            maxAge: ms(this.configService.get<string>("JWT_REFRESH_EXPIRE"))
        })

        const temp = await this.rolesService.findOne(String(user.role)) as any;

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                _id,
                name,
                email,
                role,
                permissions: temp.permissions,
            }
        };
    }

    createRefreshToken = (payload: any) => {
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.get<string>("JWT_REFRESH_TOKEN_SECRET"),
            expiresIn: ms(this.configService.get<string>("JWT_REFRESH_EXPIRE")) / 1000
        });
        return refresh_token;
    }

    processNewToken = async (refreshToken: string, response: Response) => {
        try {
            this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>("JWT_REFRESH_TOKEN_SECRET")
            })

            let user = await this.usersService.findUserByToken(refreshToken)
            if (user) {
                const { _id, name, email, role } = user;
                const payload = {
                    sub: "token refresh",
                    iss: "from server",
                    _id,
                    name,
                    email,
                    role
                };

                const refresh_token = this.createRefreshToken(payload)

                // Update user with refresh token
                await this.usersService.updateUserToken(refresh_token, _id.toString());

                // Fetch user's role
                const userRole = user.role as unknown as ({ _id: string, name: string })
                const temp = await this.rolesService.findOne(userRole._id)

                // Clear refresh_token as cookies
                response.clearCookie("refresh_token");

                //set refresh_token as cookies
                response.cookie('refresh_token', refresh_token, {
                    httpOnly: true,
                    maxAge: ms(this.configService.get<string>("JWT_REFRESH_EXPIRE"))
                })

                return {
                    access_token: this.jwtService.sign(payload),
                    user: {
                        _id,
                        name,
                        email,
                        role,
                        permissions: temp?.permissions ?? []
                    }
                };
            }
            else {
                throw new BadRequestException(`Refresh token không hợp lệ. Vui lòng login!`)
            }
        } catch (error) {
            throw new BadRequestException(`Refresh token không hợp lệ. Vui lòng login!`)
        }

    }

    processLogout = async (response: Response, user: IUser) => {
        await this.usersService.updateUserToken("", user._id);
        response.clearCookie("refresh_token");
        return "Ok"
    }

    generateCode(numericOnly = false, length = 8) {
        let result = '';
        const numericCharacters = '0123456789';
        const characters = numericOnly
            ? numericCharacters
            : `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz${numericCharacters}`;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
}
