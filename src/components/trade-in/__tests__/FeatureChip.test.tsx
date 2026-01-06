import { render, screen, fireEvent } from '@testing-library/react';
import { FeatureChip, FeatureChips } from '../FeatureChip';

describe('FeatureChip', () => {
  it('renders the label', () => {
    render(<FeatureChip label="Sunroof" selected={false} onToggle={() => {}} />);
    expect(screen.getByText('Sunroof')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = jest.fn();
    render(<FeatureChip label="Sunroof" selected={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByText('Sunroof'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when selected is true', () => {
    const { container } = render(
      <FeatureChip label="Sunroof" selected={true} onToggle={() => {}} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('border-[#0ea5e9]');
    expect(button).toHaveClass('text-white');
  });

  it('applies unselected styles when selected is false', () => {
    const { container } = render(
      <FeatureChip label="Sunroof" selected={false} onToggle={() => {}} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('border-[#475569]');
    expect(button).toHaveClass('text-[#94a3b8]');
  });
});

describe('FeatureChips', () => {
  const features = ['Sunroof', 'Cruise Control', 'Leather Seats'] as const;

  it('renders all features', () => {
    render(
      <FeatureChips
        features={features}
        selectedFeatures={[]}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Sunroof')).toBeInTheDocument();
    expect(screen.getByText('Cruise Control')).toBeInTheDocument();
    expect(screen.getByText('Leather Seats')).toBeInTheDocument();
  });

  it('renders label', () => {
    render(
      <FeatureChips
        features={features}
        selectedFeatures={[]}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Vehicle Features')).toBeInTheDocument();
  });

  it('marks selected features correctly', () => {
    const { container } = render(
      <FeatureChips
        features={features}
        selectedFeatures={['Sunroof', 'Leather Seats']}
        onToggle={() => {}}
      />
    );

    // Two features should have selected styling
    const selectedButtons = container.querySelectorAll('.border-\\[\\#0ea5e9\\]');
    expect(selectedButtons.length).toBe(2);
  });

  it('calls onToggle with correct feature when clicked', () => {
    const onToggle = jest.fn();
    render(
      <FeatureChips
        features={features}
        selectedFeatures={[]}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByText('Cruise Control'));
    expect(onToggle).toHaveBeenCalledWith('Cruise Control');
  });
});
