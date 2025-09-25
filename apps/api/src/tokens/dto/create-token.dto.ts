import {
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  Matches,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTokenDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Chain ID must be a number' })
  @Min(1, { message: 'Chain ID must be greater than 0' })
  chainId: number;

  @IsString({ message: 'Address must be a string' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Address must be a valid Ethereum address',
  })
  @Transform(({ value }) => value.toLowerCase())
  address: string;

  @IsString({ message: 'Symbol must be a string' })
  @MaxLength(10, { message: 'Symbol cannot exceed 10 characters' })
  @Transform(({ value }) => value.toUpperCase())
  symbol: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Decimals must be a number' })
  @Min(0, { message: 'Decimals cannot be negative' })
  @Max(18, { message: 'Decimals cannot exceed 18' })
  @IsOptional()
  decimals?: number = 18;

  @IsBoolean({ message: 'Enabled must be a boolean' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  enabled?: boolean = true;

  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;
}
