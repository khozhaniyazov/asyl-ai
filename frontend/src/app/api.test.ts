import { describe, it, expect, vi } from 'vitest';
import { api } from './api';
import axios from 'axios';

// Mock axios methods
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn().mockReturnValue({
        interceptors: {
          request: { use: vi.fn() }
        },
        post: vi.fn().mockResolvedValue({ data: { access_token: 'fake-token' } }),
        get: vi.fn().mockResolvedValue({ data: [{ id: 1, first_name: 'John' }] })
      })
    }
  };
});

describe('API Client', () => {
  it('should format login data as FormData and return token', async () => {
    const res = await api.login('test@test.com', 'password');
    expect(res).toHaveProperty('access_token');
    expect(res.access_token).toBe('fake-token');
  });
  
  it('should fetch patients successfully', async () => {
    const patients = await api.getPatients();
    expect(patients).toHaveLength(1);
    expect(patients[0].first_name).toBe('John');
  });
});
