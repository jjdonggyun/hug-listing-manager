import { IsIn, IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

const DEAL_TYPES = ['JEONSE', 'MONTHLY', 'SALE'] as const;

export class CreateListingDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  addressText?: string;

  @IsOptional()
  @IsIn(DEAL_TYPES)
  dealType?: (typeof DEAL_TYPES)[number];

  // 전세/월세 보증금
  @IsOptional()
  @IsInt()
  @Min(0)
  depositKrw?: number;

  // 월세
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyKrw?: number;

  // 매매가
  @IsOptional()
  @IsInt()
  @Min(0)
  salePriceKrw?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsUrl()
  referenceUrl?: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  seniorLienKrw?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  officialPrice?: number;

  @IsOptional()
  @IsString()
  usageType?: string; // RESIDENTIAL/OFFICE/UNKNOWN
}

export class UpdateListingDto extends CreateListingDto {}
