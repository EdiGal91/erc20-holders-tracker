import {
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  IsUrl,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateChainDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Chain ID must be a number' })
  @Min(1, { message: 'Chain ID must be greater than 0' })
  chainId: number;

  @IsString({ message: 'RPC URL must be a string' })
  @IsUrl({}, { message: 'RPC URL must be a valid URL' })
  rpcUrl: string;

  @IsString({ message: 'API key must be a string' })
  @MinLength(1, { message: 'API key cannot be empty' })
  apiKey: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Confirmations must be a number' })
  @Min(1, { message: 'Confirmations must be at least 1' })
  @Max(100, { message: 'Confirmations cannot exceed 100' })
  @IsOptional()
  confirmations?: number = 12;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Logs range must be a number' })
  @Min(100, { message: 'Logs range must be at least 100' })
  @Max(10000, { message: 'Logs range cannot exceed 10000' })
  @IsOptional()
  logsRange?: number = 2000;

  @IsBoolean({ message: 'Enabled must be a boolean' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  enabled?: boolean = true;

  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Symbol must be a string' })
  @IsOptional()
  symbol?: string;

  @IsUrl({}, { message: 'Explorer URL must be a valid URL' })
  @IsOptional()
  explorerUrl?: string;
}
