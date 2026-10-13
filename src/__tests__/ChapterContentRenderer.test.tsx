import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChapterContentRenderer } from '../components/ChapterContentRenderer';

describe('ChapterContentRenderer: System Prompt & Glowing Notification Parsing', () => {
  it('renders explicit [system] tag as glowing red block', () => {
    const text = `[system]【You have died】[/system]`;
    const { container } = render(<ChapterContentRenderer content={text} theme="dark" />);

    const glowEl = container.querySelector('.novel-system-glow');
    expect(glowEl).toBeInTheDocument();
    expect(glowEl).toHaveTextContent('【You have died】');
  });

  it('renders explicit [glow] tag as glowing red block', () => {
    const text = `[glow]【System Error Detected】[/glow]`;
    const { container } = render(<ChapterContentRenderer content={text} theme="dark" />);

    const glowEl = container.querySelector('.novel-system-glow');
    expect(glowEl).toBeInTheDocument();
    expect(glowEl).toHaveTextContent('【System Error Detected】');
  });

  it('automatically detects lenticular bracket death alert paragraphs', () => {
    const text = `【You have died】
【You will be revived at the last shrine you visited in 30 seconds... re... sys... tem...】`;
    const { container } = render(<ChapterContentRenderer content={text} theme="dark" />);

    const glowBlock = container.querySelector('.novel-system-glow-block');
    expect(glowBlock).toBeInTheDocument();
    expect(glowBlock).toHaveTextContent('【You have died】');
    expect(glowBlock).toHaveTextContent('【You will be revived at the last shrine you visited in 30 seconds... re... sys... tem...】');
  });

  it('renders inline system glow inside regular paragraphs', () => {
    const text = `He fell to the ground. A crimson message appeared: [system]【Warning: Vital signs critically low】[/system] before everything went dark.`;
    const { container } = render(<ChapterContentRenderer content={text} theme="dark" />);

    expect(screen.getByText(/He fell to the ground/)).toBeInTheDocument();
    const inlineGlow = container.querySelector('span.novel-system-glow');
    expect(inlineGlow).toBeInTheDocument();
    expect(inlineGlow).toHaveTextContent('【Warning: Vital signs critically low】');
  });

  it('renders centered text block using [center] tag', () => {
    const text = `[center]~ End of Volume 1 ~[/center]`;
    render(<ChapterContentRenderer content={text} theme="dark" />);

    const centeredText = screen.getByText('~ End of Volume 1 ~');
    expect(centeredText).toBeInTheDocument();
  });

  it('renders markdown bold and italic formatting correctly', () => {
    const text = `This is **bold warrior** and this is *ancient magic*.`;
    render(<ChapterContentRenderer content={text} theme="dark" />);

    expect(screen.getByText('bold warrior').tagName).toBe('STRONG');
    expect(screen.getByText('ancient magic').tagName).toBe('EM');
  });

  it('renders explicit [status] tag as blue status window block', () => {
    const text = `[status]【Name: Nolan】\n【Level: 1】\n【HP: 4/23】[/status]`;
    const { container } = render(<ChapterContentRenderer content={text} theme="dark" />);

    const glowBlock = container.querySelector('.novel-status-glow-block');
    expect(glowBlock).toBeInTheDocument();

    const glowText = container.querySelector('.novel-status-glow');
    expect(glowText).toBeInTheDocument();
    expect(glowText).toHaveTextContent('【Name: Nolan】');
    expect(glowText).toHaveTextContent('【HP: 4/23】');
  });

  it('renders inline [status] tag with blue glow inside paragraphs', () => {
    const text = `A notification appeared: [status]【HP restored to full】[/status] and the hero stood up.`;
    const { container } = render(<ChapterContentRenderer content={text} theme="dark" />);

    expect(screen.getByText(/A notification appeared/)).toBeInTheDocument();
    const inlineStatus = container.querySelector('span.novel-status-glow');
    expect(inlineStatus).toBeInTheDocument();
    expect(inlineStatus).toHaveTextContent('【HP restored to full】');
  });

  it('gracefully handles empty, null, or undefined content without crashing', () => {
    render(<ChapterContentRenderer content="" theme="dark" />);
    expect(screen.getByText(/This chapter does not contain any readable text yet/i)).toBeInTheDocument();

    // @ts-expect-error test runtime resilience for null/undefined content
    const { container: c2 } = render(<ChapterContentRenderer content={null} theme="dark" />);
    expect(c2).toBeInTheDocument();

    // @ts-expect-error test runtime resilience for null/undefined content
    const { container: c3 } = render(<ChapterContentRenderer content={undefined} theme="dark" />);
    expect(c3).toBeInTheDocument();
  });
});
