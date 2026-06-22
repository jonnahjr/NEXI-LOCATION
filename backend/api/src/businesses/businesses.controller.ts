import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { Business } from './business.entity';

@Controller()
export class BusinessesController {
  constructor(private readonly service: BusinessesService) {}

  // ── Business Endpoints ────────────────────────────────────────────────

  @Get('businesses')
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('limit') limit?: string,
  ): Promise<Business[]> {
    return this.service.findAll(
      categoryId,
      search,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
      limit ? parseInt(limit, 10) : 200,
    );
  }

  @Get('businesses/:id')
  async findById(@Param('id') id: string): Promise<Business> {
    return this.service.findById(id);
  }

  @Post('businesses/seed')
  async seed(@Body() businesses: Partial<Business>[]): Promise<{ count: number }> {
    const count = await this.service.clearAndSeed(businesses);
    return { count };
  }

  // ── Saved Places Endpoints ────────────────────────────────────────────

  @Get('saved-places/:userId')
  async getSavedIds(@Param('userId') userId: string): Promise<{ ids: string[] }> {
    const ids = await this.service.getSavedPlaceIds(userId);
    return { ids };
  }

  @Get('saved-places/:userId/detail')
  async getSavedBusinesses(@Param('userId') userId: string): Promise<Business[]> {
    return this.service.getSavedBusinesses(userId);
  }

  @Post('saved-places/:userId/:businessId')
  async savePlace(
    @Param('userId') userId: string,
    @Param('businessId') businessId: string,
  ): Promise<{ success: boolean }> {
    await this.service.savePlace(userId, businessId);
    return { success: true };
  }

  @Delete('saved-places/:userId/:businessId')
  async unsavePlace(
    @Param('userId') userId: string,
    @Param('businessId') businessId: string,
  ): Promise<{ success: boolean }> {
    await this.service.unsavePlace(userId, businessId);
    return { success: true };
  }
}
