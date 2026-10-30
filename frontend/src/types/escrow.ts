export interface EscrowState {
  buyer: string;
  seller: string;
  arbiter: string;
  amount: bigint;
  buyerApproved: boolean;
  sellerApproved: boolean;
  isDisputeRaised: boolean;
  isSettled: boolean;
}

export interface TxStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
  hash?: string;
}
