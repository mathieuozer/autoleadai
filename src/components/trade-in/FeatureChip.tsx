'use client';

interface FeatureChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function FeatureChip({ label, selected, onToggle }: FeatureChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        px-3 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${
          selected
            ? 'bg-[#0ea5e9]/10 border border-[#0ea5e9] text-white'
            : 'bg-[#334155] border border-[#475569] text-[#94a3b8] hover:border-[#64748b] hover:text-white'
        }
      `}
    >
      {label}
    </button>
  );
}

// Multi-select wrapper component
interface FeatureChipsProps {
  features: readonly string[] | string[];
  selectedFeatures: string[];
  onToggle: (feature: string) => void;
}

export function FeatureChips({ features, selectedFeatures, onToggle }: FeatureChipsProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#f8fafc]">
        Vehicle Features
      </label>
      <div className="flex flex-wrap gap-2">
        {features.map((feature) => (
          <FeatureChip
            key={feature}
            label={feature}
            selected={selectedFeatures.includes(feature)}
            onToggle={() => onToggle(feature)}
          />
        ))}
      </div>
    </div>
  );
}
