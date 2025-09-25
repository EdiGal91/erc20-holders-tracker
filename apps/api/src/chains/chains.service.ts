import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chain, ChainDocument } from './schemas/chain.schema';
import { CreateChainDto } from './dto/create-chain.dto';
import { UpdateChainDto } from './dto/update-chain.dto';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class ChainsService {
  constructor(
    @InjectModel(Chain.name) private chainModel: Model<ChainDocument>,
    private encryptionService: EncryptionService,
  ) {}

  async create(createChainDto: CreateChainDto): Promise<Chain> {
    try {
      // Check if chain with this chainId already exists
      const existingChain = await this.chainModel.findOne({
        chainId: createChainDto.chainId,
      });
      if (existingChain) {
        throw new ConflictException(
          `Chain with ID ${createChainDto.chainId} already exists`,
        );
      }

      // Encrypt the API key before storing
      const encryptedApiKey = this.encryptionService.encrypt(
        createChainDto.apiKey,
      );

      const chainData = {
        ...createChainDto,
        apiKey: encryptedApiKey,
      };

      const createdChain = new this.chainModel(chainData);
      const savedChain = await createdChain.save();

      // Return chain without the encrypted API key
      return this.sanitizeChain(savedChain);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Chain with ID ${createChainDto.chainId} already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(includeDisabled = false): Promise<Chain[]> {
    const filter = includeDisabled ? {} : { enabled: true };
    const chains = await this.chainModel.find(filter).sort({ chainId: 1 });
    return chains.map((chain) => this.sanitizeChain(chain));
  }

  async findOne(chainId: number): Promise<Chain> {
    const chain = await this.chainModel.findOne({ chainId });
    if (!chain) {
      throw new NotFoundException(`Chain with ID ${chainId} not found`);
    }
    return this.sanitizeChain(chain);
  }

  async findOneWithApiKey(
    chainId: number,
  ): Promise<Chain & { decryptedApiKey: string }> {
    const chain = await this.chainModel.findOne({ chainId }).select('+apiKey');
    if (!chain) {
      throw new NotFoundException(`Chain with ID ${chainId} not found`);
    }

    try {
      const decryptedApiKey = this.encryptionService.decrypt(chain.apiKey);
      const sanitizedChain = this.sanitizeChain(chain);
      return { ...sanitizedChain, decryptedApiKey };
    } catch (error) {
      throw new BadRequestException('Failed to decrypt API key');
    }
  }

  async update(
    chainId: number,
    updateChainDto: UpdateChainDto,
  ): Promise<Chain> {
    const chain = await this.chainModel.findOne({ chainId });
    if (!chain) {
      throw new NotFoundException(`Chain with ID ${chainId} not found`);
    }

    const updateData = { ...updateChainDto };

    // If API key is being updated, encrypt it
    if (updateChainDto.apiKey) {
      updateData.apiKey = this.encryptionService.encrypt(updateChainDto.apiKey);
    }

    const updatedChain = await this.chainModel.findOneAndUpdate(
      { chainId },
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedChain) {
      throw new NotFoundException(`Chain with ID ${chainId} not found`);
    }

    return this.sanitizeChain(updatedChain);
  }

  async remove(chainId: number): Promise<void> {
    const result = await this.chainModel.findOneAndDelete({ chainId });
    if (!result) {
      throw new NotFoundException(`Chain with ID ${chainId} not found`);
    }
  }

  async toggleEnabled(chainId: number): Promise<Chain> {
    const chain = await this.chainModel.findOne({ chainId });
    if (!chain) {
      throw new NotFoundException(`Chain with ID ${chainId} not found`);
    }

    const updatedChain = await this.chainModel.findOneAndUpdate(
      { chainId },
      { enabled: !chain.enabled },
      { new: true },
    );

    if (!updatedChain) {
      throw new NotFoundException(`Chain with ID ${chainId} not found`);
    }

    return this.sanitizeChain(updatedChain);
  }

  private sanitizeChain(chain: ChainDocument): Chain {
    const chainObj = chain.toObject();
    delete chainObj.apiKey; // Remove encrypted API key from response
    return chainObj;
  }
}
