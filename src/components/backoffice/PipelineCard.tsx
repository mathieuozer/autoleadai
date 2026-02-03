'use client';

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  change?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: string;
}

interface PipelineCardProps {
  stage: PipelineStage;
  onClick?: (id: string) => void;
  className?: string;
}

export function PipelineCard({ stage, onClick, className = '' }: PipelineCardProps) {
  const bgColor = stage.color || '#7c3aed';

  return (
    <button
      onClick={() => onClick?.(stage.id)}
      className={`bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all text-left w-full ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{stage.name}</span>
        {stage.change && (
          <span
            className={`text-xs font-medium ${
              stage.change.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {stage.change.direction === 'up' ? '+' : '-'}{stage.change.value}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-3">{stage.count}</div>
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min((stage.count / 50) * 100, 100)}%`,
            backgroundColor: bgColor,
          }}
        />
      </div>
    </button>
  );
}

interface PipelineStageCardsProps {
  stages: PipelineStage[];
  onStageClick?: (id: string) => void;
  className?: string;
}

export function PipelineStageCards({ stages, onStageClick, className = '' }: PipelineStageCardsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${className}`}>
      {stages.map((stage) => (
        <PipelineCard key={stage.id} stage={stage} onClick={onStageClick} />
      ))}
    </div>
  );
}
