import { NextRequest, NextResponse } from 'next/server';

const AZURE_VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT || 'https://northeurope.api.cognitive.microsoft.com';
const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY || '';

interface NationalIdOCRResult {
  fullNameEn?: string;
  fullNameAr?: string;
  emiratesIdNumber?: string;
  dateOfBirth?: string; // ISO date string
  nationality?: string;
  expiryDate?: string; // ISO date string
  cardNumber?: string;
  gender?: string;
  rawText?: string;
}

// Emirates ID number format: 784-YYYY-XXXXXXX-X
const EMIRATES_ID_PATTERN = /784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d/;

// Common nationalities
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

function extractNationalIdData(text: string): NationalIdOCRResult {
  const result: NationalIdOCRResult = { rawText: text };
  const upperText = text.toUpperCase();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract Emirates ID number (format: 784-YYYY-XXXXXXX-X)
  const idMatch = text.match(EMIRATES_ID_PATTERN);
  if (idMatch) {
    // Normalize to 784-YYYY-XXXXXXX-X format
    const idNumber = idMatch[0].replace(/\s/g, '').replace(/(\d{3})(\d{4})(\d{7})(\d)/, '$1-$2-$3-$4');
    result.emiratesIdNumber = idNumber;
  }

  // Also try to find ID number in different format
  if (!result.emiratesIdNumber) {
    const altIdMatch = text.match(/ID\s*(?:NO|NUMBER)?[\s.:]*(\d{3}[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d)/i);
    if (altIdMatch) {
      const idNumber = altIdMatch[1].replace(/\s/g, '').replace(/(\d{3})(\d{4})(\d{7})(\d)/, '$1-$2-$3-$4');
      result.emiratesIdNumber = idNumber;
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
        result.expiryDate = expDate;
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

  // Extract English name
  const namePatterns = [
    /(?:NAME|FULL\s*NAME|HOLDER|RESIDENT)[\s.:]*([A-Z][A-Z\s\.]{2,50})/i,
    /(?:MR\.?|MRS\.?|MS\.?|MISS)\s+([A-Z][A-Z\s\.]{2,50})/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate it looks like a name
      if (name.length > 3 && !NATIONALITIES.includes(name.toUpperCase())) {
        result.fullNameEn = name.split(/\s+/).map(
          word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        break;
      }
    }
  }

  // If no name found, look for name-like patterns in the text
  if (!result.fullNameEn) {
    for (const line of lines) {
      // Look for lines that look like names (all letters, 2+ words)
      const cleanLine = line.replace(/[^A-Za-z\s]/g, '').trim();
      if (cleanLine.length > 5 && cleanLine.split(/\s+/).length >= 2) {
        const words = cleanLine.split(/\s+/);
        const isLikelyName = words.every(w =>
          w.length >= 2 &&
          !NATIONALITIES.includes(w.toUpperCase())
        );
        if (isLikelyName) {
          result.fullNameEn = words.map(
            w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          ).join(' ');
          break;
        }
      }
    }
  }

  // Extract Arabic name (look for Arabic characters)
  const arabicNameMatch = text.match(/[\u0600-\u06FF\s]{5,}/);
  if (arabicNameMatch) {
    result.fullNameAr = arabicNameMatch[0].trim();
  }

  // Extract nationality
  for (const nat of NATIONALITIES) {
    if (upperText.includes(nat)) {
      result.nationality = nat;
      break;
    }
  }

  // Extract gender
  const genderMatch = text.match(/(?:SEX|GENDER)[\s.:]*([MF]|MALE|FEMALE)/i);
  if (genderMatch) {
    const genderValue = genderMatch[1].toUpperCase();
    result.gender = genderValue === 'M' || genderValue === 'MALE' ? 'Male' : 'Female';
  }

  // Extract card number (if present, different from ID number)
  const cardNumberMatch = text.match(/(?:CARD\s*(?:NO|NUMBER))[\s.:]*([A-Z0-9\-]+)/i);
  if (cardNumberMatch) {
    result.cardNumber = cardNumberMatch[1].trim();
  }

  return result;
}

function validateEmiratesId(idNumber: string): boolean {
  // UAE Emirates ID format: 784-YYYY-XXXXXXX-X
  // 784 is the country code for UAE
  // YYYY is birth year
  // XXXXXXX is a sequence number
  // X is a check digit
  const pattern = /^784-\d{4}-\d{7}-\d$/;
  return pattern.test(idNumber);
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

    // Parse the extracted text to find Emirates ID fields
    const extractedData = extractNationalIdData(fullText);

    // Validate Emirates ID format if found
    let isValidFormat = true;
    let formatWarning = null;

    if (extractedData.emiratesIdNumber) {
      if (!validateEmiratesId(extractedData.emiratesIdNumber)) {
        isValidFormat = false;
        formatWarning = 'Emirates ID number format appears invalid';
      }
    } else {
      isValidFormat = false;
      formatWarning = 'Could not extract Emirates ID number from image';
    }

    // Validate expiry
    let isExpired = false;
    let expiryWarning = null;

    if (extractedData.expiryDate) {
      const expiryDate = new Date(extractedData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        isExpired = true;
        expiryWarning = 'Emirates ID has expired';
      } else {
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30) {
          expiryWarning = `Emirates ID expires in ${daysUntilExpiry} days`;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      validation: {
        isValidFormat,
        formatWarning,
        isExpired,
        expiryWarning,
        canProceed: isValidFormat && !isExpired,
      },
    });
  } catch (error) {
    console.error('National ID OCR error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
