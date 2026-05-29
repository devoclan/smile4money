import { useState, useCallback } from 'react';
import type { WalletStatus, Network } from '../types';

declare global {
  interface Window {
    stellar?: {
      freighter?: {
        isConnected: () => Promise<{ isConnected: boolean }>;
        getPublicKey: () => Promise<string>;
        signTransaction: (xdr: string) => Promise<{ signedTxXdr: string }>;
        getNetwork?: () => Promise<{ network: string; networkPassphrase: string }>;
      };
    };
  }
}

interface StellarWallet {
  status: WalletStatus;
  address: string | null;
  error: string | null;
  balance: string | null;
  network: Network;
  isInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

function detectNetwork(networkPassphrase?: string): Network {
  if (!networkPassphrase) return 'unknown';
  if (networkPassphrase.includes('testnet')) return 'testnet';
  if (networkPassphrase.includes('pubnet') || networkPassphrase.includes('mainnet')) return 'mainnet';
  return 'unknown';
}

export function useStellarWallet(): StellarWallet {
  const [status, setStatus] = useState<WalletStatus>('disconnected');
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network>('unknown');

  const freighter = typeof window !== 'undefined' ? window.stellar?.freighter : undefined;
  const isInstalled = !!freighter;

  const connect = useCallback(async () => {
    if (!freighter) {
      setStatus('error');
      setError('Freighter wallet not detected. Please install the Freighter browser extension.');
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const { isConnected } = await freighter.isConnected();
      if (!isConnected) {
        setStatus('disconnected');
        return;
      }

      const publicKey = await freighter.getPublicKey();
      setAddress(publicKey);

      if (freighter.getNetwork) {
        const net = await freighter.getNetwork();
        setNetwork(detectNetwork(net.networkPassphrase));
      }

      setStatus('connected');
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to Freighter wallet',
      );
    }
  }, [freighter]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setStatus('disconnected');
    setError(null);
    setNetwork('unknown');
  }, []);

  return { status, address, error, balance, network, isInstalled, connect, disconnect };
}
