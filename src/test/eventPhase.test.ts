import { describe, expect, it } from 'vitest'
import { determineEventPhase, eventDateRangeFromDays } from '../domain/eventPhase'

const range = { startDate: '2026-06-19', endDate: '2026-06-21' }

describe('determineEventPhase', () => {
  it.each([
    ['before', '2026-06-18T12:00:00+02:00', 'before'],
    ['first day', '2026-06-19T00:00:00+02:00', 'during'],
    ['during', '2026-06-20T12:00:00+02:00', 'during'],
    ['last day', '2026-06-21T23:59:59+02:00', 'during'],
    ['after', '2026-06-22T00:00:00+02:00', 'after'],
  ] as const)('handles %s', (_case, instant, expected) => {
    expect(determineEventPhase(range, new Date(instant))).toBe(expected)
  })

  it('uses an open lower boundary without a start date', () => {
    expect(determineEventPhase({ endDate: '2026-06-21' }, new Date('2026-06-20T12:00:00Z'))).toBe('during')
    expect(determineEventPhase({ endDate: '2026-06-21' }, new Date('2026-06-22T12:00:00Z'))).toBe('after')
  })

  it('uses an open upper boundary without an end date', () => {
    expect(determineEventPhase({ startDate: '2026-06-19' }, new Date('2026-06-18T12:00:00Z'))).toBe('before')
    expect(determineEventPhase({ startDate: '2026-06-19' }, new Date('2026-06-22T12:00:00Z'))).toBe('during')
  })

  it('uses during as neutral fallback without dates', () => {
    expect(determineEventPhase({}, new Date('2026-06-20T12:00:00Z'))).toBe('during')
  })

  it('derives date-only boundaries independent of input order', () => {
    expect(eventDateRangeFromDays(['2026-06-21', 'invalid', '2026-06-19'])).toEqual({ startDate: '2026-06-19', endDate: '2026-06-21' })
  })

  it('uses the configured timezone at calendar-day boundaries', () => {
    expect(determineEventPhase(range, new Date('2026-06-18T22:30:00Z'), 'Europe/Berlin')).toBe('during')
  })
})
