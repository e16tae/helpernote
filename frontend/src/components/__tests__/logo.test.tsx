import { render, screen } from '@testing-library/react';
import { Logo } from '../logo';

describe('Logo', () => {
  it('renders logo with default size', () => {
    render(<Logo />);
    expect(screen.getByText('Helpernote')).toBeInTheDocument();
  });

  it('renders logo with small size', () => {
    const { container } = render(<Logo size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-6');
  });

  it('renders logo with medium size', () => {
    const { container } = render(<Logo size="md" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-8');
  });

  it('renders logo with large size', () => {
    const { container } = render(<Logo size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-10');
  });

  it('applies custom className', () => {
    const { container } = render(<Logo className="custom-class" />);
    const logoContainer = container.firstChild;
    expect(logoContainer).toHaveClass('custom-class');
  });

  it('renders SVG with correct structure', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 40 40');

    // Check for notepad rectangle
    const rect = container.querySelector('rect');
    expect(rect).toBeInTheDocument();

    // Check for notepad lines
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();

    // Check for notification circle
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
  });

  it('has correct text styling based on size', () => {
    const { rerender } = render(<Logo size="sm" />);
    expect(screen.getByText('Helpernote')).toHaveClass('text-base');

    rerender(<Logo size="md" />);
    expect(screen.getByText('Helpernote')).toHaveClass('text-lg');

    rerender(<Logo size="lg" />);
    expect(screen.getByText('Helpernote')).toHaveClass('text-xl');
  });
});
