import type { EscrowState } from '../types/escrow';
import { formatAddress, formatEther } from '../utils/format';

interface EscrowInfoProps {
  escrowState: EscrowState;
}

export function EscrowInfo({ escrowState }: EscrowInfoProps) {
  return (
    <div className="card">
      <h2>Escrow Details</h2>
      <div className="info-grid">
        <div className="info-item">
          <span className="label">Buyer</span>
          <span className="value">{formatAddress(escrowState.buyer)}</span>
        </div>
        <div className="info-item">
          <span className="label">Seller</span>
          <span className="value">{formatAddress(escrowState.seller)}</span>
        </div>
        <div className="info-item">
          <span className="label">Arbiter</span>
          <span className="value">{formatAddress(escrowState.arbiter)}</span>
        </div>
        <div className="info-item">
          <span className="label">Amount</span>
          <span className="value">{formatEther(escrowState.amount)}</span>
        </div>
        <div className="info-item">
          <span className="label">Buyer Approved</span>
          <span className={`value ${escrowState.buyerApproved ? 'status-ok' : 'status-pending'}`}>
            {escrowState.buyerApproved ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Seller Approved</span>
          <span className={`value ${escrowState.sellerApproved ? 'status-ok' : 'status-pending'}`}>
            {escrowState.sellerApproved ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Dispute Raised</span>
          <span className={`value ${escrowState.isDisputeRaised ? 'status-warn' : ''}`}>
            {escrowState.isDisputeRaised ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Settled</span>
          <span className={`value ${escrowState.isSettled ? 'status-ok' : ''}`}>
            {escrowState.isSettled ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
}
