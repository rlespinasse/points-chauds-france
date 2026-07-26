# Contributing

Bug reports and pull requests are welcome.

## Reporting a bug

Open an [issue](https://github.com/rlespinasse/points-chauds-france/issues/new)
with what you expected, what happened, and how to reproduce it (browser,
steps, screenshots if relevant).

## Submitting a change

1. Fork the repo and create a branch from `main`.
2. `npm install`, then `npm run dev` to work locally.
3. Run `npm run build` before opening a PR — there's no automated test suite
   yet, so a successful build is the sanity check.
4. If you touch `public/data/*.geojson` or `src/config.ts`, `npm run
   validate-config` also runs automatically via a Claude Code hook (see
   `.claude/settings.json`).
5. Open a pull request describing the change and why.

By contributing, you agree your contributions are licensed under the
project's [MIT license](LICENSE).

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
