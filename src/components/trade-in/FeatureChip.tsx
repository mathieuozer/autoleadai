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
            ? 'bg-[#2563eb]/10 border border-[#2563eb] text-white'
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

// Light theme version
function LightFeatureChip({ label, selected, onToggle }: FeatureChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        px-3 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${
          selected
            ? 'bg-blue-50 border border-blue-600 text-blue-600'
            : 'bg-gray-50 border border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'
        }
      `}
    >
      {label}
    </button>
  );
}

export function LightFeatureChips({ features, selectedFeatures, onToggle }: FeatureChipsProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Vehicle Features
      </label>
      <div className="flex flex-wrap gap-2">
        {features.map((feature) => (
          <LightFeatureChip
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
