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

  it('enthaelt Timetable Texte auf Deutsch und Niederlaendisch', async () => {
    await i18n.changeLanguage('de')

    expect(i18n.t('navigation.timetable')).toBe('Timetable')
    expect(i18n.t('timetable.empty')).toContain('noch keine Auftritte')
    expect(i18n.t('timetable.emptyDay')).toContain('An diesem Tag')
    expect(i18n.t('timetable.unknownAct')).toBe('Unbekannter Act')
    expect(i18n.t('timetable.favorite.add')).toBe('Als Favorit markieren')
    expect(i18n.t('timetable.favorite.remove')).toBe('Favorit entfernen')

    await i18n.changeLanguage('nl')

    expect(i18n.t('navigation.timetable')).toBe('Timetable')
    expect(i18n.t('timetable.empty')).toContain('nog geen optredens')
    expect(i18n.t('timetable.emptyDay')).toContain('Voor deze dag')
    expect(i18n.t('timetable.unknownAct')).toBe('Onbekende act')
    expect(i18n.t('timetable.favorite.add')).toBe('Als favoriet markeren')
    expect(i18n.t('timetable.favorite.remove')).toBe('Favoriet verwijderen')
  })

  it('enthaelt Admin Texte fuer Festivaltage auf Deutsch und Niederlaendisch', async () => {
    await i18n.changeLanguage('de')

    expect(i18n.t('admin.navigation.timetable')).toBe('Timetable')
    expect(i18n.t('admin.timetable.days.createButton')).toBe(
      'Festivaltag anlegen',
    )
    expect(i18n.t('admin.timetable.stages.createButton')).toBe('Bühne anlegen')
    expect(i18n.t('admin.timetable.acts.createButton')).toBe('Act anlegen')
    expect(i18n.t('admin.timetable.performances.createButton')).toBe(
      'Auftritt anlegen',
    )

    await i18n.changeLanguage('nl')

    expect(i18n.t('admin.navigation.timetable')).toBe('Timetable')
    expect(i18n.t('admin.timetable.days.createButton')).toBe(
      'Festivaldag aanmaken',
    )
    expect(i18n.t('admin.timetable.stages.createButton')).toBe(
      'Podium aanmaken',
    )
    expect(i18n.t('admin.timetable.acts.createButton')).toBe('Act aanmaken')
    expect(i18n.t('admin.timetable.performances.createButton')).toBe(
      'Optreden aanmaken',
    )
  })
})
