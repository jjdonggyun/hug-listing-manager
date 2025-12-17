import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateListingDto, UpdateListingDto } from './dto';
import { assessHug } from '@app/shared';

function normalizeNaver(dto: { referenceUrl?: string; externalId?: string }) {
  const ref = (dto.referenceUrl ?? '').trim();
  const ext = (dto.externalId ?? '').trim();

  // If referenceUrl looks like fin.land or m.land, extract article id
  const m1 = ref.match(/fin\.land\.naver\.com\/articles\/(\d+)/i);
  const m2 = ref.match(/m\.land\.naver\.com\/article\/(\d+)/i);
  const extracted = m1?.[1] ?? m2?.[1] ?? null;

  let externalId = ext || extracted || undefined;
  let referenceUrl = ref || undefined;

  // If we only have an id, build a standard fin.land URL
  if (!referenceUrl && externalId && /^\d{3,}$/.test(externalId)) {
    referenceUrl = `https://fin.land.naver.com/articles/${encodeURIComponent(externalId)}`;
  }

  // If we have a fin.land url, but externalId missing, fill it
  if (!externalId && extracted) externalId = extracted;

  return { externalId, referenceUrl };
}

const DEMO_USER_EMAIL = 'demo@local';
async function ensureDemoUser(prisma: PrismaService) {
  return prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: { email: DEMO_USER_EMAIL, name: 'Demo' },
  });
}

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async list() {
    const user = await ensureDemoUser(this.prisma);
    return this.prisma.listing.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        assessments: { orderBy: { createdAt: 'desc' }, take: 1 },
        notes: { orderBy: { updatedAt: 'desc' }, take: 1 },
      },
    });
  }

  async get(id: string) {
    const user = await ensureDemoUser(this.prisma);
    return this.prisma.listing.findFirstOrThrow({
      where: { id, userId: user.id },
      include: {
        notes: { orderBy: { updatedAt: 'desc' } },
        contacts: { orderBy: { at: 'desc' } },
        appointments: { orderBy: { startAt: 'asc' } },
        assessments: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async create(dto: CreateListingDto) {
    const user = await ensureDemoUser(this.prisma);
    const normalized = normalizeNaver({ referenceUrl: dto.referenceUrl, externalId: dto.externalId });

    const dealType = (dto.dealType ?? 'JEONSE') as any;
    const depositKrw = Math.max(0, dto.depositKrw ?? 0);
    const monthlyKrw = Math.max(0, dto.monthlyKrw ?? 0);
    const salePriceKrw = dto.salePriceKrw != null ? Math.max(0, dto.salePriceKrw) : null;

    // Deal-type normalization
    const normalizedMoney =
      dealType === 'SALE'
        ? { dealType, depositKrw: 0, monthlyKrw: 0, salePriceKrw: salePriceKrw ?? 0 }
        : dealType === 'MONTHLY'
          ? { dealType, depositKrw, monthlyKrw, salePriceKrw: null }
          : { dealType: 'JEONSE', depositKrw, monthlyKrw: 0, salePriceKrw: null };

    return this.prisma.listing.create({
      data: {
        userId: user.id,
        title: dto.title,
        addressText: dto.addressText,
        dealType: normalizedMoney.dealType,
        depositKrw: normalizedMoney.depositKrw,
        monthlyKrw: normalizedMoney.monthlyKrw,
        salePriceKrw: normalizedMoney.salePriceKrw,
        status: dto.status ?? 'NEW',
        tags: dto.tags ?? [],
        referenceUrl: normalized.referenceUrl,
        externalId: normalized.externalId,
        seniorLienKrw: dto.seniorLienKrw,
        officialPrice: dto.officialPrice,
        usageType: dto.usageType ?? 'UNKNOWN',
      },
    });
  }

  async update(id: string, dto: UpdateListingDto) {
    const user = await ensureDemoUser(this.prisma);
    // ensure ownership
    await this.prisma.listing.findFirstOrThrow({ where: { id, userId: user.id } });
    const normalized = normalizeNaver({ referenceUrl: dto.referenceUrl, externalId: dto.externalId });

    const dealType = (dto.dealType ?? 'JEONSE') as any;
    const depositKrw = Math.max(0, dto.depositKrw ?? 0);
    const monthlyKrw = Math.max(0, dto.monthlyKrw ?? 0);
    const salePriceKrw = dto.salePriceKrw != null ? Math.max(0, dto.salePriceKrw) : null;

    const normalizedMoney =
      dealType === 'SALE'
        ? { dealType, depositKrw: 0, monthlyKrw: 0, salePriceKrw: salePriceKrw ?? 0 }
        : dealType === 'MONTHLY'
          ? { dealType, depositKrw, monthlyKrw, salePriceKrw: null }
          : { dealType: 'JEONSE', depositKrw, monthlyKrw: 0, salePriceKrw: null };

    return this.prisma.listing.update({
      where: { id },
      data: {
        title: dto.title,
        addressText: dto.addressText,
        dealType: normalizedMoney.dealType,
        depositKrw: normalizedMoney.depositKrw,
        monthlyKrw: normalizedMoney.monthlyKrw,
        salePriceKrw: normalizedMoney.salePriceKrw,
        status: dto.status ?? 'NEW',
        tags: dto.tags ?? [],
        referenceUrl: normalized.referenceUrl,
        externalId: normalized.externalId,
        seniorLienKrw: dto.seniorLienKrw,
        officialPrice: dto.officialPrice,
        usageType: dto.usageType ?? 'UNKNOWN',
      },
    });
  }

  async remove(id: string) {
    const user = await ensureDemoUser(this.prisma);
    await this.prisma.listing.findFirstOrThrow({ where: { id, userId: user.id } });
    await this.prisma.listing.delete({ where: { id } });
    return { ok: true };
  }

  async assess(id: string, officialPrice?: number) {
    const listing = await this.get(id);

    if ((listing as any).dealType === 'SALE') {
      return {
        assessment: null,
        disclaimer:
          '매매(매매가) 매물은 본 MVP의 HUG(참고) 평가 대상이 아니에요. 전세/월세 매물에 대해 공시지가×126% 기준으로 참고 평가합니다.',
      };
    }

    const op = typeof officialPrice === 'number' ? Math.max(0, officialPrice) : (listing.officialPrice ?? undefined);
    if (typeof officialPrice === 'number') {
      await this.prisma.listing.update({ where: { id }, data: { officialPrice: op } });
    }

    const result = assessHug({
      depositKrw: listing.depositKrw,
      officialPriceKrw: op,
      seniorLienKrw: listing.seniorLienKrw ?? undefined,
      usageType: (listing.usageType as any) ?? 'UNKNOWN',
    });

    const saved = await this.prisma.hugAssessment.create({
      data: {
        listingId: listing.id,
        grade: result.grade,
        score: result.score,
        reasons: result.reasons,
      },
    });

    return { assessment: saved, disclaimer: result.disclaimer };
  }

  async addNote(id: string, content: string) {
    await this.get(id);
    // 모바일 메모장처럼 "한 매물 = 한 메모"로 동작 (저장 시 덮어쓰기)
    const saved = await this.prisma.note.upsert({
      where: { listingId: id },
      create: { listingId: id, content },
      update: { content },
    });

    // 목록 정렬(updatedAt) 갱신용
    await this.prisma.listing.update({ where: { id }, data: {} });
    return saved;
  }
}
