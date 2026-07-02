import { IsString, IsEmail, IsIn, IsOptional } from "class-validator";

/**
 * DTO for creating an invitation (Admin only)
 */
export class CreateInvitationDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsIn(['employee', 'admin'])
    role: 'employee' | 'admin';

    @IsString()
    @IsOptional()
    name?: string; // Optional name for personalized invitation
}

/**
 * DTO for validating an invitation token
 */
export class ValidateInvitationDto {
    @IsString()
    token: string;
}

/**
 * DTO for registration with invitation token
 */
export class RegisterWithInvitationDto {
    @IsString()
    token: string;

    @IsString()
    name: string;

    @IsString()
    password: string;

    @IsString()
    @IsOptional()
    phone_number?: string;
}
