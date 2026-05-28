import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaimBurn } from '../src/components/claim-burn';

// Mock CSS import
vi.mock('../src/components/claim-burn.css', () => ({}));

describe('ClaimBurn — wallet states', () => {
  it('shows connect button when disconnected', () => {
    render(<ClaimBurn walletState="disconnected" />);
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument();
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
  });

  it('calls onConnect when connect button clicked', () => {
    const onConnect = vi.fn();
    render(<ClaimBurn walletState="disconnected" onConnect={onConnect} />);
    fireEvent.click(screen.getByTestId('connect-wallet-btn'));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('shows connecting state with spinner', () => {
    render(<ClaimBurn walletState="connecting" />);
    expect(screen.getByTestId('connecting-msg')).toBeInTheDocument();
    expect(screen.getByText('Connecting to wallet...')).toBeInTheDocument();
  });

  it('shows form when connected', () => {
    render(<ClaimBurn walletState="connected" />);
    expect(screen.getByTestId('claim-burn-form')).toBeInTheDocument();
  });

  it('displays balance when provided', () => {
    render(<ClaimBurn walletState="connected" balance="100.50" />);
    expect(screen.getByText('100.50 XLM')).toBeInTheDocument();
  });
});

describe('ClaimBurn — toggle', () => {
  it('defaults to claim mode', () => {
    render(<ClaimBurn walletState="connected" />);
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('toggle-burn')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Claim XLM')).toBeInTheDocument();
  });

  it('switches to burn mode', () => {
    render(<ClaimBurn walletState="connected" />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    expect(screen.getByTestId('toggle-burn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Burn XLM')).toBeInTheDocument();
  });

  it('resets status when switching modes', () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('Test error'));
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    
    // Trigger error in claim mode
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    // Switch to burn mode
    fireEvent.click(screen.getByTestId('toggle-burn'));
    
    // Error should be cleared
    expect(screen.queryByTestId('error-msg')).not.toBeInTheDocument();
  });
});

describe('ClaimBurn — submit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onClaim with amount', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onClaim).toHaveBeenCalledWith('10');
    expect(screen.getByText('XLM claimed successfully!')).toBeInTheDocument();
  });

  it('calls onBurn with amount in burn mode', async () => {
    const onBurn = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState="connected" onBurn={onBurn} />);
    
    // Switch to burn mode
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onBurn).toHaveBeenCalledWith('5');
    expect(screen.getByText('XLM burned successfully!')).toBeInTheDocument();
  });

  it('shows error on failure', async () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('Insufficient balance'));
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    await waitFor(() => expect(screen.getByTestId('error-msg')).toHaveTextContent('Insufficient balance'));
  });

  it('disables submit when amount is empty', () => {
    render(<ClaimBurn walletState="connected" />);
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('disables submit when amount is zero or negative', () => {
    render(<ClaimBurn walletState="connected" />);
    
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '0' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
    
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '-5' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    const onClaim = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('auto-hides success message after 3 seconds', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    
    // Fast-forward time by 3 seconds
    vi.advanceTimersByTime(3000);
    
    await waitFor(() => expect(screen.queryByTestId('success-msg')).not.toBeInTheDocument());
  });

  it('clears error when typing new amount', () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('Test error'));
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    
    // Trigger error
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    // Type new amount
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '20' } });
    
    // Error should be cleared
    expect(screen.queryByTestId('error-msg')).not.toBeInTheDocument();
  });
});

describe('ClaimBurn — max button', () => {
  it('shows max button when balance is provided', () => {
    render(<ClaimBurn walletState="connected" balance="100.50" />);
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('sets amount to balance when max button clicked', () => {
    render(<ClaimBurn walletState="connected" balance="100.50" />);
    fireEvent.click(screen.getByText('Max'));
    expect(screen.getByTestId('amount-input')).toHaveValue(100.50);
  });

  it('does not show max button when balance is not provided', () => {
    render(<ClaimBurn walletState="connected" />);
    expect(screen.queryByText('Max')).not.toBeInTheDocument();
  });
});

describe('ClaimBurn — accessibility', () => {
  it('has proper ARIA labels and roles', () => {
    render(<ClaimBurn walletState="connected" />);
    
    expect(screen.getByRole('group', { name: 'Select mode' })).toBeInTheDocument();
    expect(screen.getByLabelText('Amount (XLM)')).toBeInTheDocument();
  });

  it('announces success and error messages to screen readers', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    
    await waitFor(() => {
      const successMsg = screen.getByTestId('success-msg');
      expect(successMsg).toHaveAttribute('role', 'status');
    });
  });
});
