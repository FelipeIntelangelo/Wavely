export interface Credential {
    email: string;
    username: string;
    roles: string[];
    resetToken: string;
    createdAt: Date;
}
