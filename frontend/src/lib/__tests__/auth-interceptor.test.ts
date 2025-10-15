import type { AxiosError, AxiosRequestConfig } from 'axios';

var responseInterceptor:
  | ((error: AxiosError) => Promise<unknown>)
  | undefined;

function createAxiosInstance() {
  const instance = jest.fn<(config: AxiosRequestConfig) => Promise<unknown>>((config) =>
    Promise.resolve({ data: 'retried', config })
  ) as jest.MockedFunction<(config: AxiosRequestConfig) => Promise<unknown>>;

  instance.interceptors = {
    response: {
      use: jest.fn((onFulfilled: unknown, onRejected?: (error: AxiosError) => Promise<unknown>) => {
        responseInterceptor = onRejected;
        // keep signature compatibility with axios by returning interceptor id
        return 0;
      }),
    },
  };

  instance.get = jest.fn();
  instance.post = jest.fn();
  instance.defaults = {};
  return instance;
}

type AxiosInstanceMock = ReturnType<typeof createAxiosInstance>;
type InstanceRegistry = {
  api?: AxiosInstanceMock;
  refresh?: AxiosInstanceMock;
};
var instances: InstanceRegistry = {};

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    create: jest.fn(() => {
      if (!instances) {
        instances = {};
      }
      if (!instances.api) {
        instances.api = createAxiosInstance();
        return instances.api;
      }
      if (!instances.refresh) {
        instances.refresh = createAxiosInstance();
        return instances.refresh;
      }
      return createAxiosInstance();
    }),
  };
});

let apiClient: typeof import('../api-client').apiClient;

const getApiInstance = () => {
  if (!instances.api) {
    throw new Error('api axios instance has not been initialised');
  }
  return instances.api;
};

const getRefreshInstance = () => {
  if (!instances.refresh) {
    throw new Error('refresh axios instance has not been initialised');
  }
  return instances.refresh;
};

beforeAll(async () => {
  apiClient = (await import('../api-client')).apiClient;
});

describe('apiClient 401 handling', () => {
  beforeEach(() => {
    expect(instances.api).toBeDefined();
    expect(instances.refresh).toBeDefined();
    const apiInstance = getApiInstance();
    const refreshInstance = getRefreshInstance();
    const interceptorCalls = apiInstance.interceptors.response.use.mock.calls;
    responseInterceptor = interceptorCalls.length
      ? (interceptorCalls[interceptorCalls.length - 1][1] as
          | ((error: AxiosError) => Promise<unknown>)
          | undefined)
      : undefined;
    apiInstance.mockClear();
    refreshInstance.mockClear();
    refreshInstance.post.mockReset();
  });

  it('retries the original request after a successful refresh', async () => {
    expect(apiClient).toBeDefined();
    const apiInstance = getApiInstance();
    const refreshInstance = getRefreshInstance();
    // Simulate a successful refresh call
    refreshInstance.post.mockResolvedValueOnce({ data: {} });

    // First retry of the original axios request should resolve with this payload
    apiInstance.mockResolvedValueOnce({ data: 'retry-success' });

    const unauthorizedError = {
      config: {
        url: '/api/dashboard/stats',
        _retry: false,
      } as AxiosRequestConfig & { _retry?: boolean },
      response: {
        status: 401,
      },
    } as AxiosError;

    const interceptorHandler = responseInterceptor;
    expect(interceptorHandler).toBeDefined();

    const result = await interceptorHandler!(unauthorizedError);

    expect(refreshInstance.post).toHaveBeenCalledWith('/api/auth/refresh', {});
    expect(apiInstance).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: 'retry-success' });
  });
});
