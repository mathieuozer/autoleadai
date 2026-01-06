import { NextRequest, NextResponse } from 'next/server';

const AZURE_VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT || 'https://northeurope.api.cognitive.microsoft.com';
const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY || '';

interface OCRResult {
  customerName?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleTrim?: string;
  vin?: string;
  plateNumber?: string;
  registrationYear?: number;
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
];

// Common models for better extraction
const COMMON_MODELS: Record<string, string[]> = {
  TOYOTA: ['CAMRY', 'COROLLA', 'RAV4', 'LAND CRUISER', 'PRADO', 'HIGHLANDER', 'FORTUNER', 'HILUX', 'YARIS', 'AVALON', 'SUPRA', 'SEQUOIA', '4RUNNER'],
  NISSAN: ['ALTIMA', 'PATROL', 'PATHFINDER', 'MAXIMA', 'SENTRA', 'KICKS', 'XTRAIL', 'X-TRAIL', 'MURANO', 'ARMADA', 'TITAN', 'SUNNY', 'JUKE'],
  HONDA: ['ACCORD', 'CIVIC', 'CRV', 'CR-V', 'PILOT', 'HRV', 'HR-V', 'ODYSSEY', 'CITY'],
  HYUNDAI: ['SONATA', 'ELANTRA', 'TUCSON', 'SANTA FE', 'PALISADE', 'KONA', 'VENUE', 'ACCENT', 'AZERA', 'GENESIS'],
  KIA: ['OPTIMA', 'K5', 'SPORTAGE', 'SORENTO', 'TELLURIDE', 'CARNIVAL', 'SELTOS', 'SOUL', 'STINGER', 'CERATO'],
  BMW: ['3 SERIES', '5 SERIES', '7 SERIES', 'X1', 'X3', 'X5', 'X7', 'M3', 'M5', 'I8', 'IX'],
  MERCEDES: ['C CLASS', 'E CLASS', 'S CLASS', 'GLA', 'GLC', 'GLE', 'GLS', 'AMG', 'A CLASS', 'CLA'],
  LEXUS: ['ES', 'IS', 'LS', 'RX', 'NX', 'GX', 'LX', 'UX', 'LC', 'RC'],
  FORD: ['MUSTANG', 'F150', 'F-150', 'EXPLORER', 'EXPEDITION', 'EDGE', 'ESCAPE', 'BRONCO', 'RANGER'],
};

function extractDataFromText(text: string): OCRResult {
  const result: OCRResult = { rawText: text };
  const upperText = text.toUpperCase();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract plate number (UAE format: letter(s) + numbers or Dubai/Abu Dhabi specific)
  const platePatterns = [
    /\b([A-Z]{1,3})\s*[-/]?\s*(\d{1,5})\b/g,  // A 12345, AB-12345
    /\b(\d{1,5})\s*[-/]?\s*([A-Z]{1,3})\b/g,  // 12345 A
    /PLATE\s*(?:NO\.?|NUMBER)?:?\s*([A-Z0-9\s\-\/]+)/i,
  ];

  for (const pattern of platePatterns) {
    const matches = upperText.match(pattern);
    if (matches && matches.length > 0) {
      // Clean up the plate number
      let plate = matches[0].replace(/PLATE\s*(?:NO\.?|NUMBER)?:?\s*/i, '').trim();
      if (plate.length >= 2 && plate.length <= 10) {
        result.plateNumber = plate;
        break;
      }
    }
  }

  // Extract VIN (17 characters, alphanumeric, no I, O, Q)
  const vinPattern = /\b([A-HJ-NPR-Z0-9]{17})\b/g;
  const vinMatches = upperText.match(vinPattern);
  if (vinMatches) {
    result.vin = vinMatches[0];
  }

  // Extract registration year (look for 4-digit year between 1990-2030)
  const yearPatterns = [
    /(?:MODEL\s*YEAR|YEAR|MY|M\.Y\.?)\s*:?\s*((?:19|20)\d{2})/i,
    /\b((?:19|20)\d{2})\b/g,
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

  // Extract vehicle make
  for (const make of VEHICLE_MAKES) {
    if (upperText.includes(make)) {
      result.vehicleMake = make;

      // Try to find model for this make
      const models = COMMON_MODELS[make] || COMMON_MODELS[make.split(' ')[0]] || [];
      for (const model of models) {
        if (upperText.includes(model)) {
          result.vehicleModel = model;
          break;
        }
      }
      break;
    }
  }

  // Extract customer name (look for patterns like "Owner:", "Name:", or Arabic name patterns)
  const namePatterns = [
    /(?:OWNER|NAME|REGISTERED\s*TO)\s*:?\s*([A-Z][A-Z\s]{2,40})/i,
    /(?:MR\.?|MRS\.?|MS\.?|MISS)\s+([A-Z][A-Z\s]{2,40})/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate it looks like a name (has at least 2 parts or is reasonably long)
      if (name.length > 3 && !VEHICLE_MAKES.includes(name.toUpperCase())) {
        result.customerName = name.split(/\s+/).map(
          word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        break;
      }
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
