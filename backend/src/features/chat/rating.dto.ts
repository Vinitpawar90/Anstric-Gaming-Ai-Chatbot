import { IsString, IsOptional, IsIn } from "class-validator";

/**
 * DTO for rating a message (thumbs up/down)
 */
export class RateMessageDto {
    @IsString()
    @IsIn(['up', 'down'], {
        message: 'Rating must be either "up" or "down"'
    })
    rating: 'up' | 'down';

    @IsString()
    @IsOptional()
    comment?: string; // Optional comment, especially useful for negative ratings
}
