import { render, screen, fireEvent } from '@testing-library/react';
import { ConditionSelector } from '../ConditionSelector';
import { CONDITION_OPTIONS } from '@/lib/trade-in-constants';

describe('ConditionSelector', () => {
  it('renders all condition options', () => {
    const onChange = jest.fn();
    render(<ConditionSelector value={null} onChange={onChange} />);

    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });

  it('renders descriptions for each option', () => {
    const onChange = jest.fn();
    render(<ConditionSelector value={null} onChange={onChange} />);

    expect(screen.getByText('Like new, minimal wear')).toBeInTheDocument();
    expect(screen.getByText('Minor cosmetic issues')).toBeInTheDocument();
    expect(screen.getByText('Visible wear, runs well')).toBeInTheDocument();
    expect(screen.getByText('Significant issues')).toBeInTheDocument();
  });

  it('calls onChange when an option is clicked', () => {
    const onChange = jest.fn();
    render(<ConditionSelector value={null} onChange={onChange} />);

    fireEvent.click(screen.getByText('Excellent'));
    expect(onChange).toHaveBeenCalledWith('excellent');

    fireEvent.click(screen.getByText('Good'));
    expect(onChange).toHaveBeenCalledWith('good');
  });

  it('highlights the selected option', () => {
    const onChange = jest.fn();
    const { container } = render(<ConditionSelector value="good" onChange={onChange} />);

    // Selected option should have cyan border
    const selectedButtons = container.querySelectorAll('.border-\\[\\#0ea5e9\\]');
    expect(selectedButtons.length).toBe(1);
  });

  it('shows checkmark for selected option', () => {
    const onChange = jest.fn();
    render(<ConditionSelector value="excellent" onChange={onChange} />);

    // Should have a checkmark SVG
    const checkmarks = document.querySelectorAll('svg');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('renders label', () => {
    const onChange = jest.fn();
    render(<ConditionSelector value={null} onChange={onChange} />);

    expect(screen.getByText('Vehicle Condition')).toBeInTheDocument();
  });

  it('accepts custom options', () => {
    const onChange = jest.fn();
    const customOptions = [
      { value: 'excellent' as const, label: 'New', description: 'Brand new car' },
      { value: 'good' as const, label: 'Used', description: 'Pre-owned vehicle' },
    ];

    render(
      <ConditionSelector value={null} onChange={onChange} options={customOptions} />
    );

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
    expect(screen.getByText('Brand new car')).toBeInTheDocument();
    expect(screen.getByText('Pre-owned vehicle')).toBeInTheDocument();
  });
});
