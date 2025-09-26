import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class GetHoldersDto {
  @IsOptional()
  @IsNumberString()
  chainId?: string;

  @IsOptional()
  @IsString()
  tokenAddress?: string;
}
