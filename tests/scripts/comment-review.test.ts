import { execFileSync } from 'node:child_process';
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const commentScript = path.resolve('scripts/comment-review.sh');

async function runComment(env: Record<string, string>): Promise<{
  status: number;
  stdout: string;
  comment: string;
}> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'czytankowac-gh-'));
  const ghPath = path.join(dir, 'gh');
  const commentPath = path.join(dir, 'comment.txt');
  await writeFile(
    ghPath,
    `#!/usr/bin/env bash
printf '%s\\n' "$*" > "${commentPath.replace(/\\/g, '/')}"
`,
    'utf8',
  );
  await chmod(ghPath, 0o755);

  try {
    const stdout = execFileSync('bash', [commentScript], {
      env: {
        ...process.env,
        PATH: `${dir}${path.delimiter}${process.env.PATH ?? ''}`,
        PR_NUMBER: '4',
        ...env,
      },
      encoding: 'utf8',
    });
    return {
      status: 0,
      stdout,
      comment: await readFile(commentPath, 'utf8'),
    };
  } catch (error) {
    const err = error as { status?: number; stdout?: string };
    let comment = '';
    try {
      comment = await readFile(commentPath, 'utf8');
    } catch {
      comment = '';
    }
    return { status: err.status ?? 1, stdout: err.stdout ?? '', comment };
  }
}

describe('comment-review.sh', () => {
  it('posts a PASS comment from valid JSON', async () => {
    const result = await runComment({
      REVIEW_JSON: JSON.stringify({
        decision: 'PASS',
        issues: [],
        summary: 'OK',
      }),
    });

    expect(result.status).toBe(0);
    expect(result.comment).toContain('Zatwierdzono');
    expect(result.comment).toContain('OK');
  });

  it('still comments when npm banners make REVIEW_JSON invalid', async () => {
    const result = await runComment({
      REVIEW_JSON: '\n> czytankowac@0.1.0 review\n> tsx agents/review/run-review.ts\n',
    });

    expect(result.status).toBe(1);
    expect(result.comment).toContain('nie zwrócił poprawnego JSON');
    expect(result.comment).toContain('czytankowac@0.1.0');
  });
});
