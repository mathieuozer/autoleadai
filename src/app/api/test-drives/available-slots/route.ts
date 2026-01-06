import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api/response';

// GET /api/test-drives/available-slots - Get available time slots for a vehicle on a date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get('vehicleId');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const excludeTestDriveId = searchParams.get('excludeTestDriveId'); // For editing existing bookings

    if (!vehicleId) {
      return badRequestResponse('vehicleId is required');
    }

    if (!date) {
      return badRequestResponse('date is required');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return badRequestResponse('date must be in YYYY-MM-DD format');
    }

    // Check if vehicle exists and is available for test drives
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return badRequestResponse('Vehicle not found');
    }

    if (!vehicle.testDriveAvailable) {
      return badRequestResponse('Vehicle is not available for test drives');
    }

    // Define time slots (9:00 AM to 6:00 PM, 30-minute intervals)
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    ];

    // Get existing bookings for this vehicle on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.testDrive.findMany({
      where: {
        vehicleId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'],
        },
        ...(excludeTestDriveId ? { NOT: { id: excludeTestDriveId } } : {}),
      },
      select: {
        scheduledTime: true,
        duration: true,
      },
    });

    // Calculate blocked slots based on existing bookings
    const blockedSlots = new Set<string>();

    existingBookings.forEach((booking) => {
      if (!booking.scheduledTime) return;

      const [hours, minutes] = booking.scheduledTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + (booking.duration || 30);

      // Block all slots that overlap with this booking
      allSlots.forEach((slot) => {
        const [slotHours, slotMinutes] = slot.split(':').map(Number);
        const slotStartMinutes = slotHours * 60 + slotMinutes;
        const slotEndMinutes = slotStartMinutes + 30; // Default slot duration

        // Check if slots overlap
        if (slotStartMinutes < endMinutes && slotEndMinutes > startMinutes) {
          blockedSlots.add(slot);
        }
      });
    });

    // If the date is today, also block past slots
    const now = new Date();
    const selectedDate = new Date(date);
    const isToday = now.toDateString() === selectedDate.toDateString();

    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      allSlots.forEach((slot) => {
        const [hours, minutes] = slot.split(':').map(Number);
        const slotMinutes = hours * 60 + minutes;
        // Block slots that start within the next 30 minutes
        if (slotMinutes <= currentMinutes + 30) {
          blockedSlots.add(slot);
        }
      });
    }

    // Build available slots response
    const availableSlots = allSlots.map((slot) => ({
      time: slot,
      available: !blockedSlots.has(slot),
    }));

    return successResponse({
      date,
      vehicleId,
      slots: availableSlots,
      totalAvailable: availableSlots.filter((s) => s.available).length,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return serverErrorResponse('Failed to fetch available slots');
  }
}
