import { useState } from 'react';
import './App.css';
import { useWallet } from './hooks/useWallet';
import { useEscrow } from './hooks/useEscrow';
import { WalletConnect } from './components/WalletConnect';
import { EscrowInfo } from './components/EscrowInfo';
import { EscrowActions } from './components/EscrowActions';

function App() {
  const { account, chainId, provider, connecting, error: walletError, connect } = useWallet();
  const [contractAddress, setContractAddress] = useState('');
  const {
    escrowState,
    loading,
    error: escrowError,
    txStatus,
    approveByBuyer,
    approveBySeller,
    raiseDispute,
    resolveDispute,
    setTxStatus,
  } = useEscrow(provider, account, contractAddress);

  const handleResolveForSeller = async () => {
    try {
      await resolveDispute(true);
    } catch {
      // error already captured
    }
  };

  const handleResolveForBuyer = async () => {
    try {
      await resolveDispute(false);
    } catch {
      // error already captured
    }
  };

  const handleApproveBuyer = async () => {
    try {
      await approveByBuyer();
    } catch {
      // error already captured
    }
  };

  const handleApproveSeller = async () => {
    try {
      await approveBySeller();
    } catch {
      // error already captured
    }
  };

  const handleRaiseDispute = async () => {
    try {
      await raiseDispute();
    } catch {
      // error already captured
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Escrow DApp</h1>
        <p>Manage escrow approvals, disputes, and resolution</p>
      </header>

      <WalletConnect
        account={account}
        chainId={chainId}
        connecting={connecting}
        error={walletError}
        onConnect={connect}
      />

      <div className="card">
        <h2>Contract</h2>
        <div className="contract-input">
          <label htmlFor="contractAddress">Escrow Contract Address</label>
          <input
            id="contractAddress"
            value={contractAddress}
            onChange={(e) => {
              setContractAddress(e.target.value);
              setTxStatus({ status: 'idle' });
            }}
            placeholder="0x..."
            spellCheck={false}
          />
          <span className="hint">Enter the deployed Escrow contract address for your network.</span>
        </div>
        {escrowError && <p className="error-text">{escrowError}</p>}
      </div>

      {loading && <div className="card"><p className="muted">Loading escrow details...</p></div>}

      {escrowState && !loading && (
        <>
          <EscrowInfo escrowState={escrowState} />
          <EscrowActions
            account={account}
            escrowState={escrowState}
            txStatus={txStatus}
            onApproveBuyer={handleApproveBuyer}
            onApproveSeller={handleApproveSeller}
            onRaiseDispute={handleRaiseDispute}
            onResolveForSeller={handleResolveForSeller}
            onResolveForBuyer={handleResolveForBuyer}
          />
        </>
      )}
    </div>
  );
}

export default App;
