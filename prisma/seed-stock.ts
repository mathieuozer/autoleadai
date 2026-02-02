import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding stock data...');

  // Create Brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { code: 'TOYOTA' },
      update: {},
      create: {
        name: 'Toyota',
        code: 'TOYOTA',
        logoUrl: '/logos/toyota.svg',
        discountRules: [
          { maxAmount: 7500, requiredLevel: 1 },
          { maxAmount: 20000, requiredLevel: 2 },
          { maxAmount: Infinity, requiredLevel: 2 },
        ],
      },
    }),
    prisma.brand.upsert({
      where: { code: 'NISSAN' },
      update: {},
      create: {
        name: 'Nissan',
        code: 'NISSAN',
        logoUrl: '/logos/nissan.svg',
        discountRules: [
          { maxAmount: 7500, requiredLevel: 1 },
          { maxAmount: 20000, requiredLevel: 2 },
          { maxAmount: Infinity, requiredLevel: 2 },
        ],
      },
    }),
    prisma.brand.upsert({
      where: { code: 'BMW' },
      update: {},
      create: {
        name: 'BMW',
        code: 'BMW',
        logoUrl: '/logos/bmw.svg',
        discountRules: [
          { maxAmount: 3000, requiredLevel: 1 },
          { maxAmount: 10000, requiredLevel: 2 },
          { maxAmount: Infinity, requiredLevel: 2 },
        ],
      },
    }),
    prisma.brand.upsert({
      where: { code: 'MERCEDES' },
      update: {},
      create: {
        name: 'Mercedes-Benz',
        code: 'MERCEDES',
        logoUrl: '/logos/mercedes.svg',
        discountRules: [
          { maxAmount: 3000, requiredLevel: 1 },
          { maxAmount: 10000, requiredLevel: 2 },
          { maxAmount: Infinity, requiredLevel: 2 },
        ],
      },
    }),
    prisma.brand.upsert({
      where: { code: 'HONDA' },
      update: {},
      create: {
        name: 'Honda',
        code: 'HONDA',
        logoUrl: '/logos/honda.svg',
      },
    }),
  ]);

  console.log(`Created ${brands.length} brands`);

  // Create Exterior Colors
  const exteriorColors = await Promise.all([
    prisma.vehicleColor.upsert({
      where: { code: 'EXT-WHITE' },
      update: {},
      create: { name: 'Pearl White', code: 'EXT-WHITE', hexColor: '#F5F5F5', category: 'EXTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'EXT-BLACK' },
      update: {},
      create: { name: 'Midnight Black', code: 'EXT-BLACK', hexColor: '#1a1a1a', category: 'EXTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'EXT-SILVER' },
      update: {},
      create: { name: 'Silver Metallic', code: 'EXT-SILVER', hexColor: '#C0C0C0', category: 'EXTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'EXT-GRAY' },
      update: {},
      create: { name: 'Graphite Gray', code: 'EXT-GRAY', hexColor: '#4A4A4A', category: 'EXTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'EXT-BLUE' },
      update: {},
      create: { name: 'Ocean Blue', code: 'EXT-BLUE', hexColor: '#1E3A5F', category: 'EXTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'EXT-RED' },
      update: {},
      create: { name: 'Crimson Red', code: 'EXT-RED', hexColor: '#8B0000', category: 'EXTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'EXT-GREEN' },
      update: {},
      create: { name: 'British Green', code: 'EXT-GREEN', hexColor: '#1B4D3E', category: 'EXTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'EXT-BRONZE' },
      update: {},
      create: { name: 'Bronze Metallic', code: 'EXT-BRONZE', hexColor: '#8B7355', category: 'EXTERIOR' },
    }),
  ]);

  // Create Interior Colors
  const interiorColors = await Promise.all([
    prisma.vehicleColor.upsert({
      where: { code: 'INT-BLACK' },
      update: {},
      create: { name: 'Black', code: 'INT-BLACK', hexColor: '#1a1a1a', category: 'INTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'INT-BEIGE' },
      update: {},
      create: { name: 'Beige', code: 'INT-BEIGE', hexColor: '#D4C4A8', category: 'INTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'INT-BROWN' },
      update: {},
      create: { name: 'Saddle Brown', code: 'INT-BROWN', hexColor: '#8B4513', category: 'INTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'INT-RED' },
      update: {},
      create: { name: 'Crimson', code: 'INT-RED', hexColor: '#8B0000', category: 'INTERIOR' },
    }),
    prisma.vehicleColor.upsert({
      where: { code: 'INT-GRAY' },
      update: {},
      create: { name: 'Light Gray', code: 'INT-GRAY', hexColor: '#808080', category: 'INTERIOR' },
    }),
  ]);

  console.log(`Created ${exteriorColors.length + interiorColors.length} colors`);

  // Create Models and Variants for Toyota
  const toyota = brands.find(b => b.code === 'TOYOTA')!;

  const camryModel = await prisma.vehicleModel.upsert({
    where: { brandId_code: { brandId: toyota.id, code: 'CAMRY' } },
    update: {},
    create: { brandId: toyota.id, name: 'Camry', code: 'CAMRY' },
  });

  const rav4Model = await prisma.vehicleModel.upsert({
    where: { brandId_code: { brandId: toyota.id, code: 'RAV4' } },
    update: {},
    create: { brandId: toyota.id, name: 'RAV4', code: 'RAV4' },
  });

  const landCruiserModel = await prisma.vehicleModel.upsert({
    where: { brandId_code: { brandId: toyota.id, code: 'LANDCRUISER' } },
    update: {},
    create: { brandId: toyota.id, name: 'Land Cruiser', code: 'LANDCRUISER' },
  });

  // Create Camry Variants
  const camryVariants = await Promise.all([
    prisma.vehicleVariant.upsert({
      where: { modelId_code_year: { modelId: camryModel.id, code: 'LE', year: 2025 } },
      update: {},
      create: {
        modelId: camryModel.id,
        name: 'LE',
        code: 'LE',
        year: 2025,
        msrp: 125000,
        currentPrice: 120000,
        engineType: '2.5L 4-Cylinder',
        transmission: 'Automatic',
      },
    }),
    prisma.vehicleVariant.upsert({
      where: { modelId_code_year: { modelId: camryModel.id, code: 'SE', year: 2025 } },
      update: {},
      create: {
        modelId: camryModel.id,
        name: 'SE',
        code: 'SE',
        year: 2025,
        msrp: 135000,
        currentPrice: 130000,
        engineType: '2.5L 4-Cylinder',
        transmission: 'Automatic',
      },
    }),
    prisma.vehicleVariant.upsert({
      where: { modelId_code_year: { modelId: camryModel.id, code: 'XLE', year: 2025 } },
      update: {},
      create: {
        modelId: camryModel.id,
        name: 'XLE',
        code: 'XLE',
        year: 2025,
        msrp: 150000,
        currentPrice: 145000,
        engineType: '2.5L 4-Cylinder Hybrid',
        transmission: 'CVT',
      },
    }),
    prisma.vehicleVariant.upsert({
      where: { modelId_code_year: { modelId: camryModel.id, code: 'XLE', year: 2024 } },
      update: {},
      create: {
        modelId: camryModel.id,
        name: 'XLE',
        code: 'XLE',
        year: 2024,
        msrp: 145000,
        currentPrice: 138000,
        engineType: '2.5L 4-Cylinder Hybrid',
        transmission: 'CVT',
      },
    }),
  ]);

  console.log(`Created ${camryVariants.length} Camry variants`);

  // Create RAV4 Variants
  const rav4Variants = await Promise.all([
    prisma.vehicleVariant.upsert({
      where: { modelId_code_year: { modelId: rav4Model.id, code: 'XLE', year: 2025 } },
      update: {},
      create: {
        modelId: rav4Model.id,
        name: 'XLE',
        code: 'XLE',
        year: 2025,
        msrp: 145000,
        currentPrice: 140000,
        engineType: '2.5L 4-Cylinder',
        transmission: 'Automatic',
      },
    }),
    prisma.vehicleVariant.upsert({
      where: { modelId_code_year: { modelId: rav4Model.id, code: 'LIMITED', year: 2025 } },
      update: {},
      create: {
        modelId: rav4Model.id,
        name: 'Limited',
        code: 'LIMITED',
        year: 2025,
        msrp: 165000,
        currentPrice: 160000,
        engineType: '2.5L 4-Cylinder Hybrid',
        transmission: 'CVT',
      },
    }),
  ]);

  console.log(`Created ${rav4Variants.length} RAV4 variants`);

  // Create Color Combinations for Camry XLE 2025
  const camryXLE2025 = camryVariants.find(v => v.code === 'XLE' && v.year === 2025)!;

  for (const extColor of exteriorColors.slice(0, 5)) {
    for (const intColor of interiorColors.slice(0, 3)) {
      await prisma.colorCombination.upsert({
        where: {
          variantId_exteriorColorId_interiorColorId: {
            variantId: camryXLE2025.id,
            exteriorColorId: extColor.id,
            interiorColorId: intColor.id,
          },
        },
        update: {},
        create: {
          variantId: camryXLE2025.id,
          exteriorColorId: extColor.id,
          interiorColorId: intColor.id,
          isAvailable: true,
        },
      });
    }
  }

  console.log('Created color combinations');

  // Create some inventory items
  const generateVin = () => {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
      vin += chars[Math.floor(Math.random() * chars.length)];
    }
    return vin;
  };

  const inventoryItems = [];
  const statuses = ['IN_TRANSIT', 'IN_YARD'] as const;

  for (const variant of camryVariants) {
    for (let i = 0; i < 3; i++) {
      const extColor = exteriorColors[Math.floor(Math.random() * exteriorColors.length)];
      const stockDate = new Date();
      stockDate.setDate(stockDate.getDate() - Math.floor(Math.random() * 90));

      inventoryItems.push({
        vin: generateVin(),
        variantId: variant.id,
        exteriorColorId: extColor.id,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        stockDate,
        agingDays: Math.floor((Date.now() - stockDate.getTime()) / (1000 * 60 * 60 * 24)),
        agingRiskScore: Math.floor(Math.random() * 60),
        closeabilityScore: 30 + Math.floor(Math.random() * 50),
      });
    }
  }

  for (const item of inventoryItems) {
    try {
      await prisma.vehicleInventory.create({ data: item });
    } catch (e) {
      // Ignore duplicate VIN errors
    }
  }

  console.log(`Created ${inventoryItems.length} inventory items`);

  // Create an active campaign
  const campaign = await prisma.campaign.upsert({
    where: { code: 'SUMMER2025' },
    update: {},
    create: {
      name: 'Summer Sale 2025',
      code: 'SUMMER2025',
      description: 'Special summer discounts on select vehicles',
      type: 'DISCOUNT',
      status: 'ACTIVE',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      discountType: 'FIXED',
      discountValue: 5000,
    },
  });

  // Link campaign to some variants
  for (const variant of camryVariants.slice(0, 2)) {
    await prisma.campaignVariant.upsert({
      where: {
        campaignId_variantId: {
          campaignId: campaign.id,
          variantId: variant.id,
        },
      },
      update: {},
      create: {
        campaignId: campaign.id,
        variantId: variant.id,
      },
    });
  }

  console.log('Created campaign and linked to variants');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
