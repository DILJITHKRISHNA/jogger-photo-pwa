import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(4)
  phone!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
