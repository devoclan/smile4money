import React, { useState, useEffect } from 'react';
import './claim-burn.css';

type Mode = 'claim' | 'burn';

type WalletState = 'disconnected' | 'connecting' | 'connected';

interface ClaimBurnProps {
  walletState?: WalletState;
  onConnect?: () => void;
  onClaim?: (amount: string) => Promise<void>;
  onBurn?: (amount: string) => Promise<void>;
  balance?: string;
  className?: string;
}

export function ClaimBurn({
  walletState = 'disconnected',
  onConnect,
  onClaim,
  onBurn,
  balance,
  className = '',
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (status === 'success') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setStatus('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setStatus('pending');
    setErrorMsg('');
    setShowSuccess(false);
    
    try {
      if (mode === 'claim') {
        await onClaim?.(amount);
      } else {
        await onBurn?.(amount);
      }
      setStatus('success');
      setAmount('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setStatus('idle');
    setErrorMsg('');
    setShowSuccess(false);
  }

  function handleAmountChange(value: string) {
    setAmount(value);
    if (status === 'error') {
      setStatus('idle');
      setErrorMsg('');
    }
  }

  const containerClasses = `claim-burn ${className}`.trim();

  if (walletState === 'disconnected') {
    return (
      <div className={`${containerClasses} wallet-disconnected`} data-testid="claim-burn">
        <div className="wallet-prompt-container">
          <div className="wallet-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.9 6 10 6.9 10 8V16C10 17.1 10.9 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.2 13.5 14.5 12.8 14.5 12S15.2 10.5 16 10.5 17.5 11.2 17.5 12 16.8 13.5 16 13.5Z" fill="currentColor"/>
            </svg>
          </div>
          <h3 className="wallet-prompt-title">Connect Your Wallet</h3>
          <p className="wallet-prompt-text">Connect your wallet to start claiming or burning XLM tokens</p>
          <button
            className="btn btn-connect"
            onClick={onConnect}
            data-testid="connect-wallet-btn"
          >
            <span className="btn-text">Connect Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  if (walletState === 'connecting') {
    return (
      <div className={`${containerClasses} wallet-connecting`} data-testid="claim-burn">
        <div className="connecting-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p className="connecting-text" data-testid="connecting-msg">
            Connecting to wallet...
          </p>
          <p className="connecting-subtext">Please check your wallet for connection request</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClasses} wallet-connected`} data-testid="claim-burn">
      {/* Header */}
      <div className="claim-burn-header">
        <h2 className="title">{mode === 'claim' ? 'Claim XLM' : 'Burn XLM'}</h2>
        {balance && (
          <div className="balance-display">
            <span className="balance-label">Available:</span>
            <span className="balance-amount">{balance} XLM</span>
          </div>
        )}
      </div>

      {/* Toggle */}
      <div className="toggle-container">
        <div className="toggle" role="group" aria-label="Select mode">
          <button
            className={`toggle-btn ${mode === 'claim' ? 'active' : ''}`}
            onClick={() => handleModeChange('claim')}
            aria-pressed={mode === 'claim'}
            data-testid="toggle-claim"
          >
            <span className="toggle-icon">📥</span>
            <span className="toggle-text">Claim</span>
          </button>
          <button
            className={`toggle-btn ${mode === 'burn' ? 'active' : ''}`}
            onClick={() => handleModeChange('burn')}
            aria-pressed={mode === 'burn'}
            data-testid="toggle-burn"
          >
            <span className="toggle-icon">🔥</span>
            <span className="toggle-text">Burn</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="claim-burn-form" data-testid="claim-burn-form">
        <div className="input-group">
          <label htmlFor="amount" className="input-label">
            Amount (XLM)
          </label>
          <div className="input-container">
            <input
              id="amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              disabled={status === 'pending'}
              className={`amount-input ${status === 'error' ? 'error' : ''}`}
              data-testid="amount-input"
            />
            <span className="input-suffix">XLM</span>
          </div>
          {balance && (
            <button
              type="button"
              className="max-btn"
              onClick={() => handleAmountChange(balance)}
              disabled={status === 'pending'}
            >
              Max
            </button>
          )}
        </div>

        <button
          type="submit"
          className={`btn btn-submit btn-${mode} ${status === 'pending' ? 'loading' : ''}`}
          disabled={status === 'pending' || !amount || Number(amount) <= 0}
          data-testid="submit-btn"
        >
          {status === 'pending' ? (
            <>
              <span className="loading-spinner-small"></span>
              <span>Processing...</span>
            </>
          ) : (
            <span>{mode === 'claim' ? 'Claim XLM' : 'Burn XLM'}</span>
          )}
        </button>
      </form>

      {/* Feedback */}
      <div className="feedback-container" aria-live="polite" aria-atomic="true">
        {showSuccess && status === 'success' && (
          <div className="feedback success" role="status" data-testid="success-msg">
            <div className="feedback-icon">✅</div>
            <div className="feedback-content">
              <p className="feedback-title">Success!</p>
              <p className="feedback-text">
                {mode === 'claim' ? 'XLM claimed successfully!' : 'XLM burned successfully!'}
              </p>
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="feedback error" role="alert" data-testid="error-msg">
            <div className="feedback-icon">❌</div>
            <div className="feedback-content">
              <p className="feedback-title">Error</p>
              <p className="feedback-text">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
