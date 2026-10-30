import { ethers } from 'ethers';

export function formatAddress(addr: string): string {
  if (!addr) return '';
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatEther(wei: bigint | string | null | undefined): string {
  if (wei == null) return '0 ETH';
  try {
    return `${ethers.formatEther(wei)} ETH`;
  } catch {
    return String(wei);
  }
}
