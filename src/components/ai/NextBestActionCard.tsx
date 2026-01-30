import { HTMLAttributes, forwardRef } from 'react';
import { Phone, MessageSquare, Mail, User } from 'lucide-react';
import { NextBestAction, Urgency, Channel } from '@/types';
import { Button } from '@/components/ui';

interface NextBestActionCardProps extends HTMLAttributes<HTMLDivElement> {
  action: NextBestAction;
  onTakeAction?: () => void;
  onDismiss?: () => void;
}

const channelIcons: Record<Channel, React.ElementType> = {
  CALL: Phone,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
  IN_PERSON: User,
  SYSTEM: MessageSquare,
};

const urgencyStyles: Record<Urgency, { border: string; bg: string; label: string }> = {
  NOW: { border: 'border-l-red-500', bg: 'bg-red-50', label: 'Act Now' },
  TODAY: { border: 'border-l-orange-500', bg: 'bg-orange-50', label: 'Today' },
  THIS_WEEK: { border: 'border-l-[#7c3aed]', bg: 'bg-[#f5f3ff]', label: 'This Week' },
};

const channelLabels: Record<Channel, string> = {
  CALL: 'Phone Call',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  IN_PERSON: 'In Person',
  SYSTEM: 'System',
};

export const NextBestActionCard = forwardRef<HTMLDivElement, NextBestActionCardProps>(
  ({ action, onTakeAction, onDismiss, className = '', ...props }, ref) => {
    const urgencyStyle = urgencyStyles[action.urgency];
    const ChannelIcon = channelIcons[action.channel];

    return (
      <div
        ref={ref}
        className={`rounded-lg border-l-4 p-4 ${urgencyStyle.border} ${urgencyStyle.bg} ${className}`}
        {...props}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <ChannelIcon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500">{channelLabels[action.channel]}</span>
              <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-xs font-medium text-gray-600">
                {urgencyStyle.label}
              </span>
            </div>
          </div>
        </div>

        {/* Action */}
        <h4 className="mb-2 font-semibold text-gray-900">{action.action}</h4>

        {/* Suggested Message */}
        {action.suggestedMessage && (
          <p className="mb-3 text-sm italic text-gray-600">"{action.suggestedMessage}"</p>
        )}

        {/* Impact & Reasoning */}
        <div className="mb-4 space-y-1">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Impact:</span> {action.expectedImpact}
          </p>
          <p className="text-xs text-gray-500">{action.reasoning}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={onTakeAction}>
            Take Action
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    );
  }
);

NextBestActionCard.displayName = 'NextBestActionCard';
