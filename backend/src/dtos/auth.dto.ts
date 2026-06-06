import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

export class RegisterDTO {
    @IsString({ message: 'El username debe ser un texto' })
    @IsNotEmpty({ message: 'El username es requerido' })
    @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
    @MaxLength(50, { message: 'El username no puede tener más de 50 caracteres' })
    @Matches(/^[a-zA-Z0-9_]+$/, { message: 'El username solo puede contener letras, números y guión bajo' })
    username!: string;

    @IsEmail({}, { message: 'Debe proporcionar un email válido' })
    @IsNotEmpty({ message: 'El email es requerido' })
    email!: string;

    @IsString({ message: 'La contraseña debe ser un texto' })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    @MaxLength(100, { message: 'La contraseña no puede tener más de 100 caracteres' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    })
    password!: string;
}

export class LoginDTO {
    @IsEmail({}, { message: 'Debe proporcionar un email válido' })
    @IsNotEmpty({ message: 'El email es requerido' })
    email!: string;

    @IsString({ message: 'La contraseña debe ser un texto' })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password!: string;
}
