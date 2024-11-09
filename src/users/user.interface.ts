import { AccountStatus } from "./schemas/user.schema";

export interface IUser {
    _id: string;
    name: string;
    email: string;
    role: {
        _id: string;
        name: string;
    };
    activationToken?: string;
    accountStatus?: AccountStatus;
    permissions?: {
        _id: string;
        name: string;
        apiPath: string;
        module: string
    }[]
}