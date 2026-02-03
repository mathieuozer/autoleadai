-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONTACTED', 'TEST_DRIVE_SCHEDULED', 'TEST_DRIVE_DONE', 'NEGOTIATION', 'BOOKING_DONE', 'FINANCING_PENDING', 'FINANCING_APPROVED', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('WALK_IN', 'WHATSAPP', 'WEBSITE', 'PHONE', 'REFERRAL');

-- CreateEnum
CREATE TYPE "FinancingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CASH');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'IN_PERSON', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('NOW', 'TODAY', 'THIS_WEEK');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL_OUTBOUND', 'CALL_INBOUND', 'WHATSAPP_SENT', 'WHATSAPP_RECEIVED', 'EMAIL_SENT', 'EMAIL_RECEIVED', 'VISIT', 'TEST_DRIVE', 'STATUS_CHANGE', 'NOTE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SALESPERSON', 'SALES_EXECUTIVE', 'BRANCH_MANAGER', 'CONTACT_CENTER', 'ADMIN', 'INSPECTOR');

-- CreateEnum
CREATE TYPE "TradeInStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PRICED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TestDriveStatus" AS ENUM ('DRAFT', 'IDENTITY_VERIFIED', 'VEHICLE_SELECTED', 'AGREEMENT_SIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('FRONT_VIEW', 'REAR_VIEW', 'LEFT_SIDE', 'RIGHT_SIDE', 'DASHBOARD', 'FRONT_SEATS', 'REAR_SEATS', 'TRUNK', 'ENGINE_BAY', 'WHEELS', 'ADDITIONAL_1', 'ADDITIONAL_2');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRADE_IN_PRICED', 'TRADE_IN_ACCEPTED', 'TRADE_IN_REJECTED', 'ORDER_STATUS_CHANGE', 'TEST_DRIVE_SCHEDULED', 'TEST_DRIVE_COMPLETED', 'TEST_DRIVE_FEEDBACK_REQUEST', 'TEST_DRIVE_FEEDBACK_RECEIVED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BuyingIntent" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNDETERMINED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_PROOF', 'ADDRESS_PROOF', 'INCOME_CERTIFICATE', 'INSURANCE', 'BANK_STATEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_TRANSIT', 'IN_YARD', 'RESERVED', 'SOLD', 'DAMAGED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('DISCOUNT', 'CASHBACK', 'FINANCING', 'ACCESSORY_BUNDLE', 'TRADE_IN_BONUS');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DOWN_PAYMENT', 'FULL_PAYMENT', 'INSTALLMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'REQUESTED', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DiscountStatus" AS ENUM ('DRAFT', 'PENDING_BM', 'PENDING_GM', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'ISSUED', 'SENT', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SALESPERSON',
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "preferredChannel" "Channel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "vin" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "stockDate" TIMESTAMP(3),
    "testDriveAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "source" "OrderSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expectedDeliveryDate" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "bookingAmount" DECIMAL(12,2),
    "financingStatus" "FinancingStatus" NOT NULL DEFAULT 'PENDING',
    "salespersonId" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "fulfillmentProbability" INTEGER NOT NULL DEFAULT 100,
    "lastContactAt" TIMESTAMP(3),
    "variantId" TEXT,
    "exteriorColorId" TEXT,
    "interiorColorId" TEXT,
    "vinNumber" TEXT,
    "portalActivated" BOOLEAN NOT NULL DEFAULT false,
    "portalActivatedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "sentiment" "Sentiment",
    "performedById" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "aiSummary" TEXT,
    "nextActionSuggested" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "nextBestAction" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeInAppraisal" (
    "id" TEXT NOT NULL,
    "status" "TradeInStatus" NOT NULL DEFAULT 'DRAFT',
    "leadId" TEXT,
    "customerId" TEXT NOT NULL,
    "salesExecutiveId" TEXT NOT NULL,
    "registrationFrontUrl" TEXT,
    "registrationBackUrl" TEXT,
    "ocrCustomerName" TEXT,
    "ocrTrafficFileNumber" TEXT,
    "ocrPlateNumber" TEXT,
    "ocrEmirateCode" TEXT,
    "ocrVin" TEXT,
    "ocrVehicleMake" TEXT,
    "ocrVehicleModel" TEXT,
    "ocrVehicleTrim" TEXT,
    "ocrVehicleColor" TEXT,
    "ocrVehicleType" TEXT,
    "ocrEngineNumber" TEXT,
    "ocrRegistrationYear" INTEGER,
    "ocrRegistrationDate" TIMESTAMP(3),
    "ocrExpiryDate" TIMESTAMP(3),
    "ocrInsuranceCompany" TEXT,
    "ocrInsuranceExpiry" TIMESTAMP(3),
    "ocrMortgageInfo" TEXT,
    "mileage" INTEGER,
    "expectedPrice" DECIMAL(12,2),
    "condition" "VehicleCondition",
    "features" TEXT[],
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "inspectorId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "tentativePrice" DECIMAL(12,2),
    "inspectorNotes" TEXT,

    CONSTRAINT "TradeInAppraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeInPhoto" (
    "id" TEXT NOT NULL,
    "appraisalId" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "notes" TEXT,
    "annotations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeInPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDrive" (
    "id" TEXT NOT NULL,
    "status" "TestDriveStatus" NOT NULL DEFAULT 'DRAFT',
    "customerId" TEXT NOT NULL,
    "salesExecutiveId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "orderId" TEXT,
    "drivingLicenseFrontUrl" TEXT,
    "drivingLicenseBackUrl" TEXT,
    "nationalIdFrontUrl" TEXT,
    "nationalIdBackUrl" TEXT,
    "ocrFullName" TEXT,
    "ocrLicenseNumber" TEXT,
    "ocrLicenseExpiry" TIMESTAMP(3),
    "ocrDateOfBirth" TIMESTAMP(3),
    "ocrNationality" TEXT,
    "ocrLicenseCategory" TEXT,
    "ocrEmiratesIdNumber" TEXT,
    "ocrNationalIdExpiry" TIMESTAMP(3),
    "ocrNationalIdNameEn" TEXT,
    "ocrNationalIdNameAr" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "agreementUrl" TEXT,
    "signatureUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "vehicleLockedAt" TIMESTAMP(3),
    "vehicleLockExpires" TIMESTAMP(3),
    "confirmationEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "confirmationEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "notes" TEXT,

    CONSTRAINT "TestDrive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementTerms" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgreementTerms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDriveAuditLog" (
    "id" TEXT NOT NULL,
    "testDriveId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "performedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestDriveAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDriveFeedback" (
    "id" TEXT NOT NULL,
    "testDriveId" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "voiceUrl" TEXT,
    "voiceDuration" INTEGER,
    "recordedAt" TIMESTAMP(3),
    "transcript" TEXT,
    "detectedLanguage" TEXT,
    "overallSentiment" "Sentiment",
    "sentimentScore" DOUBLE PRECISION,
    "emotionTags" TEXT[],
    "keyPositives" TEXT[],
    "mainObjections" TEXT[],
    "buyingIntent" "BuyingIntent" NOT NULL DEFAULT 'UNDETERMINED',
    "buyingIntentScore" DOUBLE PRECISION,
    "recommendedAction" TEXT,
    "recommendedActionType" TEXT,
    "actionRationale" TEXT,
    "closeProbabilityBefore" INTEGER,
    "closeProbabilityAfter" INTEGER,
    "probabilityDelta" INTEGER,
    "aiAnalysisRaw" JSONB,
    "feedbackRequestSentAt" TIMESTAMP(3),
    "feedbackRequestChannel" TEXT,
    "feedbackLinkAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "TestDriveFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "code" TEXT NOT NULL,
    "discountRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleModel" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleVariant" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "msrp" DECIMAL(12,2) NOT NULL,
    "currentPrice" DECIMAL(12,2) NOT NULL,
    "dealerCost" DECIMAL(12,2),
    "engineType" TEXT,
    "transmission" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleColor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hexColor" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorCombination" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "exteriorColorId" TEXT NOT NULL,
    "interiorColorId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,

    CONSTRAINT "ColorCombination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInventory" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "exteriorColorId" TEXT NOT NULL,
    "interiorColorId" TEXT,
    "branchId" TEXT,
    "status" "StockStatus" NOT NULL DEFAULT 'IN_TRANSIT',
    "locationCode" TEXT,
    "stockDate" TIMESTAMP(3) NOT NULL,
    "etaDate" TIMESTAMP(3),
    "reservedUntil" TIMESTAMP(3),
    "orderId" TEXT,
    "reservedBy" TEXT,
    "agingDays" INTEGER NOT NULL DEFAULT 0,
    "agingRiskScore" INTEGER NOT NULL DEFAULT 0,
    "closeabilityScore" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "discountType" TEXT,
    "discountValue" DECIMAL(12,2),
    "totalRedemptions" INTEGER NOT NULL DEFAULT 0,
    "totalSalesValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignVariant" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "overrideDiscount" DECIMAL(12,2),

    CONSTRAINT "CampaignVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "paymentMethod" TEXT,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3),
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "DiscountStatus" NOT NULL DEFAULT 'DRAFT',
    "originalPrice" DECIMAL(12,2) NOT NULL,
    "campaignDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "requestedDiscount" DECIMAL(12,2) NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "justification" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bmApprovedBy" TEXT,
    "bmApprovedAt" TIMESTAMP(3),
    "bmComment" TEXT,
    "gmApprovedBy" TEXT,
    "gmApprovedAt" TIMESTAMP(3),
    "gmComment" TEXT,
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "quotationNumber" TEXT NOT NULL,
    "vehiclePrice" DECIMAL(12,2) NOT NULL,
    "campaignDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "additionalDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "accessories" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fees" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT,
    "dmsQuotationId" TEXT,
    "dmsSyncedAt" TIMESTAMP(3),
    "issuedBy" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMetrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "branchId" TEXT,
    "totalUnits" INTEGER NOT NULL,
    "inTransitUnits" INTEGER NOT NULL,
    "inYardUnits" INTEGER NOT NULL,
    "reservedUnits" INTEGER NOT NULL,
    "units0to30Days" INTEGER NOT NULL,
    "units31to60Days" INTEGER NOT NULL,
    "units61to90Days" INTEGER NOT NULL,
    "unitsOver90Days" INTEGER NOT NULL,
    "totalStockValue" DECIMAL(15,2) NOT NULL,
    "atRiskStockValue" DECIMAL(15,2) NOT NULL,
    "avgDaysToSale" DOUBLE PRECISION NOT NULL,
    "turnoverRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorDemandAnalysis" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "exteriorColorId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "testDriveCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "deliveryCount" INTEGER NOT NULL DEFAULT 0,
    "avgStockLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockouts" INTEGER NOT NULL DEFAULT 0,
    "demandScore" INTEGER NOT NULL DEFAULT 50,
    "supplyScore" INTEGER NOT NULL DEFAULT 50,
    "mismatchScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ColorDemandAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_make_model_idx" ON "Vehicle"("make", "model");

-- CreateIndex
CREATE INDEX "Vehicle_vin_idx" ON "Vehicle"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Order_vinNumber_key" ON "Order"("vinNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_vehicleId_idx" ON "Order"("vehicleId");

-- CreateIndex
CREATE INDEX "Order_salespersonId_idx" ON "Order"("salespersonId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_riskLevel_idx" ON "Order"("riskLevel");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_variantId_idx" ON "Order"("variantId");

-- CreateIndex
CREATE INDEX "Activity_orderId_idx" ON "Activity"("orderId");

-- CreateIndex
CREATE INDEX "Activity_performedById_idx" ON "Activity"("performedById");

-- CreateIndex
CREATE INDEX "Activity_performedAt_idx" ON "Activity"("performedAt");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "PriorityItem_orderId_idx" ON "PriorityItem"("orderId");

-- CreateIndex
CREATE INDEX "PriorityItem_generatedAt_idx" ON "PriorityItem"("generatedAt");

-- CreateIndex
CREATE INDEX "PriorityItem_riskLevel_idx" ON "PriorityItem"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "Branch_code_idx" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "TradeInAppraisal_customerId_idx" ON "TradeInAppraisal"("customerId");

-- CreateIndex
CREATE INDEX "TradeInAppraisal_salesExecutiveId_idx" ON "TradeInAppraisal"("salesExecutiveId");

-- CreateIndex
CREATE INDEX "TradeInAppraisal_inspectorId_idx" ON "TradeInAppraisal"("inspectorId");

-- CreateIndex
CREATE INDEX "TradeInAppraisal_status_idx" ON "TradeInAppraisal"("status");

-- CreateIndex
CREATE INDEX "TradeInAppraisal_createdAt_idx" ON "TradeInAppraisal"("createdAt");

-- CreateIndex
CREATE INDEX "TradeInPhoto_appraisalId_idx" ON "TradeInPhoto"("appraisalId");

-- CreateIndex
CREATE INDEX "TradeInPhoto_type_idx" ON "TradeInPhoto"("type");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "TestDrive_customerId_idx" ON "TestDrive"("customerId");

-- CreateIndex
CREATE INDEX "TestDrive_salesExecutiveId_idx" ON "TestDrive"("salesExecutiveId");

-- CreateIndex
CREATE INDEX "TestDrive_vehicleId_idx" ON "TestDrive"("vehicleId");

-- CreateIndex
CREATE INDEX "TestDrive_status_idx" ON "TestDrive"("status");

-- CreateIndex
CREATE INDEX "TestDrive_scheduledDate_idx" ON "TestDrive"("scheduledDate");

-- CreateIndex
CREATE INDEX "TestDrive_vehicleLockedAt_idx" ON "TestDrive"("vehicleLockedAt");

-- CreateIndex
CREATE INDEX "TestDrive_createdAt_idx" ON "TestDrive"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementTerms_version_key" ON "AgreementTerms"("version");

-- CreateIndex
CREATE INDEX "AgreementTerms_isActive_idx" ON "AgreementTerms"("isActive");

-- CreateIndex
CREATE INDEX "AgreementTerms_effectiveAt_idx" ON "AgreementTerms"("effectiveAt");

-- CreateIndex
CREATE INDEX "TestDriveAuditLog_testDriveId_idx" ON "TestDriveAuditLog"("testDriveId");

-- CreateIndex
CREATE INDEX "TestDriveAuditLog_action_idx" ON "TestDriveAuditLog"("action");

-- CreateIndex
CREATE INDEX "TestDriveAuditLog_timestamp_idx" ON "TestDriveAuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "TestDriveFeedback_testDriveId_key" ON "TestDriveFeedback"("testDriveId");

-- CreateIndex
CREATE INDEX "TestDriveFeedback_testDriveId_idx" ON "TestDriveFeedback"("testDriveId");

-- CreateIndex
CREATE INDEX "TestDriveFeedback_status_idx" ON "TestDriveFeedback"("status");

-- CreateIndex
CREATE INDEX "TestDriveFeedback_buyingIntent_idx" ON "TestDriveFeedback"("buyingIntent");

-- CreateIndex
CREATE INDEX "TestDriveFeedback_createdAt_idx" ON "TestDriveFeedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_code_key" ON "Brand"("code");

-- CreateIndex
CREATE INDEX "Brand_code_idx" ON "Brand"("code");

-- CreateIndex
CREATE INDEX "VehicleModel_brandId_idx" ON "VehicleModel"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_brandId_code_key" ON "VehicleModel"("brandId", "code");

-- CreateIndex
CREATE INDEX "VehicleVariant_modelId_idx" ON "VehicleVariant"("modelId");

-- CreateIndex
CREATE INDEX "VehicleVariant_year_idx" ON "VehicleVariant"("year");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleVariant_modelId_code_year_key" ON "VehicleVariant"("modelId", "code", "year");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleColor_code_key" ON "VehicleColor"("code");

-- CreateIndex
CREATE INDEX "ColorCombination_variantId_idx" ON "ColorCombination"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ColorCombination_variantId_exteriorColorId_interiorColorId_key" ON "ColorCombination"("variantId", "exteriorColorId", "interiorColorId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleInventory_vin_key" ON "VehicleInventory"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleInventory_orderId_key" ON "VehicleInventory"("orderId");

-- CreateIndex
CREATE INDEX "VehicleInventory_variantId_idx" ON "VehicleInventory"("variantId");

-- CreateIndex
CREATE INDEX "VehicleInventory_status_idx" ON "VehicleInventory"("status");

-- CreateIndex
CREATE INDEX "VehicleInventory_stockDate_idx" ON "VehicleInventory"("stockDate");

-- CreateIndex
CREATE INDEX "VehicleInventory_branchId_idx" ON "VehicleInventory"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_code_key" ON "Campaign"("code");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_startDate_idx" ON "Campaign"("startDate");

-- CreateIndex
CREATE INDEX "Campaign_endDate_idx" ON "Campaign"("endDate");

-- CreateIndex
CREATE INDEX "CampaignVariant_campaignId_idx" ON "CampaignVariant"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignVariant_variantId_idx" ON "CampaignVariant"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignVariant_campaignId_variantId_key" ON "CampaignVariant"("campaignId", "variantId");

-- CreateIndex
CREATE INDEX "PaymentRequest_orderId_idx" ON "PaymentRequest"("orderId");

-- CreateIndex
CREATE INDEX "PaymentRequest_status_idx" ON "PaymentRequest"("status");

-- CreateIndex
CREATE INDEX "DiscountRequest_orderId_idx" ON "DiscountRequest"("orderId");

-- CreateIndex
CREATE INDEX "DiscountRequest_status_idx" ON "DiscountRequest"("status");

-- CreateIndex
CREATE INDEX "DiscountRequest_requestedAt_idx" ON "DiscountRequest"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_orderId_idx" ON "Quotation"("orderId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_quotationNumber_idx" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "StockMetrics_date_idx" ON "StockMetrics"("date");

-- CreateIndex
CREATE INDEX "StockMetrics_branchId_idx" ON "StockMetrics"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "StockMetrics_date_branchId_key" ON "StockMetrics"("date", "branchId");

-- CreateIndex
CREATE INDEX "ColorDemandAnalysis_variantId_idx" ON "ColorDemandAnalysis"("variantId");

-- CreateIndex
CREATE INDEX "ColorDemandAnalysis_exteriorColorId_idx" ON "ColorDemandAnalysis"("exteriorColorId");

-- CreateIndex
CREATE UNIQUE INDEX "ColorDemandAnalysis_variantId_exteriorColorId_month_key" ON "ColorDemandAnalysis"("variantId", "exteriorColorId", "month");

-- CreateIndex
CREATE INDEX "Document_orderId_idx" ON "Document"("orderId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityItem" ADD CONSTRAINT "PriorityItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInAppraisal" ADD CONSTRAINT "TradeInAppraisal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInAppraisal" ADD CONSTRAINT "TradeInAppraisal_salesExecutiveId_fkey" FOREIGN KEY ("salesExecutiveId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInAppraisal" ADD CONSTRAINT "TradeInAppraisal_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInPhoto" ADD CONSTRAINT "TradeInPhoto_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "TradeInAppraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_salesExecutiveId_fkey" FOREIGN KEY ("salesExecutiveId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDriveAuditLog" ADD CONSTRAINT "TestDriveAuditLog_testDriveId_fkey" FOREIGN KEY ("testDriveId") REFERENCES "TestDrive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDriveFeedback" ADD CONSTRAINT "TestDriveFeedback_testDriveId_fkey" FOREIGN KEY ("testDriveId") REFERENCES "TestDrive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleVariant" ADD CONSTRAINT "VehicleVariant_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColorCombination" ADD CONSTRAINT "ColorCombination_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "VehicleVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColorCombination" ADD CONSTRAINT "ColorCombination_exteriorColorId_fkey" FOREIGN KEY ("exteriorColorId") REFERENCES "VehicleColor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColorCombination" ADD CONSTRAINT "ColorCombination_interiorColorId_fkey" FOREIGN KEY ("interiorColorId") REFERENCES "VehicleColor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInventory" ADD CONSTRAINT "VehicleInventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "VehicleVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInventory" ADD CONSTRAINT "VehicleInventory_exteriorColorId_fkey" FOREIGN KEY ("exteriorColorId") REFERENCES "VehicleColor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInventory" ADD CONSTRAINT "VehicleInventory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignVariant" ADD CONSTRAINT "CampaignVariant_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignVariant" ADD CONSTRAINT "CampaignVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "VehicleVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRequest" ADD CONSTRAINT "DiscountRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
