import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'

vi.mock('../data/categories', () => ({
  loadCategories: vi.fn().mockResolvedValue([]),
  updateCategoryStatus: vi.fn(),
}))

vi.mock('../data/participants', () => ({
  loadParticipants: vi.fn().mockResolvedValue([]),
}))

vi.mock('../data/votes', () => ({
  deleteVotesForCategory: vi.fn(),
  loadVotes: vi.fn().mockResolvedValue([]),
  loadVotesForParticipant: vi.fn().mockResolvedValue([]),
  saveVote: vi.fn(),
}))

vi.mock('../data/allTimeStandings', () => ({
  loadAllTimeStandings: vi.fn().mockResolvedValue([]),
}))

describe('React test infrastructure', () => {
  it('renders the app shell in jsdom', async () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: /hurricane awards 2026/i }),
    ).toBeInTheDocument()

    expect(
      await screen.findByRole('main', {
        name: /hurricane awards 2026 mit 0/i,
      }),
    ).toBeVisible()
  })
})
