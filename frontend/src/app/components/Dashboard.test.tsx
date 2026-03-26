import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import Dashboard from './Dashboard';
import * as apiModule from '../api';

vi.mock('../api');

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiModule.api, 'getAppointments').mockResolvedValue([]);
    vi.spyOn(apiModule.api, 'getPatients').mockResolvedValue([]);
    vi.spyOn(apiModule.api, 'getScheduleRequests').mockResolvedValue([]);
  });

  it('renders calendar heading', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Календарь')).toBeInTheDocument();
    });
  });

  it('displays summary cards', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Сеансы сегодня')).toBeInTheDocument();
      expect(screen.getByText('Всего пациентов')).toBeInTheDocument();
    });
  });

  it('shows week and day view toggles', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Неделя')).toBeInTheDocument();
      expect(screen.getByText('День')).toBeInTheDocument();
    });
  });

  it('calls API on mount', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(apiModule.api.getAppointments).toHaveBeenCalledWith(0, 500);
      expect(apiModule.api.getPatients).toHaveBeenCalledWith(0, 500);
    });
  });
});
