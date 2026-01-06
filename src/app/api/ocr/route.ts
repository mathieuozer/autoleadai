import { NextRequest, NextResponse } from 'next/server';

const AZURE_VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT || 'https://northeurope.api.cognitive.microsoft.com';
const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY || '';

interface OCRResult {
  // Owner Details
  customerName?: string;
  trafficFileNumber?: string;  // T.C. No.

  // Plate Information
  plateNumber?: string;
  emirateCode?: string;

  // Vehicle Identification
  vin?: string;
  engineNumber?: string;

  // Vehicle Details
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleTrim?: string;
  vehicleColor?: string;
  vehicleType?: string;
  registrationYear?: number;

  // Dates
  registrationDate?: string;
  expiryDate?: string;

  // Insurance
  insuranceCompany?: string;
  insuranceExpiry?: string;

  // Mortgage
  mortgageInfo?: string;

  // Debug
  rawText?: string;
}

// Common UAE vehicle makes for matching
const VEHICLE_MAKES = [
  'TOYOTA', 'NISSAN', 'HONDA', 'HYUNDAI', 'KIA', 'FORD', 'CHEVROLET',
  'BMW', 'MERCEDES', 'MERCEDES-BENZ', 'AUDI', 'LEXUS', 'INFINITI',
  'PORSCHE', 'LAND ROVER', 'RANGE ROVER', 'JEEP', 'GMC', 'CADILLAC',
  'MITSUBISHI', 'MAZDA', 'VOLKSWAGEN', 'VOLVO', 'JAGUAR', 'BENTLEY',
  'ROLLS ROYCE', 'FERRARI', 'LAMBORGHINI', 'MASERATI', 'DODGE', 'RAM',
  'SUZUKI', 'SUBARU', 'PEUGEOT', 'RENAULT', 'CITROEN', 'FIAT', 'ALFA ROMEO',
  'GENESIS', 'TESLA', 'HAVAL', 'CHANGAN', 'GEELY', 'MG', 'CHERY', 'JAC',
  'GREAT WALL', 'BYD', 'GAC', 'DONGFENG', 'FOTON', 'ISUZU', 'HINO',
  'LINCOLN', 'CHRYSLER', 'BUICK', 'ACURA', 'MINI', 'SMART', 'SEAT', 'SKODA',
];

// Common models for better extraction
const COMMON_MODELS: Record<string, string[]> = {
  TOYOTA: ['CAMRY', 'COROLLA', 'RAV4', 'LAND CRUISER', 'PRADO', 'HIGHLANDER', 'FORTUNER', 'HILUX', 'YARIS', 'AVALON', 'SUPRA', 'SEQUOIA', '4RUNNER', 'GRANVIA', 'HIACE', 'CROWN', 'RUSH'],
  NISSAN: ['ALTIMA', 'PATROL', 'PATHFINDER', 'MAXIMA', 'SENTRA', 'KICKS', 'XTRAIL', 'X-TRAIL', 'MURANO', 'ARMADA', 'TITAN', 'SUNNY', 'JUKE', 'NAVARA', 'URVAN'],
  HONDA: ['ACCORD', 'CIVIC', 'CRV', 'CR-V', 'PILOT', 'HRV', 'HR-V', 'ODYSSEY', 'CITY'],
  HYUNDAI: ['SONATA', 'ELANTRA', 'TUCSON', 'SANTA FE', 'PALISADE', 'KONA', 'VENUE', 'ACCENT', 'AZERA', 'GENESIS', 'CRETA', 'STARIA'],
  KIA: ['OPTIMA', 'K5', 'SPORTAGE', 'SORENTO', 'TELLURIDE', 'CARNIVAL', 'SELTOS', 'SOUL', 'STINGER', 'CERATO', 'PICANTO', 'RIO'],
  BMW: ['3 SERIES', '5 SERIES', '7 SERIES', 'X1', 'X3', 'X5', 'X7', 'M3', 'M5', 'I8', 'IX', 'X6', 'X4', '1 SERIES', '2 SERIES', '4 SERIES', '8 SERIES'],
  MERCEDES: ['C CLASS', 'E CLASS', 'S CLASS', 'GLA', 'GLC', 'GLE', 'GLS', 'AMG', 'A CLASS', 'CLA', 'G CLASS', 'GLB', 'MAYBACH', 'V CLASS'],
  LEXUS: ['ES', 'IS', 'LS', 'RX', 'NX', 'GX', 'LX', 'UX', 'LC', 'RC'],
  FORD: ['MUSTANG', 'F150', 'F-150', 'EXPLORER', 'EXPEDITION', 'EDGE', 'ESCAPE', 'BRONCO', 'RANGER', 'EVEREST', 'TERRITORY'],
  'LAND ROVER': ['DEFENDER', 'DISCOVERY', 'RANGE ROVER', 'RANGE ROVER SPORT', 'VELAR', 'EVOQUE'],
  'RANGE ROVER': ['SPORT', 'VELAR', 'EVOQUE', 'AUTOBIOGRAPHY'],
};

// UAE Emirates and their codes
const EMIRATE_CODES: Record<string, string> = {
  'A': 'Dubai', 'B': 'Dubai', 'C': 'Dubai', 'D': 'Dubai', 'E': 'Dubai',
  'F': 'Dubai', 'G': 'Dubai', 'H': 'Dubai', 'I': 'Dubai', 'J': 'Dubai',
  'K': 'Dubai', 'L': 'Dubai', 'M': 'Dubai', 'N': 'Dubai', 'O': 'Dubai',
  'P': 'Dubai', 'Q': 'Dubai', 'R': 'Dubai', 'S': 'Dubai', 'T': 'Dubai',
  'U': 'Dubai', 'V': 'Dubai', 'W': 'Dubai', 'X': 'Dubai', 'Y': 'Dubai', 'Z': 'Dubai',
  'AA': 'Dubai', 'AB': 'Dubai',
  '1': 'Abu Dhabi', '2': 'Abu Dhabi', '3': 'Abu Dhabi', '4': 'Abu Dhabi',
  '5': 'Abu Dhabi', '6': 'Abu Dhabi', '7': 'Abu Dhabi', '8': 'Abu Dhabi',
  '9': 'Abu Dhabi', '10': 'Abu Dhabi', '11': 'Abu Dhabi', '12': 'Abu Dhabi',
  '13': 'Abu Dhabi', '14': 'Abu Dhabi', '15': 'Abu Dhabi', '16': 'Abu Dhabi', '17': 'Abu Dhabi',
  'RAK': 'Ras Al Khaimah',
  'UAQ': 'Umm Al Quwain',
  'FUJ': 'Fujairah',
  'AJM': 'Ajman',
  'SHJ': 'Sharjah',
};

// Common vehicle colors
const VEHICLE_COLORS = [
  'WHITE', 'BLACK', 'SILVER', 'GREY', 'GRAY', 'RED', 'BLUE', 'GREEN',
  'BROWN', 'BEIGE', 'GOLD', 'ORANGE', 'YELLOW', 'MAROON', 'BURGUNDY',
  'PEARL', 'PEARL WHITE', 'METALLIC', 'CHAMPAGNE', 'BRONZE', 'NAVY',
  'DARK BLUE', 'DARK GREY', 'DARK GRAY', 'LIGHT BLUE', 'LIGHT GREY',
];

// Vehicle types in UAE
const VEHICLE_TYPES = [
  'LIGHT PRIVATE VEHICLE', 'PRIVATE VEHICLE', 'LIGHT VEHICLE',
  'PUBLIC TRANSPORT', 'TAXI', 'BUS', 'MOTORCYCLE', 'MOTORBIKE',
  'HEAVY VEHICLE', 'TRUCK', 'TRAILER', 'COMMERCIAL', 'PICK UP', 'PICKUP',
  'SUV', 'SEDAN', 'COUPE', 'HATCHBACK', 'CONVERTIBLE', 'VAN', 'MINIVAN',
];

// Insurance companies in UAE
const INSURANCE_COMPANIES = [
  'ORIENT', 'AXA', 'RSA', 'OMAN INSURANCE', 'DUBAI INSURANCE', 'SALAMA',
  'TAKAFUL', 'NATIONAL GENERAL', 'UNION INSURANCE', 'AL WATHBA', 'WATANIA',
  'DAMAN', 'AL AIN AHLIA', 'ABU DHABI NATIONAL', 'ADNIC', 'EMIRATES INSURANCE',
  'TOKIO MARINE', 'ZURICH', 'ALLIANZ', 'QIC', 'NOOR TAKAFUL', 'AL SAGR',
];

function extractDataFromText(text: string): OCRResult {
  const result: OCRResult = { rawText: text };
  const upperText = text.toUpperCase();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const upperLines = lines.map(l => l.toUpperCase());

  // =====================================
  // TRAFFIC FILE NUMBER (T.C. No.)
  // =====================================
  const tcPatterns = [
    /(?:T\.?C\.?\s*(?:NO\.?|NUMBER)?|TRAFFIC\s*(?:FILE|CODE)\s*(?:NO\.?|NUMBER)?)\s*:?\s*(\d{6,12})/i,
    /(?:رقم\s*المرور|ملف\s*مرور)\s*:?\s*(\d{6,12})/,
  ];
  for (const pattern of tcPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.trafficFileNumber = match[1];
      break;
    }
  }

  // =====================================
  // PLATE NUMBER & EMIRATE CODE
  // =====================================
  const platePatterns = [
    // Dubai format: Letter(s) followed by numbers (e.g., A 12345, AA 12345)
    /(?:PLATE\s*(?:NO\.?|NUMBER)?|REG(?:ISTRATION)?\s*(?:NO\.?|NUMBER)?)\s*:?\s*([A-Z]{1,2})\s*[-\/\s]*(\d{1,5})/i,
    /\b([A-Z]{1,2})\s*[-\/]?\s*(\d{1,5})\s*(?:DUBAI|DXB)/i,
    // Abu Dhabi format: Numbers followed by category (e.g., 12345 / 1)
    /\b(\d{1,5})\s*[-\/]\s*(\d{1,2})\s*(?:ABU\s*DHABI|AD)/i,
    // Generic UAE plate
    /(?:PLATE|لوحة)\s*:?\s*([A-Z0-9]{1,2})\s*[-\/\s]*(\d{1,5})/i,
  ];

  for (const pattern of platePatterns) {
    const match = text.match(pattern);
    if (match) {
      const code = match[1].toUpperCase();
      const number = match[2];
      result.emirateCode = code;
      result.plateNumber = `${code} ${number}`;
      break;
    }
  }

  // Fallback plate extraction
  if (!result.plateNumber) {
    const simplePlate = upperText.match(/\b([A-Z]{1,2})\s*[-\/]?\s*(\d{3,5})\b/);
    if (simplePlate) {
      result.plateNumber = `${simplePlate[1]} ${simplePlate[2]}`;
      result.emirateCode = simplePlate[1];
    }
  }

  // =====================================
  // VIN / CHASSIS NUMBER (17 characters)
  // =====================================
  const vinPatterns = [
    /(?:VIN|CHASSIS\s*(?:NO\.?|NUMBER)?|هيكل)\s*:?\s*([A-HJ-NPR-Z0-9]{17})/i,
    /\b([A-HJ-NPR-Z0-9]{17})\b/g,
  ];

  for (const pattern of vinPatterns) {
    const matches = upperText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleanVin = match.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
        if (cleanVin.length === 17) {
          result.vin = cleanVin;
          break;
        }
      }
      if (result.vin) break;
    }
  }

  // =====================================
  // ENGINE NUMBER
  // =====================================
  const enginePatterns = [
    /(?:ENGINE\s*(?:NO\.?|NUMBER)?|محرك)\s*:?\s*([A-Z0-9]{6,20})/i,
    /\bENG(?:INE)?\s*:?\s*([A-Z0-9]{6,20})/i,
  ];
  for (const pattern of enginePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.engineNumber = match[1].toUpperCase();
      break;
    }
  }

  // =====================================
  // VEHICLE MAKE & MODEL
  // =====================================
  for (const make of VEHICLE_MAKES) {
    if (upperText.includes(make)) {
      result.vehicleMake = make;

      // Try to find model for this make
      const makeKey = make.includes(' ') ? make : make;
      const models = COMMON_MODELS[makeKey] || COMMON_MODELS[make.split(' ')[0]] || [];
      for (const model of models) {
        if (upperText.includes(model)) {
          result.vehicleModel = model;
          break;
        }
      }
      break;
    }
  }

  // Also look for make/model patterns
  const makeModelPatterns = [
    /(?:MAKE|الشركة|ماركة)\s*:?\s*([A-Z\s]{2,20})/i,
    /(?:MODEL|الطراز|موديل)\s*:?\s*([A-Z0-9\s]{2,30})/i,
  ];
  if (!result.vehicleMake) {
    const makeMatch = text.match(makeModelPatterns[0]);
    if (makeMatch) {
      const possibleMake = makeMatch[1].trim().toUpperCase();
      if (VEHICLE_MAKES.some(m => possibleMake.includes(m))) {
        result.vehicleMake = VEHICLE_MAKES.find(m => possibleMake.includes(m));
      }
    }
  }

  // =====================================
  // VEHICLE COLOR
  // =====================================
  const colorPatterns = [
    /(?:COLO[U]?R|اللون)\s*:?\s*([A-Z\s]{3,20})/i,
    /\b(PEARL\s*WHITE|METALLIC\s*[A-Z]+|DARK\s*[A-Z]+|LIGHT\s*[A-Z]+)\b/i,
  ];
  for (const pattern of colorPatterns) {
    const match = text.match(pattern);
    if (match) {
      const color = match[1].trim().toUpperCase();
      if (VEHICLE_COLORS.some(c => color.includes(c) || c.includes(color))) {
        result.vehicleColor = color;
        break;
      }
    }
  }
  // Fallback: check for standalone colors
  if (!result.vehicleColor) {
    for (const color of VEHICLE_COLORS) {
      if (upperText.includes(color)) {
        result.vehicleColor = color;
        break;
      }
    }
  }

  // =====================================
  // VEHICLE TYPE
  // =====================================
  const typePatterns = [
    /(?:TYPE|VEHICLE\s*TYPE|النوع)\s*:?\s*([A-Z\s]{5,30})/i,
    /(?:CATEGORY|CLASS|فئة)\s*:?\s*([A-Z\s]{5,30})/i,
  ];
  for (const pattern of typePatterns) {
    const match = text.match(pattern);
    if (match) {
      const type = match[1].trim().toUpperCase();
      for (const vType of VEHICLE_TYPES) {
        if (type.includes(vType) || vType.includes(type)) {
          result.vehicleType = vType;
          break;
        }
      }
      if (result.vehicleType) break;
    }
  }
  // Fallback
  if (!result.vehicleType) {
    for (const vType of VEHICLE_TYPES) {
      if (upperText.includes(vType)) {
        result.vehicleType = vType;
        break;
      }
    }
  }

  // =====================================
  // REGISTRATION YEAR
  // =====================================
  const yearPatterns = [
    /(?:MODEL\s*YEAR|YEAR\s*(?:OF\s*)?(?:MFG|MANUFACTURE|MANUF)?|M\.?Y\.?|سنة\s*الصنع)\s*:?\s*((?:19|20)\d{2})/i,
    /\b((?:20[0-2]\d|199\d))\b/g,
  ];
  for (const pattern of yearPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const yearStr = match.replace(/\D/g, '');
        const year = parseInt(yearStr);
        if (year >= 1990 && year <= 2030) {
          result.registrationYear = year;
          break;
        }
      }
      if (result.registrationYear) break;
    }
  }

  // =====================================
  // REGISTRATION DATE
  // =====================================
  const regDatePatterns = [
    /(?:REG(?:ISTRATION)?\s*DATE|DATE\s*(?:OF\s*)?REG(?:ISTRATION)?|تاريخ\s*التسجيل)\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(?:FIRST\s*REG(?:ISTRATION)?|INITIAL\s*REG)\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
  ];
  for (const pattern of regDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.registrationDate = match[1];
      break;
    }
  }

  // =====================================
  // EXPIRY DATE
  // =====================================
  const expiryPatterns = [
    /(?:EXPIRY|VALID\s*(?:UNTIL|TO|TILL)|EXP(?:IRATION)?|انتهاء\s*الصلاحية)\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(?:EXPIRES?|تاريخ\s*الانتهاء)\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
  ];
  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.expiryDate = match[1];
      break;
    }
  }

  // =====================================
  // OWNER NAME
  // =====================================
  const namePatterns = [
    /(?:OWNER|NAME|REGISTERED\s*(?:TO|OWNER)|المالك|اسم)\s*:?\s*([A-Z][A-Z\s]{2,40})/i,
    /(?:MR\.?|MRS\.?|MS\.?|MISS)\s+([A-Z][A-Z\s]{2,40})/i,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate it looks like a name
      if (name.length > 3 && !VEHICLE_MAKES.includes(name.toUpperCase()) && !VEHICLE_COLORS.includes(name.toUpperCase())) {
        result.customerName = name.split(/\s+/).map(
          word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        break;
      }
    }
  }

  // =====================================
  // INSURANCE INFORMATION
  // =====================================
  for (const company of INSURANCE_COMPANIES) {
    if (upperText.includes(company)) {
      result.insuranceCompany = company;
      break;
    }
  }

  const insuranceExpiryPattern = /(?:INSURANCE\s*(?:EXPIRY|VALID)|تأمين)\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
  const insuranceMatch = text.match(insuranceExpiryPattern);
  if (insuranceMatch) {
    result.insuranceExpiry = insuranceMatch[1];
  }

  // =====================================
  // MORTGAGE INFORMATION
  // =====================================
  const mortgagePatterns = [
    /(?:MORTGAGE|LIEN|BANK|رهن)\s*:?\s*([A-Z\s]{3,50})/i,
    /(?:FINANCED\s*BY|LOAN)\s*:?\s*([A-Z\s]{3,50})/i,
  ];
  for (const pattern of mortgagePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.mortgageInfo = match[1].trim();
      break;
    }
  }

  // Check for common bank names indicating mortgage
  const banks = ['EMIRATES NBD', 'FAB', 'ADCB', 'DIB', 'MASHREQ', 'RAKBANK', 'CBD', 'ADIB', 'AL HILAL'];
  for (const bank of banks) {
    if (upperText.includes(bank)) {
      if (!result.mortgageInfo) {
        result.mortgageInfo = bank;
      }
      break;
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageBase64 } = await request.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: 'Image URL or base64 data is required' },
        { status: 400 }
      );
    }

    if (!AZURE_VISION_KEY) {
      return NextResponse.json(
        { error: 'OCR service not configured' },
        { status: 500 }
      );
    }

    // Call Azure Computer Vision Read API
    const analyzeUrl = `${AZURE_VISION_ENDPOINT}/vision/v3.2/read/analyze`;

    let analyzeResponse;

    if (imageBase64) {
      // Handle base64 image (data URL format: data:image/jpeg;base64,...)
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      analyzeResponse = await fetch(analyzeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
        },
        body: imageBuffer,
      });
    } else {
      // Handle image URL
      analyzeResponse = await fetch(analyzeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
        },
        body: JSON.stringify({ url: imageUrl }),
      });
    }

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error('Azure Vision analyze error:', errorText);
      return NextResponse.json(
        { error: 'Failed to analyze image', details: errorText },
        { status: analyzeResponse.status }
      );
    }

    // Get the operation location to poll for results
    const operationLocation = analyzeResponse.headers.get('Operation-Location');

    if (!operationLocation) {
      return NextResponse.json(
        { error: 'No operation location returned' },
        { status: 500 }
      );
    }

    // Poll for results (max 30 seconds)
    let result = null;
    const maxAttempts = 30;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const resultResponse = await fetch(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
        },
      });

      if (!resultResponse.ok) {
        continue;
      }

      const resultData = await resultResponse.json();

      if (resultData.status === 'succeeded') {
        result = resultData;
        break;
      } else if (resultData.status === 'failed') {
        return NextResponse.json(
          { error: 'OCR processing failed' },
          { status: 500 }
        );
      }
      // If status is 'running' or 'notStarted', continue polling
    }

    if (!result) {
      return NextResponse.json(
        { error: 'OCR processing timeout' },
        { status: 504 }
      );
    }

    // Extract text from result
    const readResults = result.analyzeResult?.readResults || [];
    let fullText = '';

    for (const page of readResults) {
      for (const line of page.lines || []) {
        fullText += line.text + '\n';
      }
    }

    // Parse the extracted text to find relevant fields
    const extractedData = extractDataFromText(fullText);

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
