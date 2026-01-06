import { render, screen } from '@testing-library/react';
import { Stepper } from '../Stepper';
import { WizardStep } from '@/types';

const mockSteps: WizardStep[] = [
  { number: 1, label: 'Registration', sublabel: 'Scan card', status: 'completed' },
  { number: 2, label: 'Details', sublabel: 'Vehicle specs', status: 'current' },
  { number: 3, label: 'Photos', sublabel: 'Upload images', status: 'upcoming' },
  { number: 4, label: 'Review', sublabel: 'Submit', status: 'upcoming' },
];

describe('Stepper', () => {
  it('renders all steps', () => {
    render(<Stepper steps={mockSteps} currentStep={2} />);

    expect(screen.getByText('Registration')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Photos')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('renders step sublabels', () => {
    render(<Stepper steps={mockSteps} currentStep={2} />);

    expect(screen.getByText('Scan card')).toBeInTheDocument();
    expect(screen.getByText('Vehicle specs')).toBeInTheDocument();
    expect(screen.getByText('Upload images')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('shows checkmark for completed steps', () => {
    render(<Stepper steps={mockSteps} currentStep={2} />);

    // The first step should have a checkmark (completed)
    const checkmarks = document.querySelectorAll('svg');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('displays step numbers for non-completed steps', () => {
    render(<Stepper steps={mockSteps} currentStep={1} />);

    // When current step is 1, steps 2, 3, 4 should show numbers
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('applies correct styling for current step', () => {
    const { container } = render(<Stepper steps={mockSteps} currentStep={2} />);

    // Current step circle should have cyan background
    const circles = container.querySelectorAll('.bg-\\[\\#0ea5e9\\]');
    expect(circles.length).toBe(1); // Only one current step
  });

  it('applies correct styling for completed steps', () => {
    const { container } = render(<Stepper steps={mockSteps} currentStep={3} />);

    // Completed step circles should have green background (rounded-full elements)
    const completedCircles = container.querySelectorAll('.rounded-full.bg-\\[\\#22c55e\\]');
    expect(completedCircles.length).toBe(2); // Steps 1 and 2 are completed
  });

  it('applies correct styling for upcoming steps', () => {
    const { container } = render(<Stepper steps={mockSteps} currentStep={1} />);

    // Upcoming step circles should have slate background (rounded-full elements)
    const upcomingCircles = container.querySelectorAll('.rounded-full.bg-\\[\\#334155\\]');
    expect(upcomingCircles.length).toBe(3); // Steps 2, 3, 4 are upcoming
  });
});
