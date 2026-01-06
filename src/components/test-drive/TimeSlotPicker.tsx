'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotPickerProps {
  vehicleId: string;
  selectedDate: string | null;
  selectedTime: string | null;
  onDateChange: (date: string | null) => void;
  onTimeChange: (time: string | null) => void;
  className?: string;
}

export function TimeSlotPicker({
  vehicleId,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  className = '',
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate next 7 days
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate || !vehicleId) {
      setSlots([]);
      return;
    }

    async function fetchSlots() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/test-drives/available-slots?vehicleId=${vehicleId}&date=${selectedDate}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch available slots');
        }

        const { data } = await response.json();
        setSlots(data.slots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load slots');
        setSlots([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSlots();
  }, [vehicleId, selectedDate]);

  // Reset time when date changes
  useEffect(() => {
    onTimeChange(null);
  }, [selectedDate, onTimeChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-[#f8fafc] mb-3">
          <Calendar className="w-4 h-4 inline mr-2 text-[#0ea5e9]" />
          Select Date
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => onDateChange(d.date)}
              className={`flex-shrink-0 px-4 py-3 rounded-lg text-center transition-colors ${
                selectedDate === d.date
                  ? 'bg-[#0ea5e9] text-white'
                  : 'bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8]'
              }`}
            >
              <p className="text-xs font-medium">{d.label}</p>
              <p className="text-lg font-bold">{d.day}</p>
              <p className="text-xs">{d.month}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-[#f8fafc] mb-3">
            <Clock className="w-4 h-4 inline mr-2 text-[#0ea5e9]" />
            Select Time
          </label>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#0ea5e9] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400">
              {error}
            </div>
          ) : slots.length === 0 ? (
            <div className="bg-[#1e293b] rounded-lg p-6 text-center text-[#94a3b8]">
              No available slots for this date
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => slot.available && onTimeChange(slot.time)}
                  disabled={!slot.available}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedTime === slot.time
                      ? 'bg-[#0ea5e9] text-white'
                      : slot.available
                        ? 'bg-[#1e293b] hover:bg-[#334155] text-white'
                        : 'bg-[#1e293b] text-[#475569] cursor-not-allowed line-through'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Summary */}
      {selectedDate && selectedTime && (
        <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg p-4">
          <p className="text-[#22c55e] font-medium">
            Scheduled: {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })} at {selectedTime}
          </p>
        </div>
      )}
    </div>
  );
}
