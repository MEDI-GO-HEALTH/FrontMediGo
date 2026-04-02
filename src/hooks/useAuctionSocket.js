import { useEffect, useRef } from 'react';
import { createStompClient } from '../lib/stomp';

/**
 * Subscribes to real-time AuctionEvents via STOMP WebSocket.
 * Topic: /topic/auction/{auctionId}
 *
 * Events received:
 *   BID_PLACED       → { type, auctionId, currentAmount, leaderName, leaderId, timestamp, message }
 *   AUCTION_STARTED  → { type, auctionId, timestamp, message }
 *   AUCTION_CLOSED   → { type, auctionId, currentAmount, leaderName, leaderId, timestamp, message }
 *   WINNER_ADJUDICATED → same as AUCTION_CLOSED
 *
 * @param {string|number|null} auctionId
 * @param {(event: object) => void} onEvent
 */
export function useAuctionSocket(auctionId, onEvent) {
  const onEventRef = useRef(onEvent);
  // eslint-disable-next-line react-hooks/refs -- intentional "latest ref" pattern for stable callbacks
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!auctionId) return;

    const client = createStompClient();

    client.onConnect = () => {
      client.subscribe(`/topic/auction/${auctionId}`, (message) => {
        try {
          const event = JSON.parse(message.body);
          onEventRef.current(event);
        } catch {
          // ignore malformed frames
        }
      });
    };

    client.activate();
    return () => { client.deactivate(); };
  }, [auctionId]);
}
