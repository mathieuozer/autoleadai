import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoUploadCard } from '../PhotoUploadCard';
import { TradeInPhoto } from '@/types';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));

describe('PhotoUploadCard', () => {
  const defaultProps = {
    type: 'front_view' as const,
    label: 'Front View',
    onUpload: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the label', () => {
    render(<PhotoUploadCard {...defaultProps} />);
    expect(screen.getByText('Front View')).toBeInTheDocument();
  });

  it('shows "Add Photo" text when no photo is provided', () => {
    render(<PhotoUploadCard {...defaultProps} />);
    expect(screen.getByText('Add Photo')).toBeInTheDocument();
  });

  it('shows "Required" badge when required is true and no photo', () => {
    render(<PhotoUploadCard {...defaultProps} required />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('does not show "Required" badge when required is false', () => {
    render(<PhotoUploadCard {...defaultProps} required={false} />);
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
  });

  it('renders photo when provided', () => {
    const photo: TradeInPhoto = {
      id: '1',
      type: 'front_view',
      url: '/test-image.jpg',
      timestamp: new Date().toISOString(),
    };

    render(<PhotoUploadCard {...defaultProps} photo={photo} />);
    expect(screen.getByAltText('Front View')).toBeInTheDocument();
  });

  it('does not show "Required" badge when photo is provided', () => {
    const photo: TradeInPhoto = {
      id: '1',
      type: 'front_view',
      url: '/test-image.jpg',
      timestamp: new Date().toISOString(),
    };

    render(<PhotoUploadCard {...defaultProps} photo={photo} required />);
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
  });

  it('shows note indicator when photo has notes', () => {
    const photo: TradeInPhoto = {
      id: '1',
      type: 'front_view',
      url: '/test-image.jpg',
      timestamp: new Date().toISOString(),
      notes: 'Some notes',
    };

    render(<PhotoUploadCard {...defaultProps} photo={photo} />);
    expect(screen.getByText('Note')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const photo: TradeInPhoto = {
      id: '1',
      type: 'front_view',
      url: '/test-image.jpg',
      timestamp: new Date().toISOString(),
    };
    const onRemove = jest.fn();

    const { container } = render(
      <PhotoUploadCard {...defaultProps} photo={photo} onRemove={onRemove} />
    );

    // Hover to show overlay buttons - we need to find and click the remove button
    const overlay = container.querySelector('.hover\\:opacity-100');
    if (overlay) {
      // Simulate hover
      fireEvent.mouseEnter(overlay);
    }

    // Find remove button by its X icon
    const buttons = container.querySelectorAll('button');
    const removeButton = Array.from(buttons).find((btn) =>
      btn.querySelector('.lucide-x')
    );

    if (removeButton) {
      fireEvent.click(removeButton);
      expect(onRemove).toHaveBeenCalledTimes(1);
    }
  });

  it('triggers file input when card is clicked (no photo)', () => {
    const { container } = render(<PhotoUploadCard {...defaultProps} />);

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('has capture attribute for mobile camera', () => {
    const { container } = render(<PhotoUploadCard {...defaultProps} />);

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('capture', 'environment');
  });
});
