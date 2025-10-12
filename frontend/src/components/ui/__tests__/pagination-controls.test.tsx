import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaginationControls } from '../pagination-controls';

// Mock the pagination components
jest.mock('@/components/ui/pagination', () => ({
  Pagination: ({ children, className }: any) => <nav className={className}>{children}</nav>,
  PaginationContent: ({ children }: any) => <ul>{children}</ul>,
  PaginationItem: ({ children }: any) => <li>{children}</li>,
  PaginationLink: ({ children, onClick, isActive, className }: any) => (
    <button onClick={onClick} className={className} data-active={isActive}>
      {children}
    </button>
  ),
  PaginationPrevious: ({ onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      Previous
    </button>
  ),
  PaginationNext: ({ onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      Next
    </button>
  ),
  PaginationEllipsis: () => <span>...</span>,
}));

describe('PaginationControls', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when totalPages is 1 or less', () => {
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders page numbers with ellipsis for current page', () => {
    render(
      <PaginationControls
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    // Should show first page, pages around current, and last page
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onPageChange when a page number is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    await user.click(screen.getByText('2'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('disables Previous button on first page', () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByText('Previous');
    expect(prevButton).toHaveClass('pointer-events-none opacity-50');
  });

  it('disables Next button on last page', () => {
    render(
      <PaginationControls
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByText('Next');
    expect(nextButton).toHaveClass('pointer-events-none opacity-50');
  });

  it('navigates to previous page when Previous button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    await user.click(screen.getByText('Previous'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('navigates to next page when Next button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    await user.click(screen.getByText('Next'));
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('does not call onPageChange when clicking Previous on first page', async () => {
    const user = userEvent.setup();
    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    await user.click(screen.getByText('Previous'));
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('does not call onPageChange when clicking Next on last page', async () => {
    const user = userEvent.setup();
    render(
      <PaginationControls
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    await user.click(screen.getByText('Next'));
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('marks current page as active', () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const page3Button = screen.getByText('3');
    expect(page3Button).toHaveAttribute('data-active', 'true');
  });

  it('shows ellipsis for large number of pages', () => {
    render(
      <PaginationControls
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    // Should show first page, pages around current, last page, and ellipsis
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
        className="custom-pagination"
      />
    );

    expect(container.querySelector('.custom-pagination')).toBeInTheDocument();
  });
});
