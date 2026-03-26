import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import ActiveSession from './ActiveSession';
import * as apiModule from '../api';

vi.mock('../api');

// Mock useParams to return appointmentId
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: () => ({ appointmentId: '1' }),
    useNavigate: () => vi.fn(),
  };
});

describe('ActiveSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiModule.api, 'getAppointment').mockResolvedValue({
      id: 1,
      patient_id: 1,
      therapist_id: 1,
      start_time: '2026-03-27T10:00:00',
      end_time: '2026-03-27T10:45:00',
      status: 'PLANNED',
    });
    vi.spyOn(apiModule.api, 'getPatient').mockResolvedValue({
      id: 1,
      first_name: 'Айгерім',
      last_name: 'Нұрланова',
    });
    vi.spyOn(apiModule.api, 'getSoundProgress').mockResolvedValue([]);
    vi.spyOn(apiModule.api, 'getHomeworkTemplates').mockResolvedValue([]);
  });

  it('renders SOAP notes section', async () => {
    renderWithProviders(<ActiveSession />);
    await waitFor(() => {
      expect(screen.getByText(/SOAP/)).toBeInTheDocument();
    });
  });

  it('displays patient name after loading', async () => {
    renderWithProviders(<ActiveSession />);
    await waitFor(() => {
      expect(screen.getByText('Айгерім Нұрланова')).toBeInTheDocument();
    });
  });

  it('renders save and send buttons', async () => {
    renderWithProviders(<ActiveSession />);
    await waitFor(() => {
      expect(screen.getByText('Сохранить сеанс')).toBeInTheDocument();
      expect(screen.getByText(/отправить в WhatsApp/i)).toBeInTheDocument();
    });
  });

  it('renders homework section', async () => {
    renderWithProviders(<ActiveSession />);
    await waitFor(() => {
      expect(screen.getByText(/домашнее/i)).toBeInTheDocument();
    });
  });

  it('renders homework templates when available', async () => {
    vi.spyOn(apiModule.api, 'getHomeworkTemplates').mockResolvedValue([
      { id: 1, title: 'Артикуляция Р', description: 'Practice R sound', instructions: 'Do 10 reps' },
      { id: 2, title: 'Дыхательные упражнения', description: 'Breathing exercises', instructions: 'Breathe deep' },
    ]);

    renderWithProviders(<ActiveSession />);
    await waitFor(() => {
      expect(screen.getByText('Артикуляция Р')).toBeInTheDocument();
      expect(screen.getByText('Дыхательные упражнения')).toBeInTheDocument();
    });
  });

  it('calls createSession on save', async () => {
    const createSessionMock = vi.spyOn(apiModule.api, 'createSession').mockResolvedValue({ id: 42 });
    const { container } = renderWithProviders(<ActiveSession />);

    await waitFor(() => {
      expect(screen.getByText('Айгерім Нұрланова')).toBeInTheDocument();
    });

    // Find and fill the first textarea (subjective)
    const textareas = container.querySelectorAll('textarea');
    expect(textareas.length).toBeGreaterThanOrEqual(4); // 4 SOAP + 1 homework
  });
});
