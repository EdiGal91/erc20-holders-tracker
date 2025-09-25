import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Token, TokenDocument } from './schemas/token.schema';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';

@Injectable()
export class TokensService {
  constructor(
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
  ) {}

  async create(createTokenDto: CreateTokenDto): Promise<Token> {
    try {
      // Check if token with this chainId and address already exists
      const existingToken = await this.tokenModel.findOne({
        chainId: createTokenDto.chainId,
        address: createTokenDto.address.toLowerCase(),
      });

      if (existingToken) {
        throw new ConflictException(
          `Token with address ${createTokenDto.address} already exists on chain ${createTokenDto.chainId}`,
        );
      }

      const createdToken = new this.tokenModel({
        ...createTokenDto,
        address: createTokenDto.address.toLowerCase(),
        symbol: createTokenDto.symbol.toUpperCase(),
      });

      return await createdToken.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Token with address ${createTokenDto.address} already exists on chain ${createTokenDto.chainId}`,
        );
      }
      throw error;
    }
  }

  async findAll(includeDisabled = false, chainId?: number): Promise<Token[]> {
    const filter: any = includeDisabled ? {} : { enabled: true };

    if (chainId) {
      filter.chainId = chainId;
    }

    return await this.tokenModel.find(filter).sort({ chainId: 1, symbol: 1 });
  }

  async findOne(chainId: number, address: string): Promise<Token> {
    const token = await this.tokenModel.findOne({
      chainId,
      address: address.toLowerCase(),
    });

    if (!token) {
      throw new NotFoundException(
        `Token with address ${address} not found on chain ${chainId}`,
      );
    }

    return token;
  }

  async findByChain(
    chainId: number,
    includeDisabled = false,
  ): Promise<Token[]> {
    const filter: any = { chainId };
    if (!includeDisabled) {
      filter.enabled = true;
    }

    return await this.tokenModel.find(filter).sort({ symbol: 1 });
  }

  async findBySymbol(
    symbol: string,
    includeDisabled = false,
  ): Promise<Token[]> {
    const filter: any = { symbol: symbol.toUpperCase() };
    if (!includeDisabled) {
      filter.enabled = true;
    }

    return await this.tokenModel.find(filter).sort({ chainId: 1 });
  }

  async update(
    chainId: number,
    address: string,
    updateTokenDto: UpdateTokenDto,
  ): Promise<Token> {
    const updateData = { ...updateTokenDto };

    // Ensure symbol is uppercase if provided
    if (updateData.symbol) {
      updateData.symbol = updateData.symbol.toUpperCase();
    }

    const updatedToken = await this.tokenModel.findOneAndUpdate(
      { chainId, address: address.toLowerCase() },
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedToken) {
      throw new NotFoundException(
        `Token with address ${address} not found on chain ${chainId}`,
      );
    }

    return updatedToken;
  }

  async remove(chainId: number, address: string): Promise<void> {
    const result = await this.tokenModel.findOneAndDelete({
      chainId,
      address: address.toLowerCase(),
    });

    if (!result) {
      throw new NotFoundException(
        `Token with address ${address} not found on chain ${chainId}`,
      );
    }
  }

  async toggleEnabled(chainId: number, address: string): Promise<Token> {
    const token = await this.tokenModel.findOne({
      chainId,
      address: address.toLowerCase(),
    });

    if (!token) {
      throw new NotFoundException(
        `Token with address ${address} not found on chain ${chainId}`,
      );
    }

    const updatedToken = await this.tokenModel.findOneAndUpdate(
      { chainId, address: address.toLowerCase() },
      { enabled: !token.enabled },
      { new: true },
    );

    if (!updatedToken) {
      throw new NotFoundException(
        `Token with address ${address} not found on chain ${chainId}`,
      );
    }

    return updatedToken;
  }

  async bulkUpdate(
    tokens: { chainId: number; address: string; enabled: boolean }[],
  ): Promise<void> {
    const bulkOps = tokens.map((token) => ({
      updateOne: {
        filter: {
          chainId: token.chainId,
          address: token.address.toLowerCase(),
        },
        update: { enabled: token.enabled },
      },
    }));

    await this.tokenModel.bulkWrite(bulkOps);
  }
}
