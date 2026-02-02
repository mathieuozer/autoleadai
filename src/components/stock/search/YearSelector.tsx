'use client';

interface YearData {
  year: number;
  variantCount: number;
  stockCount: number;
}

interface YearSelectorProps {
  years: YearData[];
  selectedYear?: number;
  onSelect: (year: number) => void;
  isLoading?: boolean;
}

export function YearSelector({
  years,
  selectedYear,
  onSelect,
  isLoading,
}: YearSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-10 w-20 animate-pulse rounded-full bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <p className="text-sm text-gray-500">No years available</p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-600">Select Year</h3>
      <div className="flex flex-wrap gap-3">
        {years.map(({ year, variantCount, stockCount }) => (
          <button
            key={year}
            onClick={() => onSelect(year)}
            className={`
              group relative flex flex-col items-center rounded-full px-6 py-2 transition-all
              ${
                selectedYear === year
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-violet-100 hover:text-violet-700'
              }
            `}
          >
            <span className="text-lg font-semibold">{year}</span>
            <span
              className={`text-xs ${
                selectedYear === year ? 'text-violet-200' : 'text-gray-500'
              }`}
            >
              {stockCount} in stock
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
