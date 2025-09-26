import { Controller, Get, Query } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { GetHoldersDto } from './dto/get-holders.dto';

@Controller({ path: 'balances', version: '1' })
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get('holders')
  async getTopHolders(@Query() query: GetHoldersDto) {
    return this.balancesService.getTopHolders(query);
  }
}
