import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../page';
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

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render register form', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
    expect(screen.getByLabelText(/사용자명/)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/)).toBeInTheDocument();
    expect(screen.getByLabelText(/연락처/)).toBeInTheDocument();
    expect(screen.getByLabelText(/보안 질문 \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/보안 질문 답변/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /회원가입$/ })).toBeInTheDocument();
  });

  it('should display logo', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Helpernote')).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: /회원가입/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('사용자명을 입력하세요')).toBeInTheDocument();
      expect(screen.getByText('비밀번호를 입력하세요')).toBeInTheDocument();
    });
  });

  it('should validate username pattern', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/);
    const submitButton = screen.getByRole('button', { name: /회원가입/ });

    await user.type(usernameInput, 'user@name');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다')).toBeInTheDocument();
    });
  });

  it('should validate username length', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/);
    const submitButton = screen.getByRole('button', { name: /회원가입/ });

    await user.type(usernameInput, 'ab');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('사용자명은 최소 3자 이상이어야 합니다')).toBeInTheDocument();
    });
  });

  it('should validate password must contain letter', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/);
    const passwordInput = screen.getByLabelText(/비밀번호/);
    const submitButton = screen.getByRole('button', { name: /회원가입/ });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, '12345678');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('비밀번호는 최소 1개의 영문자를 포함해야 합니다')).toBeInTheDocument();
    });
  });

  it('should validate password must contain number', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/);
    const passwordInput = screen.getByLabelText(/비밀번호/);
    const submitButton = screen.getByRole('button', { name: /회원가입/ });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'abcdefgh');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('비밀번호는 최소 1개의 숫자를 포함해야 합니다')).toBeInTheDocument();
    });
  });

  it('should validate phone number format', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const phoneInput = screen.getByLabelText(/연락처/);
    const submitButton = screen.getByRole('button', { name: /회원가입/ });

    await user.type(phoneInput, 'invalid-phone');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('올바른 전화번호 형식이 아닙니다')).toBeInTheDocument();
    });
  });

  it('should validate security question and answer', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/);
    const passwordInput = screen.getByLabelText(/비밀번호/);
    const submitButton = screen.getByRole('button', { name: /회원가입/ });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('보안 질문을 선택하세요')).toBeInTheDocument();
    });
  });

  // Skipping full integration test with Select component due to jsdom limitations
  // E2E tests in e2e/register.spec.ts provide full coverage for this scenario
  it.skip('should call API and redirect on successful registration', async () => {
    const user = userEvent.setup();
    const mockPush = jest.fn();
    const mockToast = jest.fn();

    // Mock useRouter
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));

    // Mock useToast
    jest.spyOn(require('@/hooks/use-toast'), 'useToast').mockImplementation(() => ({
      toast: mockToast,
    }));

    // Mock successful API response
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { success: true },
    });

    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/);
    const passwordInput = screen.getByLabelText(/비밀번호/);
    const phoneInput = screen.getByLabelText(/연락처/);
    const answerInput = screen.getByLabelText(/보안 질문 답변/);

    await user.type(usernameInput, 'newuser');
    await user.type(passwordInput, 'password123');
    await user.type(phoneInput, '010-1234-5678');

    // Select security question
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);

    // Find and click the first option
    const option = await screen.findByText('당신의 출생지는 어디입니까?');
    await user.click(option);

    await user.type(answerInput, 'Seoul');

    const submitButton = screen.getByRole('button', { name: /회원가입/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', {
        username: 'newuser',
        password: 'password123',
        phone: '010-1234-5678',
        security_question_id: 1,
        security_answer: 'Seoul',
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: '성공',
        description: '회원가입이 완료되었습니다!',
      });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it.skip('should display error message on failed registration', async () => {
    const user = userEvent.setup();

    // Mock failed API response
    (apiClient.post as jest.Mock).mockRejectedValue({
      response: {
        data: { message: 'Username already exists' },
      },
    });

    const { getErrorMessage } = require('@/lib/api-client');
    getErrorMessage.mockReturnValue('Username already exists');

    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/);
    const passwordInput = screen.getByLabelText(/비밀번호/);
    const answerInput = screen.getByLabelText(/보안 질문 답변/);

    await user.type(usernameInput, 'existinguser');
    await user.type(passwordInput, 'password123');

    // Select security question
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    const option = await screen.findByText('당신의 출생지는 어디입니까?');
    await user.click(option);

    await user.type(answerInput, 'Seoul');

    const submitButton = screen.getByRole('button', { name: /회원가입/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
  });

  it('should have link to login page', () => {
    render(<RegisterPage />);
    const loginLink = screen.getByRole('link', { name: /로그인/ });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it.skip('should disable submit button while submitting', async () => {
    const user = userEvent.setup();

    // Mock slow API response
    (apiClient.post as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 1000))
    );

    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/);
    const passwordInput = screen.getByLabelText(/비밀번호/);
    const answerInput = screen.getByLabelText(/보안 질문 답변/);

    await user.type(usernameInput, 'newuser');
    await user.type(passwordInput, 'password123');

    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    const option = await screen.findByText('당신의 출생지는 어디입니까?');
    await user.click(option);

    await user.type(answerInput, 'Seoul');

    const submitButton = screen.getByRole('button', { name: /회원가입/ });
    await user.click(submitButton);

    // Button should be disabled while submitting
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /계정 생성 중.../ })).toBeInTheDocument();
  });
});
