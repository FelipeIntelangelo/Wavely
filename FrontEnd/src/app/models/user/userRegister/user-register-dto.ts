import { UserCredentialDTO } from "../user-credential-dto"

export interface UserRegisterDTO {
    name: string;
    lastName: string;
    nickname: string;
    credential: UserCredentialDTO;
}
