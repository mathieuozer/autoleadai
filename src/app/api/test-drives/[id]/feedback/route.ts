import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

interface FeedbackAnalysis {
  transcript: string;
  detectedLanguage: string;
  overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  sentimentScore: number;
  emotionTags: string[];
  keyPositives: string[];
  mainObjections: string[];
  buyingIntent: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNDETERMINED';
  buyingIntentScore: number;
  recommendedAction: string;
  recommendedActionType: string;
  actionRationale: string;
}

// GET: Check if feedback exists
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const feedback = await prisma.testDriveFeedback.findUnique({
      where: { testDriveId: id },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: { message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status: feedback.status,
        transcript: feedback.transcript,
        detectedLanguage: feedback.detectedLanguage,
        overallSentiment: feedback.overallSentiment,
        sentimentScore: feedback.sentimentScore,
        emotionTags: feedback.emotionTags,
        keyPositives: feedback.keyPositives,
        mainObjections: feedback.mainObjections,
        buyingIntent: feedback.buyingIntent,
        buyingIntentScore: feedback.buyingIntentScore,
        recommendedAction: feedback.recommendedAction,
        recommendedActionType: feedback.recommendedActionType,
        actionRationale: feedback.actionRationale,
        closeProbabilityBefore: feedback.closeProbabilityBefore,
        closeProbabilityAfter: feedback.closeProbabilityAfter,
        probabilityDelta: feedback.probabilityDelta,
      },
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to retrieve feedback' } },
      { status: 500 }
    );
  }
}

// POST: Process voice feedback
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if test drive exists
    const testDrive = await prisma.testDrive.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    if (!testDrive) {
      return NextResponse.json(
        { error: { message: 'Test drive not found' } },
        { status: 404 }
      );
    }

    // Handle skipped feedback
    if (body.skipped) {
      const feedback = await prisma.testDriveFeedback.upsert({
        where: { testDriveId: id },
        create: {
          testDriveId: id,
          status: 'SKIPPED',
        },
        update: {
          status: 'SKIPPED',
        },
      });

      return NextResponse.json({
        success: true,
        data: { status: feedback.status },
      });
    }

    // Validate audio data
    const { audioData, duration } = body;
    if (!audioData) {
      return NextResponse.json(
        { error: { message: 'Audio data is required' } },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: { message: 'OpenAI API key not configured' } },
        { status: 500 }
      );
    }

    // Create or update feedback record as PROCESSING
    await prisma.testDriveFeedback.upsert({
      where: { testDriveId: id },
      create: {
        testDriveId: id,
        status: 'PROCESSING',
        voiceDuration: duration,
        recordedAt: new Date(),
      },
      update: {
        status: 'PROCESSING',
        voiceDuration: duration,
        recordedAt: new Date(),
      },
    });

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Step 1: Transcribe audio using Whisper
    const transcript = await transcribeAudio(openai, audioData);

    // Step 2: Analyze feedback with GPT-4
    const analysis = await analyzeFeedback(openai, transcript, testDrive);

    // Step 3: Calculate probability delta
    const closeProbabilityBefore = testDrive.outcome ? 50 : 65; // Base probability
    const closeProbabilityAfter = calculateNewProbability(
      closeProbabilityBefore,
      analysis
    );
    const probabilityDelta = closeProbabilityAfter - closeProbabilityBefore;

    // Step 4: Save results to database
    const feedback = await prisma.testDriveFeedback.update({
      where: { testDriveId: id },
      data: {
        status: 'COMPLETED',
        transcript: transcript,
        detectedLanguage: analysis.detectedLanguage,
        overallSentiment: analysis.overallSentiment,
        sentimentScore: analysis.sentimentScore,
        emotionTags: analysis.emotionTags,
        keyPositives: analysis.keyPositives,
        mainObjections: analysis.mainObjections,
        buyingIntent: analysis.buyingIntent,
        buyingIntentScore: analysis.buyingIntentScore,
        recommendedAction: analysis.recommendedAction,
        recommendedActionType: analysis.recommendedActionType,
        actionRationale: analysis.actionRationale,
        closeProbabilityBefore,
        closeProbabilityAfter,
        probabilityDelta,
        aiAnalysisRaw: analysis as object,
        processedAt: new Date(),
      },
    });

    // Create notification for sales team
    await createFeedbackNotification(testDrive, analysis);

    return NextResponse.json({
      success: true,
      data: {
        status: feedback.status,
        transcript: feedback.transcript,
        detectedLanguage: feedback.detectedLanguage,
        overallSentiment: feedback.overallSentiment,
        sentimentScore: feedback.sentimentScore,
        emotionTags: feedback.emotionTags,
        keyPositives: feedback.keyPositives,
        mainObjections: feedback.mainObjections,
        buyingIntent: feedback.buyingIntent,
        buyingIntentScore: feedback.buyingIntentScore,
        recommendedAction: feedback.recommendedAction,
        recommendedActionType: feedback.recommendedActionType,
        actionRationale: feedback.actionRationale,
        closeProbabilityBefore: feedback.closeProbabilityBefore,
        closeProbabilityAfter: feedback.closeProbabilityAfter,
        probabilityDelta: feedback.probabilityDelta,
      },
    });
  } catch (error) {
    console.error('Process feedback error:', error);

    // Update status to FAILED
    const { id } = await params;
    await prisma.testDriveFeedback.upsert({
      where: { testDriveId: id },
      create: {
        testDriveId: id,
        status: 'FAILED',
      },
      update: {
        status: 'FAILED',
      },
    });

    return NextResponse.json(
      { error: { message: 'Failed to process feedback' } },
      { status: 500 }
    );
  }
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(openai: OpenAI, audioDataUrl: string): Promise<string> {
  // Extract base64 data and mime type from data URL
  const matches = audioDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid audio data format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Determine file extension
  let extension = 'webm';
  if (mimeType.includes('mp4')) {
    extension = 'mp4';
  } else if (mimeType.includes('wav')) {
    extension = 'wav';
  } else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    extension = 'mp3';
  }

  // Create a File object for the API
  const file = new File([buffer], `audio.${extension}`, { type: mimeType });

  const response = await openai.audio.transcriptions.create({
    file: file,
    model: 'whisper-1',
    response_format: 'verbose_json',
  });

  return response.text;
}

// Analyze feedback with GPT-4
async function analyzeFeedback(
  openai: OpenAI,
  transcript: string,
  testDrive: {
    customer: { name: string };
    vehicle: { make: string; model: string; year: number };
  }
): Promise<FeedbackAnalysis> {
  const vehicleInfo = `${testDrive.vehicle.year} ${testDrive.vehicle.make} ${testDrive.vehicle.model}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an AI sales intelligence assistant for an automotive dealership.
Analyze customer feedback from a test drive and extract actionable insights.
Return ONLY a valid JSON object with no other text.`,
      },
      {
        role: 'user',
        content: `Analyze this test drive feedback from ${testDrive.customer.name} about a ${vehicleInfo}:

"${transcript}"

Return a JSON object with:
{
  "detectedLanguage": "language code (en, ar, etc)",
  "overallSentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "sentimentScore": number from -1 (negative) to 1 (positive),
  "emotionTags": ["array", "of", "emotions detected like excited, hesitant, satisfied, frustrated"],
  "keyPositives": ["array of specific things they liked about the car"],
  "mainObjections": ["array of concerns or objections they mentioned"],
  "buyingIntent": "HIGH" | "MEDIUM" | "LOW" | "UNDETERMINED",
  "buyingIntentScore": number from 0 to 100,
  "recommendedAction": "One clear recommended next step for the salesperson",
  "recommendedActionType": "OFFER_VARIANT" | "FINANCE_OFFER" | "SEND_INFO" | "FOLLOW_UP" | "CLOSE_DEAL" | "ADDRESS_CONCERN",
  "actionRationale": "Brief explanation of why this action is recommended"
}

Be specific and actionable. Focus on insights that help close the deal.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from GPT-4');
  }

  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse analysis response');
  }

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    transcript,
    detectedLanguage: analysis.detectedLanguage || 'en',
    overallSentiment: analysis.overallSentiment || 'NEUTRAL',
    sentimentScore: analysis.sentimentScore || 0,
    emotionTags: analysis.emotionTags || [],
    keyPositives: analysis.keyPositives || [],
    mainObjections: analysis.mainObjections || [],
    buyingIntent: analysis.buyingIntent || 'UNDETERMINED',
    buyingIntentScore: analysis.buyingIntentScore || 50,
    recommendedAction: analysis.recommendedAction || 'Follow up with customer',
    recommendedActionType: analysis.recommendedActionType || 'FOLLOW_UP',
    actionRationale: analysis.actionRationale || '',
  };
}

// Calculate new close probability based on analysis
function calculateNewProbability(
  baseProbability: number,
  analysis: FeedbackAnalysis
): number {
  let delta = 0;

  // Sentiment impact
  if (analysis.overallSentiment === 'POSITIVE') {
    delta += 10;
  } else if (analysis.overallSentiment === 'NEGATIVE') {
    delta -= 15;
  }

  // Buying intent impact
  if (analysis.buyingIntent === 'HIGH') {
    delta += 15;
  } else if (analysis.buyingIntent === 'MEDIUM') {
    delta += 5;
  } else if (analysis.buyingIntent === 'LOW') {
    delta -= 10;
  }

  // Objections impact
  if (analysis.mainObjections.length > 2) {
    delta -= 10;
  } else if (analysis.mainObjections.length > 0) {
    delta -= 5;
  }

  // Key positives impact
  if (analysis.keyPositives.length > 2) {
    delta += 5;
  }

  // Calculate final probability, bounded between 5 and 95
  const newProbability = Math.max(5, Math.min(95, baseProbability + delta));
  return newProbability;
}

// Create notification for sales team
async function createFeedbackNotification(
  testDrive: {
    id: string;
    salesExecutiveId: string;
    customer: { name: string };
    vehicle: { make: string; model: string };
  },
  analysis: FeedbackAnalysis
) {
  try {
    const sentimentEmoji =
      analysis.overallSentiment === 'POSITIVE' ? '😊' :
      analysis.overallSentiment === 'NEGATIVE' ? '😟' : '😐';

    const intentLabel =
      analysis.buyingIntent === 'HIGH' ? 'High buying intent' :
      analysis.buyingIntent === 'MEDIUM' ? 'Medium buying intent' :
      analysis.buyingIntent === 'LOW' ? 'Low buying intent' : '';

    await prisma.notification.create({
      data: {
        userId: testDrive.salesExecutiveId,
        type: 'TEST_DRIVE_FEEDBACK_RECEIVED',
        title: `${sentimentEmoji} Feedback from ${testDrive.customer.name}`,
        message: `${testDrive.vehicle.make} ${testDrive.vehicle.model} test drive. ${intentLabel}. ${analysis.recommendedAction}`,
        link: `/test-drive/${testDrive.id}/feedback`,
        referenceId: testDrive.id,
        referenceType: 'test-drive-feedback',
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't throw - notification failure shouldn't fail the main request
  }
}
