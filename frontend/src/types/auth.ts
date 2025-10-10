export interface User {
  id: number;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  security_question_id: number;
  security_answer: string;
  phone?: string;
}

export interface ForgotPasswordRequest {
  username: string;
  security_question_id: number;
  security_answer: string;
  new_password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
