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

  it('enthaelt Festival Playlist Texte auf Deutsch und Niederlaendisch', async () => {
    await i18n.changeLanguage('de')

    expect(i18n.t('info.musicPlaylist.open')).toBe('In Spotify öffnen')
    expect(i18n.t('admin.musicPlaylist.save')).toBe('Playlist speichern')

    await i18n.changeLanguage('nl')

    expect(i18n.t('info.musicPlaylist.open')).toBe('Openen in Spotify')
    expect(i18n.t('admin.musicPlaylist.save')).toBe('Playlist opslaan')
  })
})
