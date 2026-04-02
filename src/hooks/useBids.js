import { useQuery } from '@tanstack/react-query';
import { getBidHistory } from '../services/auctionService';

/** Returns Bid[] ordered chronologically (newest first expected from backend). */
export function useBids(auctionId) {
  return useQuery({
    queryKey: ['bids', String(auctionId)],
    queryFn: () => getBidHistory(auctionId),
    enabled: !!auctionId,
  });
}
