import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabRow } from '../../src/components/TabRow';
import type { BrowserTab } from '../../src/domain/types';

describe('TabRow Component', () => {
  const sampleTab: BrowserTab = {
    id: 101,
    windowId: 1,
    url: 'https://github.com/google/tabpilot',
    title: 'Google TabPilot Repository',
    active: false,
    pinned: false,
    incognito: false,
    index: 0,
  };

  it('renders tab title and domain', () => {
    render(
      <TabRow
        tab={sampleTab}
        isSelected={false}
        onSelectToggle={vi.fn()}
        onActivate={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Google TabPilot Repository')).toBeDefined();
    expect(screen.getByText('github.com')).toBeDefined();
  });

  it('handles click to activate and toggle selection', () => {
    const onActivate = vi.fn();
    const onSelectToggle = vi.fn();

    render(
      <TabRow
        tab={sampleTab}
        isSelected={false}
        onSelectToggle={onSelectToggle}
        onActivate={onActivate}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Google TabPilot Repository'));
    expect(onActivate).toHaveBeenCalledWith(101, 1);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onSelectToggle).toHaveBeenCalledWith(101);
  });
});
