'use client';

import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  deriveMarketPDA,
  derivePositionPDA,
  createMarketInstruction,
  buySharesInstruction,
  sellSharesInstruction,
  resolveMarketInstruction,
  claimWinningsInstruction,
  buildTransaction,
  getMarketAccount,
  getPositionAccount,
  getAllUserPositions,
  Side,
  estimateShares,
  solToLamports,
  lamportsToSol,
} from '@/lib/vapor-client';

export interface PositionData {
  side: 'yes' | 'no';
  shares: number;
}

export interface UserPosition {
  marketAddress: string;
  side: 'yes' | 'no';
  shares: number;
  avgPrice: number;
}

export interface UseVaporResult {
  // State
  loading: boolean;
  error: string | null;
  txSignature: string | null;
  
  // Actions
  createMarket: (projectId: number, projectName: string, resolutionDays?: number) => Promise<{ signature: string | null; address: string } | null>;
  buyShares: (projectId: number, side: 'yes' | 'no', solAmount: number) => Promise<string | null>;
  sellShares: (projectId: number, side: 'yes' | 'no', sharesToSell: number) => Promise<string | null>;
  resolveMarket: (projectId: number, winner: 'yes' | 'no') => Promise<string | null>;
  claimWinnings: (projectId: number, side: 'yes' | 'no') => Promise<string | null>;
  
  // Queries
  checkMarketExists: (projectId: number) => Promise<boolean>;
  getPosition: (projectId: number, side: 'yes' | 'no') => Promise<PositionData | null>;
  getPositions: (projectId: number) => Promise<{ yes: PositionData | null; no: PositionData | null }>;
  getAllPositions: () => Promise<UserPosition[]>;
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
  ): Promise<{ signature: string | null; address: string } | null> => {
    if (!publicKey) {
      setError('Connect wallet first');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const [marketPDA, bump] = deriveMarketPDA(projectId);
      const marketAddress = marketPDA.toBase58();
      
      const existing = await getMarketAccount(projectId);
      if (existing.exists) {
        console.log('Market already exists on-chain, syncing...');
        return { signature: null, address: marketAddress };
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
      return sig ? { signature: sig, address: marketAddress } : null;
    } catch (err: any) {
      // Handle "Account already in use" error (RPC consistency issue)
      const msg = err.message || JSON.stringify(err);
      if (msg.includes('already in use') || msg.includes('custom program error: 0x0')) {
        console.log('Market exists (caught via tx error), syncing...');
        const [marketPDA] = deriveMarketPDA(projectId);
        setLoading(false);
        return { signature: null, address: marketPDA.toBase58() };
      }

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
      const sideEnum = side === 'yes' ? Side.Yes : Side.No;
      const [positionPDA, positionBump] = derivePositionPDA(marketPDA, publicKey, sideEnum);
      
      const amount = solToLamports(solAmount);

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

  // Sell shares in a market
  const sellShares = useCallback(async (
    projectId: number,
    side: 'yes' | 'no',
    sharesToSell: number
  ): Promise<string | null> => {
    if (!publicKey) {
      setError('Connect wallet first');
      return null;
    }

    if (sharesToSell <= 0) {
      setError('Must sell at least 1 share');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const [marketPDA] = deriveMarketPDA(projectId);
      const sideEnum = side === 'yes' ? Side.Yes : Side.No;
      const [positionPDA, positionBump] = derivePositionPDA(marketPDA, publicKey, sideEnum);

      const ix = sellSharesInstruction(
        publicKey,
        marketPDA,
        positionPDA,
        sideEnum,
        sharesToSell,
        positionBump
      );

      const tx = await buildTransaction(connection, publicKey, [ix]);
      const sig = await sendTransaction(tx);
      
      setLoading(false);
      return sig;
    } catch (err: any) {
      setError(err.message || 'Failed to sell shares');
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
    projectId: number,
    side: 'yes' | 'no'
  ): Promise<string | null> => {
    if (!publicKey) {
      setError('Connect wallet first');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const [marketPDA] = deriveMarketPDA(projectId);
      const sideEnum = side === 'yes' ? Side.Yes : Side.No;
      const [positionPDA] = derivePositionPDA(marketPDA, publicKey, sideEnum);

      const ix = claimWinningsInstruction(publicKey, marketPDA, positionPDA, sideEnum);

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

  // Get user's position for a specific side
  const getPosition = useCallback(async (
    projectId: number,
    side: 'yes' | 'no'
  ): Promise<PositionData | null> => {
    if (!publicKey) return null;

    const sideEnum = side === 'yes' ? Side.Yes : Side.No;
    const result = await getPositionAccount(projectId, publicKey, sideEnum);
    if (!result.exists || !result.data) return null;

    return {
      side,
      shares: result.data.shares,
    };
  }, [publicKey]);

  // Get both YES and NO positions
  const getPositions = useCallback(async (
    projectId: number
  ): Promise<{ yes: PositionData | null; no: PositionData | null }> => {
    if (!publicKey) return { yes: null, no: null };

    const [yesPos, noPos] = await Promise.all([
      getPosition(projectId, 'yes'),
      getPosition(projectId, 'no'),
    ]);

    return { yes: yesPos, no: noPos };
  }, [publicKey, getPosition]);

  // Get all user positions efficiently
  const getAllPositions = useCallback(async (): Promise<UserPosition[]> => {
    if (!publicKey) return [];
    
    const rawPositions = await getAllUserPositions(publicKey, connection);
    
    return rawPositions.map(p => ({
      marketAddress: p.market.toBase58(),
      side: p.side === 0 ? 'yes' : 'no',
      shares: p.shares,
      avgPrice: p.avgPrice,
    }));
  }, [publicKey, connection]);

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
    sellShares,
    resolveMarket,
    claimWinnings,
    checkMarketExists,
    getPosition,
    getPositions,
    getAllPositions,
    estimateTrade,
    clearError,
  };
}
