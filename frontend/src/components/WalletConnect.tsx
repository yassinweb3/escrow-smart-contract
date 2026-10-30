import { formatAddress } from '../utils/format';

interface WalletConnectProps {
  account: string | null;
  chainId: string | null;
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
}

export function WalletConnect({ account, chainId, connecting, error, onConnect }: WalletConnectProps) {
  return (
    <div className="card">
      <h2>Wallet</h2>
      {!account ? (
        <button onClick={onConnect} disabled={connecting} className="btn btn-primary">
          {connecting ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      ) : (
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Address</span>
            <span className="value">{formatAddress(account)}</span>
          </div>
          {chainId && (
            <div className="info-item">
              <span className="label">Chain ID</span>
              <span className="value">{chainId}</span>
            </div>
          )}
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
