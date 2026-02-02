'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BrandSelector } from './BrandSelector';
import { ModelSelector } from './ModelSelector';
import { YearSelector } from './YearSelector';
import { VariantSelector } from './VariantSelector';
import { ColorSwatchGrid } from './ColorSwatchGrid';
import { PricingCard } from './PricingCard';
import { AIColorRecommendation } from './AIColorRecommendation';

interface ProgressiveSearchProps {
  onComplete?: (selection: StockSelection) => void;
}

interface StockSelection {
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  year: number;
  variantId: string;
  variantName: string;
  exteriorColorId: string;
  exteriorColorName: string;
  interiorColorId: string;
  interiorColorName: string;
  price: number;
}

export function ProgressiveSearch({ onComplete }: ProgressiveSearchProps) {
  // Selection state
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedExterior, setSelectedExterior] = useState<any>(null);
  const [selectedInterior, setSelectedInterior] = useState<any>(null);

  // Data state
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [colorData, setColorData] = useState<any>(null);
  const [pricingData, setPricingData] = useState<any>(null);

  // Loading state
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingColors, setLoadingColors] = useState(false);

  // Fetch brands on mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      fetchModels(selectedBrand.id);
    }
  }, [selectedBrand]);

  // Fetch years when model changes
  useEffect(() => {
    if (selectedModel) {
      fetchYears(selectedModel.id);
    }
  }, [selectedModel]);

  // Fetch variants when year changes
  useEffect(() => {
    if (selectedModel && selectedYear) {
      fetchVariants(selectedModel.id, selectedYear);
    }
  }, [selectedModel, selectedYear]);

  // Fetch colors and pricing when variant changes
  useEffect(() => {
    if (selectedVariant) {
      fetchColors(selectedVariant.id);
      fetchPricing(selectedVariant.id);
    }
  }, [selectedVariant]);

  const fetchBrands = async () => {
    setLoadingBrands(true);
    try {
      const res = await fetch('/api/stock/brands');
      const data = await res.json();
      if (data.success) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchModels = async (brandId: string) => {
    setLoadingModels(true);
    setSelectedModel(null);
    setSelectedYear(null);
    setSelectedVariant(null);
    setModels([]);
    setYears([]);
    setVariants([]);
    setColorData(null);
    setPricingData(null);

    try {
      const res = await fetch(`/api/stock/brands/${brandId}/models`);
      const data = await res.json();
      if (data.success) {
        setModels(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchYears = async (modelId: string) => {
    setLoadingYears(true);
    setSelectedYear(null);
    setSelectedVariant(null);
    setYears([]);
    setVariants([]);
    setColorData(null);
    setPricingData(null);

    try {
      const res = await fetch(`/api/stock/models/${modelId}/years`);
      const data = await res.json();
      if (data.success) {
        setYears(data.data.years);
      }
    } catch (error) {
      console.error('Failed to fetch years:', error);
    } finally {
      setLoadingYears(false);
    }
  };

  const fetchVariants = async (modelId: string, year: number) => {
    setLoadingVariants(true);
    setSelectedVariant(null);
    setVariants([]);
    setColorData(null);
    setPricingData(null);

    try {
      const res = await fetch(`/api/stock/models/${modelId}/variants?year=${year}`);
      const data = await res.json();
      if (data.success) {
        setVariants(data.data.variants);
      }
    } catch (error) {
      console.error('Failed to fetch variants:', error);
    } finally {
      setLoadingVariants(false);
    }
  };

  const fetchColors = async (variantId: string) => {
    setLoadingColors(true);
    setSelectedExterior(null);
    setSelectedInterior(null);

    try {
      const res = await fetch(`/api/stock/variants/${variantId}/colors`);
      const data = await res.json();
      if (data.success) {
        setColorData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch colors:', error);
    } finally {
      setLoadingColors(false);
    }
  };

  const fetchPricing = async (variantId: string) => {
    try {
      const res = await fetch(`/api/stock/variants/${variantId}/pricing`);
      const data = await res.json();
      if (data.success) {
        setPricingData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  };

  const handleComplete = () => {
    if (!selectedBrand || !selectedModel || !selectedYear || !selectedVariant ||
        !selectedExterior || !selectedInterior) {
      return;
    }

    const selection: StockSelection = {
      brandId: selectedBrand.id,
      brandName: selectedBrand.name,
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      year: selectedYear,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      exteriorColorId: selectedExterior.id,
      exteriorColorName: selectedExterior.name,
      interiorColorId: selectedInterior.id,
      interiorColorName: selectedInterior.name,
      price: pricingData?.pricing?.effectivePrice || selectedVariant.currentPrice,
    };

    onComplete?.(selection);
  };

  const handleReset = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedYear(null);
    setSelectedVariant(null);
    setSelectedExterior(null);
    setSelectedInterior(null);
    setModels([]);
    setYears([]);
    setVariants([]);
    setColorData(null);
    setPricingData(null);
  };

  const isComplete = selectedBrand && selectedModel && selectedYear &&
    selectedVariant && selectedExterior && selectedInterior;

  // Breadcrumb
  const breadcrumb = [
    selectedBrand?.name,
    selectedModel?.name,
    selectedYear,
    selectedVariant?.name,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Reset */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {breadcrumb.map((item, idx) => (
              <span key={idx} className="flex items-center gap-2">
                {idx > 0 && <span className="text-gray-400">/</span>}
                <span className={idx === breadcrumb.length - 1 ? 'text-violet-600 font-medium' : 'text-gray-600'}>
                  {item}
                </span>
              </span>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Start Over
          </Button>
        </div>
      )}

      {/* Step 1: Brand Selection */}
      <BrandSelector
        brands={brands}
        selectedBrandId={selectedBrand?.id}
        onSelect={setSelectedBrand}
        isLoading={loadingBrands}
      />

      {/* Step 2: Model Selection */}
      {selectedBrand && (
        <ModelSelector
          models={models}
          selectedModelId={selectedModel?.id}
          onSelect={setSelectedModel}
          brandName={selectedBrand.name}
          isLoading={loadingModels}
        />
      )}

      {/* Step 3: Year Selection */}
      {selectedModel && (
        <YearSelector
          years={years}
          selectedYear={selectedYear || undefined}
          onSelect={setSelectedYear}
          isLoading={loadingYears}
        />
      )}

      {/* Step 4: Variant Selection */}
      {selectedYear && (
        <VariantSelector
          variants={variants}
          selectedVariantId={selectedVariant?.id}
          onSelect={setSelectedVariant}
          modelName={selectedModel?.name}
          isLoading={loadingVariants}
        />
      )}

      {/* Step 5: Color Selection with AI Recommendation */}
      {selectedVariant && colorData && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {/* AI Recommendation */}
            {colorData.bestColorRecommendation && (
              <AIColorRecommendation
                recommendation={colorData.bestColorRecommendation}
                exteriorColorName={
                  colorData.exteriorColors.find(
                    (c: any) => c.id === colorData.bestColorRecommendation.exteriorColorId
                  )?.name
                }
                interiorColorName={
                  colorData.exteriorColors
                    .find((c: any) => c.id === colorData.bestColorRecommendation.exteriorColorId)
                    ?.interiorOptions.find(
                      (i: any) => i.id === colorData.bestColorRecommendation.interiorColorId
                    )?.name
                }
                onSelect={() => {
                  const exterior = colorData.exteriorColors.find(
                    (c: any) => c.id === colorData.bestColorRecommendation.exteriorColorId
                  );
                  if (exterior) {
                    setSelectedExterior(exterior);
                    const interior = exterior.interiorOptions.find(
                      (i: any) => i.id === colorData.bestColorRecommendation.interiorColorId
                    );
                    if (interior) {
                      setSelectedInterior(interior);
                    }
                  }
                }}
              />
            )}

            {/* Color Swatches */}
            <Card>
              <ColorSwatchGrid
                exteriorColors={colorData.exteriorColors}
                selectedExteriorId={selectedExterior?.id}
                selectedInteriorId={selectedInterior?.id}
                onSelectExterior={setSelectedExterior}
                onSelectInterior={setSelectedInterior}
                isLoading={loadingColors}
              />
            </Card>
          </div>

          {/* Pricing Card */}
          <div>
            <PricingCard
              variant={pricingData?.variant}
              pricing={pricingData?.pricing}
              activeCampaign={pricingData?.activeCampaign}
              allCampaigns={pricingData?.allCampaigns}
            />
          </div>
        </div>
      )}

      {/* Complete Selection */}
      {isComplete && (
        <div className="flex justify-end">
          <Button size="lg" onClick={handleComplete}>
            Continue with Selection
          </Button>
        </div>
      )}
    </div>
  );
}
