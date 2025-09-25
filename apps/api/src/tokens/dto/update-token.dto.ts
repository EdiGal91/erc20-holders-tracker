import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTokenDto } from './create-token.dto';

export class UpdateTokenDto extends PartialType(
  OmitType(CreateTokenDto, ['chainId', 'address'] as const),
) {
  // All fields from CreateTokenDto except chainId and address are optional for updates
}
