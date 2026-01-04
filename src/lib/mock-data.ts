import { Order, Customer, Vehicle, Activity, User } from '@/types';

// Helper to generate dates relative to today
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const daysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

// Mock Users (Salespeople)
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@autolead.ai',
    role: 'SALESPERSON',
  },
  {
    id: 'user-2',
    name: 'Sara Al-Mahmoud',
    email: 'sara.mahmoud@autolead.ai',
    role: 'SALESPERSON',
  },
  {
    id: 'user-3',
    name: 'Omar Khalil',
    email: 'omar.khalil@autolead.ai',
    role: 'SALES_EXECUTIVE',
  },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Mohammed Al-Rashid',
    email: 'mohammed.rashid@email.com',
    phone: '+971501234567',
    preferredChannel: 'WHATSAPP',
  },
  {
    id: 'cust-2',
    name: 'Fatima Ahmed',
    email: 'fatima.ahmed@email.com',
    phone: '+971502345678',
    preferredChannel: 'CALL',
  },
  {
    id: 'cust-3',
    name: 'Khalid Ibrahim',
    email: 'khalid.ibrahim@email.com',
    phone: '+971503456789',
    preferredChannel: 'WHATSAPP',
  },
  {
    id: 'cust-4',
    name: 'Aisha Mohammed',
    email: 'aisha.m@email.com',
    phone: '+971504567890',
    preferredChannel: 'EMAIL',
  },
  {
    id: 'cust-5',
    name: 'Yusuf Al-Farsi',
    email: 'yusuf.farsi@email.com',
    phone: '+971505678901',
    preferredChannel: 'CALL',
  },
  {
    id: 'cust-6',
    name: 'Layla Hassan',
    email: 'layla.h@email.com',
    phone: '+971506789012',
    preferredChannel: 'WHATSAPP',
  },
  {
    id: 'cust-7',
    name: 'Tariq Mansour',
    email: 'tariq.m@email.com',
    phone: '+971507890123',
    preferredChannel: 'CALL',
  },
  {
    id: 'cust-8',
    name: 'Noor Al-Salem',
    email: 'noor.salem@email.com',
    phone: '+971508901234',
    preferredChannel: 'WHATSAPP',
  },
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  { id: 'veh-1', make: 'Toyota', model: 'Camry', variant: 'SE', year: 2024, color: 'Pearl White' },
  { id: 'veh-2', make: 'Honda', model: 'Accord', variant: 'Sport', year: 2024, color: 'Midnight Blue' },
  { id: 'veh-3', make: 'Nissan', model: 'Altima', variant: 'SV', year: 2024, color: 'Gun Metallic' },
  { id: 'veh-4', make: 'Toyota', model: 'RAV4', variant: 'XLE', year: 2024, color: 'Lunar Rock' },
  { id: 'veh-5', make: 'Lexus', model: 'ES350', variant: 'Luxury', year: 2024, color: 'Caviar Black' },
  { id: 'veh-6', make: 'Toyota', model: 'Land Cruiser', variant: 'GXR', year: 2024, color: 'Super White' },
  { id: 'veh-7', make: 'Honda', model: 'CR-V', variant: 'EX-L', year: 2024, color: 'Sonic Gray' },
  { id: 'veh-8', make: 'Nissan', model: 'Patrol', variant: 'Platinum', year: 2024, color: 'Pearl White' },
];

// Mock Activities
export const mockActivities: Activity[] = [
  {
    id: 'act-1',
    orderId: 'order-1',
    type: 'CALL_OUTBOUND',
    channel: 'CALL',
    summary: 'Discussed financing options',
    details: 'Customer interested in 5-year financing plan. Requested follow-up with bank approval.',
    sentiment: 'POSITIVE',
    performedBy: 'user-1',
    performedAt: daysAgo(4),
    duration: 420,
  },
  {
    id: 'act-2',
    orderId: 'order-1',
    type: 'STATUS_CHANGE',
    channel: 'SYSTEM',
    summary: 'Status changed to FINANCING_PENDING',
    performedBy: 'SYSTEM',
    performedAt: daysAgo(4),
  },
  {
    id: 'act-3',
    orderId: 'order-2',
    type: 'WHATSAPP_SENT',
    channel: 'WHATSAPP',
    summary: 'Sent delivery update',
    details: 'Informed customer about 3-day delay due to shipping.',
    performedBy: 'user-1',
    performedAt: daysAgo(1),
  },
  {
    id: 'act-4',
    orderId: 'order-2',
    type: 'WHATSAPP_RECEIVED',
    channel: 'WHATSAPP',
    summary: 'Customer expressed concern',
    sentiment: 'NEGATIVE',
    performedBy: 'cust-2',
    performedAt: daysAgo(1),
  },
  {
    id: 'act-5',
    orderId: 'order-3',
    type: 'CALL_OUTBOUND',
    channel: 'CALL',
    summary: 'Follow-up call - no answer',
    performedBy: 'user-2',
    performedAt: daysAgo(8),
    duration: 0,
  },
  {
    id: 'act-6',
    orderId: 'order-4',
    type: 'VISIT',
    channel: 'IN_PERSON',
    summary: 'Customer visited showroom',
    details: 'Test drove the vehicle, very interested. Ready to proceed.',
    sentiment: 'POSITIVE',
    performedBy: 'user-1',
    performedAt: daysAgo(2),
  },
  {
    id: 'act-7',
    orderId: 'order-5',
    type: 'STATUS_CHANGE',
    channel: 'SYSTEM',
    summary: 'Vehicle arrived at yard',
    performedBy: 'SYSTEM',
    performedAt: daysAgo(0),
  },
  {
    id: 'act-8',
    orderId: 'order-6',
    type: 'CALL_OUTBOUND',
    channel: 'CALL',
    summary: 'Confirmed order details',
    sentiment: 'POSITIVE',
    performedBy: 'user-2',
    performedAt: daysAgo(1),
    duration: 300,
  },
];

// Mock Orders - varied scenarios for testing
export const mockOrders: Order[] = [
  {
    // HIGH RISK: Financing pending for 4 days
    id: 'order-1',
    customerId: 'cust-1',
    vehicleId: 'veh-1',
    status: 'FINANCING_PENDING',
    source: 'WALK_IN',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(4),
    expectedDeliveryDate: daysFromNow(7),
    totalAmount: 125000,
    bookingAmount: 10000,
    financingStatus: 'PENDING',
    riskScore: 0, // Will be calculated
    fulfillmentProbability: 0,
    lastContactDaysAgo: 4,
    customer: mockCustomers[0],
    vehicle: mockVehicles[0],
    salesperson: mockUsers[0],
    activities: mockActivities.filter(a => a.orderId === 'order-1'),
  },
  {
    // HIGH RISK: Delivery delayed + negative sentiment
    id: 'order-2',
    customerId: 'cust-2',
    vehicleId: 'veh-2',
    status: 'READY_FOR_DELIVERY',
    source: 'WEBSITE',
    createdAt: daysAgo(21),
    updatedAt: daysAgo(1),
    expectedDeliveryDate: daysFromNow(3), // Was supposed to be 3 days ago
    totalAmount: 135000,
    bookingAmount: 15000,
    financingStatus: 'APPROVED',
    riskScore: 0,
    fulfillmentProbability: 0,
    lastContactDaysAgo: 1,
    customer: mockCustomers[1],
    vehicle: mockVehicles[1],
    salesperson: mockUsers[0],
    activities: mockActivities.filter(a => a.orderId === 'order-2'),
  },
  {
    // MEDIUM RISK: No contact for 8 days
    id: 'order-3',
    customerId: 'cust-3',
    vehicleId: 'veh-3',
    status: 'NEGOTIATION',
    source: 'PHONE',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(8),
    totalAmount: 98000,
    financingStatus: 'CASH',
    riskScore: 0,
    fulfillmentProbability: 0,
    lastContactDaysAgo: 8,
    customer: mockCustomers[2],
    vehicle: mockVehicles[2],
    salesperson: mockUsers[1],
    activities: mockActivities.filter(a => a.orderId === 'order-3'),
  },
  {
    // LOW RISK: Recent positive contact
    id: 'order-4',
    customerId: 'cust-4',
    vehicleId: 'veh-4',
    status: 'BOOKING_DONE',
    source: 'WALK_IN',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(2),
    expectedDeliveryDate: daysFromNow(14),
    totalAmount: 165000,
    bookingAmount: 20000,
    financingStatus: 'APPROVED',
    riskScore: 0,
    fulfillmentProbability: 0,
    lastContactDaysAgo: 2,
    customer: mockCustomers[3],
    vehicle: mockVehicles[3],
    salesperson: mockUsers[0],
    activities: mockActivities.filter(a => a.orderId === 'order-4'),
  },
  {
    // MEDIUM RISK: Vehicle arrived, needs delivery scheduling
    id: 'order-5',
    customerId: 'cust-5',
    vehicleId: 'veh-5',
    status: 'FINANCING_APPROVED',
    source: 'REFERRAL',
    createdAt: daysAgo(18),
    updatedAt: daysAgo(0),
    expectedDeliveryDate: daysFromNow(2),
    totalAmount: 245000,
    bookingAmount: 30000,
    financingStatus: 'APPROVED',
    riskScore: 0,
    fulfillmentProbability: 0,
    lastContactDaysAgo: 3,
    customer: mockCustomers[4],
    vehicle: mockVehicles[4],
    salesperson: mockUsers[1],
    activities: mockActivities.filter(a => a.orderId === 'order-5'),
  },
  {
    // LOW RISK: Everything on track
    id: 'order-6',
    customerId: 'cust-6',
    vehicleId: 'veh-6',
    status: 'BOOKING_DONE',
    source: 'WALK_IN',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
    expectedDeliveryDate: daysFromNow(21),
    totalAmount: 385000,
    bookingAmount: 50000,
    financingStatus: 'APPROVED',
    riskScore: 0,
    fulfillmentProbability: 0,
    lastContactDaysAgo: 1,
    customer: mockCustomers[5],
    vehicle: mockVehicles[5],
    salesperson: mockUsers[1],
    activities: mockActivities.filter(a => a.orderId === 'order-6'),
  },
  {
    // MEDIUM RISK: Financing pending 2 days (borderline)
    id: 'order-7',
    customerId: 'cust-7',
    vehicleId: 'veh-7',
    status: 'FINANCING_PENDING',
    source: 'WEBSITE',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(2),
    expectedDeliveryDate: daysFromNow(10),
    totalAmount: 155000,
    bookingAmount: 15000,
    financingStatus: 'PENDING',
    riskScore: 0,
    fulfillmentProbability: 0,
    lastContactDaysAgo: 2,
    customer: mockCustomers[6],
    vehicle: mockVehicles[6],
    salesperson: mockUsers[0],
    activities: [],
  },
  {
    // LOW RISK: New order, just contacted
    id: 'order-8',
    customerId: 'cust-8',
    vehicleId: 'veh-8',
    status: 'CONTACTED',
    source: 'WHATSAPP',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(0),
    totalAmount: 295000,
    financingStatus: 'CASH',
    riskScore: 0,
    fulfillmentProbability: 0,
    lastContactDaysAgo: 0,
    customer: mockCustomers[7],
    vehicle: mockVehicles[7],
    salesperson: mockUsers[0],
    activities: [],
  },
];

// Helper to get order with calculated fields
export function getOrderById(id: string): Order | undefined {
  return mockOrders.find(order => order.id === id);
}

// Helper to get all orders for a salesperson
export function getOrdersBySalesperson(userId: string): Order[] {
  return mockOrders.filter(order => order.salesperson?.id === userId);
}

// Helper to get activities for an order
export function getActivitiesForOrder(orderId: string): Activity[] {
  return mockActivities.filter(activity => activity.orderId === orderId);
}
