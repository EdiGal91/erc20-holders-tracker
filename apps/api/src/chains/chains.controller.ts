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
  ParseBoolPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ChainsService } from './chains.service';
import { CreateChainDto } from './dto/create-chain.dto';
import { UpdateChainDto } from './dto/update-chain.dto';

@Controller({ path: 'chains', version: '1' })
export class ChainsController {
  constructor(private readonly chainsService: ChainsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(ValidationPipe) createChainDto: CreateChainDto) {
    return this.chainsService.create(createChainDto);
  }

  @Get()
  findAll(
    @Query('includeDisabled', new ParseBoolPipe({ optional: true }))
    includeDisabled?: boolean,
  ) {
    return this.chainsService.findAll(includeDisabled);
  }

  @Get(':chainId')
  findOne(@Param('chainId', ParseIntPipe) chainId: number) {
    return this.chainsService.findOne(chainId);
  }

  @Patch(':chainId')
  update(
    @Param('chainId', ParseIntPipe) chainId: number,
    @Body(ValidationPipe) updateChainDto: UpdateChainDto,
  ) {
    return this.chainsService.update(chainId, updateChainDto);
  }

  @Patch(':chainId/toggle')
  @HttpCode(HttpStatus.OK)
  toggleEnabled(@Param('chainId', ParseIntPipe) chainId: number) {
    return this.chainsService.toggleEnabled(chainId);
  }

  @Delete(':chainId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('chainId', ParseIntPipe) chainId: number) {
    return this.chainsService.remove(chainId);
  }
}
