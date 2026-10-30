import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, type Eip1193Provider } from 'ethers';

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      on?: (...args: any[]) => void;
      removeListener?: (...args: any[]) => void;
      request: (args: { method: string; params?: any[] | object }) => Promise<any>;
    };
  }
}

interface WalletState {
  account: string | null;
  chainId: string | null;
  provider: BrowserProvider | null;
  connecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    account: null,
    chainId: null,
    provider: null,
    connecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState((s) => ({ ...s, error: 'MetaMask not detected. Please install MetaMask.' }));
      return;
    }
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      setState({
        account: accounts?.[0] ?? null,
        chainId: '0x' + network.chainId.toString(16),
        provider,
        connecting: false,
        error: null,
      });
    } catch (e: any) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: e?.message ?? 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      account: null,
      chainId: null,
      provider: null,
      connecting: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setState((s) => ({ ...s, account: accounts?.[0] ?? null }));
    };

    const handleChainChanged = (chainId: string) => {
      setState((s) => ({ ...s, chainId }));
      // Reload to avoid stale state on chain change
      window.location.reload();
    };

    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  return { ...state, connect, disconnect };
}
