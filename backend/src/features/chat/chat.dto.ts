import "reflect-metadata";
import {
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  ArrayNotEmpty,
  IsIn,
} from "class-validator";

export class LegacyChatDto {
  @IsArray()
  @ArrayNotEmpty()
  messages: any[];

  @IsOptional()
  @IsString()
  model?: string;
}

export class AgentChatDto {
  @IsArray()
  @ArrayNotEmpty()
  messages: any[];

  @IsOptional()
  @IsString()
  sessionId?: string; // Optional: continue in existing session or create new one

  @IsOptional()
  @IsString()
  @IsIn(['auto', 'file', 'text', 'website', 'database', 'qa'])
  sourceSelection?: 'auto' | 'file' | 'text' | 'website' | 'database' | 'qa'; // Optional: filter context by source type

  // Playground ephemeral overrides for testing
  @IsOptional()
  overrides?: {
    temperature?: number;
    systemPrompt?: string;
    provider?: string;
    model?: string;
  };
}

export class CreateSessionDto {
  @IsNumber()
  agentId: number;
}

export class ChatSessionParamsDto {
  @IsString()
  sessionId: string;
}
