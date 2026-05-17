import { IsArray, IsUUID, ArrayMinSize, ArrayMaxSize, IsOptional, IsInt, IsString } from 'class-validator';

export class CompareRequestDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(3)
  gadgetIds: string[];

  @IsOptional()
  @IsInt()
  userBudget?: number;

  @IsOptional()
  @IsString()
  userUsecase?: string;
}
