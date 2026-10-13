import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';

describe('ConfirmDialog Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={false}
        title="Delete All?"
        description="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title, description and triggers actions on click', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Close Multiple Tabs?"
        description="This will close 5 tabs."
        confirmText="Yes, Close"
        cancelText="Keep Open"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Close Multiple Tabs?')).toBeDefined();
    expect(screen.getByText('This will close 5 tabs.')).toBeDefined();

    fireEvent.click(screen.getByText('Yes, Close'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Keep Open'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
