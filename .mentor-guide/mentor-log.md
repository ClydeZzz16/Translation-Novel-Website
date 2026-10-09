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
- **Decision**: Support direct local image file upload for Reader Profile pictures via HTML5 `FileReader` with instant preview, 2MB size constraint guard, and fallback to external image URLs.

## [2026-09-28] - Phase 2: Secure Supabase Admin Authentication System
- **Decision**: Integrate Supabase Authentication (Google OAuth) alongside database-level PostgreSQL Row-Level Security (RLS) and security-definer function `public.is_admin()`.
- **Decision**: Completely decouple the public website from the admin section. Remove all Admin/Creator buttons, modal triggers, and passcode access from the public navbar, drawer, footer, and catalog empty states.
- **Decision**: Implement URL-based routing for `/admin/*` (`/admin`, `/admin/login`, `/admin/novels`, `/admin/chapters`, `/admin/comments`, `/admin/settings`) via HTML5 History API while maintaining clean client-side SPA performance.
- **Decision**: Guard all `/admin/*` routes with a dual-layer check: Supabase Auth session validation followed by an authoritative database role query against `public.profiles.role = 'admin'`. Non-admins authenticated via Google OAuth are routed to an access denied screen with sign-out options.
- **Decision**: Provide modular admin management views: `AdminDashboard` (telemetry/metrics), `AdminNovels` (CRUD & publish toggle), `AdminChapters` (chapter editor with word count & sequence management), `AdminComments` (moderation & delete), `AdminSettings` (session info & account status).
- **Decision**: Provide local developer preview bypass when Supabase environment variables are unconfigured, enabling local UI testing without blocking production deployment security.
## [2026-10-08] - Phase 3: Two-Tier Google Authentication System (Normal Users & Administrator)
- **Decision**: Unified Google OAuth authentication across the entire platform — any visitor with a valid Google account can sign in as a normal reader without being pre-whitelisted or restricted.
- **Decision**: Implement two-tier authorization: visitors authenticate into normal reader accounts, while administrative access to `/admin` is granted exclusively to the Google account matching `ADMIN_EMAIL` / `VITE_ADMIN_EMAIL` and verified by Supabase database role `profiles.role = 'admin'` with Row-Level Security (RLS).
- **Decision**: Update `src/lib/supabase.ts` with `signInWithGoogle()`, `signOutUser()`, `fetchUserProfile()`, and `verifyAdminAuthorization()` supporting email and DB role verification.
- **Decision**: Expose Google Sign-In options for guests on public navigation header, mobile drawer, and user profile page without exposing admin access buttons or links in public UI.
- **Decision**: Implement `/auth/callback` routing handler in SPA to seamlessly finalize OAuth tokens and route authenticated users to their destination (`/admin`, `/profile`, or `/`).
- **Decision**: Synchronize Google authenticated session metadata (name, avatar, email) with `userProfile` state and Supabase `profiles` table.
- **Decision**: Add automated tests in `src/__tests__/App.test.tsx` validating visitor accessibility, guest Google Sign-In UI, and 403 access control for `/admin`.

## [2026-10-09] - Phase 4: Account-Scoped Bookmarks, Orphan Cleanup, Individual Removals & Admin Tool Access
- **Decision**: Scope bookmarks and reading history per user account (`ashtl_bookmarks_${userId}` and `ashtl_history_${userId}` for authenticated users vs guest storage), ensuring accounts do not share libraries while synchronizing with Supabase `bookmarks` and `reading_history` tables.
- **Decision**: Implement individual item deletion on Bookmarks cards (`handleRemoveBookmark`) and Reading History cards (`handleRemoveHistoryItem`), giving readers full control to remove specific novels from their lists.
- **Decision**: Implement automatic orphan filtering and cleanup (`visibleBookmarks`, `visibleHistory`, and pruning effect) so that novels deleted by admin are immediately purged from bookmarks and history.
- **Decision**: Surface direct Admin Tools navigation buttons in Desktop Header, Mobile Drawer, and User Profile view when `isAdminAuthorized` is true, enabling the administrator to easily access dashboard management.
- **Decision**: Proactively synchronize admin database elevation via `supabase.rpc('sync_admin_status')` in `verifyAdminAuthorization`, and seed `set_admin_email('ashtranslation123@gmail.com')` in `supabase/schema.sql` to ensure PostgreSQL Row-Level Security (RLS) permits novel and chapter management.

## [2026-10-09] - Phase 5: View & Bookmark Metrics, View-Based Spotlight & Most Popular Ranking
- **Decision**: Deprecate and remove star rating indicators across all user-facing interfaces (Spotlight Hero banner, Recently Updated cards, Catalog cards, Novel Detail view, and Admin management tables).
- **Decision**: Introduce visible engagement metrics: view counter (`views`) and bookmark counter (`bookmarksCount`) across novel cards, spotlight banners, detail headers, and admin management tables.
- **Decision**: Re-architect Featured Spotlight Novel on the Homepage to automatically select the published novel with the highest view count (`[...published].sort((a, b) => b.views - a.views)[0]`).
- **Decision**: Add dedicated "Most Popular" ranked showcase section on the Homepage displaying top-viewed novels with visual rank badges (`#1`, `#2`, etc.) and real-time view/bookmark counts.
- **Decision**: Update Novel Catalog sort options to support "Most Popular (Views)" as the primary view-based ranking mode alongside "Most Bookmarked" and "Recently Added".
- **Decision**: Wire reader activity to increment novel views automatically when chapters are read in the reader, with a per-session deduplication ref (`viewedChaptersRef`) to prevent redundant increments.
- **Decision**: Wire bookmark toggles to atomically increment or decrement novel `bookmarksCount` locally and synchronize updates to Supabase `novels.bookmarks_count`.
- **Decision**: Add automated Vitest unit tests verifying view-based Spotlight selection, Most Popular ranking, and dynamic bookmark count adjustments.
- **Decision**: Prevent view and bookmark counts from resetting to zero on account switch by using `Math.max()` merge with local cached metrics when `fetchSupabaseData` runs, adding SECURITY DEFINER RPC functions `increment_novel_view` and `sync_novel_bookmark_count`, and attaching trigger `trg_sync_novel_bookmarks_count` to synchronize database-level bookmark counts.


