import { useQuery } from '@tanstack/react-query';
import { getActiveAuctions } from '../services/auctionService';

/**
 * Lists all ACTIVE auctions.
 * Refetches every 30s to align with backend scheduler interval.
 * NOTE: The API only exposes /api/auctions/active; filtering by other
 * statuses (SCHEDULED, CLOSED) requires a separate admin endpoint not yet available.
 */
export function useAuctions() {
  return useQuery({
    queryKey: ['auctions', 'active'],
    queryFn: getActiveAuctions,
    refetchInterval: 30_000,
  });
}
