import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, { message: 'Username hanya boleh huruf kecil, angka, dan underscore' })
  username: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
