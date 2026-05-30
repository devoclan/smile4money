import React, { useState } from 'react';
import '../styles/claim-burn.css';

type Mode = 'claim' | 'burn';
type Phase = 'idle' | 'confirm' | 'pending' | 'success' | 'error';
type WalletState =
  | 'checking'
  | 'notInstalled'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'wrongNetwork'
  | { status: string; address?: string | null; error?: string | null; balance?: string | null; network?: string };

interface ClaimBurnProps {
  walletState: WalletState;
  onConnect?: () => void;
  onClaim?: (amount: string) => Promise<void>;
  onBurn?: (amount: string) => Promise<void>;
  onSwitchNetwork?: () => void;
  publicKey?: string | null;
  expectedNetwork?: string;
}

function resolveState(walletState: WalletState): string {
  if (typeof walletState === 'string') return walletState;
  return walletState.status;
}

function hasConfirmStep(walletState: WalletState): boolean {
  return typeof walletState === 'object';
}

function isValidAmount(value: string): boolean {
  const n = Number(value);
  return value.trim() !== '' && !isNaN(n) && n > 0;
}

export function ClaimBurn({
  walletState,
  onConnect,
  onClaim,
  onBurn,
  onSwitchNetwork,
  publicKey,
  expectedNetwork = 'testnet',
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const state = resolveState(walletState);

  const confirmStep = hasConfirmStep(walletState);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    if (phase === 'error' || phase === 'success') setPhase('idle');
  }

  function handleModeChange(next: Mode) {
    setMode(next);
    setPhase('idle');
    setErrorMsg('');
  }

  async function execute(amt: string) {
    setPhase('pending');
    setErrorMsg('');
    try {
      if (mode === 'claim') {
        await onClaim?.(amt);
      } else {
        await onBurn?.(amt);
      }
      setPhase('success');
      setAmount('');
    } catch (err) {
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidAmount(amount)) return;
    if (confirmStep) {
      setPhase('confirm');
    } else {
      execute(amount);
    }
  }

  async function handleConfirm() {
    await execute(amount);
  }

  function handleCancel() {
    setPhase('idle');
  }

  function renderConnecting() {
    return (
      <div className="wallet-state" data-testid="wallet-connecting">
        <div className="spinner" />
        <p className="wallet-state-message">Connecting to Freighter&hellip;</p>
      </div>
    );
  }

  function renderNotInstalled() {
    return (
      <div className="wallet-state" data-testid="wallet-not-installed">
        <div className="wallet-state-icon">⚠️</div>
        <h3 className="wallet-state-title">Freighter Not Found</h3>
        <p className="wallet-state-message">
          Please install the{' '}
          <a href="https://freighter.app" target="_blank" rel="noopener noreferrer">
            Freighter wallet extension
          </a>{' '}
          to continue.
        </p>
      </div>
    );
  }

  function renderDisconnected() {
    return (
      <div className="wallet-state" data-testid="wallet-disconnected">
        <div className="wallet-state-icon">💼</div>
        <h3 className="wallet-state-title">Connect Your Wallet</h3>
        <p className="wallet-state-message">
          Connect your Freighter wallet to claim rewards or burn tokens.
        </p>
        <button className="btn btn-connect" onClick={onConnect} data-testid="connect-wallet-btn">
          Connect Wallet
        </button>
      </div>
    );
  }

  function renderWrongNetwork() {
    return (
      <div className="wallet-state" data-testid="wallet-wrong-network">
        <div className="wallet-state-icon">🌐</div>
        <h3 className="wallet-state-title">Wrong Network</h3>
        <p className="wallet-state-message">
          Please switch your Freighter wallet to <strong>{expectedNetwork}</strong>.
        </p>
        <button
          className="btn btn-switch-network"
          onClick={onSwitchNetwork}
          data-testid="switch-network-btn"
        >
          Switch to {expectedNetwork}
        </button>
      </div>
    );
  }

  function renderForm() {
    const submitDisabled = phase === 'pending' || !isValidAmount(amount);

    return (
      <>
        <div className="toggle" role="group" aria-label="Select mode">
          <button
            className={`toggle-btn${mode === 'claim' ? ' active' : ''}`}
            onClick={() => handleModeChange('claim')}
            aria-pressed={mode === 'claim'}
            data-testid="toggle-claim"
          >
            Claim
          </button>
          <button
            className={`toggle-btn${mode === 'burn' ? ' active' : ''}`}
            onClick={() => handleModeChange('burn')}
            aria-pressed={mode === 'burn'}
            data-testid="toggle-burn"
          >
            Burn
          </button>
        </div>

        {publicKey && (
          <div className="wallet-info" data-testid="wallet-info">
            <span className="wallet-info-label">Connected</span>
            <span className="wallet-info-address">
              {publicKey.slice(0, 4)}&hellip;{publicKey.slice(-4)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="claim-burn-form">
          <label htmlFor="amount">
            {mode === 'claim' ? 'Claim amount' : 'Burn amount'} (XLM)
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            disabled={phase === 'pending'}
            data-testid="amount-input"
          />
          {phase !== 'confirm' && (
            <button
              type="submit"
              className={`btn btn-${mode}`}
              disabled={submitDisabled}
              data-testid="submit-btn"
            >
              {phase === 'pending' ? 'Processing…' : mode === 'claim' ? 'Claim' : 'Burn'}
            </button>
          )}
        </form>

        {phase === 'confirm' && (
          <div className="confirm-overlay" data-testid="confirm-overlay">
            <p className="confirm-message">
              {mode === 'claim' ? 'Claim' : 'Burn'} <strong>{amount}</strong> XLM?
            </p>
            <div className="confirm-actions">
              <button className="btn btn-confirm" onClick={handleConfirm} data-testid="confirm-btn">
                Confirm
              </button>
              <button className="btn btn-cancel" onClick={handleCancel} data-testid="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div aria-live="polite" aria-atomic="true">
          {phase === 'success' && (
            <p className="feedback success" role="status" data-testid="success-msg">
              {mode === 'claim' ? 'Claimed successfully!' : 'Burned successfully!'}
            </p>
          )}
          {phase === 'error' && (
            <p className="feedback error" role="alert" data-testid="error-msg">
              {errorMsg}
            </p>
          )}
        </div>
      </>
    );
  }

  const stateMap: Record<string, React.ReactNode> = {
    checking: renderConnecting(),
    connecting: renderConnecting(),
    notInstalled: renderNotInstalled(),
    disconnected: renderDisconnected(),
    wrongNetwork: renderWrongNetwork(),
    connected: renderForm(),
  };

  return (
    <div className="claim-burn" data-testid="claim-burn">
      <h2 className="claim-burn-title">Claim &amp; Burn</h2>
      {stateMap[state] ?? renderForm()}
    </div>
  );
}
