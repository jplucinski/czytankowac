# Runbook operacyjny — CzyTankowac.pl

## Konfiguracja repozytorium (jednorazowo)

1. **GitHub Actions** → Settings → Actions → General:
   - Workflow permissions: *Read and write*
   - Włącz *Allow GitHub Actions to create and approve pull requests*
2. **Pages** → Build and deployment → Source: *GitHub Actions*
3. **Secrets**: `OPENAI_API_KEY`
4. **Variables** (opcjonalne): `OPENAI_RESEARCH_MODEL`, `OPENAI_REVIEW_MODEL` (np. `gpt-4.1-mini`)

## Codzienny cykl autonomiczny

```
05:30 UTC — research.yml → PR → review.yml → merge → deploy.yml
```

Nie wymaga interwencji człowieka, gdy prognoza przejdzie walidację i review.

## Ręczne uruchomienie research

1. Actions → **Research Forecast** → Run workflow
2. Sprawdź branch `forecast/YYYY-MM-DD` i otwarty PR
3. Review uruchomi się automatycznie przez `repository_dispatch`

## Ponowne uruchomienie review

Gdy review się nie uruchomił lub wystąpił błąd infrastruktury:

```bash
gh api repos/{owner}/{repo}/dispatches \
  -f event_type=forecast-review-requested \
  -f client_payload[pr_number]=<N> \
  -f client_payload[branch]=forecast/YYYY-MM-DD \
  -f client_payload[head_sha]=<sha>
```

Lub: zamknij PR i uruchom research ponownie.

## Zamknięcie odrzuconego PR

1. Przeczytaj komentarz review na PR (❌ Odrzucono)
2. Zamknij PR bez merge: `gh pr close <N>`
3. Opcjonalnie usuń branch: `git push origin --delete forecast/YYYY-MM-DD`

## Cofnięcie złej prognozy na main

```bash
git checkout main
git pull
git revert <merge-commit-sha> -m 1
git push origin main
gh workflow run deploy.yml --ref main
```

## Ręczny deploy

Actions → **Deploy** → Run workflow (branch: `main`)

Lub:

```bash
gh workflow run deploy.yml --ref main
```

## Rotacja OPENAI_API_KEY

1. Wygeneruj nowy klucz w OpenAI
2. Settings → Secrets → `OPENAI_API_KEY` → Update
3. Uruchom research ręcznie, aby zweryfikować

## Wyłączenie harmonogramu research

Edytuj `.github/workflows/research.yml` — usuń lub zakomentuj sekcję `schedule`, commit na `main`.

## Lokalne testy

```bash
npm ci
npm run test:run
npm run build
OPENAI_API_KEY=sk-... npm run research   # wymaga sieci
npm run review                            # na src/data/latest.json
```

## Diagnostyka

| Problem | Działanie |
|---------|-----------|
| Research timeout | Workflow ponawia raz; sprawdź status OpenAI API |
| Review REJECT | PR pozostaje otwarty; strona bez zmian |
| Stale SHA | Review przerwany — uruchom review ponownie z aktualnym SHA |
| Deploy nie startuje | `gh workflow run deploy.yml --ref main` |
