import { render, screen } from '@testing-library/react';
import { RiskBadge } from '../RiskBadge';

describe('RiskBadge', () => {
  it('renders HIGH risk level correctly', () => {
    render(<RiskBadge level="HIGH" />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('renders MEDIUM risk level correctly', () => {
    render(<RiskBadge level="MEDIUM" />);
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
  });

  it('renders LOW risk level correctly', () => {
    render(<RiskBadge level="LOW" />);
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });

  it('renders just the level when showLabel is false', () => {
    render(<RiskBadge level="HIGH" showLabel={false} />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.queryByText('High Risk')).not.toBeInTheDocument();
  });

  it('applies HIGH risk styles', () => {
    render(<RiskBadge level="HIGH" />);
    const badge = screen.getByText('High Risk');
    expect(badge).toHaveClass('bg-red-50', 'text-red-700');
  });

  it('applies MEDIUM risk styles', () => {
    render(<RiskBadge level="MEDIUM" />);
    const badge = screen.getByText('Medium Risk');
    expect(badge).toHaveClass('bg-orange-50', 'text-orange-700');
  });

  it('applies LOW risk styles', () => {
    render(<RiskBadge level="LOW" />);
    const badge = screen.getByText('Low Risk');
    expect(badge).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('applies small size by default', () => {
    render(<RiskBadge level="HIGH" />);
    const badge = screen.getByText('High Risk');
    expect(badge).toHaveClass('text-xs');
  });

  it('applies medium size when specified', () => {
    render(<RiskBadge level="HIGH" size="md" />);
    const badge = screen.getByText('High Risk');
    expect(badge).toHaveClass('text-sm');
  });

  it('applies custom className', () => {
    render(<RiskBadge level="HIGH" className="custom-class" />);
    expect(screen.getByText('High Risk')).toHaveClass('custom-class');
  });

  it('has rounded-full for pill shape', () => {
    render(<RiskBadge level="HIGH" />);
    expect(screen.getByText('High Risk')).toHaveClass('rounded-full');
  });
});
