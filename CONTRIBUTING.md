# Contributing to Function Studies

Thanks for helping make the graphs clearer, the math more accurate, and the app more useful.

## Start here

For a bug, use the bug report issue template. For a mathematical error, use the math accuracy template and include the formula or identity involved. For a new feature, explain what someone could do with it and why it belongs in the app.

Small fixes can go straight to a pull request. For a larger change, open an issue first so we can agree on the approach.

## Local setup

Use Node.js 22 and pnpm 10.

```sh
git clone https://github.com/HarshitKumar9030/function-studies.git
cd function-studies
pnpm install --frozen-lockfile
pnpm dev
```

The graphs, custom editor and exports work without credentials. For the assistant, copy `.env.example` to `.env.local`. Your own key can also be entered in the app. Public usage needs a Google AI key and MongoDB connection; usage records live in the separate `function_studies` database.

## Before opening a pull request

```sh
pnpm format
pnpm test
pnpm build
pnpm test:deployment
pnpm format:check
```

For visual changes, check desktop and a narrow mobile screen. For graph changes, check undefined points and discontinuities as well as a typical curve. Add tests when they demonstrate a mathematical property or prevent a meaningful regression.

Write a short description of the problem, the new behavior and how you checked it. Include a screenshot for a visible change. Keep unrelated edits in separate pull requests.

## A few conventions

- Keep the interface quiet and readable. Preserve the monochrome graph and mathematical typography.
- Use the existing bounded expression parser. Do not evaluate custom expressions as JavaScript.
- Keep the assistant focused on math while allowing greetings and ordinary conversation.
- Reserve public tokens before provider calls. Do not replace the shared MongoDB budget with a process-local counter or silently fall back to the public key for BYOK requests.
- Keep API keys and connection strings out of source, issues, screenshots and logs.

There is no contribution license agreement. The repository does not currently declare a project license; do not assume it grants an open-source license.
