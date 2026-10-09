# Feature Guide: 01 - AshTL Translation Novel Platform

## Mission
Build and configure the complete AshTL web novel reading and translation platform, including full catalog search/filter, distraction-free customized reader with dual-language capability, bookmarks, history, admin publishing, and responsive aesthetic UI.

## Success Criteria
1. Fast, responsive, modern web application running on Vite + React + TypeScript.
2. Complete data models for Novels, Chapters, Reader Settings, Bookmarks, and History.
3. Multi-view navigation: Home, Novel Catalog, Novel Detail, Reader, Bookmarks, History, Admin, DMCA, Privacy, About.
4. Distraction-free reader with font size, line-height, width, font family, theme (Light, Dark, Sepia, OLED), and dual-language stacked view.
5. Non-intrusive AdSlot integration points.
6. Full test suite and lint passing with zero errors.

## Key Files to Create / Modify
- `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- `src/index.css`: Tailwind configuration and ash color tokens
- `src/types/novel.ts`: Complete TypeScript interfaces
- `src/data/initialNovels.ts`: Initial dataset with multiple novels in CN, KR, JP
- `src/components/AdSlot.tsx`: Ad placeholder component
- `src/App.tsx`: Main application component
- `src/__tests__/App.test.tsx`: Integration tests for key flows
