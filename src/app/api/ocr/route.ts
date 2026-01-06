import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const AZURE_VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT || 'https://northeurope.api.cognitive.microsoft.com';
const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

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

// Use OpenAI to extract structured data from OCR text
async function extractWithLLM(rawText: string): Promise<OCRResult> {
  const result: OCRResult = { rawText };

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not configured');
    return result;
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const prompt = `You are extracting data from a UAE vehicle registration card (Mulkiyah).
Extract the following fields from this OCR text. Return ONLY a valid JSON object, no explanation.

OCR Text:
${rawText}

Extract these fields (use null if not found):
- vin: The chassis number / VIN (17 characters, from "Chassis No." or "رقم الهيكل")
- plateNumber: Traffic plate number (e.g., "A 12345" or "Dubai A 12345")
- emirateCode: The letter/code from the plate (e.g., "A", "B", "1")
- vehicleMake: Car manufacturer (e.g., TOYOTA, BMW, MERCEDES) - from "Veh. Type" or "Make" or "الصنع"
- vehicleModel: Car model (e.g., LAND CRUISER, CAMRY) - from "Veh. Type" or "Model" or "الطراز"
- vehicleTrim: Trim level if present (e.g., GXR, VXR, LIMITED)
- vehicleColor: Color of the vehicle
- registrationYear: Year as number (from "Model" field which contains year, or "Model Year")
- customerName: Owner name
- trafficFileNumber: T.C. No. or traffic file number
- engineNumber: Engine number
- expiryDate: Expiry date as string
- registrationDate: Registration date as string

IMPORTANT for UAE Mulkiyah:
- "Chassis No." field contains the VIN (17 characters)
- "Veh. Type" field contains Make + Model + Trim together (e.g., "TOYOTA LAND CRUISER GXR")
- "Model" field usually contains the YEAR (e.g., "2023"), not the car model name
- Split "Veh. Type" into make, model, and trim

Return JSON only:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        console.log('LLM extracted:', extracted);

        // Map to result
        if (extracted.vin) result.vin = extracted.vin;
        if (extracted.plateNumber) result.plateNumber = extracted.plateNumber;
        if (extracted.emirateCode) result.emirateCode = extracted.emirateCode;
        if (extracted.vehicleMake) result.vehicleMake = extracted.vehicleMake;
        if (extracted.vehicleModel) result.vehicleModel = extracted.vehicleModel;
        if (extracted.vehicleTrim) result.vehicleTrim = extracted.vehicleTrim;
        if (extracted.vehicleColor) result.vehicleColor = extracted.vehicleColor;
        if (extracted.registrationYear) result.registrationYear = parseInt(extracted.registrationYear);
        if (extracted.customerName) result.customerName = extracted.customerName;
        if (extracted.trafficFileNumber) result.trafficFileNumber = extracted.trafficFileNumber;
        if (extracted.engineNumber) result.engineNumber = extracted.engineNumber;
        if (extracted.expiryDate) result.expiryDate = extracted.expiryDate;
        if (extracted.registrationDate) result.registrationDate = extracted.registrationDate;
      }
    }
  } catch (error) {
    console.error('LLM extraction error:', error);
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

    console.log('=== OCR RAW TEXT ===');
    console.log(fullText);
    console.log('=== END RAW TEXT ===');

    // Use LLM to extract structured data
    const extractedData = await extractWithLLM(fullText);

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
