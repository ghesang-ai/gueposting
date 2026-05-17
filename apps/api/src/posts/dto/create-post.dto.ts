import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsArray, IsUUID, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { PostType } from '@prisma/client';

export class CreatePollDto {
  @IsString()
  question: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  options: string[];

  @IsInt()
  @Min(1)
  @Max(14)
  durationDays: number;
}

export class CreatePostDto {
  @IsString()
  content: string;

  @IsEnum(PostType)
  type: PostType;

  @IsOptional()
  @IsUUID()
  gadgetId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto;
}
