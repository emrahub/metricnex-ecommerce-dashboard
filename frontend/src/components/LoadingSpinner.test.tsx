import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';
import { describe, it, expect } from 'vitest';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-6 w-6');
    expect(spinner).toHaveClass('border-blue-600');
  });

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-4 w-4');
  });

  it('renders with large size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-8 w-8');
  });

  it('renders with white color', () => {
    render(<LoadingSpinner color="white" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('border-white');
  });

  it('renders with gray color', () => {
    render(<LoadingSpinner color="gray" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('border-gray-600');
  });

  it('has accessible loading text', () => {
    render(<LoadingSpinner />);
    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toHaveClass('sr-only');
  });
});
