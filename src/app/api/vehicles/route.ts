import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, badRequestResponse } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const inStock = searchParams.get('inStock');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (inStock === 'true') {
      where.inStock = true;
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: [
        { make: 'asc' },
        { model: 'asc' },
        { year: 'desc' },
      ],
      take: 100,
    });

    return successResponse(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return serverErrorResponse('Failed to fetch vehicles');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { make, model, variant, year, color, vin } = body;

    if (!make) {
      return badRequestResponse('Make is required');
    }
    if (!model) {
      return badRequestResponse('Model is required');
    }
    if (!year || year < 1900 || year > new Date().getFullYear() + 2) {
      return badRequestResponse('Valid year is required');
    }

    // Check if VIN already exists
    if (vin) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { vin },
      });
      if (existingVehicle) {
        return badRequestResponse('A vehicle with this VIN already exists');
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        make,
        model,
        variant: variant || null,
        year,
        color: color || null,
        vin: vin || null,
        inStock: true,
        testDriveAvailable: false,
      },
    });

    return successResponse(vehicle, undefined, 201);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return serverErrorResponse('Failed to create vehicle');
  }
}
