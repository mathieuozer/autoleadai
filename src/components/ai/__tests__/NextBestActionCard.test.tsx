import { render, screen, fireEvent } from '@testing-library/react';
import { NextBestActionCard } from '../NextBestActionCard';
import { NextBestAction } from '@/types';

const mockAction: NextBestAction = {
  action: 'Call customer about financing',
  channel: 'CALL',
  urgency: 'NOW',
  suggestedMessage: 'Hi, following up on your financing application...',
  expectedImpact: 'Reduces cancellation risk by 23%',
  reasoning: 'Financing pending for 4 days, approval probability drops after day 3',
};

describe('NextBestActionCard', () => {
  it('renders the action title', () => {
    render(<NextBestActionCard action={mockAction} />);
    expect(screen.getByText('Call customer about financing')).toBeInTheDocument();
  });

  it('renders the channel label', () => {
    render(<NextBestActionCard action={mockAction} />);
    expect(screen.getByText('Phone Call')).toBeInTheDocument();
  });

  it('renders the urgency label', () => {
    render(<NextBestActionCard action={mockAction} />);
    expect(screen.getByText('Act Now')).toBeInTheDocument();
  });

  it('renders TODAY urgency label', () => {
    const todayAction = { ...mockAction, urgency: 'TODAY' as const };
    render(<NextBestActionCard action={todayAction} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders THIS_WEEK urgency label', () => {
    const weekAction = { ...mockAction, urgency: 'THIS_WEEK' as const };
    render(<NextBestActionCard action={weekAction} />);
    expect(screen.getByText('This Week')).toBeInTheDocument();
  });

  it('renders suggested message when provided', () => {
    render(<NextBestActionCard action={mockAction} />);
    expect(screen.getByText(/Hi, following up on your financing/)).toBeInTheDocument();
  });

  it('renders expected impact', () => {
    render(<NextBestActionCard action={mockAction} />);
    expect(screen.getByText('Reduces cancellation risk by 23%')).toBeInTheDocument();
  });

  it('renders reasoning', () => {
    render(<NextBestActionCard action={mockAction} />);
    expect(screen.getByText(/Financing pending for 4 days/)).toBeInTheDocument();
  });

  it('calls onTakeAction when Take Action button is clicked', () => {
    const handleTakeAction = jest.fn();
    render(<NextBestActionCard action={mockAction} onTakeAction={handleTakeAction} />);

    fireEvent.click(screen.getByRole('button', { name: /take action/i }));
    expect(handleTakeAction).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when Dismiss button is clicked', () => {
    const handleDismiss = jest.fn();
    render(<NextBestActionCard action={mockAction} onDismiss={handleDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('applies NOW urgency styles', () => {
    render(<NextBestActionCard action={mockAction} data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border-l-red-500', 'bg-red-50');
  });

  it('applies TODAY urgency styles', () => {
    const todayAction = { ...mockAction, urgency: 'TODAY' as const };
    render(<NextBestActionCard action={todayAction} data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border-l-orange-500', 'bg-orange-50');
  });

  it('applies THIS_WEEK urgency styles', () => {
    const weekAction = { ...mockAction, urgency: 'THIS_WEEK' as const };
    render(<NextBestActionCard action={weekAction} data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border-l-blue-500', 'bg-blue-50');
  });

  it('renders different channel labels', () => {
    const channels = [
      { channel: 'WHATSAPP' as const, label: 'WhatsApp' },
      { channel: 'EMAIL' as const, label: 'Email' },
      { channel: 'IN_PERSON' as const, label: 'In Person' },
    ];

    channels.forEach(({ channel, label }) => {
      const action = { ...mockAction, channel };
      const { unmount } = render(<NextBestActionCard action={action} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  it('applies custom className', () => {
    render(<NextBestActionCard action={mockAction} className="custom-class" data-testid="card" />);
    expect(screen.getByTestId('card')).toHaveClass('custom-class');
  });
});
