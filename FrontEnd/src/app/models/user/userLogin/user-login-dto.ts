export interface UserLoginDTO {
    identifier:string // Un solo campo que puede ser Email o Username, cosa que se pueda logear con cualquiera de los dos.
    password: string
}
