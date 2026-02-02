import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            models: true,
          },
        },
      },
    });

    // Transform to include model count
    const transformedBrands = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      code: brand.code,
      logoUrl: brand.logoUrl,
      modelCount: brand._count.models,
    }));

    return successResponse(transformedBrands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return serverErrorResponse('Failed to fetch brands');
  }
}
