import { describe, expect, it } from 'vitest'
import i18n from '../i18n'

describe('i18n test infrastructure', () => {
  it('loads translations and applies replacements', () => {
    expect(
      i18n.t('app.ariaLabel', {
        count: 3,
        festivalName: 'Hurricane Awards 2026',
      }),
    ).toContain('3')
  })

  it('falls back to German when a translation is missing', async () => {
    await i18n.changeLanguage('nl')

    expect(
      i18n.t('app.ariaLabel', {
        count: 3,
        festivalName: 'Hurricane Awards 2026',
      }),
    ).toBe(
      'Hurricane Awards 2026 met 3 deelnemers',
    )
    expect(i18n.t('test.missing.key')).toBe('test.missing.key')
  })
})
