import { PageContainer } from '@/components/layout';
import { AlertCircle, Phone, MessageSquare, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  return (
    <PageContainer
      title="Good morning!"
      subtitle="Here's what you need to focus on today"
    >
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <SummaryCard
          label="High Risk Orders"
          value={2}
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          bgColor="bg-red-50"
        />
        <SummaryCard
          label="Calls Today"
          value={5}
          icon={<Phone className="h-5 w-5 text-blue-500" />}
          bgColor="bg-blue-50"
        />
        <SummaryCard
          label="Messages Pending"
          value={3}
          icon={<MessageSquare className="h-5 w-5 text-orange-500" />}
          bgColor="bg-orange-50"
        />
        <SummaryCard
          label="Conversion Rate"
          value="78%"
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          bgColor="bg-green-50"
        />
      </div>

      {/* Priority List Placeholder */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-[#2563eb]">Today's Priority List</h2>
        <p className="text-sm text-gray-500">
          AI-powered priority list will be displayed here. This shows orders ranked by risk
          score with next-best-action recommendations.
        </p>

        {/* Placeholder items */}
        <div className="mt-6 space-y-4">
          <PriorityItemPlaceholder
            rank={1}
            customer="Ahmed Al-Rashid"
            vehicle="Toyota Camry 2024"
            riskLevel="HIGH"
            action="Call about financing - pending 4 days"
          />
          <PriorityItemPlaceholder
            rank={2}
            customer="Sara Mohammed"
            vehicle="Honda Accord 2024"
            riskLevel="HIGH"
            action="Notify about delivery delay"
          />
          <PriorityItemPlaceholder
            rank={3}
            customer="Omar Hassan"
            vehicle="Nissan Altima 2024"
            riskLevel="MEDIUM"
            action="Check-in message - no contact for 8 days"
          />
        </div>
      </div>
    </PageContainer>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  bgColor,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function PriorityItemPlaceholder({
  rank,
  customer,
  vehicle,
  riskLevel,
  action,
}: {
  rank: number;
  customer: string;
  vehicle: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
}) {
  const riskColors = {
    HIGH: 'bg-red-50 text-red-700 border-l-red-500',
    MEDIUM: 'bg-orange-50 text-orange-700 border-l-orange-500',
    LOW: 'bg-green-50 text-green-700 border-l-green-500',
  };

  return (
    <div className={`rounded-lg border-l-4 p-4 ${riskColors[riskLevel]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold">
            {rank}
          </span>
          <div>
            <p className="font-medium text-gray-900">{customer}</p>
            <p className="text-sm text-gray-500">{vehicle}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`risk-badge ${riskLevel.toLowerCase()}`}>{riskLevel} RISK</span>
        </div>
      </div>
      <p className="mt-2 text-sm">{action}</p>
      <div className="mt-3 flex gap-2">
        <button className="btn-primary text-xs">Take Action</button>
        <button className="btn-outline text-xs">View Details</button>
      </div>
    </div>
  );
}
