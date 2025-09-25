import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  ParseBoolPipe,
} from '@nestjs/common';
import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';

@Controller({ path: 'tokens', version: '1' })
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(ValidationPipe) createTokenDto: CreateTokenDto) {
    return this.tokensService.create(createTokenDto);
  }

  @Get()
  findAll(
    @Query('includeDisabled', new ParseBoolPipe({ optional: true }))
    includeDisabled?: boolean,
    @Query('chainId', new ParseIntPipe({ optional: true })) chainId?: number,
  ) {
    return this.tokensService.findAll(includeDisabled, chainId);
  }

  @Get('chain/:chainId')
  findByChain(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Query('includeDisabled') includeDisabled?: string,
  ) {
    const include = includeDisabled === 'true';
    return this.tokensService.findByChain(chainId, include);
  }

  @Get('symbol/:symbol')
  findBySymbol(
    @Param('symbol') symbol: string,
    @Query('includeDisabled') includeDisabled?: string,
  ) {
    const include = includeDisabled === 'true';
    return this.tokensService.findBySymbol(symbol, include);
  }

  @Get(':chainId/:address')
  findOne(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Param('address') address: string,
  ) {
    return this.tokensService.findOne(chainId, address);
  }

  @Patch(':chainId/:address')
  update(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Param('address') address: string,
    @Body(ValidationPipe) updateTokenDto: UpdateTokenDto,
  ) {
    return this.tokensService.update(chainId, address, updateTokenDto);
  }

  @Patch(':chainId/:address/toggle')
  @HttpCode(HttpStatus.OK)
  toggleEnabled(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Param('address') address: string,
  ) {
    return this.tokensService.toggleEnabled(chainId, address);
  }

  @Delete(':chainId/:address')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Param('address') address: string,
  ) {
    return this.tokensService.remove(chainId, address);
  }

  @Post('bulk-update')
  @HttpCode(HttpStatus.OK)
  bulkUpdate(
    @Body(ValidationPipe)
    tokens: { chainId: number; address: string; enabled: boolean }[],
  ) {
    return this.tokensService.bulkUpdate(tokens);
  }
}
