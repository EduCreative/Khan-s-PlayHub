# Changelog

## [1.8.8] - 2024-05-25
### Fixed
- **Build Failure**: Resolved TypeScript error `TS2345` in `services/gemini.ts` by adding fallback checks for `response.text`.
- **API Safety**: Updated `fetchDailyRiddle` to return mock data if `API_KEY` is missing, ensuring the app builds and runs without environment variables.

## [1.8.7] - 2024-05-25
### Changed
- **API Dependency Removed**: Removed all calls to Gemini AI to allow for a smooth initial deployment without requiring an API key.

... (rest of changelog)
