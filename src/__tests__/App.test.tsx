import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';

describe('AshTL Application Core Workflows', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders brand header, hero section, and empty state CTA', () => {
    render(<App />);
    expect(screen.getAllByText('AshTL').length).toBeGreaterThan(0);
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();
    expect(screen.getByText('Ready for Your Translated Novels')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add First Translated Novel in Admin/i })).toBeInTheDocument();
  });

  it('navigates to novel catalog and shows empty state', () => {
    render(<App />);
    const catalogNavBtn = screen.getByRole('button', { name: /^Novels$/i });
    fireEvent.click(catalogNavBtn);

    expect(screen.getByRole('heading', { level: 1, name: 'Novel Catalog' })).toBeInTheDocument();
    expect(screen.getByText('No Novels Found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Admin Dashboard/i })).toBeInTheDocument();
  });

  it('navigates to admin panel and creates a novel when creator is authenticated', () => {
    localStorage.setItem('ashtl_creator_session', 'true');
    render(<App />);
    const adminNavBtn = screen.getByRole('button', { name: /^Admin$/i });
    fireEvent.click(adminNavBtn);

    expect(screen.getByText('AshTL Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Create New Translated Web Novel')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/Novel Title/i);
    const authorInput = screen.getByPlaceholderText(/^Author/i);
    fireEvent.change(titleInput, { target: { value: 'Test Novel' } });
    fireEvent.change(authorInput, { target: { value: 'Test Author' } });

    fireEvent.click(screen.getByRole('button', { name: /^Create Novel$/i }));

    expect(screen.getAllByText(/Test Novel/).length).toBeGreaterThan(0);
  });

  it('creates a novel and chapter, then reads at top of page', () => {
    localStorage.setItem('ashtl_creator_session', 'true');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Admin$/i }));

    fireEvent.change(screen.getByPlaceholderText(/Novel Title/i), { target: { value: 'My Web Novel' } });
    fireEvent.change(screen.getByPlaceholderText(/^Author/i), { target: { value: 'Author X' } });
    fireEvent.click(screen.getByRole('button', { name: /^Create Novel$/i }));

    fireEvent.click(screen.getByRole('button', { name: /2\. Upload Chapter to Novel/i }));
    fireEvent.change(screen.getByPlaceholderText(/Chapter Title/i), { target: { value: 'Chapter 1: The Beginning' } });
    fireEvent.change(screen.getByPlaceholderText(/Paste English translated chapter text/i), { target: { value: 'This is the first paragraph of the chapter.\n\nThis is the second paragraph.' } });
    fireEvent.click(screen.getByRole('button', { name: /^Publish Chapter$/i }));

    fireEvent.click(screen.getByRole('button', { name: /^View$/i }));

    expect(screen.getByRole('heading', { level: 1, name: 'My Web Novel' })).toBeInTheDocument();
    expect(screen.getByText('Chapter 1: The Beginning')).toBeInTheDocument();
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

  it('navigates back to home from Novels, Bookmarks, History, and Admin views using in-app back button', () => {
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

    // Admin/Creator -> Back to Home
    fireEvent.click(screen.getByRole('button', { name: /Creator/i }));
    expect(screen.getByText('Creator Verification')).toBeInTheDocument();
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

  it('supports direct file upload for novel cover image and omits raw chapter textareas', () => {
    localStorage.setItem('ashtl_creator_session', 'true');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Admin$/i }));

    // Verify direct file input for cover image
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.accept).toBe('image/*');

    // Create a novel first
    fireEvent.change(screen.getByPlaceholderText(/Novel Title/i), { target: { value: 'Cover Test Novel' } });
    fireEvent.change(screen.getByPlaceholderText(/^Author/i), { target: { value: 'Author' } });
    fireEvent.click(screen.getByRole('button', { name: /^Create Novel$/i }));

    // Switch to Upload Chapter tab
    fireEvent.click(screen.getByRole('button', { name: /2\. Upload Chapter to Novel/i }));

    // Verify translated English chapter input exists but raw chapter input does not
    expect(screen.getByPlaceholderText(/Paste English translated chapter text/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/raw/i)).not.toBeInTheDocument();
  });

  it('locks Admin dashboard behind Creator Verification and unlocks with creator passcode', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Creator/i }));
    expect(screen.getByText('Creator Verification')).toBeInTheDocument();
    expect(screen.getByText(/strictly restricted to the site creator/i)).toBeInTheDocument();

    // Wrong passcode
    fireEvent.change(screen.getByPlaceholderText(/Enter secret creator passcode/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Unlock Admin Dashboard/i }));
    expect(screen.getByText(/Invalid creator passcode/i)).toBeInTheDocument();

    // Correct passcode
    fireEvent.change(screen.getByPlaceholderText(/Enter secret creator passcode/i), { target: { value: 'creator123' } });
    fireEvent.click(screen.getByRole('button', { name: /Unlock Admin Dashboard/i }));
    expect(screen.getByText('AshTL Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Creator Session Active')).toBeInTheDocument();
  });

  it('navigates to user profile, renders reading statistics, and allows editing profile', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Profile/i }));
    expect(screen.getByText('AshReader')).toBeInTheDocument();
    expect(screen.getAllByText(/Saved Bookmarks/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Chapters Read/i).length).toBeGreaterThan(0);

    // Edit profile
    fireEvent.click(screen.getByText('Edit Profile'));
    const usernameInput = screen.getByDisplayValue('AshReader');
    fireEvent.change(usernameInput, { target: { value: 'ClydeTheTranslator' } });
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
});
