import { useCallback, useEffect, useState } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import escrowAbi from '../escrowAbi.json';
import type { EscrowState, TxStatus } from '../types/escrow';

export function useEscrow(provider: BrowserProvider | null, _account: string | null, contractAddress: string) {
  const [escrowState, setEscrowState] = useState<EscrowState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>({ status: 'idle' });

  const getContract = useCallback(async (withSigner = false) => {
    if (!provider || !contractAddress) throw new Error('Provider or contract address missing');
    // Basic validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      throw new Error('Invalid contract address');
    }
    const signerOrProvider = withSigner ? await provider.getSigner() : provider;
    return new Contract(contractAddress, escrowAbi as any, signerOrProvider);
  }, [provider, contractAddress]);

  const fetchState = useCallback(async () => {
    if (!provider || !contractAddress) {
      setEscrowState(null);
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      setError('Invalid contract address format');
      setEscrowState(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(false);
      const [buyer, seller, arbiter, amount, buyerApproved, sellerApproved, isDisputeRaised, isSettled] =
        await Promise.all([
          contract.BUYER(),
          contract.SELLER(),
          contract.ARBITER(),
          contract.AMOUNT(),
          contract.buyerApproved(),
          contract.sellerApproved(),
          contract.isDisputeRaised(),
          contract.isSettled(),
        ]);
      setEscrowState({
        buyer,
        seller,
        arbiter,
        amount,
        buyerApproved,
        sellerApproved,
        isDisputeRaised,
        isSettled,
      });
    } catch (e: any) {
      setEscrowState(null);
      setError(e?.message ?? 'Failed to load escrow data');
    } finally {
      setLoading(false);
    }
  }, [provider, contractAddress, getContract]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const executeTx = useCallback(
    async (fn: string, args: any[] = []) => {
      setTxStatus({ status: 'pending' });
      setError(null);
      try {
        const contract = await getContract(true);
        const tx = await (contract as any)[fn](...args);
        setTxStatus({ status: 'pending', hash: tx.hash, message: 'Transaction sent' });
        await tx.wait();
        setTxStatus({ status: 'success', hash: tx.hash, message: 'Transaction confirmed' });
        await fetchState();
        return tx;
      } catch (e: any) {
        // Extract useful error message
        const msg =
          e?.reason ||
          e?.data?.message ||
          e?.error?.message ||
          e?.message ||
          'Transaction failed';
        setTxStatus({ status: 'error', message: msg });
        setError(msg);
        throw e;
      }
    },
    [getContract, fetchState]
  );

  const approveByBuyer = useCallback(() => executeTx('approveByBuyer'), [executeTx]);
  const approveBySeller = useCallback(() => executeTx('approveBySeller'), [executeTx]);
  const raiseDispute = useCallback(() => executeTx('raiseDispute'), [executeTx]);
  const resolveDispute = useCallback(
    (approveForSeller: boolean) => executeTx('resolveDispute', [approveForSeller]),
    [executeTx]
  );

  return {
    escrowState,
    loading,
    error,
    txStatus,
    fetchState,
    approveByBuyer,
    approveBySeller,
    raiseDispute,
    resolveDispute,
    setTxStatus,
  };
}
