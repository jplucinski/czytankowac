# CzyTankowac.pl

Statyczna strona z rekomendacją tankowania PB95 i diesla w Polsce. Prognoza jest generowana codziennie przez agenta OpenAI w GitHub Actions, weryfikowana przez niezależnego recenzenta i publikowana na GitHub Pages po przejściu review.

## Lokalny development

```bash
npm ci
npm run dev        # podgląd strony
npm run test:run   # testy
npm run build      # build statyczny → dist/
npm run research   # agent badawczy (wymaga OPENAI_API_KEY)
npm run review     # walidacja + recenzja prognozy
```

Operacje produkcyjne: [docs/runbook.md](docs/runbook.md).
