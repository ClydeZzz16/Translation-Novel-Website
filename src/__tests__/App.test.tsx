import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('AshTL Application Core Workflows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders brand header, hero section, and spotlight novel', () => {
    render(<App />);
    expect(screen.getAllByText('AshTL').length).toBeGreaterThan(0);
    expect(screen.getByText(/Discover Your Next/i)).toBeInTheDocument();
    expect(screen.getByText('Featured Spotlight Novel')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'The Silent Moon' })).toBeInTheDocument();
  });

  it('navigates to novel catalog and filters by query', () => {
    render(<App />);
    const catalogNavBtn = screen.getByRole('button', { name: /^Novels$/i });
    fireEvent.click(catalogNavBtn);

    expect(screen.getByRole('heading', { level: 1, name: 'Novel Catalog' })).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/Search titles.../i);
    fireEvent.change(searchInput, { target: { value: 'Crimson' } });

    expect(screen.getByRole('heading', { name: 'Crimson Horizon' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'When Winter Meets Spring' })).not.toBeInTheDocument();
  });

  it('opens reader view, navigates chapters, and toggles reader settings', () => {
    render(<App />);
    const readButtons = screen.getAllByRole('button', { name: /Start Reading Ch\. 1/i });
    fireEvent.click(readButtons[0]);

    // Reader header should show novel and chapter title
    expect(screen.getByRole('heading', { level: 1, name: 'Chapter 1: The Shattered Lunar Peak' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();

    // Click Next chapter
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Chapter 2: The Whispering Ember' })).toBeInTheDocument();

    // Verify Reader Customizer panel elements
    expect(screen.getByText('Reader Customizer')).toBeInTheDocument();
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('Reading Area Width')).toBeInTheDocument();
  });

  it('toggles bookmarks and persists in localStorage', () => {
    render(<App />);
    // Open novel details
    const viewDetailsBtn = screen.getByRole('button', { name: /View Details/i });
    fireEvent.click(viewDetailsBtn);

    const bookmarkBtn = screen.getByRole('button', { name: /Add to Bookmarks/i });
    fireEvent.click(bookmarkBtn);

    expect(screen.getByText(/Bookmarked/i)).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem('ashtl_bookmarks') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].novelTitle).toBe('The Silent Moon');
  });

  it('navigates to admin panel and displays metrics', () => {
    render(<App />);
    const adminNavBtn = screen.getByRole('button', { name: /Admin/i });
    fireEvent.click(adminNavBtn);

    expect(screen.getByText('AshTL Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Novels')).toBeInTheDocument();
    expect(screen.getByText('Upload New Translated Chapter')).toBeInTheDocument();
  });

  it('renders static legal pages (DMCA, Privacy, About)', () => {
    render(<App />);
    const dmcaFooterLink = screen.getByText('DMCA Copyright Policy');
    fireEvent.click(dmcaFooterLink);
    expect(screen.getByRole('heading', { level: 1, name: 'DMCA Copyright Policy' })).toBeInTheDocument();

    const privacyFooterLink = screen.getByText('Privacy Policy');
    fireEvent.click(privacyFooterLink);
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();

    const aboutFooterLink = screen.getByText('About AshTL');
    fireEvent.click(aboutFooterLink);
    expect(screen.getByRole('heading', { level: 1, name: 'About AshTL' })).toBeInTheDocument();
  });
});
