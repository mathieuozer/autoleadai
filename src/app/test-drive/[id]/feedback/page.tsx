'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  Loader2,
  CheckCircle,
  ThumbsUp,
  AlertTriangle,
  DollarSign,
  Sparkles,
  ArrowRight,
  Car,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { VoiceRecorder } from '@/components/test-drive';

interface PageProps {
  params: Promise<{ id: string }>;
}

type FeedbackStep = 'welcome' | 'recording' | 'processing' | 'insights' | 'complete';

interface FeedbackInsights {
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
  closeProbabilityBefore: number;
  closeProbabilityAfter: number;
  probabilityDelta: number;
}

interface TestDriveInfo {
  id: string;
  customer: { name: string };
  vehicle: { make: string; model: string; year: number };
  completedAt: string;
}

export default function TestDriveFeedbackPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [step, setStep] = useState<FeedbackStep>('welcome');
  const [testDrive, setTestDrive] = useState<TestDriveInfo | null>(null);
  const [insights, setInsights] = useState<FeedbackInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load test drive info
  useEffect(() => {
    const fetchTestDrive = async () => {
      try {
        const response = await fetch(`/api/test-drives/${id}`);
        if (!response.ok) {
          throw new Error('Test drive not found');
        }
        const { data } = await response.json();
        setTestDrive(data);

        // Check if feedback already exists
        const feedbackResponse = await fetch(`/api/test-drives/${id}/feedback`);
        if (feedbackResponse.ok) {
          const { data: feedbackData } = await feedbackResponse.json();
          if (feedbackData && feedbackData.status === 'COMPLETED') {
            setInsights(feedbackData);
            setStep('insights');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestDrive();
  }, [id]);

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setStep('processing');
    setError(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Submit for processing
      const response = await fetch(`/api/test-drives/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64,
          duration,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to process feedback');
      }

      const { data } = await response.json();
      setInsights(data);
      setStep('insights');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process feedback');
      setStep('recording');
    }
  };

  const handleSkip = async () => {
    try {
      await fetch(`/api/test-drives/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true }),
      });
      setStep('complete');
    } catch {
      // Silently handle skip errors
      setStep('complete');
    }
  };

  const handleComplete = () => {
    router.push(`/test-drive/${id}`);
  };

  const vehicleInfo = testDrive
    ? `${testDrive.vehicle.year} ${testDrive.vehicle.make} ${testDrive.vehicle.model}`
    : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  if (error && !testDrive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 shadow-sm max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Test Drive Feedback</h1>
              <p className="text-sm text-gray-500">{vehicleInfo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4">
        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  How was your test drive?
                </h2>
                <p className="text-gray-500 mt-2">
                  Share a quick voice note about your experience. It only takes 30 seconds!
                </p>
              </div>
            </div>

            <div className="bg-violet-50 rounded-lg p-4">
              <p className="text-sm text-violet-800">
                <span className="font-medium">Hi {testDrive?.customer.name}!</span> Your thoughts help us
                understand what matters most to you and improve our service.
              </p>
            </div>

            <button
              onClick={() => setStep('recording')}
              className="w-full py-4 px-6 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-3"
            >
              <Mic className="w-5 h-5" />
              Record Voice Feedback
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleSkip}
              className="w-full py-3 px-6 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              Maybe later
            </button>
          </div>
        )}

        {/* Step: Recording */}
        {step === 'recording' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <VoiceRecorder
              maxDuration={60}
              onRecordingComplete={handleRecordingComplete}
              onSkip={handleSkip}
              prompts={[
                'What did you like about the test drive?',
                'How did the car feel while driving?',
                'Any concerns or things that didn\'t feel right?',
                'What would help you make a decision?',
              ]}
            />

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-center space-y-6 py-8">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-violet-200" />
                <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
                <div className="absolute inset-4 rounded-full bg-violet-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-violet-600" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">Analyzing your feedback</h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Our AI is transcribing and extracting insights...
                </p>
              </div>

              <div className="space-y-2 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                  Transcribing voice...
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-4 h-4" />
                  Analyzing sentiment...
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-4 h-4" />
                  Extracting insights...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Insights */}
        {step === 'insights' && insights && (
          <div className="space-y-4">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">Feedback received!</p>
                <p className="text-sm text-green-700">Thank you for sharing your thoughts.</p>
              </div>
            </div>

            {/* Sentiment & Intent Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                AI Insights
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Sentiment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sentiment</p>
                  <div className="flex items-center gap-2">
                    {insights.overallSentiment === 'POSITIVE' && (
                      <>
                        <ThumbsUp className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-700">Positive</span>
                      </>
                    )}
                    {insights.overallSentiment === 'NEUTRAL' && (
                      <>
                        <Minus className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-amber-700">Neutral</span>
                      </>
                    )}
                    {insights.overallSentiment === 'NEGATIVE' && (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-700">Negative</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Buying Intent */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Buying Intent</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className={`w-5 h-5 ${
                      insights.buyingIntent === 'HIGH' ? 'text-green-600' :
                      insights.buyingIntent === 'MEDIUM' ? 'text-amber-600' :
                      'text-gray-400'
                    }`} />
                    <span className={`font-medium ${
                      insights.buyingIntent === 'HIGH' ? 'text-green-700' :
                      insights.buyingIntent === 'MEDIUM' ? 'text-amber-700' :
                      'text-gray-600'
                    }`}>
                      {insights.buyingIntent}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Positives */}
              {insights.keyPositives.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                    What they liked
                  </p>
                  <div className="space-y-1">
                    {insights.keyPositives.map((positive, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-green-50 rounded-lg px-3 py-2">
                        {positive}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Objections */}
              {insights.mainObjections.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Concerns raised
                  </p>
                  <div className="space-y-1">
                    {insights.mainObjections.map((objection, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-amber-50 rounded-lg px-3 py-2">
                        {objection}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Probability Change */}
              {insights.probabilityDelta !== 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    {insights.probabilityDelta > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    Deal Intelligence Update
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">Close probability:</span>
                    <span className="font-medium">
                      {insights.closeProbabilityBefore}%
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className={`font-bold ${
                      insights.probabilityDelta > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {insights.closeProbabilityAfter}%
                      <span className="text-xs ml-1">
                        ({insights.probabilityDelta > 0 ? '+' : ''}{insights.probabilityDelta}%)
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Recommended Action */}
            {insights.recommendedAction && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-violet-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Recommended Next Step
                </p>
                <p className="text-violet-800 font-medium">{insights.recommendedAction}</p>
                {insights.actionRationale && (
                  <p className="text-sm text-violet-600">{insights.actionRationale}</p>
                )}
              </div>
            )}

            {/* Done Button */}
            <button
              onClick={handleComplete}
              className="w-full py-4 px-6 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Step: Complete (skipped) */}
        {step === 'complete' && !insights && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No problem!</h3>
              <p className="text-gray-500 mt-1">
                You can share feedback anytime from your customer portal.
              </p>
            </div>
            <button
              onClick={handleComplete}
              className="w-full py-3 px-6 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
