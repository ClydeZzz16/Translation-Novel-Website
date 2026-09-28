# Mentor Log: Architectural Decisions & History

## [2026-09-28] - Phase 1: AshTL Translation Platform Initialization
- **Decision**: Adopt Vite with React 19 / TypeScript for blazing fast local HMR and modern bundle generation.
- **Decision**: Use Tailwind CSS for utility-first styling supplemented with custom ash-theme color palette matching modern web novel reading apps.
- **Decision**: Lucide React for consistent icon design across navigation, reader settings, and admin dashboard.
- **Decision**: Provide both single and split/stacked dual-language reading modes to support translation comparison between source language (Chinese/Korean/Japanese) and English.
- **Decision**: Implement client-side persistence for reading progress and bookmarks via LocalStorage.
- **Decision**: Add dedicated non-intrusive AdSlot component supporting multiple ad network adapters (e.g. Montagem, Google AdSense).
- **Decision**: Set initial novel catalog to empty state by default to prepare for user's custom translated content post-deployment, accompanied by clear empty-state UI and Admin shortcuts.
- **Decision**: Enforce automatic window scroll reset (`window.scrollTo(0, 0)`) when entering reader mode to ensure readers always begin at the top of a chapter.
- **Decision**: Implement dynamic navigation stack tracking (`previousPage`) so navigating back from novel detail properly returns to the referring view (Home or Catalog).
- **Decision**: Refine light theme color tokens across background, card surfaces, and text classes to ensure WCAG AA contrast compliance.
- **Decision**: Integrate browser HTML5 History API (`window.history.pushState` and `window.addEventListener('popstate')`) so that pressing the browser back button while browsing Novels, Bookmarks, History, or Admin returns to Home instead of exiting the website.
- **Decision**: Add persistent in-app "Back to Home" navigation headers to all top-level subviews (Novels Catalog, Bookmarks, History, Admin, DMCA, Privacy, About) providing an intuitive one-click return path.
- **Decision**: Synchronize the `dark` class on `document.documentElement` to guarantee proper cascade of theme mode color tokens across all DOM nodes in light mode.
- **Decision**: Configure `@custom-variant dark (&:where(.dark, .dark *));` in `index.css` to override Tailwind CSS v4's default `prefers-color-scheme: dark` media query behavior with a deterministic class-based toggle, eliminating dark-mode bleed when users switch to light mode on dark-mode OS environments.
- **Decision**: Update official copyright agent email in DMCA takedown policy from `dmca@ash-tl.com` to `ashtranslation123@gmail.com`.
- **Decision**: Replace external cover image URL input with direct local file upload via HTML5 `FileReader` producing base64 data URLs, enabling direct cover uploads without external image hosting.
- **Decision**: Transition platform architecture to purely English translated web novels, removing multi-source language filters and raw chapter toggles to provide a streamlined, focused reader experience.

