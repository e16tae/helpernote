import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import { apiClient } from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
  getErrorMessage: jest.fn((error) => error.message || 'An error occurred'),
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('should render login form', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByLabelText('사용자명')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /로그인$/ })).toBeInTheDocument();
  });

  it('should display logo', () => {
    render(<LoginPage />);
    expect(screen.getByText('Helpernote')).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /로그인/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('사용자명을 입력하세요')).toBeInTheDocument();
    });
  });

  it('should show validation error for short username', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('사용자명');
    const submitButton = screen.getByRole('button', { name: /로그인/ });

    await user.type(usernameInput, 'ab');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('사용자명은 최소 3자 이상이어야 합니다')).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('사용자명');
    const passwordInput = screen.getByLabelText('비밀번호');
    const submitButton = screen.getByRole('button', { name: /로그인/ });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'short');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('비밀번호는 최소 8자 이상이어야 합니다')).toBeInTheDocument();
    });
  });

  it('should call API and redirect on successful login', async () => {
    const user = userEvent.setup();
    const mockPush = jest.fn();

    // Mock useRouter
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));

    // Mock successful API response
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { access_token: 'test-token' },
    });

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('사용자명');
    const passwordInput = screen.getByLabelText('비밀번호');
    const submitButton = screen.getByRole('button', { name: /로그인/ });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display error message on failed login', async () => {
    const user = userEvent.setup();

    // Mock failed API response
    (apiClient.post as jest.Mock).mockRejectedValue({
      response: {
        data: { message: 'Invalid credentials' },
      },
    });

    const { getErrorMessage } = require('@/lib/api-client');
    getErrorMessage.mockReturnValue('Invalid credentials');

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('사용자명');
    const passwordInput = screen.getByLabelText('비밀번호');
    const submitButton = screen.getByRole('button', { name: /로그인/ });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();

    // Mock slow API response
    (apiClient.post as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { access_token: 'test-token' } }), 1000))
    );

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('사용자명');
    const passwordInput = screen.getByLabelText('비밀번호');
    const submitButton = screen.getByRole('button', { name: /로그인/ });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Button should be disabled while submitting
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /로그인 중.../ })).toBeInTheDocument();
  });

  it('should have link to register page', () => {
    render(<LoginPage />);
    const registerLink = screen.getByRole('link', { name: /회원가입/ });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});
