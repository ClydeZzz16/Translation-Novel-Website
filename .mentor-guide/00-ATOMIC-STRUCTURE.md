# Atomic Branching Strategy & Architecture Overview

## Gitflow & Branching Strategy
- `main`: Production release branch. Only accepts fast-forward merges from `develop` via release tags.
- `develop`: Primary integration branch. All feature branches branch off `develop` and merge back here.
- `feature/*`: Dedicated atomic feature branches (e.g. `feature/ash-tl-platform`).
- `hotfix/*`: Emergency patches directly targeting `main` and back-ported to `develop`.

## System Overview: AshTL Novel Translation Web Platform
AshTL is a high-performance web platform designed for reading and translating Asian web novels (Chinese, Korean, Japanese).

### Key Architectural Pillars
1. **Reader Customization Engine**:
   - Typography controls: font size, font family (serif, sans, mono), line height, reading container width.
   - Ambient themes: Light, Dark, Sepia, OLED Pitch-black.
   - Dual-language translation view: Stacked parallel paragraphs aligning raw source and translated text.
2. **Catalog & Search Filter Matrix**:
   - Multi-parameter filtering by genre, original language, publication status, and sorting by popularity, rating, or recency.
3. **Local State & Persistence Layer**:
   - Client-side reading progress tracking (last chapter read, percentage progress).
   - Bookmark collection stored in LocalStorage.
4. **Monetization & Ad Architecture**:
   - Clean, non-intrusive ad slot abstraction (`AdSlot`) supporting pluggable ad networks (Montagem Ads, Google AdSense, demo).
5. **Admin Operations Dashboard**:
   - Content statistics, chapter publication and translation workflow tooling.
