import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import type { Notification, CreateNotificationDto } from './notification.types';
import {
  NotificationCategory,
} from './notification.types';

// ── Default user (until auth is implemented) ──────────────────────────────
const DEFAULT_USER_ID = 'user-1';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // ── GET /notifications?userId=user-1 ──────────────────────────────────
  @Get()
  getNotifications(@Query('userId') userId?: string): Notification[] {
    const uid = userId || DEFAULT_USER_ID;
    return this.notificationsService.getNotifications(uid);
  }

  // ── GET /notifications/unread-count?userId=user-1 ────────────────────
  @Get('unread-count')
  getUnreadCount(@Query('userId') userId?: string): { count: number } {
    const uid = userId || DEFAULT_USER_ID;
    return { count: this.notificationsService.getUnreadCount(uid) };
  }

  // ── PATCH /notifications/:id/read ─────────────────────────────────────
  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ): { success: boolean } {
    const uid = userId || DEFAULT_USER_ID;
    const result = this.notificationsService.markAsRead(uid, id);
    if (!result) {
      throw new NotFoundException('Notification not found');
    }
    // Emit real-time update
    const unreadCount = this.notificationsService.getUnreadCount(uid);
    this.notificationsGateway['server']?.to(`user:${uid}`).emit('unread_count', { count: unreadCount });
    return { success: true };
  }

  // ── PATCH /notifications/mark-all-read ────────────────────────────────
  @Patch('mark-all-read')
  markAllAsRead(@Query('userId') userId?: string): { count: number } {
    const uid = userId || DEFAULT_USER_ID;
    const count = this.notificationsService.markAllAsRead(uid);
    // Emit real-time update
    const notifications = this.notificationsService.getNotifications(uid);
    this.notificationsGateway['server']?.to(`user:${uid}`).emit('notifications:all', { notifications });
    this.notificationsGateway['server']?.to(`user:${uid}`).emit('unread_count', { count: 0 });
    return { count };
  }

  // ── POST /notifications/simulate (for testing) ────────────────────────
  @Post('simulate')
  @HttpCode(HttpStatus.CREATED)
  simulateNotification(
    @Body() body: { type?: string; userId?: string },
  ): Notification {
    const uid = body.userId || DEFAULT_USER_ID;
    const types = Object.values(NotificationCategory);
    const randomType = body.type as NotificationCategory || types[Math.floor(Math.random() * types.length)];
    
    // Generate a simulated notification based on type
    const simulatedData = this.generateSimulatedData(randomType);
    const dto: CreateNotificationDto = {
      userId: uid,
      category: randomType,
      title: simulatedData.title,
      description: simulatedData.description,
    };

    const notification = this.notificationsService.createNotification(dto);
    
    // Push via WebSocket in real-time
    this.notificationsGateway.sendNotificationToUser(uid, notification);
    
    return notification;
  }

  // ── DELETE /notifications/:id ─────────────────────────────────────────
  @Delete(':id')
  deleteNotification(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ): { success: boolean } {
    const uid = userId || DEFAULT_USER_ID;
    const result = this.notificationsService.deleteNotification(uid, id);
    if (!result) {
      throw new NotFoundException('Notification not found');
    }
    return { success: true };
  }

  // ── Helper: Generate simulated notification data ──────────────────────
  private generateSimulatedData(type: NotificationCategory): { title: string; description: string } {
    const mockData: Record<string, { title: string; description: string }[]> = {
      [NotificationCategory.NEW_REVIEW]: [
        { title: 'New Review', description: 'Sarah left a 5-star review at Tomoca Coffee' },
        { title: 'New Review', description: 'Abebe B. reviewed Yod Abyssinia Restaurant' },
      ],
      [NotificationCategory.NEW_LOCATION]: [
        { title: 'New Place Nearby', description: 'Kaldi\'s Coffee Bole has been added to the map' },
        { title: 'New Place Nearby', description: 'New restaurant discovered in your area' },
      ],
      [NotificationCategory.LOGIN_ALERT]: [
        { title: 'New Login', description: 'New sign-in from Chrome on Windows' },
        { title: 'New Login', description: 'Login detected from a new device' },
      ],
      [NotificationCategory.AD_PROMOTION]: [
        { title: 'Special Offer', description: '25% off at Sheraton Addis · This weekend only' },
        { title: 'Promotion Nearby', description: 'Buy 1 Get 1 Free at Tomoca Coffee' },
      ],
      [NotificationCategory.REWARD_EARNED]: [
        { title: 'Points Earned', description: '+100 points for adding a new place' },
        { title: 'Reward Unlocked', description: 'You earned the "Explorer" badge!' },
      ],
      [NotificationCategory.BUSINESS_RESPONSE]: [
        { title: 'Business Reply', description: 'Yod Abyssinia Restaurant responded to your review' },
        { title: 'Business Reply', description: 'Tomoca Coffee thanked you for your review' },
      ],
      [NotificationCategory.VERIFICATION_APPROVED]: [
        { title: 'Verification Approved', description: 'Your business listing for Tomoca Coffee is now verified' },
        { title: 'Verification Complete', description: 'Your place has been verified successfully' },
      ],
      [NotificationCategory.PHOTO_LIKED]: [
        { title: 'Photo Liked', description: 'Meron K. liked your photo at Tomoca Coffee' },
        { title: 'Photo Liked', description: 'Tewodros A. liked 3 of your photos' },
      ],
      [NotificationCategory.REFERRAL_BONUS]: [
        { title: 'Referral Bonus', description: '+150 points — Helen joined using your referral code' },
        { title: 'Referral Reward', description: 'Your friend signed up! You earned +100 points' },
      ],
      [NotificationCategory.TRENDING_ALERT]: [
        { title: 'Trending Now', description: 'Yod Abyssinia Restaurant is trending in Bole' },
        { title: 'Hot Spot', description: 'Sishu is the most popular spot this week' },
      ],
      [NotificationCategory.LEADERBOARD_UPDATE]: [
        { title: 'Leaderboard', description: 'You climbed to #38 in Addis Ababa' },
        { title: 'Rank Update', description: 'You\'re now in the top 50 contributors!' },
      ],
      [NotificationCategory.CHALLENGE_COMPLETE]: [
        { title: 'Challenge Complete', description: 'Weekly challenge: Visit 5 places — completed!' },
        { title: 'Achievement Unlocked', description: 'Photo Challenge: Upload 10 photos done!' },
      ],
    };

    const options = mockData[type] || [{ title: 'Notification', description: 'You have a new notification' }];
    return options[Math.floor(Math.random() * options.length)];
  }
}
