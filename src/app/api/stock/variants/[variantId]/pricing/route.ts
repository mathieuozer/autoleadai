import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, serverErrorResponse, notFoundResponse } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ variantId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { variantId } = await context.params;

    // Get variant with pricing and campaigns
    const variant = await prisma.vehicleVariant.findUnique({
      where: { id: variantId },
      include: {
        model: {
          include: { brand: true },
        },
        campaigns: {
          include: {
            campaign: true,
          },
          where: {
            campaign: {
              status: 'ACTIVE',
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        },
      },
    });

    if (!variant) {
      return notFoundResponse('Variant not found');
    }

    // Calculate effective campaign discount
    let campaignDiscount = 0;
    let activeCampaign = null;

    if (variant.campaigns.length > 0) {
      // Take the best campaign discount
      const bestCampaign = variant.campaigns.reduce((best, current) => {
        const currentDiscount = current.overrideDiscount
          ? Number(current.overrideDiscount)
          : current.campaign.discountType === 'PERCENTAGE'
            ? Number(variant.currentPrice) * Number(current.campaign.discountValue || 0) / 100
            : Number(current.campaign.discountValue || 0);

        const bestDiscount = best.overrideDiscount
          ? Number(best.overrideDiscount)
          : best.campaign.discountType === 'PERCENTAGE'
            ? Number(variant.currentPrice) * Number(best.campaign.discountValue || 0) / 100
            : Number(best.campaign.discountValue || 0);

        return currentDiscount > bestDiscount ? current : best;
      });

      campaignDiscount = bestCampaign.overrideDiscount
        ? Number(bestCampaign.overrideDiscount)
        : bestCampaign.campaign.discountType === 'PERCENTAGE'
          ? Number(variant.currentPrice) * Number(bestCampaign.campaign.discountValue || 0) / 100
          : Number(bestCampaign.campaign.discountValue || 0);

      activeCampaign = {
        id: bestCampaign.campaign.id,
        name: bestCampaign.campaign.name,
        type: bestCampaign.campaign.type,
        discountType: bestCampaign.campaign.discountType,
        discountValue: Number(bestCampaign.campaign.discountValue),
        endDate: bestCampaign.campaign.endDate,
        description: bestCampaign.campaign.description,
      };
    }

    // Calculate effective price
    const msrp = Number(variant.msrp);
    const currentPrice = Number(variant.currentPrice);
    const effectivePrice = currentPrice - campaignDiscount;
    const totalSavings = msrp - effectivePrice;
    const savingsPercentage = Math.round((totalSavings / msrp) * 100);

    return successResponse({
      variant: {
        id: variant.id,
        name: variant.name,
        code: variant.code,
        year: variant.year,
        model: variant.model.name,
        brand: variant.model.brand.name,
      },
      pricing: {
        msrp,
        currentPrice,
        campaignDiscount,
        effectivePrice,
        totalSavings,
        savingsPercentage,
        currency: 'AED',
      },
      activeCampaign,
      allCampaigns: variant.campaigns.map(cv => ({
        id: cv.campaign.id,
        name: cv.campaign.name,
        type: cv.campaign.type,
        discountType: cv.campaign.discountType,
        discountValue: cv.overrideDiscount
          ? Number(cv.overrideDiscount)
          : Number(cv.campaign.discountValue),
        endDate: cv.campaign.endDate,
        daysRemaining: Math.ceil(
          (new Date(cv.campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      })),
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return serverErrorResponse('Failed to fetch pricing');
  }
}
