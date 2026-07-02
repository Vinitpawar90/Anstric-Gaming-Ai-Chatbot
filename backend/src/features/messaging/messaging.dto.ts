import { IsNotEmpty, IsString, IsNumber, MaxLength, MinLength } from "class-validator";

/**
 * Messaging DTOs
 * 
 * Data Transfer Objects for request validation.
 */

export class SendMessageDto {
    @IsNotEmpty({ message: "Message content is required" })
    @IsString({ message: "Message content must be a string" })
    @MinLength(1, { message: "Message cannot be empty" })
    @MaxLength(5000, { message: "Message cannot exceed 5000 characters" })
    content!: string;
}

export class CreateConversationDto {
    @IsNotEmpty({ message: "Recipient ID is required" })
    @IsNumber({}, { message: "Recipient ID must be a number" })
    recipient_id!: number;
}

export class GetMessagesQueryDto {
    page?: number;
    limit?: number;
}
