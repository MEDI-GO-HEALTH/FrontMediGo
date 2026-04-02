import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAuction,
  updateAuction,
  joinAuction,
  placeBid,
} from '../services/auctionService';
import { markJoined } from '../lib/joinedAuctions';

export function useCreateAuction({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAuction,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['auctions'] });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useUpdateAuction(auctionId, { onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateAuction(auctionId, data),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['auctions'] });
      qc.invalidateQueries({ queryKey: ['auction', String(auctionId)] });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useJoinAuction(auctionId, { onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => joinAuction(auctionId, userId),
    onSuccess: (data, userId, ...rest) => {
      // Mirror join state client-side (no query endpoint for "am I joined?")
      markJoined(userId, auctionId);
      qc.invalidateQueries({ queryKey: ['auction', String(auctionId)] });
      onSuccess?.(data, userId, ...rest);
    },
    onError,
  });
}

export function usePlaceBid(auctionId, { onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => placeBid(auctionId, data),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bids', String(auctionId)] });
      qc.invalidateQueries({ queryKey: ['auction', String(auctionId)] });
      onSuccess?.(...args);
    },
    onError,
  });
}
