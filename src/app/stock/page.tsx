'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { ProgressiveSearch } from '@/components/stock/search';
import { ArrowLeft, BarChart3 } from 'lucide-react';

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

export default function StockSearchPage() {
  const router = useRouter();
  const [selection, setSelection] = useState<StockSelection | null>(null);

  const handleComplete = (sel: StockSelection) => {
    setSelection(sel);
    // Store selection in sessionStorage for order creation
    sessionStorage.setItem('stockSelection', JSON.stringify(sel));
    // Redirect to order creation or show order form
    router.push('/orders/new');
  };

  return (
    <PageContainer
      title="Stock Search"
      subtitle="Find and select vehicles from inventory"
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/stock/intelligence">
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Stock Intelligence
          </Button>
        </Link>
      </div>

      <Card padding="lg">
        <ProgressiveSearch onComplete={handleComplete} />
      </Card>
    </PageContainer>
  );
}
