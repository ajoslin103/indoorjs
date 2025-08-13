# Codebase Structure

## Top-Level Organization
```
├── build/       # Build configurations (Rollup, Webpack)
├── demo/        # Interactive examples and test harness
├── dist/        # Production builds (indoor.js, indoor.min.js)
├── src/         # Primary source code
├── test/        # Unit and integration tests
├── dev/         # Development tools
└── lib/         # Legacy library components
```

## Key Directories
- **src/**
  - Core rendering engine
  - Map coordinate system implementations
  - Fabric.js integration layer

- **test/**
  - Karma/Mocha test suites
  - Canvas rendering verification

- **build/**
  - Rollup configuration
  - Webpack development server setup
  - Release scripts

## Important Files
- `package.json`: Primary project configuration
- `.eslintrc.js`: Code quality rules
- `.prettierrc`: Formatting standards