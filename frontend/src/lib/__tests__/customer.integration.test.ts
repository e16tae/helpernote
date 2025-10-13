import { customerApi } from '../customer';
import { apiClient } from '../api-client';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/types/customer';

// Mock apiClient
jest.mock('../api-client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Customer API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all customers successfully', async () => {
      const mockCustomers: Customer[] = [
        {
          id: 1,
          customer_type: 'Employer',
          name: '테스트 구인자',
          phone: '010-1234-5678',
          birth_date: '1990-01-01',
          address: '서울시 강남구',
          profile_photo_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          deleted_at: null,
        },
        {
          id: 2,
          customer_type: 'Employee',
          name: '테스트 구직자',
          phone: '010-9876-5432',
          birth_date: '1995-05-15',
          address: null,
          profile_photo_id: null,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          deleted_at: null,
        },
      ];

      mockedApiClient.get.mockResolvedValue({ data: mockCustomers });

      const result = await customerApi.getAll();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/customers');
      expect(result).toEqual(mockCustomers);
      expect(result).toHaveLength(2);
    });

    it('should handle errors when fetching customers', async () => {
      const errorMessage = 'Network error';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(customerApi.getAll()).rejects.toThrow(errorMessage);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/customers');
    });
  });

  describe('getById', () => {
    it('should fetch a single customer by id', async () => {
      const mockCustomer: Customer = {
        id: 1,
        customer_type: 'Employer',
        name: '테스트 구인자',
        phone: '010-1234-5678',
        birth_date: '1990-01-01',
        address: '서울시 강남구',
        profile_photo_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
      };

      mockedApiClient.get.mockResolvedValue({ data: mockCustomer });

      const result = await customerApi.getById(1);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/customers/1');
      expect(result).toEqual(mockCustomer);
      expect(result.id).toBe(1);
      expect(result.name).toBe('테스트 구인자');
    });

    it('should handle 404 error for non-existent customer', async () => {
      mockedApiClient.get.mockRejectedValue({
        response: { status: 404, data: { error: 'Customer not found' } },
      });

      await expect(customerApi.getById(999)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('create', () => {
    it('should create a new customer successfully', async () => {
      const newCustomerData: CreateCustomerRequest = {
        customer_type: 'Employer',
        name: '새 고객',
        phone: '010-1111-2222',
        birth_date: '1985-03-20',
        address: '부산시 해운대구',
      };

      const createdCustomer: Customer = {
        id: 3,
        ...newCustomerData,
        profile_photo_id: null,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        deleted_at: null,
      };

      mockedApiClient.post.mockResolvedValue({ data: createdCustomer });

      const result = await customerApi.create(newCustomerData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/customers', newCustomerData);
      expect(result).toEqual(createdCustomer);
      expect(result.id).toBe(3);
      expect(result.name).toBe('새 고객');
    });

    it('should validate required fields on create', async () => {
      const invalidData = {
        customer_type: 'Employer',
        name: '',
        phone: '',
      } as CreateCustomerRequest;

      mockedApiClient.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Name and phone are required' },
        },
      });

      await expect(customerApi.create(invalidData)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  describe('update', () => {
    it('should update an existing customer', async () => {
      const updateData: UpdateCustomerRequest = {
        customer_type: 'Both',
        name: '업데이트된 이름',
        phone: '010-3333-4444',
        birth_date: '1990-01-01',
        address: '대전시 유성구',
      };

      const updatedCustomer: Customer = {
        id: 1,
        ...updateData,
        profile_photo_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
        deleted_at: null,
      };

      mockedApiClient.put.mockResolvedValue({ data: updatedCustomer });

      const result = await customerApi.update(1, updateData);

      expect(mockedApiClient.put).toHaveBeenCalledWith('/api/customers/1', updateData);
      expect(result).toEqual(updatedCustomer);
      expect(result.name).toBe('업데이트된 이름');
    });

    it('should handle partial updates', async () => {
      const partialUpdate: Partial<UpdateCustomerRequest> = {
        phone: '010-5555-6666',
      };

      const updatedCustomer: Customer = {
        id: 1,
        customer_type: 'Employer',
        name: '기존 이름',
        phone: '010-5555-6666',
        birth_date: '1990-01-01',
        address: '서울시 강남구',
        profile_photo_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
        deleted_at: null,
      };

      mockedApiClient.put.mockResolvedValue({ data: updatedCustomer });

      const result = await customerApi.update(1, partialUpdate as UpdateCustomerRequest);

      expect(mockedApiClient.put).toHaveBeenCalledWith('/api/customers/1', partialUpdate);
      expect(result.phone).toBe('010-5555-6666');
    });
  });

  describe('delete', () => {
    it('should delete a customer by id', async () => {
      mockedApiClient.delete.mockResolvedValue({ data: null });

      await customerApi.delete(1);

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/api/customers/1');
    });

    it('should handle deletion of non-existent customer', async () => {
      mockedApiClient.delete.mockRejectedValue({
        response: { status: 404, data: { error: 'Customer not found' } },
      });

      await expect(customerApi.delete(999)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('CRUD workflow', () => {
    it('should complete full CRUD lifecycle', async () => {
      // Create
      const newCustomer: CreateCustomerRequest = {
        customer_type: 'Employee',
        name: '전체 테스트',
        phone: '010-7777-8888',
        birth_date: null,
        address: null,
      };

      const createdCustomer: Customer = {
        id: 10,
        ...newCustomer,
        profile_photo_id: null,
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
        deleted_at: null,
      };

      mockedApiClient.post.mockResolvedValue({ data: createdCustomer });
      const created = await customerApi.create(newCustomer);
      expect(created.id).toBe(10);

      // Read
      mockedApiClient.get.mockResolvedValue({ data: createdCustomer });
      const fetched = await customerApi.getById(10);
      expect(fetched.name).toBe('전체 테스트');

      // Update
      const updateData: UpdateCustomerRequest = {
        ...newCustomer,
        name: '수정된 이름',
      };

      const updatedCustomer: Customer = {
        ...createdCustomer,
        name: '수정된 이름',
        updated_at: '2024-01-06T00:00:00Z',
      };

      mockedApiClient.put.mockResolvedValue({ data: updatedCustomer });
      const updated = await customerApi.update(10, updateData);
      expect(updated.name).toBe('수정된 이름');

      // Delete
      mockedApiClient.delete.mockResolvedValue({ data: null });
      await customerApi.delete(10);
      expect(mockedApiClient.delete).toHaveBeenCalledWith('/api/customers/10');
    });
  });
});
