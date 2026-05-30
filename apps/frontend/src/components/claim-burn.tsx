import React, { useEffect, useMemo, useState } from 'react';

type WalletState = 'disconnected' | 'connecting' | 'connected';
type ActionMode = 'claim' | 'burn';

type TransactionStatus = 'idle' | 'processing' | 'completed' | 'failed';

const actionLabels: Record<ActionMode, string> = {
  claim: 'Claim Rewards',
  burn: 'Burn Tokens',
};

const walletConnectLabel: Record<WalletState, string> = {
  disconnected: 'Connect Wallet',
  connecting: 'Connecting…',
  connected: 'Wallet Connected',
};

const walletStatusMessage: Record<WalletState, string> = {
  disconnected: 'No wallet is connected. Connect to claim rewards or burn tokens.',
  connecting: 'Please approve the wallet connection in your Stellar wallet.',
  connected: 'Your wallet is connected and ready for claim/burn operations.',
};

const getWalletBadge = (state: WalletState) => {
  switch (state) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting';
    default:
      return 'Disconnected';
  }
};

export function ClaimBurn() {
  const [walletState, setWalletState] = useState<WalletState>('disconnected');
  const [selectedMode, setSelectedMode] = useState<ActionMode>('claim');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [transactionMessage, setTransactionMessage] = useState<string>('Select an action to begin.');
  const [accountAddress, setAccountAddress] = useState<string>('');
  const [balance, setBalance] = useState<number>(12.75);

  const isActionEnabled = walletState === 'connected' && transactionStatus !== 'processing';
  const currentAction = actionLabels[selectedMode];

  const networkLabel = useMemo(() => {
    if (walletState === 'connected') {
      return 'Stellar Testnet';
    }
    return 'No Network';
  }, [walletState]);

  useEffect(() => {
    if (walletState === 'connected') {
      setTransactionMessage('Ready to claim or burn your available balance.');
    }
  }, [walletState]);

  const connectWallet = () => {
    if (walletState !== 'disconnected') {
      return;
    }

    setWalletState('connecting');
    setTransactionMessage('Establishing a secure wallet connection...');

    window.setTimeout(() => {
      setWalletState('connected');
      setAccountAddress('GCB4Z7Q7LW5H3Y3QJUZ3WTSQGDDT7NNOLQ7D7IVY4C4ZV4CJLZVY6N4V');
      setTransactionMessage('Wallet connected. Choose Claim or Burn to continue.');
    }, 700);
  };

  const disconnectWallet = () => {
    setWalletState('disconnected');
    setAccountAddress('');
    setTransactionStatus('idle');
    setTransactionMessage('No wallet is connected. Connect to claim rewards or burn tokens.');
  };

  const handleModeToggle = (mode: ActionMode) => {
    setSelectedMode(mode);
    setTransactionStatus('idle');
    setTransactionMessage(
      mode === 'claim'
        ? 'Claim rewards from your active balance.'
        : 'Burn tokens to reduce supply and unlock utility.'
    );
  };

  const performAction = () => {
    if (!isActionEnabled) {
      return;
    }

    setTransactionStatus('processing');
    setTransactionMessage(`${currentAction} in progress...`);

    window.setTimeout(() => {
      const success = Math.random() > 0.05;

      if (success) {
        setTransactionStatus('completed');
        setTransactionMessage(
          selectedMode === 'claim'
            ? 'Rewards claimed successfully. Your balance was updated.'
            : 'Tokens burned successfully. Supply was updated.'
        );

        if (selectedMode === 'claim') {
          setBalance((current) => Math.max(0, current - 2.5));
        } else {
          setBalance((current) => Math.max(0, current - 1.0));
        }
      } else {
        setTransactionStatus('failed');
        setTransactionMessage('The wallet action failed. Please try again.');
      }
    }, 900);
  };

  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '24px' }}>
      <div
        style={{
          background: '#0b1220',
          borderRadius: 24,
          padding: '24px',
          color: '#f8fafc',
          boxShadow: '0 18px 40px rgba(8, 15, 35, 0.18)',
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5, color: '#82aaff', fontSize: 12 }}>
            Claim & Burn
          </p>
          <h1 style={{ fontSize: 28, lineHeight: 1.2, margin: 0 }}>
            Manage your wallet state and token actions
          </h1>
          <p style={{ marginTop: 12, color: '#cbd5e1' }}>
            Use the toggles below to switch between claim and burn flows, and monitor wallet connectivity in real time.
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gap: 18,
            gridTemplateColumns: '1fr',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              padding: 20,
              borderRadius: 20,
              background: 'rgba(15, 23, 42, 0.92)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ color: '#94a3b8', marginBottom: 6 }}>Wallet status</p>
                <strong style={{ fontSize: 18 }}>{getWalletBadge(walletState)}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#94a3b8', marginBottom: 6 }}>Network</p>
                <strong style={{ fontSize: 18 }}>{networkLabel}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 220px', minWidth: 220 }}>
                <p style={{ color: '#94a3b8', marginBottom: 6 }}>Account</p>
                <div style={{ padding: '14px 16px', borderRadius: 16, background: '#111827', color: '#e2e8f0', minHeight: 52 }}>
                  {accountAddress || 'No wallet connected'}
                </div>
              </div>

              <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                <p style={{ color: '#94a3b8', marginBottom: 6 }}>Available balance</p>
                <div style={{ padding: '14px 16px', borderRadius: 16, background: '#111827', color: '#e2e8f0', minHeight: 52 }}>
                  {balance.toFixed(2)} XLM
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                {walletState === 'connected' ? (
                  <button
                    type="button"
                    onClick={disconnectWallet}
                    style={{
                      width: '100%',
                      borderRadius: 14,
                      padding: '14px 18px',
                      border: '1px solid #334155',
                      background: '#111827',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                    }}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={connectWallet}
                    style={{
                      width: '100%',
                      borderRadius: 14,
                      padding: '14px 18px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    {walletConnectLabel[walletState]}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: '1fr',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={() => handleModeToggle('claim')}
                aria-pressed={selectedMode === 'claim'}
                style={{
                  borderRadius: 14,
                  padding: '14px 18px',
                  border: '1px solid transparent',
                  background: selectedMode === 'claim' ? '#1d4ed8' : '#111827',
                  color: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                Claim
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle('burn')}
                aria-pressed={selectedMode === 'burn'}
                style={{
                  borderRadius: 14,
                  padding: '14px 18px',
                  border: '1px solid transparent',
                  background: selectedMode === 'burn' ? '#dc2626' : '#111827',
                  color: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                Burn
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 12,
                padding: 20,
                borderRadius: 20,
                background: '#111827',
              }}
            >
              <div>
                <p style={{ color: '#94a3b8', marginBottom: 6 }}>Action</p>
                <h2 style={{ margin: 0, fontSize: 22 }}>{currentAction}</h2>
              </div>

              <p style={{ margin: 0, color: '#cbd5e1' }}>{walletStatusMessage[walletState]}</p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={performAction}
                  disabled={!isActionEnabled}
                  style={{
                    flex: '1 1 160px',
                    minWidth: 160,
                    borderRadius: 14,
                    padding: '14px 18px',
                    border: 'none',
                    background: isActionEnabled ? '#2563eb' : '#334155',
                    color: '#ffffff',
                    cursor: isActionEnabled ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isActionEnabled ? currentAction : 'Connect wallet to continue'}
                </button>

                <div style={{ flex: '1 1 220px', minWidth: 220, padding: '14px 16px', borderRadius: 16, background: '#0f172a' }}>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>Status</p>
                  <p style={{ marginTop: 8, color: '#e2e8f0' }}>{transactionMessage}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
