/**
 * ClaimBurn component tests
 *
 * Covers wallet connection states, action toggles, and outcome feedback.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { ClaimBurn } from '../../src/components/claim-burn';

describe('ClaimBurn component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders with the disconnected wallet state and a connect button', () => {
    render(<ClaimBurn />);

    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    expect(screen.getByText(/no wallet is connected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /claim/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /burn/i })).toBeInTheDocument();
  });

  it('prevents claim/burn actions when the wallet is disconnected', async () => {
    render(<ClaimBurn />);

    const actionButton = screen.getByRole('button', { name: /connect wallet to continue/i });
    expect(actionButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /burn/i }));
    expect(screen.getByText(/burn tokens to reduce supply/i)).toBeInTheDocument();
  });

  it('connects the wallet and updates the UI state', async () => {
    render(<ClaimBurn />);

    await user.click(screen.getByRole('button', { name: /connect wallet/i }));

    expect(screen.getByRole('button', { name: /connecting…/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/wallet connected/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/ready to claim or burn your available balance/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /claim rewards/i })).toBeEnabled();
  });

  it('switches between claim and burn tabs and performs an action', async () => {
    render(<ClaimBurn />);

    await user.click(screen.getByRole('button', { name: /connect wallet/i }));
    await waitFor(() => screen.getByText(/wallet connected/i));

    await user.click(screen.getByRole('button', { name: /burn/i }));
    expect(screen.getByText(/burn tokens to reduce supply/i)).toBeInTheDocument();

    const burnActionButton = screen.getByRole('button', { name: /burn tokens/i });
    expect(burnActionButton).toBeEnabled();

    await user.click(burnActionButton);
    expect(screen.getByText(/burn tokens in progress/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/tokens burned successfully/i)).toBeInTheDocument();
    });
  });
});
