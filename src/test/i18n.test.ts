import { describe, expect, it } from 'vitest'
import { t } from '../i18n'

describe('i18n test infrastructure', () => {
  it('loads translations and applies replacements', () => {
    expect(t('app.ariaLabel', { count: 3 })).toContain('3')
  })

  it('falls back to the translation path for missing keys', () => {
    expect(t('test.missing.key')).toBe('test.missing.key')
  })
})
