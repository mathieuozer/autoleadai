import { render, screen, fireEvent } from '@testing-library/react';
import { PriorityListItem } from '../PriorityListItem';
import { PriorityItem } from '@/types';

const mockItem: PriorityItem = {
  id: '1',
  orderId: 'order-1',
  order: {
    id: 'order-1',
    customerId: 'cust-1',
    vehicleId: 'veh-1',
    status: 'FINANCING_PENDING',
    source: 'WALK_IN',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    totalAmount: 50000,
    financingStatus: 'PENDING',
    riskScore: 78,
    fulfillmentProbability: 65,
    lastContactDaysAgo: 8,
    customer: {
      id: 'cust-1',
      name: 'Ahmed Al-Rashid',
      phone: '+971501234567',
    },
    vehicle: {
      id: 'veh-1',
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
    },
  },
  rank: 1,
  riskScore: 78,
  riskLevel: 'HIGH',
  riskFactors: [
    { factor: 'financing', impact: 25, description: 'Financing pending 4 days' },
  ],
  nextBestAction: {
    action: 'Call about financing status',
    channel: 'CALL',
    urgency: 'TODAY',
    expectedImpact: 'Reduces cancellation risk by 23%',
    reasoning: 'Approval probability drops after day 3',
  },
  generatedAt: '2024-01-10T06:00:00Z',
  expiresAt: '2024-01-11T06:00:00Z',
};

describe('PriorityListItem', () => {
  it('renders customer name', () => {
    render(<PriorityListItem item={mockItem} />);
    expect(screen.getByText('Ahmed Al-Rashid')).toBeInTheDocument();
  });

  it('renders vehicle info', () => {
    render(<PriorityListItem item={mockItem} />);
    expect(screen.getByText('Toyota Camry 2024')).toBeInTheDocument();
  });

  it('renders rank number', () => {
    render(<PriorityListItem item={mockItem} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders risk score', () => {
    render(<PriorityListItem item={mockItem} />);
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('Risk Score')).toBeInTheDocument();
  });

  it('renders risk badge', () => {
    render(<PriorityListItem item={mockItem} />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('renders recommended action', () => {
    render(<PriorityListItem item={mockItem} />);
    expect(screen.getByText('Call about financing status')).toBeInTheDocument();
  });

  it('renders expected impact', () => {
    render(<PriorityListItem item={mockItem} />);
    expect(screen.getByText('Reduces cancellation risk by 23%')).toBeInTheDocument();
  });

  it('calls onTakeAction when Take Action button is clicked', () => {
    const handleTakeAction = jest.fn();
    render(<PriorityListItem item={mockItem} onTakeAction={handleTakeAction} />);

    fireEvent.click(screen.getByRole('button', { name: /take action/i }));
    expect(handleTakeAction).toHaveBeenCalledTimes(1);
  });

  it('calls onViewDetails when View Details button is clicked', () => {
    const handleViewDetails = jest.fn();
    render(<PriorityListItem item={mockItem} onViewDetails={handleViewDetails} />);

    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(handleViewDetails).toHaveBeenCalledTimes(1);
  });

  it('applies HIGH risk border color', () => {
    render(<PriorityListItem item={mockItem} data-testid="item" />);
    expect(screen.getByTestId('item')).toHaveClass('border-l-red-500');
  });

  it('applies MEDIUM risk border color', () => {
    const mediumItem = { ...mockItem, riskLevel: 'MEDIUM' as const };
    render(<PriorityListItem item={mediumItem} data-testid="item" />);
    expect(screen.getByTestId('item')).toHaveClass('border-l-orange-500');
  });

  it('applies LOW risk border color', () => {
    const lowItem = { ...mockItem, riskLevel: 'LOW' as const };
    render(<PriorityListItem item={lowItem} data-testid="item" />);
    expect(screen.getByTestId('item')).toHaveClass('border-l-green-500');
  });

  it('applies custom className', () => {
    render(<PriorityListItem item={mockItem} className="custom-class" data-testid="item" />);
    expect(screen.getByTestId('item')).toHaveClass('custom-class');
  });
});
