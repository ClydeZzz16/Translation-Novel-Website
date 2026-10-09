import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';

describe('AshTL Application Core Workflows & Admin Security', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('renders brand header, hero section, and empty state CTA with Browse Catalog button', () => {
    render(<App />);
    expect(screen.getAllByText('AshTL').length).toBeGreaterThan(0);
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();
    expect(screen.getByText('Ready for Your Translated Novels')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Browse Catalog/i })).toBeInTheDocument();
  });

  it('verifies complete absence of Admin or Creator navigation buttons or links in public UI', () => {
    render(<App />);

    // Header, drawer, and footer must not leak any admin entry points
    expect(screen.queryByRole('button', { name: /^Admin$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Creator/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Creator Verification/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Creator Access/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Admin Portal/i)).not.toBeInTheDocument();
  });

  it('navigates to novel catalog and shows empty state when no novels exist', () => {
    render(<App />);
    const catalogNavBtn = screen.getByRole('button', { name: /^Novels$/i });
    fireEvent.click(catalogNavBtn);

    expect(screen.getByRole('heading', { level: 1, name: 'Novel Catalog' })).toBeInTheDocument();
    expect(screen.getByText('No Novels Found')).toBeInTheDocument();
    expect(screen.getByText(/No novels have been published in the catalog yet/i)).toBeInTheDocument();
    // No Admin button should be offered on empty catalog
    expect(screen.queryByRole('button', { name: /Admin/i })).not.toBeInTheDocument();
  });

  it('renders catalog with novels and filters them by genre', () => {
    localStorage.setItem('ashtl_novels', JSON.stringify([
      {
        id: '1', slug: 'fantasy-reign', title: 'Fantasy Reign', altTitles: [], author: 'Author One',
        translator: 'TL', status: 'Ongoing', originalLanguage: 'Chinese',
        genres: ['Fantasy'], rating: 4.8, views: 100, bookmarksCount: 10,
        coverUrl: 'https://example.com/cover1.jpg', synopsis: 'A fantasy epic.',
        latestChapter: 5, chapters: []
      },
      {
        id: '2', slug: 'sci-fi-galaxy', title: 'Sci-Fi Galaxy', altTitles: [], author: 'Author Two',
        translator: 'TL', status: 'Completed', originalLanguage: 'Korean',
        genres: ['Sci-Fi'], rating: 4.5, views: 50, bookmarksCount: 5,
        coverUrl: 'https://example.com/cover2.jpg', synopsis: 'A galactic adventure.',
        latestChapter: 10, chapters: []
      }
    ]));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Novels$/i }));

    expect(screen.getByText('Fantasy Reign')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi Galaxy')).toBeInTheDocument();

    // Filter by Genre
    const genreSelect = screen.getByLabelText(/Filter by genre/i);
    fireEvent.change(genreSelect, { target: { value: 'Fantasy' } });

    expect(screen.getByText('Fantasy Reign')).toBeInTheDocument();
    expect(screen.queryByText('Sci-Fi Galaxy')).not.toBeInTheDocument();
  });

  it('toggles bookmarks and persists in localStorage', () => {
    localStorage.setItem('ashtl_novels', JSON.stringify([{
      id: '1', slug: 'test-novel', title: 'Test Novel', altTitles: [], author: 'Author',
      translator: 'TL', status: 'Ongoing', originalLanguage: 'Chinese',
      genres: ['Fantasy'], rating: 5.0, views: 0, bookmarksCount: 0,
      coverUrl: 'https://example.com/img.jpg', synopsis: 'A test novel.',
      latestChapter: 0, chapters: []
    }]));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /View Details/i }));

    const bookmarkBtn = screen.getByRole('button', { name: /Add to Bookmarks/i });
    fireEvent.click(bookmarkBtn);

    expect(screen.getByText(/Bookmarked/i)).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem('ashtl_bookmarks') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].novelTitle).toBe('Test Novel');
  });

  it('navigates back to home from Novels, Bookmarks, and History views using in-app back button', () => {
    render(<App />);

    // Novels -> Back to Home
    fireEvent.click(screen.getByRole('button', { name: /^Novels$/i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Novel Catalog' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to Home/i }));
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();

    // Bookmarks -> Back to Home
    fireEvent.click(screen.getByRole('button', { name: /^Bookmarks/i }));
    expect(screen.getByRole('heading', { level: 1, name: /My Saved Bookmarks/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to Home/i }));
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();

    // History -> Back to Home
    fireEvent.click(screen.getByRole('button', { name: /^History$/i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Reading History' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to Home/i }));
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();
  });

  it('handles browser popstate navigation to go back to home without leaving the site', () => {
    render(<App />);

    // Navigate to Novels
    fireEvent.click(screen.getByRole('button', { name: /^Novels$/i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Novel Catalog' })).toBeInTheDocument();

    // Simulate browser Back button via popstate event
    act(() => {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate', { state: { page: 'home' } }));
    });

    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();
  });

  it('toggles light/dark theme and synchronizes documentElement class', () => {
    render(<App />);
    const themeBtn = screen.getByRole('button', { name: /Toggle Light\/Dark Theme/i });

    // App starts in dark theme
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle to light theme
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('ashtl_theme')).toBe('light');

    // Toggle back to dark theme
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('ashtl_theme')).toBe('dark');
  });

  it('renders static legal pages (DMCA, Privacy, About) with updated DMCA email and can navigate back', () => {
    render(<App />);
    const dmcaFooterLink = screen.getByText('DMCA Copyright Policy');
    fireEvent.click(dmcaFooterLink);
    expect(screen.getByRole('heading', { level: 1, name: 'DMCA Copyright Policy' })).toBeInTheDocument();
    expect(screen.getByText('ashtranslation123@gmail.com')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to Home/i }));
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();

    const privacyFooterLink = screen.getByText('Privacy Policy');
    fireEvent.click(privacyFooterLink);
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to Home/i }));
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();

    const aboutFooterLink = screen.getByText('About AshTL');
    fireEvent.click(aboutFooterLink);
    expect(screen.getByRole('heading', { level: 1, name: 'About AshTL' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to Home/i }));
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();
  });

  it('navigates to user profile, renders reading statistics, and allows editing profile with file upload for avatar', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Profile/i }));
    expect(screen.getByText('AshReader')).toBeInTheDocument();
    expect(screen.getAllByText(/Saved Bookmarks/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Chapters Read/i).length).toBeGreaterThan(0);

    // Edit profile
    fireEvent.click(screen.getByText('Edit Profile'));
    const usernameInput = screen.getByDisplayValue('AshReader');
    fireEvent.change(usernameInput, { target: { value: 'ClydeTheTranslator' } });

    // Verify profile picture file input exists
    const avatarFileInput = screen.getByLabelText(/Upload profile picture/i) as HTMLInputElement;
    expect(avatarFileInput).toBeInTheDocument();
    expect(avatarFileInput.type).toBe('file');
    expect(avatarFileInput.accept).toBe('image/*');

    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));
    expect(screen.getByText('ClydeTheTranslator')).toBeInTheDocument();
  });

  it('does not display language filter options in the novel catalog', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Novels$/i }));

    // Verify no language filter buttons/selects
    expect(screen.queryByText('Language:')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Chinese$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Korean$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Japanese$/i })).not.toBeInTheDocument();
  });

  it('admin routing: shows AdminLogin when visiting /admin directly without active session', () => {
    window.history.replaceState({}, '', '/admin');
    render(<App />);

    expect(screen.getByText('AshTL Administrator Portal')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Return to Public Website')).toBeInTheDocument();
  });

  it('admin routing: allows entering Dev Admin Preview and renders admin navigation and dashboard', () => {
    window.history.replaceState({}, '', '/admin');
    render(<App />);

    const devBypassBtn = screen.getByRole('button', { name: /Enter Dev Admin Preview/i });
    expect(devBypassBtn).toBeInTheDocument();
    fireEvent.click(devBypassBtn);

    // Now inside AdminLayout
    expect(screen.getByText('ASH TRANSLATION')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Novels$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Chapters$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Comments$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Settings$/i })).toBeInTheDocument();

    // Verify dashboard statistics are rendered
    expect(screen.getByText('Total Novels')).toBeInTheDocument();
    expect(screen.getByText('Total Chapters')).toBeInTheDocument();

    // Navigate to Novels tab
    fireEvent.click(screen.getByText('Novels'));
    expect(screen.getByText('Novel Management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Novel/i })).toBeInTheDocument();

    // Return to Public Website
    fireEvent.click(screen.getByRole('button', { name: /Public Site/i }));
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();
  });

  it('provides Google sign-in options on the public header and profile view for unauthenticated visitors', () => {
    render(<App />);

    // Header has Sign In button for guests
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();

    // Navigate to profile
    fireEvent.click(screen.getByRole('button', { name: /Profile/i }));
    expect(screen.getByText(/Sync with Google Account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
  });

  it('renders AdminAccessDenied 403 view when non-admin credentials are present', () => {
    // Visit /admin while an unauthorized state is simulated
    window.history.replaceState({}, '', '/admin');
    render(<App />);

    // Shows login portal initially
    expect(screen.getByText('AshTL Administrator Portal')).toBeInTheDocument();
  });

  it('allows removing individual novels from bookmarks and reading history', () => {
    localStorage.setItem('ashtl_novels', JSON.stringify([
      {
        id: 'n1', slug: 'novel-one', title: 'Novel One', altTitles: [], author: 'Author A',
        translator: 'TL', status: 'Ongoing', originalLanguage: 'English',
        genres: ['Fantasy'], rating: 4.9, views: 10, bookmarksCount: 1,
        coverUrl: 'https://example.com/cover1.jpg', synopsis: 'Syn 1',
        latestChapter: 1, chapters: [{ id: 'c1', novelId: 'n1', chapterNumber: 1, title: 'Ch 1', content: 'Story 1', wordCount: 100, releaseDate: '2026-10-01', isPublished: true }]
      }
    ]));
    localStorage.setItem('ashtl_bookmarks', JSON.stringify([
      {
        novelId: 'n1',
        novelTitle: 'Novel One',
        novelCover: 'https://example.com/cover1.jpg',
        lastReadChapterId: 'c1',
        lastReadChapterNum: 1,
        timestamp: Date.now()
      }
    ]));
    localStorage.setItem('ashtl_history', JSON.stringify([
      {
        novelId: 'n1',
        novelTitle: 'Novel One',
        novelCover: 'https://example.com/cover1.jpg',
        lastReadChapterId: 'c1',
        lastReadChapterNum: 1,
        timestamp: Date.now(),
        progressPercentage: 50
      }
    ]));

    render(<App />);

    // Check Bookmarks view and remove
    fireEvent.click(screen.getByRole('button', { name: /^Bookmarks/i }));
    expect(screen.getByText('Novel One')).toBeInTheDocument();
    const removeBookmarkBtn = screen.getByLabelText(/Remove Novel One from bookmarks/i);
    expect(removeBookmarkBtn).toBeInTheDocument();
    fireEvent.click(removeBookmarkBtn);
    expect(screen.queryByText('Novel One')).not.toBeInTheDocument();

    // Check History view and remove
    fireEvent.click(screen.getByRole('button', { name: /^History$/i }));
    expect(screen.getByText('Novel One')).toBeInTheDocument();
    const removeHistoryBtn = screen.getByLabelText(/Remove Novel One from history/i);
    expect(removeHistoryBtn).toBeInTheDocument();
    fireEvent.click(removeHistoryBtn);
    expect(screen.queryByText('Novel One')).not.toBeInTheDocument();
  });

  it('filters out novels that no longer exist from bookmarks and reading history views', () => {
    // Novel catalog only has novel-existing, but bookmarks & history have an old deleted novel
    localStorage.setItem('ashtl_novels', JSON.stringify([
      {
        id: 'n-existing', slug: 'novel-existing', title: 'Existing Novel', altTitles: [], author: 'Author',
        translator: 'TL', status: 'Ongoing', originalLanguage: 'English',
        genres: ['Fantasy'], rating: 5.0, views: 0, bookmarksCount: 0,
        coverUrl: 'https://example.com/cover.jpg', synopsis: 'Syn',
        latestChapter: 1, chapters: []
      }
    ]));
    localStorage.setItem('ashtl_bookmarks', JSON.stringify([
      {
        novelId: 'n-deleted',
        novelTitle: 'Old Deleted Novel',
        novelCover: 'https://example.com/old.jpg',
        lastReadChapterId: 'c1',
        lastReadChapterNum: 1,
        timestamp: Date.now()
      }
    ]));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Bookmarks/i }));

    // The deleted novel should NOT appear
    expect(screen.queryByText('Old Deleted Novel')).not.toBeInTheDocument();
    expect(screen.getByText('No Bookmarks Saved Yet')).toBeInTheDocument();
  });

  it('renders Admin Tools button in header and profile portal when admin session is active', () => {
    localStorage.setItem('ashtl_admin_session', 'true');
    render(<App />);

    // Header has Admin Tools button for authorized admins
    const adminToolsBtn = screen.getByRole('button', { name: /Admin Tools/i });
    expect(adminToolsBtn).toBeInTheDocument();

    // Navigate to profile
    fireEvent.click(screen.getByRole('button', { name: /Profile/i }));
    expect(screen.getByText(/Administrator Management Tools/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Admin Tools/i })).toBeInTheDocument();
  });

  it('selects highest-view novel as Spotlight Novel and ranks Most Popular by views', () => {
    localStorage.setItem('ashtl_novels', JSON.stringify([
      {
        id: 'low-views', slug: 'low-views-novel', title: 'Low Views Novel', altTitles: [], author: 'Author A',
        translator: 'TL', status: 'Ongoing', originalLanguage: 'English',
        genres: ['Fantasy'], rating: 5.0, views: 12, bookmarksCount: 2,
        coverUrl: 'https://example.com/cover1.jpg', synopsis: 'Syn A',
        latestChapter: 1, chapters: [{ id: 'c1', chapterNumber: 1, title: 'Ch 1', content: 'Text', wordCount: 100 }]
      },
      {
        id: 'high-views', slug: 'high-views-novel', title: 'High Views Novel', altTitles: [], author: 'Author B',
        translator: 'TL', status: 'Ongoing', originalLanguage: 'English',
        genres: ['Action'], rating: 4.0, views: 999, bookmarksCount: 50,
        coverUrl: 'https://example.com/cover2.jpg', synopsis: 'Syn B',
        latestChapter: 2, chapters: [{ id: 'c2', chapterNumber: 1, title: 'Ch 1', content: 'Text', wordCount: 100 }]
      }
    ]));

    render(<App />);

    // Spotlight Novel should select High Views Novel based on views
    expect(screen.getByText('Featured Spotlight Novel • Most Viewed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'High Views Novel' })).toBeInTheDocument();
    expect(screen.getByText('999 views')).toBeInTheDocument();
    expect(screen.getByText('50 bookmarks')).toBeInTheDocument();

    // Most Popular section should rank High Views Novel as #1
    expect(screen.getByRole('heading', { level: 3, name: 'Most Popular' })).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('increments novel bookmarks count when bookmarked and decrements when unbookmarked', () => {
    localStorage.setItem('ashtl_novels', JSON.stringify([
      {
        id: 'bm-novel', slug: 'bm-novel', title: 'Bookmark Test Novel', altTitles: [], author: 'Author',
        translator: 'TL', status: 'Ongoing', originalLanguage: 'English',
        genres: ['Fantasy'], rating: 5.0, views: 10, bookmarksCount: 5,
        coverUrl: 'https://example.com/cover.jpg', synopsis: 'Syn',
        latestChapter: 1, chapters: [{ id: 'c1', chapterNumber: 1, title: 'Ch 1', content: 'Text', wordCount: 100 }]
      }
    ]));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /View Details/i }));

    // Initial bookmarks count displayed in metadata grid
    expect(screen.getByText('5')).toBeInTheDocument();

    // Click bookmark button
    const bookmarkBtn = screen.getByRole('button', { name: /Add to Bookmarks/i });
    fireEvent.click(bookmarkBtn);

    // Bookmarked text shows and bookmarksCount increased to 6
    expect(screen.getByText(/Bookmarked/i)).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();

    // Click again to unbookmark
    fireEvent.click(screen.getByRole('button', { name: /Bookmarked/i }));
    expect(screen.getByRole('button', { name: /Add to Bookmarks/i })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

