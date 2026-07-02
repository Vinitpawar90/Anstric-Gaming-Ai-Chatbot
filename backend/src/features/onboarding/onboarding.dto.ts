import { IsString, IsArray, IsNumber, IsOptional, IsBoolean, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

/**
 * Section within an onboarding template
 */
export class OnboardingSectionDto {
    @IsNumber()
    day: number;

    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsOptional()
    document_ids?: number[]; // Documents to show in this section
}

/**
 * DTO for creating/updating onboarding template
 */
export class CreateOnboardingTemplateDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OnboardingSectionDto)
    sections: OnboardingSectionDto[];

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

/**
 * DTO for marking a section as complete
 */
export class MarkSectionCompleteDto {
    @IsNumber()
    template_id: number;

    @IsNumber()
    section_day: number;
}

/**
 * DTO for updating onboarding progress
 */
export class UpdateProgressDto {
    @IsNumber()
    @IsOptional()
    current_day?: number;

    @IsArray()
    @IsOptional()
    completed_sections?: number[]; // Array of day numbers
}
