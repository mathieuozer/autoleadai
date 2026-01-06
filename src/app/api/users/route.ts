import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { UserRole } from '@prisma/client';

// GET /api/users - List users (for selecting sales executives)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') as UserRole | null;

    const where: Record<string, unknown> = {};

    if (role && Object.values(UserRole).includes(role)) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return serverErrorResponse('Failed to fetch users');
  }
}
