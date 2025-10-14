import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmDialog } from '../delete-confirm-dialog';

describe('DeleteConfirmDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnConfirm = jest.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onConfirm: mockOnConfirm,
    title: '항목 삭제',
    description: '정말 이 항목을 삭제하시겠습니까?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct title and description', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    expect(screen.getByText('항목 삭제')).toBeInTheDocument();
    expect(screen.getByText('정말 이 항목을 삭제하시겠습니까?')).toBeInTheDocument();
  });

  it('renders cancel and delete buttons', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('calls onConfirm when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmDialog {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: '삭제' });
    await user.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange with false when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: '취소' });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('does not render when open is false', () => {
    render(<DeleteConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('항목 삭제')).not.toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    // AlertDialog automatically provides role="alertdialog"
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();

    // Check that title and description are connected via ARIA
    expect(screen.getByText('항목 삭제')).toBeInTheDocument();
    expect(screen.getByText('정말 이 항목을 삭제하시겠습니까?')).toBeInTheDocument();
  });

  it('delete button has destructive styling', () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: '삭제' });
    expect(deleteButton).toHaveClass('bg-destructive');
  });

  it('can be opened and closed multiple times', async () => {
    const { rerender } = render(<DeleteConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('항목 삭제')).not.toBeInTheDocument();

    rerender(<DeleteConfirmDialog {...defaultProps} open={true} />);
    expect(screen.getByText('항목 삭제')).toBeInTheDocument();

    rerender(<DeleteConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('항목 삭제')).not.toBeInTheDocument();
  });

  it('supports custom title and description text', () => {
    const customProps = {
      ...defaultProps,
      title: '고객 삭제',
      description: '이 고객과 관련된 모든 데이터가 삭제됩니다.',
    };

    render(<DeleteConfirmDialog {...customProps} />);

    expect(screen.getByText('고객 삭제')).toBeInTheDocument();
    expect(screen.getByText('이 고객과 관련된 모든 데이터가 삭제됩니다.')).toBeInTheDocument();
  });
});
