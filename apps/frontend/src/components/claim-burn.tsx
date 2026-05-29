import React, { useState } from 'react';
import type { WalletState, Mode } from '../types';

interface ClaimBurnProps {
  walletState: WalletState;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
}

const STROOP_DECIMALS = 7;

function formatAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function isValidAmount(val: string): boolean {
  if (val === '' || val === '.') return false;
  const n = Number(val);
  if (Number.isNaN(n) || n <= 0) return false;

  const parts = val.split('.');
  if (parts.length === 2 && parts[1].length > STROOP_DECIMALS) return false;

  return true;
}

function formatNetwork(net: string): string {
  if (net === 'testnet') return 'Testnet';
  if (net === 'mainnet') return 'Mainnet';
  return 'Unknown';
}

export function ClaimBurn({
  walletState,
  onConnect,
  onDisconnect,
  onClaim,
  onBurn,
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidAmount(amount)) return;

    setStatus('pending');
    setErrorMsg('');
    setTxHash(null);
    try {
      let hash: string | void;
      if (mode === 'claim') {
        hash = await onClaim?.(amount);
      } else {
        hash = await onBurn?.(amount);
      }
      if (hash) setTxHash(hash);
      setStatus('success');
      setAmount('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    if (status !== 'idle' && status !== 'pending') {
      setStatus('idle');
      setTxHash(null);
    }
  }

  function handleToggle(newMode: Mode) {
    setMode(newMode);
    if (status !== 'idle' && status !== 'pending') {
      setStatus('idle');
      setTxHash(null);
    }
  }

  if (walletState.status === 'disconnected') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <p className="wallet-prompt">
          {walletState.network !== 'unknown' && (
            <span className="network-badge" data-testid="network-badge-disconnected">
              {formatNetwork(walletState.network)}
            </span>
          )}
          Connect your Freighter wallet to continue
        </p>
        <button
          className="btn btn-connect"
          onClick={onConnect}
          data-testid="connect-wallet-btn"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (walletState.status === 'connecting') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <p className="wallet-connecting" data-testid="connecting-msg">
          <span className="spinner" data-testid="spinner" />
          Connecting to Freighter…
        </p>
      </div>
    );
  }

  if (walletState.status === 'error') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <div className="wallet-error">
          <p data-testid="wallet-error-msg">
            {walletState.error || 'An unknown error occurred'}
          </p>
          <button
            className="btn btn-connect"
            onClick={onConnect}
            data-testid="retry-connect-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const valid = isValidAmount(amount);

  return (
    <div className="claim-burn" data-testid="claim-burn">
      <div className="wallet-info">
        <span className="wallet-address" data-testid="wallet-address">
          {formatAddress(walletState.address || '')}
        </span>
        <div className="wallet-info-actions">
          {walletState.network && walletState.network !== 'unknown' && (
            <span
              className={`network-badge network-badge--${walletState.network}`}
              data-testid="network-badge"
            >
              {formatNetwork(walletState.network)}
            </span>
          )}
          {onDisconnect && (
            <button
              className="btn btn-disconnect"
              onClick={onDisconnect}
              data-testid="disconnect-btn"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="toggle" role="group" aria-label="Select mode">
        <button
          className={`toggle-btn${mode === 'claim' ? ' active' : ''}`}
          onClick={() => handleToggle('claim')}
          aria-pressed={mode === 'claim'}
          data-testid="toggle-claim"
        >
          Claim
        </button>
        <button
          className={`toggle-btn${mode === 'burn' ? ' active' : ''}`}
          onClick={() => handleToggle('burn')}
          aria-pressed={mode === 'burn'}
          data-testid="toggle-burn"
        >
          Burn
        </button>
      </div>

      <form onSubmit={handleSubmit} className="claim-burn-form" data-testid="claim-burn-form">
        <label htmlFor="amount">
          {mode === 'claim' ? 'Amount to claim' : 'Amount to burn'}
          {walletState.balance !== null && (
            <span className="balance-hint">
              (Balance: {walletState.balance} XLM)
            </span>
          )}
        </label>
        <div className="input-wrap">
          <input
            id="amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            disabled={status === 'pending'}
            data-testid="amount-input"
          />
          <span className="input-suffix">XLM</span>
        </div>
        {amount && !valid && (
          <p className="field-error" data-testid="amount-error">
            {amount.split('.').length === 2 && amount.split('.')[1].length > STROOP_DECIMALS
              ? `Maximum ${STROOP_DECIMALS} decimal places`
              : 'Enter a valid positive amount'}
          </p>
        )}
        <button
          type="submit"
          className={`btn btn-${mode}`}
          disabled={status === 'pending' || !valid}
          data-testid="submit-btn"
        >
          {status === 'pending' ? (
            <>
              <span className="spinner spinner--small" data-testid="spinner" />
              Processing…
            </>
          ) : mode === 'claim' ? (
            'Claim'
          ) : (
            'Burn'
          )}
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {status === 'success' && (
          <p className="feedback success" role="status" data-testid="success-msg">
            {mode === 'claim' ? 'Claimed' : 'Burned'} successfully!
            {txHash && (
              <span className="tx-hash" data-testid="tx-hash">
                TX: {formatAddress(txHash)}
              </span>
            )}
          </p>
        )}
        {status === 'error' && (
          <p className="feedback error" role="alert" data-testid="error-msg">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
