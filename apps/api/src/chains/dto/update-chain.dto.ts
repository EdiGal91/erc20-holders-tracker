import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateChainDto } from './create-chain.dto';

export class UpdateChainDto extends PartialType(
  OmitType(CreateChainDto, ['chainId'] as const),
) {
  // All fields from CreateChainDto except chainId are optional for updates
}
