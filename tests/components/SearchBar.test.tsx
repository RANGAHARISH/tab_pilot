import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '../../src/components/SearchBar';

describe('SearchBar Component', () => {
  it('renders input with placeholder and fires debounced change', async () => {
    const onChange = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={onChange}
        placeholder="Search everything..."
      />
    );

    const input = screen.getByPlaceholderText('Search everything...');
    fireEvent.change(input, { target: { value: 'react docs' } });

    await waitFor(
      () => {
        expect(onChange).toHaveBeenCalledWith('react docs');
      },
      { timeout: 500 }
    );
  });

  it('renders filter chips and switches selected type', () => {
    const onTypeChange = vi.fn();

    render(
      <SearchBar
        value="test"
        onChange={vi.fn()}
        selectedType="all"
        onTypeChange={onTypeChange}
      />
    );

    const sessionChip = screen.getByText('Sessions');
    fireEvent.click(sessionChip);
    expect(onTypeChange).toHaveBeenCalledWith('session');
  });
});
