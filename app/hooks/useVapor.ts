'use client';

import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  deriveMarketPDA,
  derivePositionPDA,
  createMarketInstruction,
  buySharesInstruction,
  resolveMarketInstruction,
  claimWinningsInstruction,
  buildTransaction,
  getMarketAccount,
  getPositionAccount,
  Side,
  estimateShares,
  solToLamports,
  lamportsToSol,
} from '@/lib/vapor-client';

export interface UseVaporResult {
  // State
  loading: boolean;
  error: string | null;
  txSignature: string | null;
  
  // Actions
  createMarket: (projectId: number, projectName: string, resolutionDays?: number) => Promise<string | null>;
  buyShares: (projectId: number, side: 'yes' | 'no', solAmount: number) => Promise<string | null>;
  resolveMarket: (projectId: number, winner: 'yes' | 'no') => Promise<string | null>;
  claimWinnings: (projectId: number) => Promise<string | null>;
  
  // Queries
  checkMarketExists: (projectId: number) => Promise<boolean>;
  getPosition: (projectId: number) => Promise<{ side: 'yes' | 'no'; shares: number } | null>;
  estimateTrade: (yesPool: number, noPool: number, amount: number, side: 'yes' | 'no') => number;
  
  // Helpers
  clearError: () => void;
}

export function useVapor(): UseVaporResult {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setTxSignature(null);
  }, []);

  const sendTransaction = useCallback(async (tx: Transaction): Promise<string | null> => {
    if (!signTransaction || !publicKey) {
      setError('Wallet not connected');
      return null;
    }

    try {
      const signed = await signTransaction(tx);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      setTxSignature(signature);
      return signature;
    } catch (err: any) {
      console.error('Transaction failed:', err);
      setError(err.message || 'Transaction failed');
      return null;
    }
  }, [connection, publicKey, signTransaction]);

  // Create a new market
  const createMarket = useCallback(async (
    projectId: number,
    projectName: string,
    resolutionDays: number = 7
  ): Promise<string | null> => {
    if (!publicKey) {
      setError('Connect wallet first');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const [marketPDA, bump] = deriveMarketPDA(projectId);
      
      // Check if market already exists
      const existing = await getMarketAccount(projectId);
      if (existing.exists) {
        setError('Market already exists');
        setLoading(false);
        return null;
      }

      const resolutionTimestamp = Math.floor(Date.now() / 1000) + (resolutionDays * 24 * 60 * 60);

      const ix = createMarketInstruction(
        publicKey,
        marketPDA,
        projectId,
        projectName,
        resolutionTimestamp,
        bump
      );

      const tx = await buildTransaction(connection, publicKey, [ix]);
      const sig = await sendTransaction(tx);
      
      setLoading(false);
      return sig;
    } catch (err: any) {
      setError(err.message || 'Failed to create market');
      setLoading(false);
      return null;
    }
  }, [publicKey, connection, sendTransaction]);

  // Buy shares in a market
  const buyShares = useCallback(async (
    projectId: number,
    side: 'yes' | 'no',
    solAmount: number
  ): Promise<string | null> => {
    if (!publicKey) {
      setError('Connect wallet first');
      return null;
    }

    if (solAmount <= 0) {
      setError('Amount must be greater than 0');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const [marketPDA] = deriveMarketPDA(projectId);
      const [positionPDA, positionBump] = derivePositionPDA(marketPDA, publicKey);
      
      const amount = solToLamports(solAmount);
      const sideEnum = side === 'yes' ? Side.Yes : Side.No;

      const ix = buySharesInstruction(
        publicKey,
        marketPDA,
        positionPDA,
        sideEnum,
        amount,
        positionBump
      );

      const tx = await buildTransaction(connection, publicKey, [ix]);
      const sig = await sendTransaction(tx);
      
      setLoading(false);
      return sig;
    } catch (err: any) {
      setError(err.message || 'Failed to buy shares');
      setLoading(false);
      return null;
    }
  }, [publicKey, connection, sendTransaction]);

  // Resolve a market (authority only)
  const resolveMarket = useCallback(async (
    projectId: number,
    winner: 'yes' | 'no'
  ): Promise<string | null> => {
    if (!publicKey) {
      setError('Connect wallet first');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const [marketPDA] = deriveMarketPDA(projectId);
      const winnerEnum = winner === 'yes' ? Side.Yes : Side.No;

      const ix = resolveMarketInstruction(publicKey, marketPDA, winnerEnum);

      const tx = await buildTransaction(connection, publicKey, [ix]);
      const sig = await sendTransaction(tx);
      
      setLoading(false);
      return sig;
    } catch (err: any) {
      setError(err.message || 'Failed to resolve market');
      setLoading(false);
      return null;
    }
  }, [publicKey, connection, sendTransaction]);

  // Claim winnings from resolved market
  const claimWinnings = useCallback(async (
    projectId: number
  ): Promise<string | null> => {
    if (!publicKey) {
      setError('Connect wallet first');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const [marketPDA] = deriveMarketPDA(projectId);
      const [positionPDA] = derivePositionPDA(marketPDA, publicKey);

      const ix = claimWinningsInstruction(publicKey, marketPDA, positionPDA);

      const tx = await buildTransaction(connection, publicKey, [ix]);
      const sig = await sendTransaction(tx);
      
      setLoading(false);
      return sig;
    } catch (err: any) {
      setError(err.message || 'Failed to claim winnings');
      setLoading(false);
      return null;
    }
  }, [publicKey, connection, sendTransaction]);

  // Check if market exists on-chain
  const checkMarketExists = useCallback(async (projectId: number): Promise<boolean> => {
    const result = await getMarketAccount(projectId);
    return result.exists;
  }, []);

  // Get user's position in a market
  const getPosition = useCallback(async (
    projectId: number
  ): Promise<{ side: 'yes' | 'no'; shares: number } | null> => {
    if (!publicKey) return null;

    const result = await getPositionAccount(projectId, publicKey);
    if (!result.exists || !result.data) return null;

    return {
      side: result.data.side === Side.Yes ? 'yes' : 'no',
      shares: result.data.shares,
    };
  }, [publicKey]);

  // Estimate shares from trade
  const estimateTrade = useCallback((
    yesPool: number,
    noPool: number,
    amount: number,
    side: 'yes' | 'no'
  ): number => {
    const sideEnum = side === 'yes' ? Side.Yes : Side.No;
    return estimateShares(yesPool, noPool, solToLamports(amount), sideEnum);
  }, []);

  return {
    loading,
    error,
    txSignature,
    createMarket,
    buyShares,
    resolveMarket,
    claimWinnings,
    checkMarketExists,
    getPosition,
    estimateTrade,
    clearError,
  };
}
