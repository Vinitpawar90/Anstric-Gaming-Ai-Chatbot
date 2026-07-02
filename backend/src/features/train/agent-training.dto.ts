import { IsBoolean, IsOptional, IsArray, IsInt } from "class-validator";

export class TrainAgentDto {
  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  documentIds?: number[]; // NEW: Document IDs from Knowledge Base to train on

  @IsBoolean()
  @IsOptional()
  forceRetrain?: boolean;

  @IsBoolean()
  @IsOptional()
  cleanupExisting?: boolean;
}
