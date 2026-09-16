import { readFile } from 'node:fs/promises';
import { ForecastSchema } from '../src/domain/forecast';
import { toCommitSummary } from '../src/domain/forecast-view';

const forecast = ForecastSchema.parse(
  JSON.parse(await readFile('src/data/latest.json', 'utf8')),
);

const date = forecast.asOf.slice(0, 10);
const ref = `forecast/${date}`;
const subject = `forecast: ${toCommitSummary(forecast)}`;

const lines = [subject, '', `Date: ${date}`, `Ref: ${ref}`];

if (process.env.PR_NUMBER) {
  lines.push(`PR: #${process.env.PR_NUMBER}`);
}

console.log(lines.join('\n'));
