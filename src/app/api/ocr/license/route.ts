import { NextRequest, NextResponse } from 'next/server';

const AZURE_VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT || 'https://northeurope.api.cognitive.microsoft.com';
const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY || '';

interface LicenseOCRResult {
  fullName?: string;
  licenseNumber?: string;
  licenseExpiry?: string; // ISO date string
  dateOfBirth?: string; // ISO date string
  nationality?: string;
  licenseCategory?: string;
  issueDate?: string; // ISO date string
  rawText?: string;
}

// Common nationalities in UAE
const NATIONALITIES = [
  'UAE', 'UNITED ARAB EMIRATES', 'EMIRATI',
  'INDIA', 'INDIAN', 'PAKISTAN', 'PAKISTANI',
  'PHILIPPINES', 'FILIPINO', 'BANGLADESH', 'BANGLADESHI',
  'EGYPT', 'EGYPTIAN', 'JORDAN', 'JORDANIAN',
  'LEBANON', 'LEBANESE', 'SYRIA', 'SYRIAN',
  'SAUDI', 'SAUDI ARABIA', 'SAUDI ARABIAN',
  'USA', 'AMERICAN', 'UK', 'BRITISH',
  'CANADA', 'CANADIAN', 'AUSTRALIA', 'AUSTRALIAN',
  'GERMANY', 'GERMAN', 'FRANCE', 'FRENCH',
  'ITALY', 'ITALIAN', 'SPAIN', 'SPANISH',
  'CHINA', 'CHINESE', 'JAPAN', 'JAPANESE',
  'KOREA', 'KOREAN', 'SOUTH KOREA',
  'IRAN', 'IRANIAN', 'IRAQ', 'IRAQI',
  'OMAN', 'OMANI', 'QATAR', 'QATARI',
  'KUWAIT', 'KUWAITI', 'BAHRAIN', 'BAHRAINI',
  'MOROCCO', 'MOROCCAN', 'TUNISIA', 'TUNISIAN',
  'ALGERIA', 'ALGERIAN', 'SUDAN', 'SUDANESE',
  'ETHIOPIA', 'ETHIOPIAN', 'KENYA', 'KENYAN',
  'NIGERIA', 'NIGERIAN', 'SOUTH AFRICA', 'SOUTH AFRICAN',
  'RUSSIA', 'RUSSIAN', 'UKRAINE', 'UKRAINIAN',
  'NEPAL', 'NEPALI', 'NEPALESE', 'SRI LANKA', 'SRI LANKAN',
];

// License categories
const LICENSE_CATEGORIES = [
  'LMV', 'L.M.V.', // Light Motor Vehicle
  'HMV', 'H.M.V.', // Heavy Motor Vehicle
  'MOTORCYCLE', 'M/C', 'MC',
  'AUTO', 'AUTOMATIC',
  'MANUAL',
  'CAR', 'CAR AUTOMATIC', 'CAR MANUAL',
  'LIGHT VEHICLE',
  'HEAVY VEHICLE',
  'BUS', 'TRUCK',
  'A', 'B', 'C', 'D', 'E', 'F', // UAE license categories
  'A1', 'A2', 'B1', 'B2',
  'CATEGORY A', 'CATEGORY B',
];

function parseDate(dateStr: string): string | null {
  // Try various date formats
  const formats = [
    // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    // YYYY/MM/DD or YYYY-MM-DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    // DD MMM YYYY or DD-MMM-YYYY
    /(\d{1,2})[\s\-]?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[\s\-]?(\d{4})/i,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year: number, month: number, day: number;

      if (format === formats[0]) {
        // DD/MM/YYYY
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
      } else if (format === formats[1]) {
        // YYYY/MM/DD
        year = parseInt(match[1]);
        month = parseInt(match[2]);
        day = parseInt(match[3]);
      } else {
        // DD MMM YYYY
        day = parseInt(match[1]);
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        month = monthNames.indexOf(match[2].toUpperCase().substring(0, 3)) + 1;
        year = parseInt(match[3]);
      }

      if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
  }

  return null;
}

function extractLicenseData(text: string): LicenseOCRResult {
  const result: LicenseOCRResult = { rawText: text };
  const upperText = text.toUpperCase();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract license number
  const licensePatterns = [
    /(?:LICENSE|LICENCE|LIC)[\s.]*(?:NO|NUMBER|#)?[\s.:]*([A-Z0-9\-\/]+)/i,
    /(?:DL|D\.L\.)[\s.]*(?:NO|NUMBER|#)?[\s.:]*([A-Z0-9\-\/]+)/i,
    /(?:DRIVING\s*LICENSE)[\s.:]*([A-Z0-9\-\/]+)/i,
    // UAE specific patterns
    /\b([A-Z]{1,3}\d{6,10})\b/, // Letter(s) followed by numbers
    /\b(\d{2,3}[-/]\d{4,8}[-/]\d{2,4})\b/, // Number-number-number format
  ];

  for (const pattern of licensePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const licNum = match[1].replace(/\s+/g, '').trim();
      if (licNum.length >= 5 && licNum.length <= 20) {
        result.licenseNumber = licNum;
        break;
      }
    }
  }

  // Extract expiry date
  const expiryPatterns = [
    /(?:EXPIRY|EXPIRES?|EXP|VALID\s*(?:UNTIL|TILL|TO)|VALIDITY)[\s.:]*(.+)/i,
    /(?:DATE\s*OF\s*EXPIRY)[\s.:]*(.+)/i,
  ];

  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const expDate = parseDate(match[1]);
      if (expDate) {
        result.licenseExpiry = expDate;
        break;
      }
    }
  }

  // Extract date of birth
  const dobPatterns = [
    /(?:DATE\s*OF\s*BIRTH|DOB|D\.O\.B|BIRTH\s*DATE|BORN)[\s.:]*(.+)/i,
    /(?:D[/.]?O[/.]?B)[\s.:]*(.+)/i,
  ];

  for (const pattern of dobPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const dob = parseDate(match[1]);
      if (dob) {
        result.dateOfBirth = dob;
        break;
      }
    }
  }

  // Extract issue date
  const issueDatePatterns = [
    /(?:ISSUE\s*DATE|DATE\s*OF\s*ISSUE|ISSUED|VALID\s*FROM)[\s.:]*(.+)/i,
  ];

  for (const pattern of issueDatePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const issueDate = parseDate(match[1]);
      if (issueDate) {
        result.issueDate = issueDate;
        break;
      }
    }
  }

  // Extract full name
  const namePatterns = [
    /(?:NAME|FULL\s*NAME|HOLDER|DRIVER)[\s.:]*([A-Z][A-Z\s\.]{2,50})/i,
    /(?:MR\.?|MRS\.?|MS\.?|MISS)\s+([A-Z][A-Z\s\.]{2,50})/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate it looks like a name
      if (name.length > 3 && !NATIONALITIES.includes(name.toUpperCase())) {
        result.fullName = name.split(/\s+/).map(
          word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        break;
      }
    }
  }

  // If no name found, look for name-like patterns in the text
  if (!result.fullName) {
    for (const line of lines) {
      // Look for lines that look like names (all letters, 2+ words)
      const cleanLine = line.replace(/[^A-Za-z\s]/g, '').trim();
      if (cleanLine.length > 5 && cleanLine.split(/\s+/).length >= 2) {
        const words = cleanLine.split(/\s+/);
        const isLikelyName = words.every(w =>
          w.length >= 2 &&
          !NATIONALITIES.includes(w.toUpperCase()) &&
          !LICENSE_CATEGORIES.includes(w.toUpperCase())
        );
        if (isLikelyName) {
          result.fullName = words.map(
            w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          ).join(' ');
          break;
        }
      }
    }
  }

  // Extract nationality
  for (const nat of NATIONALITIES) {
    if (upperText.includes(nat)) {
      result.nationality = nat;
      break;
    }
  }

  // Extract license category
  const categoryPatterns = [
    /(?:CATEGORY|CAT|CLASS|TYPE)[\s.:]*([A-Z0-9\/\s,]+)/i,
    /(?:VEHICLE\s*TYPE|AUTHORIZED\s*TO\s*DRIVE)[\s.:]*(.+)/i,
  ];

  for (const pattern of categoryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const category = match[1].trim().split(/[\s,]+/)[0];
      if (category.length >= 1 && category.length <= 20) {
        result.licenseCategory = category;
        break;
      }
    }
  }

  // If no category found, look for known categories in text
  if (!result.licenseCategory) {
    for (const cat of LICENSE_CATEGORIES) {
      if (upperText.includes(cat)) {
        result.licenseCategory = cat;
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

    // Parse the extracted text to find license fields
    const extractedData = extractLicenseData(fullText);

    // Validate license expiry
    let isExpired = false;
    let expiryWarning = null;

    if (extractedData.licenseExpiry) {
      const expiryDate = new Date(extractedData.licenseExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        isExpired = true;
        expiryWarning = 'Driving license has expired';
      } else {
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30) {
          expiryWarning = `License expires in ${daysUntilExpiry} days`;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      validation: {
        isExpired,
        expiryWarning,
        canProceed: !isExpired,
      },
    });
  } catch (error) {
    console.error('License OCR error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
