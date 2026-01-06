import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

interface OCRResult {
  customerName?: string;
  trafficFileNumber?: string;
  plateNumber?: string;
  emirateCode?: string;
  vin?: string;
  engineNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleTrim?: string;
  vehicleColor?: string;
  vehicleType?: string;
  registrationYear?: number;
  registrationDate?: string;
  expiryDate?: string;
  insuranceCompany?: string;
  insuranceExpiry?: string;
  mortgageInfo?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image base64 data is required' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Use GPT-4o Vision to read the image directly
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `This is a UAE vehicle registration card (Mulkiyah). Extract ALL information and return ONLY a JSON object.

IMPORTANT - UAE Mulkiyah field mapping:
- "Chassis No." or "رقم الهيكل" = VIN (17 character chassis number)
- "Veh. Type" or "نوع المركبة" = Contains Make + Model + Trim together (e.g., "TOYOTA LAND CRUISER GXR" means Make=TOYOTA, Model=LAND CRUISER, Trim=GXR)
- "Model" or "الموديل" = This is the YEAR (e.g., "2023"), NOT the car model name
- "Traffic Plate No." = Plate number
- "T.C. No." = Traffic file number
- "Owner" = Customer name
- "Colour" or "اللون" = Vehicle color

Return this exact JSON structure (use null for missing fields):
{
  "vin": "17-character chassis number from Chassis No. field",
  "plateNumber": "plate number as shown",
  "emirateCode": "letter/number code from plate",
  "vehicleMake": "car brand from Veh. Type (e.g., TOYOTA, BMW)",
  "vehicleModel": "car model from Veh. Type (e.g., LAND CRUISER, CAMRY)",
  "vehicleTrim": "trim level from Veh. Type if present (e.g., GXR, VXR)",
  "vehicleColor": "color",
  "registrationYear": year as number from Model field,
  "customerName": "owner name",
  "trafficFileNumber": "T.C. number",
  "engineNumber": "engine number if shown",
  "expiryDate": "expiry date",
  "registrationDate": "registration date",
  "insuranceCompany": "insurance company name",
  "insuranceExpiry": "insurance expiry date",
  "mortgageInfo": "mortgage info if any"
}

Return ONLY the JSON, no other text.`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content;
    console.log('GPT-4o Vision response:', content);

    if (!content) {
      return NextResponse.json(
        { error: 'No response from GPT-4o Vision' },
        { status: 500 }
      );
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Could not parse response' },
        { status: 500 }
      );
    }

    const extracted = JSON.parse(jsonMatch[0]);
    console.log('Extracted data:', extracted);

    const result: OCRResult = {};

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
    if (extracted.insuranceCompany) result.insuranceCompany = extracted.insuranceCompany;
    if (extracted.insuranceExpiry) result.insuranceExpiry = extracted.insuranceExpiry;
    if (extracted.mortgageInfo) result.mortgageInfo = extracted.mortgageInfo;

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
