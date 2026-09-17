# CzyTankowac.pl

A project for running OpenAI agents with web search (`@openai/agents` + `webSearchTool`). The demo is a static site with PB95 and diesel fill-up recommendations for Poland.

Site: [https://jplucinski.github.io/czytankowac](https://jplucinski.github.io/czytankowac)

Agent architecture is iterated in **GitHub Actions** (schedule, secrets, PRs, review, deploy): research → review → merge → GitHub Pages.

## Local development

```bash
npm ci
npm run dev        # site preview
npm run test:run   # tests
npm run build      # static build → dist/
npm run research   # research agent (needs OPENAI_API_KEY)
npm run review     # validation + forecast review
```

Ops: [docs/runbook.md](docs/runbook.md).
