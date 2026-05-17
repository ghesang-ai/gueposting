import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private initialized = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const hasValidCreds =
      privateKey &&
      !privateKey.includes('placeholder') &&
      process.env.FIREBASE_PROJECT_ID !== 'dekat-app';

    if (hasValidCreds && !admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          } as admin.ServiceAccount),
        });
        this.initialized = true;
      } catch (e: any) {
        console.warn(`Firebase init skipped: ${e.message}`);
      }
    }
  }

  async sendPush(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
    if (!fcmToken || !this.initialized) return;
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
    } catch (error: any) {
      console.warn(`FCM send failed: ${error.message}`);
    }
  }

  async createNotif(data: { userId: string; actorId: string; type: 'like' | 'comment' | 'follow'; postId?: string }) {
    if (data.userId === data.actorId) return;
    return this.prisma.notification.create({ data: data as any });
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        actor: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        post: { select: { id: true, content: true } },
      },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } });
    return { count };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { ok: true };
  }
}
