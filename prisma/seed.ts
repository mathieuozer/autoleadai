import { PrismaClient, OrderStatus, OrderSource, FinancingStatus, Channel, Sentiment, ActivityType, UserRole, DocumentType, DocumentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clean existing data (in correct order for foreign key constraints)
  await prisma.priorityItem.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.document.deleteMany();
  await prisma.tradeInPhoto.deleteMany();
  await prisma.tradeInAppraisal.deleteMany();
  await prisma.testDriveFeedback.deleteMany();
  await prisma.testDriveAuditLog.deleteMany();
  await prisma.testDrive.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.discountRequest.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.order.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // Create Branch
  const branch = await prisma.branch.create({
    data: {
      name: 'Dubai Main Showroom',
      code: 'DXB-MAIN',
      address: 'Sheikh Zayed Road, Dubai, UAE',
      phone: '+971-4-123-4567',
    },
  });
  console.log('Created branch:', branch.name);

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'ahmed.hassan@autolead.ai',
        name: 'Ahmed Hassan',
        role: UserRole.SALESPERSON,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sara.khan@autolead.ai',
        name: 'Sara Khan',
        role: UserRole.SALESPERSON,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara',
      },
    }),
    prisma.user.create({
      data: {
        email: 'omar.malik@autolead.ai',
        name: 'Omar Malik',
        role: UserRole.SALES_EXECUTIVE,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=omar',
      },
    }),
    prisma.user.create({
      data: {
        email: 'fatima.ali@autolead.ai',
        name: 'Fatima Ali',
        role: UserRole.BRANCH_MANAGER,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
      },
    }),
  ]);
  console.log(`Created ${users.length} users`);

  // Create Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Mohammed Al Rashid',
        email: 'mohammed.rashid@email.com',
        phone: '+971-50-123-4567',
        preferredChannel: Channel.WHATSAPP,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Aisha Mahmood',
        email: 'aisha.m@email.com',
        phone: '+971-55-234-5678',
        preferredChannel: Channel.CALL,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Khalid Ibrahim',
        email: 'k.ibrahim@email.com',
        phone: '+971-50-345-6789',
        preferredChannel: Channel.WHATSAPP,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Noura Al Salem',
        email: 'noura.salem@email.com',
        phone: '+971-56-456-7890',
        preferredChannel: Channel.EMAIL,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Yusuf Ahmed',
        email: 'yusuf.a@email.com',
        phone: '+971-50-567-8901',
        preferredChannel: Channel.WHATSAPP,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Layla Hassan',
        email: 'layla.h@email.com',
        phone: '+971-55-678-9012',
        preferredChannel: Channel.CALL,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Omar Farouk',
        email: 'omar.f@email.com',
        phone: '+971-50-789-0123',
        preferredChannel: Channel.WHATSAPP,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Hana Al Qasimi',
        email: 'hana.q@email.com',
        phone: '+971-56-890-1234',
        preferredChannel: Channel.IN_PERSON,
      },
    }),
  ]);
  console.log(`Created ${customers.length} customers`);

  // Create Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        make: 'Toyota',
        model: 'Land Cruiser',
        variant: 'GXR V8',
        year: 2024,
        color: 'Pearl White',
        vin: 'JTMHY7AJ5L4000001',
        inStock: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        make: 'Nissan',
        model: 'Patrol',
        variant: 'Platinum',
        year: 2024,
        color: 'Black',
        vin: 'JN8AZ2NE5L9000002',
        inStock: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        make: 'Mercedes-Benz',
        model: 'GLE 450',
        variant: '4MATIC',
        year: 2024,
        color: 'Obsidian Black',
        vin: 'W1N2M2HB5LA000003',
        inStock: false,
        stockDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    }),
    prisma.vehicle.create({
      data: {
        make: 'BMW',
        model: 'X5',
        variant: 'xDrive40i',
        year: 2024,
        color: 'Alpine White',
        vin: '5UXCR6C55L9000004',
        inStock: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        make: 'Lexus',
        model: 'LX 600',
        variant: 'F Sport',
        year: 2024,
        color: 'Sonic Titanium',
        vin: 'JTJHY7AX5L4000005',
        inStock: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        make: 'Porsche',
        model: 'Cayenne',
        variant: 'S',
        year: 2024,
        color: 'Carrara White',
        vin: 'WP1AB2A59LDA00006',
        inStock: false,
        stockDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    }),
    prisma.vehicle.create({
      data: {
        make: 'Range Rover',
        model: 'Sport',
        variant: 'HSE Dynamic',
        year: 2024,
        color: 'Santorini Black',
        vin: 'SALWA2FK5LA000007',
        inStock: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        make: 'Audi',
        model: 'Q7',
        variant: '55 TFSI',
        year: 2024,
        color: 'Glacier White',
        vin: 'WA1VAAF75LD000008',
        inStock: true,
      },
    }),
  ]);
  console.log(`Created ${vehicles.length} vehicles`);

  const now = new Date();

  // Create Orders with various risk scenarios
  const orders = await Promise.all([
    // HIGH RISK - Silent customer with pending financing
    prisma.order.create({
      data: {
        customerId: customers[0].id,
        vehicleId: vehicles[0].id,
        status: OrderStatus.BOOKING_DONE,
        source: OrderSource.WALK_IN,
        totalAmount: 285000,
        bookingAmount: 10000,
        financingStatus: FinancingStatus.PENDING,
        salespersonId: users[0].id,
        lastContactAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        expectedDeliveryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    // HIGH RISK - Delivery delayed with negative sentiment
    prisma.order.create({
      data: {
        customerId: customers[1].id,
        vehicleId: vehicles[1].id,
        status: OrderStatus.READY_FOR_DELIVERY,
        source: OrderSource.REFERRAL,
        totalAmount: 320000,
        bookingAmount: 15000,
        financingStatus: FinancingStatus.APPROVED,
        salespersonId: users[1].id,
        lastContactAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        expectedDeliveryDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
      },
    }),
    // MEDIUM RISK - Stagnant in financing pending
    prisma.order.create({
      data: {
        customerId: customers[2].id,
        vehicleId: vehicles[2].id,
        status: OrderStatus.FINANCING_PENDING,
        source: OrderSource.WEBSITE,
        totalAmount: 420000,
        bookingAmount: 20000,
        financingStatus: FinancingStatus.PENDING,
        salespersonId: users[0].id,
        lastContactAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
    }),
    // MEDIUM RISK - High value with silence
    prisma.order.create({
      data: {
        customerId: customers[3].id,
        vehicleId: vehicles[3].id,
        status: OrderStatus.NEGOTIATION,
        source: OrderSource.WALK_IN,
        totalAmount: 380000,
        financingStatus: FinancingStatus.CASH,
        salespersonId: users[1].id,
        lastContactAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    }),
    // LOW RISK - On track
    prisma.order.create({
      data: {
        customerId: customers[4].id,
        vehicleId: vehicles[4].id,
        status: OrderStatus.FINANCING_APPROVED,
        source: OrderSource.WHATSAPP,
        totalAmount: 550000,
        bookingAmount: 25000,
        financingStatus: FinancingStatus.APPROVED,
        salespersonId: users[0].id,
        lastContactAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        expectedDeliveryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
    // MEDIUM RISK - Waiting too long
    prisma.order.create({
      data: {
        customerId: customers[5].id,
        vehicleId: vehicles[5].id,
        status: OrderStatus.BOOKING_DONE,
        source: OrderSource.PHONE,
        totalAmount: 480000,
        bookingAmount: 20000,
        financingStatus: FinancingStatus.APPROVED,
        salespersonId: users[1].id,
        lastContactAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      },
    }),
    // LOW RISK - New order, engaged customer
    prisma.order.create({
      data: {
        customerId: customers[6].id,
        vehicleId: vehicles[6].id,
        status: OrderStatus.TEST_DRIVE_DONE,
        source: OrderSource.WALK_IN,
        totalAmount: 520000,
        financingStatus: FinancingStatus.PENDING,
        salespersonId: users[0].id,
        lastContactAt: now, // Today
      },
    }),
    // DELIVERED - Completed order
    prisma.order.create({
      data: {
        customerId: customers[7].id,
        vehicleId: vehicles[7].id,
        status: OrderStatus.DELIVERED,
        source: OrderSource.REFERRAL,
        totalAmount: 340000,
        bookingAmount: 15000,
        financingStatus: FinancingStatus.APPROVED,
        salespersonId: users[1].id,
        lastContactAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log(`Created ${orders.length} orders`);

  // Create Activities
  const activities = await Promise.all([
    // Activities for Order 1 (High Risk - Silent)
    prisma.activity.create({
      data: {
        orderId: orders[0].id,
        type: ActivityType.CALL_OUTBOUND,
        channel: Channel.CALL,
        summary: 'Initial contact after booking',
        sentiment: Sentiment.POSITIVE,
        performedById: users[0].id,
        performedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        duration: 180,
      },
    }),
    // Activities for Order 2 (High Risk - Delayed)
    prisma.activity.create({
      data: {
        orderId: orders[1].id,
        type: ActivityType.WHATSAPP_RECEIVED,
        channel: Channel.WHATSAPP,
        summary: 'Customer asking about delivery delay',
        details: 'When will my car be ready? It was supposed to be delivered last week.',
        sentiment: Sentiment.NEGATIVE,
        performedById: null,
        performedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.activity.create({
      data: {
        orderId: orders[1].id,
        type: ActivityType.WHATSAPP_SENT,
        channel: Channel.WHATSAPP,
        summary: 'Apologized for delay, promised update',
        sentiment: Sentiment.NEUTRAL,
        performedById: users[1].id,
        performedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    // Activities for Order 3 (Medium Risk - Financing)
    prisma.activity.create({
      data: {
        orderId: orders[2].id,
        type: ActivityType.STATUS_CHANGE,
        channel: Channel.SYSTEM,
        summary: 'Status changed to FINANCING_PENDING',
        performedById: null,
        performedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
    }),
    // Activities for Order 5 (Low Risk - On Track)
    prisma.activity.create({
      data: {
        orderId: orders[4].id,
        type: ActivityType.CALL_OUTBOUND,
        channel: Channel.CALL,
        summary: 'Confirmed delivery date with customer',
        sentiment: Sentiment.POSITIVE,
        performedById: users[0].id,
        performedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        duration: 240,
      },
    }),
    // Activities for Order 7 (Low Risk - New)
    prisma.activity.create({
      data: {
        orderId: orders[6].id,
        type: ActivityType.TEST_DRIVE,
        channel: Channel.IN_PERSON,
        summary: 'Customer completed test drive, very interested',
        sentiment: Sentiment.POSITIVE,
        performedById: users[0].id,
        performedAt: now,
        duration: 1800,
      },
    }),
    // Activities for Order 8 (Delivered)
    prisma.activity.create({
      data: {
        orderId: orders[7].id,
        type: ActivityType.STATUS_CHANGE,
        channel: Channel.SYSTEM,
        summary: 'Vehicle delivered to customer',
        performedById: null,
        performedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log(`Created ${activities.length} activities`);

  // Create Documents for various orders
  const documents = await Promise.all([
    // Documents for Order 0 (High Risk - Booking Done)
    prisma.document.create({
      data: {
        orderId: orders[0].id,
        type: DocumentType.ID_PROOF,
        status: DocumentStatus.APPROVED,
        name: 'ID Proof - Emirates ID',
        fileName: 'emirates_id.pdf',
        fileSize: 245000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
      },
    }),
    prisma.document.create({
      data: {
        orderId: orders[0].id,
        type: DocumentType.ADDRESS_PROOF,
        status: DocumentStatus.APPROVED,
        name: 'Address Proof - Utility Bill',
        fileName: 'utility_bill.pdf',
        fileSize: 180000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
      },
    }),
    prisma.document.create({
      data: {
        orderId: orders[0].id,
        type: DocumentType.INCOME_CERTIFICATE,
        status: DocumentStatus.UNDER_REVIEW,
        name: 'Income Certificate',
        fileName: 'salary_certificate.pdf',
        fileSize: 320000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.document.create({
      data: {
        orderId: orders[0].id,
        type: DocumentType.INSURANCE,
        status: DocumentStatus.PENDING,
        name: 'Insurance Document',
      },
    }),
    // Documents for Order 1 (High Risk - Ready for Delivery)
    prisma.document.create({
      data: {
        orderId: orders[1].id,
        type: DocumentType.ID_PROOF,
        status: DocumentStatus.APPROVED,
        name: 'ID Proof - Passport',
        fileName: 'passport.pdf',
        fileSize: 520000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
      },
    }),
    prisma.document.create({
      data: {
        orderId: orders[1].id,
        type: DocumentType.ADDRESS_PROOF,
        status: DocumentStatus.APPROVED,
        name: 'Address Proof - Tenancy Contract',
        fileName: 'tenancy_contract.pdf',
        fileSize: 890000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
      },
    }),
    prisma.document.create({
      data: {
        orderId: orders[1].id,
        type: DocumentType.BANK_STATEMENT,
        status: DocumentStatus.APPROVED,
        name: 'Bank Statement',
        fileName: 'bank_statement.pdf',
        fileSize: 450000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
      },
    }),
    prisma.document.create({
      data: {
        orderId: orders[1].id,
        type: DocumentType.INSURANCE,
        status: DocumentStatus.APPROVED,
        name: 'Vehicle Insurance',
        fileName: 'insurance_policy.pdf',
        fileSize: 680000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
      },
    }),
    // Documents for Order 2 (Medium Risk - Financing Pending)
    prisma.document.create({
      data: {
        orderId: orders[2].id,
        type: DocumentType.ID_PROOF,
        status: DocumentStatus.UPLOADED,
        name: 'ID Proof',
        fileName: 'id_front.jpg',
        fileSize: 1200000,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.document.create({
      data: {
        orderId: orders[2].id,
        type: DocumentType.INCOME_CERTIFICATE,
        status: DocumentStatus.REJECTED,
        name: 'Income Certificate',
        fileName: 'salary_slip.pdf',
        fileSize: 280000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
        reviewNotes: 'Document is outdated. Please upload a recent salary certificate from the last 3 months.',
      },
    }),
    // Documents for Order 4 (Low Risk - On Track)
    prisma.document.create({
      data: {
        orderId: orders[4].id,
        type: DocumentType.ID_PROOF,
        status: DocumentStatus.APPROVED,
        name: 'ID Proof - Emirates ID',
        fileName: 'emirates_id.pdf',
        fileSize: 240000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
      },
    }),
    prisma.document.create({
      data: {
        orderId: orders[4].id,
        type: DocumentType.ADDRESS_PROOF,
        status: DocumentStatus.APPROVED,
        name: 'Address Proof',
        fileName: 'dewa_bill.pdf',
        fileSize: 150000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
      },
    }),
    prisma.document.create({
      data: {
        orderId: orders[4].id,
        type: DocumentType.INCOME_CERTIFICATE,
        status: DocumentStatus.APPROVED,
        name: 'Income Certificate',
        fileName: 'salary_cert.pdf',
        fileSize: 290000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
      },
    }),
    prisma.document.create({
      data: {
        orderId: orders[4].id,
        type: DocumentType.BANK_STATEMENT,
        status: DocumentStatus.APPROVED,
        name: 'Bank Statement',
        fileName: 'bank_stmt.pdf',
        fileSize: 420000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        reviewedBy: users[2].id,
      },
    }),
  ]);
  console.log(`Created ${documents.length} documents`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
