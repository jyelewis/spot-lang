# Development Guide

## Project Structure

This is a yarn workspace monorepo with the following structure:

```
spot-lang/
├── packages/
│   └── spot-engine/          # Core language engine
│       ├── src/
│       │   └── index.ts      # Main entry point
│       ├── tests/
│       │   └── index.test.ts # Unit tests
│       ├── package.json
│       └── tsconfig.json
├── docs/                     # Documentation
├── .github/
│   └── workflows/           # CI/CD workflows
├── package.json             # Root package configuration
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest testing configuration
├── .eslintrc.js           # ESLint configuration
└── .prettierrc            # Prettier configuration
```

## Development Workflow

1. **Install dependencies**: `yarn install`
2. **Start development**: `yarn dev`
3. **Run tests**: `yarn test`
4. **Lint code**: `yarn lint`
5. **Format code**: `yarn format`
6. **Type check**: `yarn typecheck`

## Tools Used

- **TypeScript**: Primary language
- **tsx**: For running TypeScript files directly
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Yarn Workspaces**: Monorepo management

## Adding New Packages

To add a new package to the workspace:

1. Create a new directory under `packages/`
2. Add a `package.json` with the package configuration
3. Update the root `package.json` workspaces if needed
4. Run `yarn install` to link the workspace
