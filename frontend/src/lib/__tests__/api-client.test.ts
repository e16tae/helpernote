import axios, { AxiosError } from 'axios';
import { getErrorMessage } from '../api-client';

describe('getErrorMessage', () => {
  it('should return server error message from response.data.error', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          error: 'Custom server error',
        },
        status: 500,
      },
    } as AxiosError;

    jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const message = getErrorMessage(error);
    expect(message).toBe('Custom server error');
  });

  it('should return server error message from response.data.message', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          message: 'Server message error',
        },
        status: 400,
      },
    } as AxiosError;

    jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const message = getErrorMessage(error);
    expect(message).toBe('Server message error');
  });

  describe('HTTP status code messages', () => {
    it('should return message for 400 Bad Request', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 400,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('잘못된 요청입니다.');
    });

    it('should return message for 401 Unauthorized', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 401,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('인증이 필요합니다.');
    });

    it('should return message for 403 Forbidden', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 403,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('접근 권한이 없습니다.');
    });

    it('should return message for 404 Not Found', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 404,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('요청한 리소스를 찾을 수 없습니다.');
    });

    it('should return message for 409 Conflict', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 409,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('이미 존재하는 데이터입니다.');
    });

    it('should return message for 422 Unprocessable Entity', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 422,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('입력 데이터가 올바르지 않습니다.');
    });

    it('should return message for 429 Too Many Requests', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 429,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    });

    it('should return message for 500 Internal Server Error', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 500,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('서버 오류가 발생했습니다.');
    });

    it('should return message for 502 Bad Gateway', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 502,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('게이트웨이 오류가 발생했습니다.');
    });

    it('should return message for 503 Service Unavailable', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 503,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('서비스를 일시적으로 사용할 수 없습니다.');
    });
  });

  describe('Network errors', () => {
    it('should return message for network error', () => {
      const error = {
        isAxiosError: true,
        code: 'ERR_NETWORK',
        message: 'Network Error',
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('네트워크 연결을 확인해주세요.');
    });

    it('should return message for timeout error', () => {
      const error = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('요청 시간이 초과되었습니다.');
    });

    it('should return axios message for other errors', () => {
      const error = {
        isAxiosError: true,
        message: 'Some other axios error',
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('Some other axios error');
    });
  });

  describe('Non-Axios errors', () => {
    it('should return message from standard Error', () => {
      const error = new Error('Standard error message');
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const message = getErrorMessage(error);
      expect(message).toBe('Standard error message');
    });

    it('should return default message for unknown error', () => {
      const error = { someProperty: 'some value' };
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const message = getErrorMessage(error);
      expect(message).toBe('알 수 없는 오류가 발생했습니다.');
    });

    it('should return default message for null', () => {
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const message = getErrorMessage(null);
      expect(message).toBe('알 수 없는 오류가 발생했습니다.');
    });

    it('should return default message for undefined', () => {
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const message = getErrorMessage(undefined);
      expect(message).toBe('알 수 없는 오류가 발생했습니다.');
    });
  });

  describe('Priority of error messages', () => {
    it('should prioritize response.data.error over status code', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            error: 'Custom error message',
          },
          status: 500,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('should prioritize response.data.message over status code', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Custom message',
          },
          status: 404,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('Custom message');
    });

    it('should prioritize response.data.error over response.data.message', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            error: 'Error field',
            message: 'Message field',
          },
          status: 400,
        },
      } as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const message = getErrorMessage(error);
      expect(message).toBe('Error field');
    });
  });
});
