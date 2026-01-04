import { render, screen } from '@testing-library/react';
import { PriorityScore } from '../PriorityScore';

describe('PriorityScore', () => {
  it('renders the score correctly', () => {
    render(<PriorityScore score={75} level="HIGH" />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('renders "Risk Score" label', () => {
    render(<PriorityScore score={50} level="MEDIUM" />);
    expect(screen.getByText('Risk Score')).toBeInTheDocument();
  });

  it('applies HIGH level color', () => {
    render(<PriorityScore score={80} level="HIGH" />);
    expect(screen.getByText('80')).toHaveClass('text-red-600');
  });

  it('applies MEDIUM level color', () => {
    render(<PriorityScore score={50} level="MEDIUM" />);
    expect(screen.getByText('50')).toHaveClass('text-orange-600');
  });

  it('applies LOW level color', () => {
    render(<PriorityScore score={20} level="LOW" />);
    expect(screen.getByText('20')).toHaveClass('text-green-600');
  });

  it('shows positive trend when score increased', () => {
    render(<PriorityScore score={80} previousScore={70} level="HIGH" />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('shows negative trend when score decreased', () => {
    render(<PriorityScore score={60} previousScore={70} level="MEDIUM" />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('does not show trend when no previous score', () => {
    render(<PriorityScore score={75} level="HIGH" />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders lastUpdated when provided', () => {
    render(<PriorityScore score={75} level="HIGH" lastUpdated="5 mins ago" />);
    expect(screen.getByText('Updated 5 mins ago')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<PriorityScore score={75} level="HIGH" className="custom-class" />);
    const container = screen.getByText('75').parentElement?.parentElement;
    expect(container).toHaveClass('custom-class');
  });
});
