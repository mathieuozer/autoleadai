'use client';

import { Phone, MessageSquare, Mail, User, Car, FileText, Clock } from 'lucide-react';
import { Badge } from '@/components/ui';

interface Activity {
  id: string;
  type: string;
  channel: string;
  summary: string;
  details?: string | null;
  sentiment?: string | null;
  performedAt: string;
  duration?: number | null;
  performedBy?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const activityIcons: Record<string, React.ReactNode> = {
  CALL_OUTBOUND: <Phone className="h-4 w-4" />,
  CALL_INBOUND: <Phone className="h-4 w-4" />,
  WHATSAPP_SENT: <MessageSquare className="h-4 w-4" />,
  WHATSAPP_RECEIVED: <MessageSquare className="h-4 w-4" />,
  EMAIL_SENT: <Mail className="h-4 w-4" />,
  EMAIL_RECEIVED: <Mail className="h-4 w-4" />,
  VISIT: <User className="h-4 w-4" />,
  TEST_DRIVE: <Car className="h-4 w-4" />,
  STATUS_CHANGE: <FileText className="h-4 w-4" />,
  NOTE: <FileText className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  CALL_OUTBOUND: 'bg-blue-100 text-blue-600',
  CALL_INBOUND: 'bg-blue-100 text-blue-600',
  WHATSAPP_SENT: 'bg-green-100 text-green-600',
  WHATSAPP_RECEIVED: 'bg-green-100 text-green-600',
  EMAIL_SENT: 'bg-purple-100 text-purple-600',
  EMAIL_RECEIVED: 'bg-purple-100 text-purple-600',
  VISIT: 'bg-orange-100 text-orange-600',
  TEST_DRIVE: 'bg-cyan-100 text-cyan-600',
  STATUS_CHANGE: 'bg-gray-100 text-gray-600',
  NOTE: 'bg-yellow-100 text-yellow-600',
};

const sentimentColors: Record<string, 'success' | 'warning' | 'danger'> = {
  POSITIVE: 'success',
  NEUTRAL: 'warning',
  NEGATIVE: 'danger',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatActivityType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        <p>No activities recorded yet</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {index !== activities.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      activityColors[activity.type] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {activityIcons[activity.type] || <FileText className="h-4 w-4" />}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.summary}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatActivityType(activity.type)}
                      </span>
                      {activity.sentiment && (
                        <Badge
                          variant={sentimentColors[activity.sentiment] || 'default'}
                          size="sm"
                        >
                          {activity.sentiment.toLowerCase()}
                        </Badge>
                      )}
                      {activity.duration && (
                        <span className="text-xs text-gray-400">
                          {formatDuration(activity.duration)}
                        </span>
                      )}
                    </div>
                    {activity.details && (
                      <p className="mt-1 text-sm text-gray-500">{activity.details}</p>
                    )}
                    {activity.performedBy && (
                      <p className="mt-1 text-xs text-gray-400">
                        by {activity.performedBy.name}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-500">
                    <time dateTime={activity.performedAt}>
                      {formatRelativeTime(activity.performedAt)}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
