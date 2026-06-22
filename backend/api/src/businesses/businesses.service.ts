import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Business } from './business.entity';
import { SavedPlace } from './saved-place.entity';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private businessRepo: Repository<Business>,
    @InjectRepository(SavedPlace)
    private savedPlaceRepo: Repository<SavedPlace>,
  ) {}

  // ── Business CRUD ─────────────────────────────────────────────────────

  async findAll(
    categoryId?: string,
    search?: string,
    lat?: number,
    lng?: number,
    limit = 200,
  ): Promise<Business[]> {
    const where: any = {};

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (search) {
      where.name = Like(`%${search}%`);
    }

    let businesses = await this.businessRepo.find({
      where,
      take: limit,
      order: { name: 'ASC' },
    });

    // If lat/lng provided, sort by distance
    if (lat && lng) {
      businesses = businesses
        .map((b) => ({
          ...b,
          distance: this.haversineDistance(lat, lng, b.latitude, b.longitude),
        }))
        .sort((a, b) => a.distance - b.distance)
        .map((b) => ({
          ...b,
          distance: b.distance < 1
            ? `${Math.round(b.distance * 1000)} m`
            : `${b.distance.toFixed(1)} km`,
        })) as any;
    }

    return businesses;
  }

  async findById(id: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async create(business: Partial<Business>): Promise<Business> {
    return this.businessRepo.save(business);
  }

  async seed(businesses: Partial<Business>[]): Promise<number> {
    // Upsert: insert or update
    let count = 0;
    for (const biz of businesses) {
      await this.businessRepo.upsert(biz, ['id']);
      count++;
    }
    return count;
  }

  async clearAndSeed(businesses: Partial<Business>[]): Promise<number> {
    await this.businessRepo.clear();
    const result = await this.businessRepo.save(businesses);
    return result.length;
  }

  // ── Saved Places ──────────────────────────────────────────────────────

  async getSavedPlaceIds(userId: string): Promise<string[]> {
    const saved = await this.savedPlaceRepo.find({
      where: { userId },
      select: { businessId: true },
    });
    return saved.map((s) => s.businessId);
  }

  async getSavedBusinesses(userId: string): Promise<Business[]> {
    const savedIds = await this.getSavedPlaceIds(userId);
    if (savedIds.length === 0) return [];
    return this.businessRepo.find({ where: { id: In(savedIds) } });
  }

  async savePlace(userId: string, businessId: string): Promise<void> {
    const existing = await this.savedPlaceRepo.findOne({
      where: { userId, businessId },
    });
    if (!existing) {
      await this.savedPlaceRepo.save({ userId, businessId });
    }
  }

  async unsavePlace(userId: string, businessId: string): Promise<void> {
    await this.savedPlaceRepo.delete({ userId, businessId });
  }

  // ── Helper: Haversine distance in km ─────────────────────────────────
  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
