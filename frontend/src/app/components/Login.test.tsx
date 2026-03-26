import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import Login from './Login';
import * as apiModule from '../api';

vi.mock('../api');

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // AuthContext calls api.isAuthenticated() and api.getMe()
    vi.spyOn(apiModule.api, 'isAuthenticated').mockReturnValue(false);
  });

  it('renders login form with email and password fields', () => {
    renderWithProviders(<Login />, { withAuth: true });
    expect(screen.getByText('С возвращением')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('dana@clinic.kz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('renders register and parent portal links', () => {
    renderWithProviders(<Login />, { withAuth: true });
    expect(screen.getByText(/регистрация/i)).toBeInTheDocument();
  });
});
