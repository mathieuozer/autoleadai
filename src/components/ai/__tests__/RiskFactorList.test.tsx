import { render, screen } from '@testing-library/react';
import { RiskFactorList } from '../RiskFactorList';
import { RiskFactor } from '@/types';

const mockFactors: RiskFactor[] = [
  { factor: 'silence', impact: 20, description: 'No contact for 8 days' },
  { factor: 'financing', impact: 25, description: 'Financing pending for 4 days' },
  { factor: 'delay', impact: 15, description: 'Delivery delayed by 5 days' },
];

describe('RiskFactorList', () => {
  it('renders the title', () => {
    render(<RiskFactorList factors={mockFactors} />);
    expect(screen.getByText('Risk Factors')).toBeInTheDocument();
  });

  it('renders all factors', () => {
    render(<RiskFactorList factors={mockFactors} />);
    expect(screen.getByText('No contact for 8 days')).toBeInTheDocument();
    expect(screen.getByText('Financing pending for 4 days')).toBeInTheDocument();
    expect(screen.getByText('Delivery delayed by 5 days')).toBeInTheDocument();
  });

  it('renders impact values', () => {
    render(<RiskFactorList factors={mockFactors} />);
    expect(screen.getByText('+20')).toBeInTheDocument();
    expect(screen.getByText('+25')).toBeInTheDocument();
    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  it('sorts factors by impact (highest first)', () => {
    render(<RiskFactorList factors={mockFactors} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Financing pending');
    expect(items[1]).toHaveTextContent('No contact');
    expect(items[2]).toHaveTextContent('Delivery delayed');
  });

  it('renders nothing when factors array is empty', () => {
    const { container } = render(<RiskFactorList factors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    render(<RiskFactorList factors={mockFactors} className="custom-class" data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveClass('custom-class');
  });
});
