import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/notifications/mark-all-read - Mark all notifications as read for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { count: result.count },
    });
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark all as read' },
      { status: 500 }
    );
  }
}
