import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TournamentsPage } from '../TournamentsPage';
import * as useTournamentsModule from '../../hooks/useTournaments';
import type { Tournament } from '../../types/tournament';

const mockTournaments: Tournament[] = [
  {
    id: 't-1',
    title: 'Турнир Зима',
    date: '2026-01-15',
    format: 'doubles',
    status: 'completed',
    winner_team_name: 'Шампиони',
    notes: 'Играно на закрито',
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
  },
  {
    id: 't-2',
    title: 'Турнир Пролет',
    date: '2026-04-20',
    format: 'singles',
    status: 'in_progress',
    winner_team_name: null,
    notes: 'Открит корт',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 't-3',
    title: 'Турнир Лято',
    date: '2026-07-10',
    format: 'doubles',
    status: 'draft',
    winner_team_name: null,
    notes: null,
    created_at: '2026-07-01T10:00:00Z',
    updated_at: '2026-07-01T10:00:00Z',
  },
];

describe('TournamentsPage', () => {
  const createTournamentMock = vi.fn();
  const updateTournamentMock = vi.fn();
  const deleteTournamentMock = vi.fn();
  const fetchTournamentsMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useTournamentsModule, 'useTournaments').mockReturnValue({
      tournaments: mockTournaments,
      loading: false,
      error: null,
      fetchTournaments: fetchTournamentsMock,
      createTournament: createTournamentMock,
      updateTournament: updateTournamentMock,
      deleteTournament: deleteTournamentMock,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <TournamentsPage />
      </MemoryRouter>
    );
  };

  it('renders header, total count badge, and Нов турнир button', () => {
    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: /турнири/i })).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /нов турнир/i })).toBeInTheDocument();
  });

  it('renders stats summary row with total, in progress, draft, and completed counts', () => {
    renderComponent();

    expect(screen.getByText('Общо')).toBeInTheDocument();
    expect(screen.getAllByText('В ход').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Чернови').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Приключили').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all tournament cards initially', () => {
    renderComponent();

    expect(screen.getByText('Турнир Зима')).toBeInTheDocument();
    expect(screen.getByText('Турнир Пролет')).toBeInTheDocument();
    expect(screen.getByText('Турнир Лято')).toBeInTheDocument();
  });

  it('filters tournaments by status tabs', () => {
    renderComponent();

    // Click "В ход"
    fireEvent.click(screen.getByRole('button', { name: 'В ход' }));
    expect(screen.queryByText('Турнир Зима')).not.toBeInTheDocument();
    expect(screen.getByText('Турнир Пролет')).toBeInTheDocument();
    expect(screen.queryByText('Турнир Лято')).not.toBeInTheDocument();

    // Click "Чернови"
    fireEvent.click(screen.getByRole('button', { name: 'Чернови' }));
    expect(screen.queryByText('Турнир Пролет')).not.toBeInTheDocument();
    expect(screen.getByText('Турнир Лято')).toBeInTheDocument();

    // Click "Приключили"
    fireEvent.click(screen.getByRole('button', { name: 'Приключили' }));
    expect(screen.getByText('Турнир Зима')).toBeInTheDocument();
    expect(screen.queryByText('Турнир Лято')).not.toBeInTheDocument();

    // Click "Всички"
    fireEvent.click(screen.getByRole('button', { name: 'Всички' }));
    expect(screen.getByText('Турнир Зима')).toBeInTheDocument();
    expect(screen.getByText('Турнир Пролет')).toBeInTheDocument();
    expect(screen.getByText('Турнир Лято')).toBeInTheDocument();
  });

  it('filters tournaments by search input on title and notes', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText('Търси турнир...');

    // Search by title
    fireEvent.change(searchInput, { target: { value: 'Пролет' } });
    expect(screen.getByText('Турнир Пролет')).toBeInTheDocument();
    expect(screen.queryByText('Турнир Зима')).not.toBeInTheDocument();

    // Search by notes
    fireEvent.change(searchInput, { target: { value: 'закрито' } });
    expect(screen.getByText('Турнир Зима')).toBeInTheDocument();
    expect(screen.queryByText('Турнир Пролет')).not.toBeInTheDocument();
  });

  it('renders search empty state when search query matches nothing', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText('Търси турнир...');
    fireEvent.change(searchInput, { target: { value: 'несъществуващ' } });

    expect(
      screen.getByText('Няма намерени турнири, отговарящи на търсенето.')
    ).toBeInTheDocument();
  });

  it('renders empty database state when no tournaments exist', () => {
    vi.spyOn(useTournamentsModule, 'useTournaments').mockReturnValue({
      tournaments: [],
      loading: false,
      error: null,
      fetchTournaments: fetchTournamentsMock,
      createTournament: createTournamentMock,
      updateTournament: updateTournamentMock,
      deleteTournament: deleteTournamentMock,
    });

    renderComponent();

    expect(screen.getByText('Все още няма създадени турнири')).toBeInTheDocument();
    expect(
      screen.getByText(/създайте първия турнир, за да организирате групи/i)
    ).toBeInTheDocument();
  });

  it('opens create modal on button click and submits new tournament', async () => {
    createTournamentMock.mockResolvedValueOnce({
      id: 't-4',
      title: 'Нов турнир 2026',
      date: '2026-08-01',
      format: 'doubles',
      status: 'draft',
      winner_team_name: null,
      notes: null,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    });

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /нов турнир/i }));

    expect(screen.getByRole('heading', { name: 'Нов турнир' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/име на турнира/i), {
      target: { value: 'Нов турнир 2026' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Създай' }));

    await waitFor(() => {
      expect(createTournamentMock).toHaveBeenCalledTimes(1);
      expect(createTournamentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Нов турнир 2026',
        })
      );
    });
  });

  it('opens edit modal and submits updated tournament', async () => {
    updateTournamentMock.mockResolvedValueOnce({
      ...mockTournaments[0],
      title: 'Обновена Зима',
    });

    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: 'Редактиране' });
    fireEvent.click(editButtons[0]);

    expect(screen.getByRole('heading', { name: 'Редактиране на турнир' })).toBeInTheDocument();
    expect(screen.getByLabelText(/име на турнира/i)).toHaveValue('Турнир Зима');

    fireEvent.change(screen.getByLabelText(/име на турнира/i), {
      target: { value: 'Обновена Зима' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    await waitFor(() => {
      expect(updateTournamentMock).toHaveBeenCalledTimes(1);
      expect(updateTournamentMock).toHaveBeenCalledWith(
        't-1',
        expect.objectContaining({
          title: 'Обновена Зима',
        })
      );
    });
  });

  it('opens delete confirmation modal and deletes tournament upon confirmation', async () => {
    deleteTournamentMock.mockResolvedValueOnce(undefined);

    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: 'Изтриване' });
    fireEvent.click(deleteButtons[0]);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Изтриване на турнир' })).toBeInTheDocument();
    expect(within(dialog).getByText('Турнир Зима')).toBeInTheDocument();

    // Confirm delete in modal
    const confirmDeleteBtn = within(dialog).getByRole('button', { name: 'Изтриване' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(deleteTournamentMock).toHaveBeenCalledTimes(1);
      expect(deleteTournamentMock).toHaveBeenCalledWith('t-1');
    });
  });
});
