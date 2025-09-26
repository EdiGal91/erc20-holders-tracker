import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Balance, BalanceDocument } from './schemas/balance.schema';
import { Token, TokenDocument } from '../tokens/schemas/token.schema';
import { Chain, ChainDocument } from '../chains/schemas/chain.schema';
import { GetHoldersDto } from './dto/get-holders.dto';

@Injectable()
export class BalancesService {
  constructor(
    @InjectModel(Balance.name) private balanceModel: Model<BalanceDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    @InjectModel(Chain.name) private chainModel: Model<ChainDocument>,
  ) {}

  async getTopHolders(query: GetHoldersDto) {
    const { chainId, tokenAddress } = query;

    const filter: any = {};

    if (chainId) {
      filter.chainId = parseInt(chainId, 10);
    }

    if (tokenAddress) {
      filter.token = tokenAddress.toLowerCase();
    }

    // Get balances and calculate total (confirmed + pending) for sorting
    const balances = await this.balanceModel.find(filter).lean().exec();

    // Sort by total balance (confirmed + pending) in descending order
    // Only include addresses with non-zero total balance
    const sortedBalances = balances
      .map((balance) => ({
        ...balance,
        totalBalance: BigInt(balance.confirmed) + BigInt(balance.pending),
      }))
      .filter((balance) => balance.totalBalance > BigInt(0)) // Filter by total balance > 0
      .sort((a, b) => {
        // Sort by total balance descending
        if (a.totalBalance > b.totalBalance) return -1;
        if (a.totalBalance < b.totalBalance) return 1;
        return 0;
      })
      .slice(0, 20); // Take top 20

    // Get token and chain information for each balance
    const enrichedBalances = await Promise.all(
      sortedBalances.map(async (balance) => {
        const [token, chain] = await Promise.all([
          this.tokenModel
            .findOne({
              chainId: balance.chainId,
              address: balance.token,
            })
            .lean(),
          this.chainModel.findOne({ chainId: balance.chainId }).lean(),
        ]);

        // Remove the totalBalance BigInt property before returning
        const { totalBalance, ...balanceWithoutTotal } = balance;
        return {
          ...balanceWithoutTotal,
          tokenInfo: token,
          chainInfo: chain,
        };
      }),
    );

    return enrichedBalances;
  }
}
