import type { EscrowState, TxStatus } from '../types/escrow';

interface EscrowActionsProps {
  account: string | null;
  escrowState: EscrowState;
  txStatus: TxStatus;
  onApproveBuyer: () => void;
  onApproveSeller: () => void;
  onRaiseDispute: () => void;
  onResolveForSeller: () => void;
  onResolveForBuyer: () => void;
}

export function EscrowActions({
  account,
  escrowState,
  txStatus,
  onApproveBuyer,
  onApproveSeller,
  onRaiseDispute,
  onResolveForSeller,
  onResolveForBuyer,
}: EscrowActionsProps) {
  const isPending = txStatus.status === 'pending';
  const isBuyer = account?.toLowerCase() === escrowState.buyer.toLowerCase();
  const isSeller = account?.toLowerCase() === escrowState.seller.toLowerCase();
  const isArbiter = account?.toLowerCase() === escrowState.arbiter.toLowerCase();
  const isParty = isBuyer || isSeller;

  if (escrowState.isSettled) {
    return (
      <div className="card">
        <h2>Actions</h2>
        <p className="muted">Escrow has been settled. No actions available.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Actions</h2>
      <div className="actions">
        {isBuyer && !escrowState.isDisputeRaised && !escrowState.buyerApproved && (
          <button onClick={onApproveBuyer} disabled={isPending} className="btn btn-primary">
            Approve as Buyer
          </button>
        )}
        {isBuyer && escrowState.buyerApproved && !escrowState.isDisputeRaised && (
          <p className="muted">You have approved. Waiting for seller approval.</p>
        )}

        {isSeller && !escrowState.isDisputeRaised && !escrowState.sellerApproved && (
          <button onClick={onApproveSeller} disabled={isPending} className="btn btn-primary">
            Approve as Seller
          </button>
        )}
        {isSeller && escrowState.sellerApproved && !escrowState.isDisputeRaised && (
          <p className="muted">You have approved. Waiting for buyer approval.</p>
        )}

        {isParty && !escrowState.isDisputeRaised && (
          <button onClick={onRaiseDispute} disabled={isPending} className="btn btn-warning">
            Raise Dispute
          </button>
        )}

        {isArbiter && escrowState.isDisputeRaised && !escrowState.isSettled && (
          <>
            <button onClick={onResolveForSeller} disabled={isPending} className="btn btn-success">
              Pay Seller
            </button>
            <button onClick={onResolveForBuyer} disabled={isPending} className="btn btn-danger">
              Refund Buyer
            </button>
          </>
        )}
        {isArbiter && !escrowState.isDisputeRaised && (
          <p className="muted">No dispute to resolve yet.</p>
        )}

        {!isParty && !isArbiter && (
          <p className="muted">Only buyer, seller, or arbiter can perform actions.</p>
        )}
      </div>

      {txStatus.status === 'pending' && (
        <p className="status-text status-pending">
          {txStatus.message || 'Transaction pending...'} {txStatus.hash && `(${txStatus.hash.slice(0, 10)}...)`}
        </p>
      )}
      {txStatus.status === 'success' && (
        <p className="status-text status-ok">
          {txStatus.message} {txStatus.hash && `(${txStatus.hash.slice(0, 10)}...)`}
        </p>
      )}
      {txStatus.status === 'error' && (
        <p className="status-text status-warn">{txStatus.message}</p>
      )}
    </div>
  );
}
