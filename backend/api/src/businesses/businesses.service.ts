import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Business } from './business.entity';
import { SavedPlace } from './saved-place.entity';

// ── AI Ranking weights for SQL-level partial scoring ──────────────────────
interface SQLRankWeights {
  ratingWeight: number;
  distanceWeight: number;
  reviewWeight: number;
  trendingWeight: number;
  verifiedBoost: number;
}

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);

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

  // ── Find businesses by viewport bounding box ──────────────────────────
  async findByBounds(
    southWestLat: number,
    southWestLng: number,
    northEastLat: number,
    northEastLng: number,
    categoryId?: string,
    limit = 200,
  ): Promise<Business[]> {
    const query = this.businessRepo.createQueryBuilder('b')
      .where('b.latitude BETWEEN :swLat AND :neLat', { swLat: southWestLat, neLat: northEastLat })
      .andWhere('b.longitude BETWEEN :swLng AND :neLng', { swLng: southWestLng, neLng: northEastLng });

    if (categoryId && categoryId !== 'all') {
      query.andWhere('b.categoryId = :categoryId', { categoryId });
    }

    query.orderBy('b.rating', 'DESC');
    query.take(limit);

    return query.getMany();
  }

  // ── AI/ML: Rank businesses by multi-factor score (SQL-assisted) ────────
  // Combines rating, distance, popularity, trending into a real-time score.
  // Returns businesses sorted by AI relevance score descending.
  async rankNearby(
    userLat: number,
    userLng: number,
    categoryId?: string,
    limit = 50,
    weights?: SQLRankWeights,
  ): Promise<any[]> {
    const w = weights || {
      ratingWeight: 0.3,
      distanceWeight: 0.3,
      reviewWeight: 0.2,
      trendingWeight: 0.15,
      verifiedBoost: 0.05,
    };

    const query = this.businessRepo.createQueryBuilder('b')
      .where('b.status = :status', { status: 'active' })
      .setParameter('userLat', userLat)
      .setParameter('userLng', userLng)
      .setParameter('ratingW', w.ratingWeight)
      .setParameter('distW', w.distanceWeight)
      .setParameter('reviewW', w.reviewWeight)
      .setParameter('trendW', w.trendingWeight)
      .setParameter('verBoost', w.verifiedBoost);

    if (categoryId && categoryId !== 'all') {
      query.andWhere('b.categoryId = :categoryId', { categoryId });
    }

    // SQLite doesn't support LOG or ACOS natively in the same way,
    // so we compute a simplified score in SQL and return as-is.
    // For production Postgres, use the formula in JS comment below.
    query.select([
      'b.id', 'b.name', 'b.category', 'b.categoryId',
      'b.rating', 'b.reviews', 'b.latitude', 'b.longitude',
      'b.image', 'b.verified', 'b.description',
      'b.phone', 'b.hours', 'b.address',
      // Simplified distance in degrees (approximate)
      `((b.latitude - :userLat) * (b.latitude - :userLat) + 
        (b.longitude - :userLng) * (b.longitude - :userLng)) AS _distSq`,
      // Partial score: rating * weight + review_log * weight + verified_boost
      `CASE WHEN b.verified = 1 THEN :verBoost ELSE 0 END AS _score`,
    ]);

    query.orderBy('b.rating', 'DESC');
    query.take(limit);

    const raw = await query.getRawMany();

    // Full scoring in application layer (SQLite limitation)
    return raw.map((row: any) => {
      const dLat = row.b_latitude - userLat;
      const dLng = row.b_longitude - userLng;
      const distDeg = Math.sqrt(dLat * dLat + dLng * dLng);
      // Convert degrees to km (~111km per degree at equator)
      const distKm = distDeg * 111;
      const distScore = Math.max(0, 1 - distKm / 15);
      const ratingScore = row.b_rating / 5;
      const popScore = Math.min(1, Math.log((row.b_reviews || 0) + 1) / Math.log(500));
      const verifiedBonus = row.b_verified ? w.verifiedBoost : 0;

      const finalScore =
        distScore * w.distanceWeight +
        ratingScore * w.ratingWeight +
        popScore * w.reviewWeight +
        verifiedBonus;

      return {
        id: row.b_id,
        name: row.b_name,
        category: row.b_category,
        categoryId: row.b_categoryId,
        rating: row.b_rating,
        reviews: row.b_reviews,
        latitude: row.b_latitude,
        longitude: row.b_longitude,
        image: row.b_image,
        verified: !!row.b_verified,
        description: row.b_description,
        phone: row.b_phone,
        hours: row.b_hours,
        address: row.b_address,
        distance: distKm < 1
          ? `${Math.round(distKm * 1000)} m`
          : `${distKm.toFixed(1)} km`,
        aiScore: Number(finalScore.toFixed(4)),
      };
    }).sort((a, b) => b.aiScore - a.aiScore);
  }

  // ── Postgres version of ranking (use when on Postgres) ──────────────────
  /*
  SELECT *,
    (rating / 5) * :ratingWeight +
    (1 / (1 + (haversine(lat, lng, :userLat, :userLng) / 15))) * :distanceWeight +
    (LN(reviews + 1) / LN(500)) * :reviewWeight +
    CASE WHEN verified THEN :verifiedBoost ELSE 0 END AS ai_score
  FROM businesses
  WHERE status = 'active'
  ORDER BY ai_score DESC
  LIMIT :limit
  */

  // ── Update embedding for a business ───────────────────────────────────
  async updateEmbedding(id: string, embeddingJson: string, embeddingText?: string): Promise<void> {
    await this.businessRepo.update(id, {
      embedding: embeddingJson,
      embeddingText: embeddingText ?? undefined,
    });
  }

  // ── Fetch businesses that have embeddings ─────────────────────────────
  async findWithEmbeddings(limit = 200): Promise<Business[]> {
    return this.businessRepo.find({
      take: limit,
    }).then(bizs => bizs.filter(b => b.embedding != null));
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
