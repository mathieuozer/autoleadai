import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../Select';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select', () => {
  it('renders correctly with options', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select options={options} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Select label="Country" options={options} />);
    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('renders placeholder when provided', () => {
    render(<Select placeholder="Select an option" options={options} />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Select options={options} onChange={handleChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'option2' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    render(<Select options={options} error="Please select an option" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Please select an option');
  });

  it('applies error styles when error is provided', () => {
    render(<Select options={options} error="Error" />);
    expect(screen.getByRole('combobox')).toHaveClass('border-red-500');
  });

  it('sets aria-invalid when error is provided', () => {
    render(<Select options={options} error="Error" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('applies custom className', () => {
    render(<Select options={options} className="custom-class" />);
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });

  it('associates label with select using id', () => {
    render(<Select label="Country" options={options} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'country');
  });
});
