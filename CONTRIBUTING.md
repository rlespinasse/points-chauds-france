# Contributing to Geopages Template

Thank you for helping improve the geopages template!

## How to Contribute

### Report a Bug
- Open an [issue](https://github.com/rlespinasse/geopages-template/issues)
- Include: what you were doing, what you expected, what happened

### Suggest a Feature
- Open a discussion
- Describe the use case

### Submit a Fix
- Fork the repo
- Create a branch: `git checkout -b fix/issue-name`
- Make changes
- Test locally: `npm run dev`
- Commit: `git commit -m "fix: description"`
- Push and open a PR

## Template Development Phases

The template is developed in phases:

- **Phase 1** (Current): Core template + basic docs
- **Phase 2** (Planned): datagouv MCP + custom skill
- **Phase 3** (Planned): Scaling pattern (sources.json + generator)
- **Phase 4** (Planned): Polish + publish

If you're working on Phase 2+, coordinate first to avoid duplicating work.

## Code Style

- Use TypeScript for new code
- Keep files simple and focused
- Comment only non-obvious code
- Follow existing patterns

## Documentation Style

Docs follow [Diataxis](https://diataxis.fr/) principles:

- **Tutorials** (learn): Step-by-step, hands-on
- **How-to** (do): Task-focused, assume basic knowledge
- **Explanation** (understand): Conceptual, discuss trade-offs
- **Reference** (look up): Precise, structured

When adding docs, choose the right category (see above).

## Running Tests

```bash
npm run validate-config  # Validate GeoJSON files
npm run build            # Test production build
```

No automated tests yet, but we verify:
1. Template clones successfully
2. `npm install` works
3. `npm run dev` starts
4. Build completes without errors
5. Sample layer appears and is interactive

## License

All contributions are licensed under MIT.

---

**Questions?** Open an issue or ask in discussions.
