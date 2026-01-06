import { NextRequest, NextResponse } from 'next/server';

const AZURE_VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT || 'https://northeurope.api.cognitive.microsoft.com';
const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY || '';

interface OCRResult {
  // Owner Details
  customerName?: string;
  trafficFileNumber?: string;

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

// Common UAE vehicle makes
const VEHICLE_MAKES = [
  'TOYOTA', 'NISSAN', 'HONDA', 'HYUNDAI', 'KIA', 'FORD', 'CHEVROLET',
  'BMW', 'MERCEDES', 'MERCEDES-BENZ', 'AUDI', 'LEXUS', 'INFINITI',
  'PORSCHE', 'LAND ROVER', 'RANGE ROVER', 'JEEP', 'GMC', 'CADILLAC',
  'MITSUBISHI', 'MAZDA', 'VOLKSWAGEN', 'VOLVO', 'JAGUAR', 'BENTLEY',
  'ROLLS ROYCE', 'FERRARI', 'LAMBORGHINI', 'MASERATI', 'DODGE', 'RAM',
  'SUZUKI', 'SUBARU', 'PEUGEOT', 'RENAULT', 'CITROEN', 'FIAT',
  'GENESIS', 'TESLA', 'HAVAL', 'CHANGAN', 'GEELY', 'MG', 'CHERY',
  'GREAT WALL', 'BYD', 'GAC', 'ISUZU', 'HINO', 'LINCOLN', 'CHRYSLER',
  'BUICK', 'ACURA', 'MINI', 'SKODA',
];

// Common vehicle colors
const VEHICLE_COLORS = [
  'WHITE', 'BLACK', 'SILVER', 'GREY', 'GRAY', 'RED', 'BLUE', 'GREEN',
  'BROWN', 'BEIGE', 'GOLD', 'ORANGE', 'YELLOW', 'MAROON', 'BURGUNDY',
  'PEARL WHITE', 'PEARL', 'CHAMPAGNE', 'BRONZE', 'NAVY',
];

function extractDataFromText(text: string): OCRResult {
  const result: OCRResult = { rawText: text };
  const upperText = text.toUpperCase();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  console.log('=== OCR RAW TEXT ===');
  console.log(text);
  console.log('=== END RAW TEXT ===');

  // =====================================
  // 1. CHASSIS NO. → VIN (رقم الهيكل)
  // =====================================
  // Look for "Chassis No" or Arabic equivalent
  const chassisPatterns = [
    /CHASSIS\s*(?:NO\.?|NUMBER)?[:\s]+([A-Z0-9]{17})/i,
    /CHASSIS\s*(?:NO\.?|NUMBER)?[:\s]+([A-Z0-9\s]{15,20})/i,
    /رقم\s*الهيكل[:\s]+([A-Z0-9]{17})/i,
    /رقم\s*الهيكل[:\s]+([A-Z0-9\s]{15,20})/i,
  ];

  for (const pattern of chassisPatterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/\s/g, '').toUpperCase();
      if (cleaned.length === 17) {
        result.vin = cleaned;
        break;
      }
    }
  }

  // Fallback: find any 17-character alphanumeric sequence that looks like a VIN
  if (!result.vin) {
    const vinMatch = upperText.replace(/\s/g, '').match(/[A-HJ-NPR-Z0-9]{17}/);
    if (vinMatch) {
      result.vin = vinMatch[0];
    }
  }

  // =====================================
  // 2. TRAFFIC PLATE NO. (take as-is)
  // =====================================
  const platePatterns = [
    /TRAFFIC\s*PLATE\s*(?:NO\.?)?[:\s]+([A-Z0-9\s\-\/]+)/i,
    /PLATE\s*(?:NO\.?|NUMBER)?[:\s]+([A-Z]{1,2}\s*[-\/]?\s*\d{1,5})/i,
    /لوحة[:\s]+([A-Z0-9\s\-\/]+)/i,
  ];

  for (const pattern of platePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.plateNumber = match[1].trim();
      // Extract emirate code (first letter(s))
      const codeMatch = result.plateNumber.match(/^([A-Z]{1,2})/i);
      if (codeMatch) {
        result.emirateCode = codeMatch[1].toUpperCase();
      }
      break;
    }
  }

  // =====================================
  // 3. VEH. TYPE → Make + Model + Trim
  // =====================================
  const vehTypePatterns = [
    /VEH\.?\s*TYPE[:\s]+(.+?)(?:\n|$)/i,
    /VEHICLE\s*TYPE[:\s]+(.+?)(?:\n|$)/i,
    /نوع\s*المركبة[:\s]+(.+?)(?:\n|$)/i,
  ];

  for (const pattern of vehTypePatterns) {
    const match = text.match(pattern);
    if (match) {
      const vehType = match[1].trim().toUpperCase();
      console.log('Found Veh. Type:', vehType);

      // Sort makes by length (longest first) to match "LAND ROVER" before "ROVER"
      const sortedMakes = [...VEHICLE_MAKES].sort((a, b) => b.length - a.length);

      for (const make of sortedMakes) {
        if (vehType.startsWith(make) || vehType.includes(make)) {
          result.vehicleMake = make;
          // Everything after make is model + trim
          let remainder = vehType.replace(make, '').trim();
          remainder = remainder.replace(/^[\-\/\s]+/, '').trim();

          if (remainder.length > 0) {
            // Split remainder into model and trim
            const parts = remainder.split(/\s+/);
            if (parts.length >= 2) {
              // First part(s) = model, last part = trim (if it looks like a trim)
              const trimIndicators = ['GXR', 'VXR', 'VXS', 'GX', 'VX', 'SE', 'LE', 'XLE', 'LIMITED', 'PLATINUM', 'SPORT', 'TOURING', 'PREMIUM', 'LUXURY', 'GLS', 'GL', 'LX', 'EX', 'SV', 'SL', 'SR', 'XL', 'XLT', 'SAHARA', 'RUBICON', '4X4', '4WD', 'AWD'];
              const lastPart = parts[parts.length - 1];

              if (trimIndicators.includes(lastPart)) {
                result.vehicleTrim = lastPart;
                result.vehicleModel = parts.slice(0, -1).join(' ');
              } else {
                result.vehicleModel = remainder;
              }
            } else {
              result.vehicleModel = remainder;
            }
          }
          break;
        }
      }
      if (result.vehicleMake) break;
    }
  }

  // =====================================
  // 4. DEDICATED MAKE FIELD (الصنع)
  // =====================================
  if (!result.vehicleMake) {
    const makePatterns = [
      /MAKE[:\s]+([A-Z\s\-]+?)(?:\n|$)/i,
      /الصنع[:\s]+([A-Z\s\-]+?)(?:\n|$)/i,
    ];

    for (const pattern of makePatterns) {
      const match = text.match(pattern);
      if (match) {
        const possibleMake = match[1].trim().toUpperCase();
        for (const make of VEHICLE_MAKES) {
          if (possibleMake.includes(make) || make.includes(possibleMake)) {
            result.vehicleMake = make;
            break;
          }
        }
        if (result.vehicleMake) break;
      }
    }
  }

  // =====================================
  // 5. DEDICATED MODEL FIELD (الطراز)
  // =====================================
  if (!result.vehicleModel) {
    const modelPatterns = [
      /(?<!VEH\.\s)MODEL[:\s]+([A-Z0-9\s\-]+?)(?:\n|$)/i,
      /الطراز[:\s]+([A-Z0-9\s\-]+?)(?:\n|$)/i,
    ];

    for (const pattern of modelPatterns) {
      const match = text.match(pattern);
      if (match) {
        const modelValue = match[1].trim();
        // Check if it's a year (Model field sometimes contains year in UAE)
        if (/^(19|20)\d{2}$/.test(modelValue)) {
          result.registrationYear = parseInt(modelValue);
        } else {
          result.vehicleModel = modelValue.toUpperCase();
        }
        break;
      }
    }
  }

  // =====================================
  // 6. REGISTRATION YEAR (MODEL YEAR)
  // =====================================
  if (!result.registrationYear) {
    const yearPatterns = [
      /MODEL\s*YEAR[:\s]+((?:19|20)\d{2})/i,
      /YEAR[:\s]+((?:19|20)\d{2})/i,
      /سنة\s*الصنع[:\s]+((?:19|20)\d{2})/i,
      /موديل[:\s]+((?:19|20)\d{2})/i,
    ];

    for (const pattern of yearPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.registrationYear = parseInt(match[1]);
        break;
      }
    }
  }

  // =====================================
  // 7. COLOR
  // =====================================
  const colorPatterns = [
    /COLOU?R[:\s]+([A-Z\s]+?)(?:\n|$)/i,
    /اللون[:\s]+([A-Z\s]+?)(?:\n|$)/i,
  ];

  for (const pattern of colorPatterns) {
    const match = text.match(pattern);
    if (match) {
      const colorValue = match[1].trim().toUpperCase();
      for (const color of VEHICLE_COLORS) {
        if (colorValue.includes(color)) {
          result.vehicleColor = color;
          break;
        }
      }
      if (result.vehicleColor) break;
    }
  }

  // =====================================
  // 8. OWNER NAME
  // =====================================
  const namePatterns = [
    /OWNER[:\s]+([A-Z][A-Z\s]{2,40})/i,
    /NAME[:\s]+([A-Z][A-Z\s]{2,40})/i,
    /المالك[:\s]+(.+?)(?:\n|$)/,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      const name = match[1].trim();
      if (name.length > 3) {
        result.customerName = name;
        break;
      }
    }
  }

  // =====================================
  // 9. TRAFFIC FILE NUMBER (T.C. No.)
  // =====================================
  const tcPatterns = [
    /T\.?C\.?\s*(?:NO\.?)?[:\s]+(\d{6,12})/i,
    /TRAFFIC\s*FILE[:\s]+(\d{6,12})/i,
  ];

  for (const pattern of tcPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.trafficFileNumber = match[1];
      break;
    }
  }

  // =====================================
  // 10. ENGINE NUMBER
  // =====================================
  const enginePatterns = [
    /ENGINE\s*(?:NO\.?|NUMBER)?[:\s]+([A-Z0-9]{6,20})/i,
    /رقم\s*المحرك[:\s]+([A-Z0-9]{6,20})/i,
  ];

  for (const pattern of enginePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.engineNumber = match[1].toUpperCase();
      break;
    }
  }

  // =====================================
  // 11. EXPIRY DATE
  // =====================================
  const expiryPatterns = [
    /EXPIRY[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /VALID\s*(?:UNTIL|TO)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /انتهاء[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
  ];

  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.expiryDate = match[1];
      break;
    }
  }

  // =====================================
  // 12. REGISTRATION DATE
  // =====================================
  const regDatePatterns = [
    /REG(?:ISTRATION)?\s*DATE[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /تاريخ\s*التسجيل[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
  ];

  for (const pattern of regDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.registrationDate = match[1];
      break;
    }
  }

  console.log('=== EXTRACTED DATA ===');
  console.log('VIN:', result.vin);
  console.log('Make:', result.vehicleMake);
  console.log('Model:', result.vehicleModel);
  console.log('Trim:', result.vehicleTrim);
  console.log('Plate:', result.plateNumber);
  console.log('Year:', result.registrationYear);
  console.log('=== END EXTRACTED ===');

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
      // Handle base64 image
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

    // Parse the extracted text
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
