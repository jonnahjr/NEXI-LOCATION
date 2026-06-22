import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.types';

// ── User-Socket mapping (userId -> Set<SocketId>) ──────────────────────────
// In production, use Redis or a proper store
const userSockets: Map<string, Set<string>> = new Map();

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationsService: NotificationsService) {}

  // ── On client connect ──────────────────────────────────────────────────
  handleConnection(client: Socket): void {
    console.log(`[WS] Client connected: ${client.id}`);
  }

  // ── On client disconnect ───────────────────────────────────────────────
  handleDisconnect(client: Socket): void {
    // Remove socket from all user mappings
    for (const [userId, sockets] of userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
        console.log(`[WS] User ${userId} disconnected (${client.id})`);
        break;
      }
    }
  }

  // ── Client authenticates and joins user channel ────────────────────────
  @SubscribeMessage('auth')
  handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ): void {
    const { userId } = data;
    if (!userId) {
      client.emit('error', { message: 'userId is required' });
      return;
    }

    // Track socket for user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(client.id);

    // Join socket room for the user
    client.join(`user:${userId}`);
    client.data.userId = userId;

    console.log(`[WS] User ${userId} authenticated (${client.id})`);

    // Send unread count immediately
    const unreadCount = this.notificationsService.getUnreadCount(userId);
    client.emit('unread_count', { count: unreadCount });

    // Send all notifications
    const notifications = this.notificationsService.getNotifications(userId);
    client.emit('notifications:all', { notifications });
  }

  // ── Send a real-time notification to a specific user ──────────────────
  sendNotificationToUser(userId: string, notification: Notification): void {
    this.server.to(`user:${userId}`).emit('notification:new', { notification });

    // Also update unread count
    const unreadCount = this.notificationsService.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unread_count', { count: unreadCount });
  }

  // ── Broadcast promotion to all connected users ───────────────────────
  broadcastToAll(notification: Notification): void {
    this.server.emit('notification:new', { notification });
  }

  // ── Mark as read via WebSocket ────────────────────────────────────────
  @SubscribeMessage('mark_read')
  handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ): void {
    const userId = client.data.userId;
    if (!userId || !data.notificationId) return;

    this.notificationsService.markAsRead(userId, data.notificationId);

    // Update unread count
    const unreadCount = this.notificationsService.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unread_count', { count: unreadCount });
  }

  // ── Mark all as read via WebSocket ────────────────────────────────────
  @SubscribeMessage('mark_all_read')
  handleMarkAllRead(@ConnectedSocket() client: Socket): void {
    const userId = client.data.userId;
    if (!userId) return;

    this.notificationsService.markAllAsRead(userId);

    // Update all notifications & unread count
    const notifications = this.notificationsService.getNotifications(userId);
    this.server.to(`user:${userId}`).emit('notifications:all', { notifications });
    this.server.to(`user:${userId}`).emit('unread_count', { count: 0 });
  }

  // ── Get unread count via WebSocket ────────────────────────────────────
  @SubscribeMessage('get_unread_count')
  handleGetUnreadCount(@ConnectedSocket() client: Socket): void {
    const userId = client.data.userId;
    if (!userId) return;

    const unreadCount = this.notificationsService.getUnreadCount(userId);
    client.emit('unread_count', { count: unreadCount });
  }

  // ── Get all notifications via WebSocket ───────────────────────────────
  @SubscribeMessage('get_notifications')
  handleGetNotifications(@ConnectedSocket() client: Socket): void {
    const userId = client.data.userId;
    if (!userId) return;

    const notifications = this.notificationsService.getNotifications(userId);
    client.emit('notifications:all', { notifications });
  }
}
