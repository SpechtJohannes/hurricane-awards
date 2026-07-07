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
    expect(i18n.t('timetable.emptyStages')).toContain('noch keine Buehnen')
    expect(i18n.t('timetable.emptyDay')).toContain('An diesem Tag')
    expect(i18n.t('timetable.scrollHint')).toContain('Seitlich scrollen')
    expect(i18n.t('timetable.unknownAct')).toBe('Unbekannter Act')
    expect(i18n.t('timetable.favorite.add')).toBe('Als Favorit markieren')
    expect(i18n.t('timetable.favorite.badge')).toBe('Favorit')
    expect(i18n.t('timetable.favorite.remove')).toBe('Favorit entfernen')
    expect(i18n.t('timetable.favorite.sharedLabel')).toBe('Auch dabei')
    expect(i18n.t('timetable.favorite.sharedMore', { count: 2 })).toBe('+2')

    await i18n.changeLanguage('nl')

    expect(i18n.t('navigation.timetable')).toBe('Timetable')
    expect(i18n.t('timetable.empty')).toContain('nog geen optredens')
    expect(i18n.t('timetable.emptyStages')).toContain('nog geen podia')
    expect(i18n.t('timetable.emptyDay')).toContain('Voor deze dag')
    expect(i18n.t('timetable.scrollHint')).toContain('Scroll zijwaarts')
    expect(i18n.t('timetable.unknownAct')).toBe('Onbekende act')
    expect(i18n.t('timetable.favorite.add')).toBe('Als favoriet markeren')
    expect(i18n.t('timetable.favorite.badge')).toBe('Favoriet')
    expect(i18n.t('timetable.favorite.remove')).toBe('Favoriet verwijderen')
    expect(i18n.t('timetable.favorite.sharedLabel')).toBe('Ook erbij')
    expect(i18n.t('timetable.favorite.sharedMore', { count: 2 })).toBe('+2')
  })

  it('enthaelt Bingo Erklaerungen auf Deutsch und Niederlaendisch', async () => {
    await i18n.changeLanguage('de')

    expect(i18n.t('navigation.games')).toBe('Spiele')
    expect(i18n.t('games.title')).toBe('Spiele')
    expect(i18n.t('games.navigationLabel')).toBe('Spielauswahl')
    expect(i18n.t('bingo.description')).toContain(
      'automatisch eine eigene Bingokarte',
    )
    expect(i18n.t('bingo.description')).toContain(
      'ausserhalb der App',
    )

    await i18n.changeLanguage('nl')

    expect(i18n.t('navigation.games')).toBe('Spellen')
    expect(i18n.t('games.title')).toBe('Spellen')
    expect(i18n.t('games.navigationLabel')).toBe('Spelkeuze')
    expect(i18n.t('bingo.description')).toContain(
      'automatisch een eigen bingokaart',
    )
    expect(i18n.t('bingo.description')).toContain(
      'buiten de app',
    )
  })

  it('enthaelt Abstimmungs-Empty-State-Texte auf Deutsch und Niederlaendisch', async () => {
    await i18n.changeLanguage('de')

    expect(i18n.t('categories.empty')).toContain('keine Abstimmungen aktiv')

    await i18n.changeLanguage('nl')

    expect(i18n.t('categories.empty')).toContain('geen actieve stemmingen')
  })

  it('enthaelt Profiltexte fuer Login- und Profilzustand', async () => {
    await i18n.changeLanguage('de')

    expect(i18n.t('navigation.dashboard')).toBe('Start')
    expect(i18n.t('dashboard.greeting', { name: 'Alice' })).toBe('Hallo Alice')
    expect(i18n.t('dashboard.tiles.awards.title')).toBe('Abstimmungen')
    expect(i18n.t('identity.loginTitle')).toContain('Teilnehmercode')
    expect(i18n.t('identity.profileTitle')).toBe('Dein Profil')
    expect(i18n.t('identity.avatar.selected')).toBe('Ausgewählt')

    await i18n.changeLanguage('nl')

    expect(i18n.t('navigation.dashboard')).toBe('Start')
    expect(i18n.t('dashboard.greeting', { name: 'Alice' })).toBe('Hallo Alice')
    expect(i18n.t('dashboard.tiles.awards.title')).toBe('Stemmingen')
    expect(i18n.t('identity.loginTitle')).toContain('deelnemerscode')
    expect(i18n.t('identity.profileTitle')).toBe('Je profiel')
    expect(i18n.t('identity.avatar.selected')).toBe('Gekozen')
  })

  it('enthaelt Admin Texte fuer Festivaltage auf Deutsch und Niederlaendisch', async () => {
    await i18n.changeLanguage('de')

    expect(i18n.t('admin.navigation.timetable')).toBe('Timetable')
    expect(i18n.t('admin.timetable.days.createButton')).toBe(
      'Festivaltag anlegen',
    )
    expect(i18n.t('admin.timetable.stages.createButton')).toBe('Bühne anlegen')
    expect(i18n.t('admin.timetable.stages.colorLabel')).toBe('Farbe')
    expect(i18n.t('admin.timetable.stages.defaultColor')).toBe('Standard')
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
    expect(i18n.t('admin.timetable.stages.colorLabel')).toBe('Kleur')
    expect(i18n.t('admin.timetable.stages.defaultColor')).toBe('Standaard')
    expect(i18n.t('admin.timetable.acts.createButton')).toBe('Act aanmaken')
    expect(i18n.t('admin.timetable.performances.createButton')).toBe(
      'Optreden aanmaken',
    )
  })
})
