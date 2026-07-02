import "reflect-metadata";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
} from "class-validator";

export class CreateSourceDto {
  @IsNumber()
  agent_id: number;

  @IsString()
  source_type: "file";

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSourceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: "pending" | "processing" | "completed" | "failed";

  @IsOptional()
  is_embedded?: boolean;
}

export class FileSourceDto {
  @IsNumber()
  id: number;

  @IsNumber()
  source_id: number;

  @IsString()
  file_url: string;

  @IsString()
  @IsOptional()
  mime_type?: string;

  @IsNumber()
  file_size: number;

  @IsString()
  @IsOptional()
  text_content?: string;
}

export class UpdateFileSourceDto {
  @IsString()
  @IsOptional()
  file_url?: string;

  @IsString()
  @IsOptional()
  mime_type?: string;

  @IsNumber()
  @IsOptional()
  file_size?: number;

  @IsString()
  @IsOptional()
  text_content?: string;
}

export class CreateMultipleFilesSourceDto {
  @IsNumber()
  agent_id: number;

  @IsArray()
  @IsString({ each: true })
  names: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  descriptions?: string[];
}
