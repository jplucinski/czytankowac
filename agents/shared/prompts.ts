export const RESEARCH_PROMPT_MAX_CHARS = 1600;
export const REVIEW_PROMPT_MAX_CHARS = 1200;

export const RESEARCH_SEARCH_OPTIONS = {
  searchContextSize: 'low' as const,
  userLocation: { type: 'approximate' as const, country: 'PL' },
};

export const REVIEW_SEARCH_OPTIONS = {
  searchContextSize: 'low' as const,
  userLocation: { type: 'approximate' as const, country: 'PL' },
};

export const RESEARCH_PROMPT = `Analizuj rynek paliw w Polsce i zwróć prognozę JSON.

Zasady:
- Tylko rynek PL, paliwa PB95 i DIESEL, horyzont 7 dni (horizonDays=7, market=PL).
- direction: UP, STABLE lub DOWN; recommendation: FILL_UP, NORMAL lub WAIT.
- Min. 3 źródła z min. 2 różnych hostów; max 2 wyszukiwania web.
- Preferuj: hurt (Orlen, ANWIM), kurs EUR NBP, notowania detaliczne PL.
- summary: jedno zdanie po polsku, max 160 znaków, bez żargonu i bez słowa "AI".
- confidence: 0–1, konserwatywnie; oddziel obserwowane fakty od przewidywania.
- Nie twierdź, że prognoza jest pewna.
- Ustaw asOf na czas bieżący (UTC, ISO-8601).
- Każde źródło: title, url, accessedAt (ISO-8601).`;

export const REVIEW_PROMPT = `Weryfikuj prognozę paliw PL (PB95, DIESEL) na 7 dni.

Zasady:
- Max 1 wyszukiwanie web; sprawdź główny sygnał per paliwo.
- REJECT tylko gdy dowody są sprzeczne z direction/recommendation lub brak jakiegokolwiek publicznego sygnału.
- Słabe lub niejednoznaczne uzasadnienie → PASS; opisz słabość w issues i summary.
- Nie wymagaj pewnych prognoz — rekomendacja modelu jest z natury słaba.
- summary: max 120 znaków, po polsku, bez żargonu.
- issues: lista krótkich problemów (pusta gdy brak zastrzeżeń).`;
