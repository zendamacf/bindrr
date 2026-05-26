import { describe, expect, it } from 'vitest';
import type { ScryfallCard } from './client';
import { mapScryfallExtendedDetails } from './extendedDetails';

describe('mapScryfallExtendedDetails', () => {
  it('maps a single-faced card', () => {
    const card: ScryfallCard = {
      id: 'abc',
      name: 'Lightning Bolt',
      set: 'm10',
      set_name: 'Magic 2010',
      collector_number: '146',
      lang: 'en',
      mana_cost: '{R}',
      type_line: 'Instant',
      oracle_text: 'Lightning Bolt deals 3 damage to any target.',
      artist: 'Christopher Rush',
      released_at: '2009-07-17',
    };

    expect(mapScryfallExtendedDetails(card)).toEqual({
      manaCost: '{R}',
      typeLine: 'Instant',
      oracleText: 'Lightning Bolt deals 3 damage to any target.',
      flavorText: null,
      artist: 'Christopher Rush',
      releasedAt: '2009-07-17',
    });
  });

  it('combines oracle text for double-faced cards', () => {
    const card: ScryfallCard = {
      id: 'dfc',
      name: 'Delver of Secrets',
      set: 'isd',
      set_name: 'Innistrad',
      collector_number: '51',
      lang: 'en',
      card_faces: [
        {
          name: 'Delver of Secrets',
          mana_cost: '{U}',
          type_line: 'Creature — Human Wizard',
          oracle_text: 'At the beginning of your upkeep, look at the top card of your library.',
        },
        {
          name: 'Insectile Aberration',
          type_line: 'Creature — Human Insect',
          oracle_text: 'Flying',
        },
      ],
    };

    const details = mapScryfallExtendedDetails(card);
    expect(details.manaCost).toBe('{U}');
    expect(details.oracleText).toContain('Delver of Secrets');
    expect(details.oracleText).toContain('Insectile Aberration');
  });
});
