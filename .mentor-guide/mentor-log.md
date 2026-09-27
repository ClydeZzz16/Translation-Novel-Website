# Mentor Log: Architectural Decisions & History

## [2026-09-28] - Phase 1: AshTL Translation Platform Initialization
- **Decision**: Adopt Vite with React 19 / TypeScript for blazing fast local HMR and modern bundle generation.
- **Decision**: Use Tailwind CSS for utility-first styling supplemented with custom ash-theme color palette matching modern web novel reading apps.
- **Decision**: Lucide React for consistent icon design across navigation, reader settings, and admin dashboard.
- **Decision**: Provide both single and split/stacked dual-language reading modes to support translation comparison between source language (Chinese/Korean/Japanese) and English.
- **Decision**: Implement client-side persistence for reading progress and bookmarks via LocalStorage.
- **Decision**: Add dedicated non-intrusive AdSlot component supporting multiple ad network adapters (e.g. Montagem, Google AdSense).
