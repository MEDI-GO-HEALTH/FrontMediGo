/**
 * Client-side tracking of auctions the current user has joined.
 * The backend stores this in Redis (no "am I joined?" query endpoint exists),
 * so we mirror the join state in localStorage keyed by userId.
 */
const KEY = 'medigo_joined_auctions';

function getMap() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * @param {number|string} userId
 * @param {number|string} auctionId
 */
export function markJoined(userId, auctionId) {
  const map = getMap();
  if (!map[userId]) map[userId] = {};
  map[userId][auctionId] = true;
  localStorage.setItem(KEY, JSON.stringify(map));
}

/**
 * @param {number|string} userId
 * @param {number|string} auctionId
 * @returns {boolean}
 */
export function isJoined(userId, auctionId) {
  if (!userId || !auctionId) return false;
  return !!getMap()[userId]?.[auctionId];
}
