# Code Style & Conventions

## JavaScript Style
- **Base Standard**: Airbnb JavaScript Style Guide (modified)
- **Single Quotes**: Always used for strings (`'text'`)
- **Line Length**: Max 100 characters
- **Comma Dangle**: Never for arrays/objects (except functions)

## Formatting Rules
- **Prettier**: Enforced with:
  ```json
  {
    "printWidth": 100,
    "singleQuote": true
  }
  ```
- **Tab Size**: 2 spaces (implied by Airbnb config)

## Ignored Rules
The following Airbnb rules are disabled:
- `no-underscore-dangle` (allows private members)
- `no-param-reassign`
- `arrow-parens`
- `implicit-arrow-linebreak`