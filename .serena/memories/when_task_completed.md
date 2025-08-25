# Task Completion Checklist

After completing any feature or bug fix, execute these verification steps:

1. **Code Quality**
   ```sh
   npm run lintfix
   ```
   - Automatically fixes lint/formatting issues
   - Required before commit

2. **Functional Verification**
   ```sh
   npm test
   ```
   - Runs all tests with pre-commit linting
   - Failing tests must be addressed

3. **Production Build Check**
   ```sh
   npm run build
   ```
   - Confirms successful production bundle generation
   - Validates minification and source maps

4. **Documentation** (if applicable)
   ```sh
   npm run docs
   ```
   - Updates API documentation

> 💡 Pro Tip: Use `npm run watch` during development for continuous Rollup builds