import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('renders initials when name is provided without src', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single name', () => {
    render(<Avatar name="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(<Avatar src="/avatar.jpg" alt="User avatar" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'User avatar');
  });

  it('uses name as alt text when alt is not provided', () => {
    render(<Avatar src="/avatar.jpg" name="John Doe" />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'John Doe');
  });

  it('renders question mark when no name or src provided', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('applies small size styles', () => {
    render(<Avatar name="John Doe" size="sm" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('h-8', 'w-8');
  });

  it('applies medium size styles by default', () => {
    render(<Avatar name="John Doe" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('h-10', 'w-10');
  });

  it('applies large size styles', () => {
    render(<Avatar name="John Doe" size="lg" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('h-12', 'w-12');
  });

  it('applies custom className', () => {
    render(<Avatar name="John Doe" className="custom-class" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('custom-class');
  });

  it('is rounded-full', () => {
    render(<Avatar name="John Doe" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('rounded-full');
  });

  it('truncates initials to 2 characters for long names', () => {
    render(<Avatar name="John Michael Doe" />);
    expect(screen.getByText('JM')).toBeInTheDocument();
  });
});
