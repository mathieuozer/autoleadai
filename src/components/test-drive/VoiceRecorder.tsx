'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  RotateCcw,
  Play,
  Pause,
  Check,
  X,
  Volume2,
} from 'lucide-react';

interface VoiceRecorderProps {
  maxDuration?: number; // in seconds, default 60
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onSkip?: () => void;
  prompts?: string[];
  disabled?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing';

export function VoiceRecorder({
  maxDuration = 60,
  onRecordingComplete,
  onSkip,
  prompts = [
    'What did you like about the test drive?',
    'Was there anything that didn\'t feel right?',
    'Any other thoughts?',
  ],
  disabled = false,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Cycle through prompts while recording
  useEffect(() => {
    if (state === 'recording' && prompts.length > 1) {
      const promptInterval = setInterval(() => {
        setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
      }, 8000); // Change prompt every 8 seconds
      return () => clearInterval(promptInterval);
    }
  }, [state, prompts.length]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio analysis for visual feedback
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Animate audio level
      const updateLevel = () => {
        if (analyserRef.current && state === 'recording') {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          animationRef.current = requestAnimationFrame(updateLevel);
        }
      };

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setState('recorded');

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Clean up audio context
        audioContext.close();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      setState('recording');
      setDuration(0);
      setCurrentPromptIndex(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Start audio level animation
      animationRef.current = requestAnimationFrame(updateLevel);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setState('idle');
    setCurrentPromptIndex(0);
  }, [audioUrl]);

  const playRecording = useCallback(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setState('playing');
    }
  }, [audioUrl]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState('recorded');
    }
  }, []);

  const submitRecording = useCallback(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
    }
  }, [audioBlob, duration, onRecordingComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Prompt Display */}
      {state === 'idle' && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-violet-100 rounded-full flex items-center justify-center">
            <Mic className="w-10 h-10 text-violet-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Share Your Thoughts</h3>
            <p className="text-sm text-gray-500 mt-1">
              Record a short voice note (up to {maxDuration} seconds)
            </p>
          </div>
          <div className="bg-violet-50 rounded-lg p-4 text-left">
            <p className="text-sm font-medium text-violet-900 mb-2">What to share:</p>
            <ul className="text-sm text-violet-700 space-y-1">
              {prompts.map((prompt, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recording State */}
      {state === 'recording' && (
        <div className="text-center space-y-4">
          {/* Animated Recording Indicator */}
          <div className="relative w-32 h-32 mx-auto">
            {/* Pulsing rings */}
            <div
              className="absolute inset-0 rounded-full bg-red-200 animate-ping opacity-25"
              style={{ transform: `scale(${1 + audioLevel * 0.5})` }}
            />
            <div
              className="absolute inset-2 rounded-full bg-red-300 animate-pulse opacity-40"
              style={{ transform: `scale(${1 + audioLevel * 0.3})` }}
            />
            {/* Center circle */}
            <div className="absolute inset-4 rounded-full bg-red-500 flex items-center justify-center">
              <Mic className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Timer */}
          <div className="text-3xl font-mono font-bold text-gray-900">
            {formatTime(duration)}
            <span className="text-gray-400">/{formatTime(maxDuration)}</span>
          </div>

          {/* Current Prompt */}
          <div className="bg-gray-100 rounded-lg p-4 transition-all">
            <p className="text-sm text-gray-600 italic">
              &ldquo;{prompts[currentPromptIndex]}&rdquo;
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${(duration / maxDuration) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Recorded State */}
      {(state === 'recorded' || state === 'playing') && audioUrl && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <Volume2 className="w-10 h-10 text-green-600" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recording Complete</h3>
            <p className="text-sm text-gray-500 mt-1">
              Duration: {formatTime(duration)}
            </p>
          </div>

          {/* Audio Player */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setState('recorded')}
            className="hidden"
          />

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={state === 'playing' ? pausePlayback : playRecording}
              className="p-3 rounded-full bg-violet-100 text-violet-600 hover:bg-violet-200 transition-colors"
            >
              {state === 'playing' ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {state === 'idle' && (
          <>
            <button
              onClick={startRecording}
              disabled={disabled}
              className="w-full py-3 px-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Mic className="w-5 h-5" />
              Start Recording
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                disabled={disabled}
                className="w-full py-3 px-4 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
            )}
          </>
        )}

        {state === 'recording' && (
          <button
            onClick={stopRecording}
            className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Square className="w-5 h-5" />
            Stop Recording
          </button>
        )}

        {(state === 'recorded' || state === 'playing') && (
          <div className="flex gap-3">
            <button
              onClick={resetRecording}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Redo
            </button>
            <button
              onClick={submitRecording}
              className="flex-1 py-3 px-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
