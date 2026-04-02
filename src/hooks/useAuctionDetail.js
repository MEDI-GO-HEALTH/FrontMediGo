import { useQuery } from '@tanstack/react-query';
import { getAuctionDetail } from '../services/auctionService';

/**
 * Returns AuctionDetailView: { auction, medicationName, medicationUnit,
 * remainingTime, winnerName }
 * Refetches every 30s; real-time updates come via useAuctionSocket.
 */
export function useAuctionDetail(id) {
  return useQuery({
    queryKey: ['auction', String(id)],
    queryFn: () => getAuctionDetail(id),
    enabled: !!id,
    refetchInterval: 30_000,
  });
}
