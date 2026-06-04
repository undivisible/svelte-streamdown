# Contributing to Svelte Streamdown

Thank you for your interest in contributing to Svelte Streamdown.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Bun 1.3 or higher

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/svelte-streamdown.git
   cd svelte-streamdown
   ```
3. Install dependencies:
   ```bash
   bun install
   ```
4. Build all packages (required before running tests):
   ```bash
   bun run build
   ```
5. Run the tests to ensure everything is working:
   ```bash
   bun run test
   ```

## Development Workflow

### Project Structure

This is a monorepo managed with Turbo. The main package is located at:

- `packages/svelte-streamdown/` - The Svelte Streamdown component package
- `packages/remend/` - Incomplete markdown repair utilities

### Available Scripts

- `bun run build` - Build all packages
- `bun run build:packages` - Build publishable packages
- `bun run test` - Run tests
- `bun run check` - Check linting and formatting
- `bun run fix` - Fix linting and formatting
- `bun run typecheck` - Type checking
- `bun run lint` - Run lint gates
- `bun run format:check` - Check formatting

### Making Changes

1. Create a new branch for your feature or fix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure:
   - All tests pass (`bun run test`)
   - Code is properly formatted (`bun run format:check`)
   - Type checking passes (`bun run typecheck`)
   - Linting passes (`bun run lint`)

3. Write or update tests for your changes

4. Create a changeset for your changes:
   ```bash
   bun run changeset
   ```

   - Select the package(s) affected
   - Choose the appropriate version bump (patch/minor/major)
   - Write a concise description of the changes

## Commit Guidelines

We follow conventional commits for clear commit history:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code changes that neither fix bugs nor add features
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:

```
feat: add support for custom code block themes
fix: resolve markdown parsing issue with nested lists
docs: update README with new API examples
```

## Pull Request Process

1. Ensure your PR:
   - Has a clear, descriptive title
   - Includes a changeset when publishing changes require one
   - Passes all CI checks
   - Includes tests for new functionality
   - Updates documentation if needed

2. PR Description should include:
   - What changes were made
   - Why these changes were necessary
   - Any breaking changes
   - Screenshots/demos for UI changes

3. Link any related issues using keywords like `Fixes #123` or `Closes #456`

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode (in package directory)
cd packages/svelte-streamdown
bun vitest
```

### Writing Tests

- Tests are located in `packages/svelte-streamdown/__tests__/` and `packages/remend/__tests__/`
- Use descriptive test names
- Test both success and error cases
- Ensure good coverage for new features

## Release Process

Releases use changesets. Run `bun run changeset` for publishable package changes, then version and publish with the root scripts when preparing a release.

## Code Style

- We use TypeScript for type safety
- Follow the existing code style in the project
- Use meaningful variable and function names
- Keep functions small and focused

## Getting Help

- Open an issue for bugs or feature requests
- Join discussions in GitHub Discussions
- Check existing issues before creating new ones

## License

By contributing to Svelte Streamdown, you agree that your contributions will be licensed under the MPL-2.0 License. Apache-2.0 upstream license material is retained in `LICENSE-APACHE`.
