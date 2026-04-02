import api from '../lib/api';

// ── Queries ──────────────────────────────────────────────────────────────────

/** GET /api/auctions/active → Auction[] */
export const getActiveAuctions = () =>
  api.get('/auctions/active').then((r) => r.data);

/** GET /api/auctions/{id} → AuctionDetailView */
export const getAuctionDetail = (id) =>
  api.get(`/auctions/${id}`).then((r) => r.data);

/** GET /api/auctions/{id}/bids → Bid[] */
export const getBidHistory = (id) =>
  api.get(`/auctions/${id}/bids`).then((r) => r.data);

/** GET /api/auctions/{id}/winner → WinnerView */
export const getAuctionWinner = (id) =>
  api.get(`/auctions/${id}/winner`).then((r) => r.data);

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auctions
 * @param {{ medicationId: number, branchId: number, basePrice: number,
 *           startTime: string, endTime: string, closureType?: string,
 *           maxPrice?: number, inactivityMinutes?: number }} data
 */
export const createAuction = (data) =>
  api.post('/auctions', data).then((r) => r.data);

/**
 * PUT /api/auctions/{id} — only SCHEDULED auctions
 * @param {number} id
 * @param {{ basePrice?: number, startTime?: string, endTime?: string }} data
 */
export const updateAuction = (id, data) =>
  api.put(`/auctions/${id}`, data).then((r) => r.data);

/**
 * POST /api/auctions/{id}/join?userId={userId}
 * Registers user as participant; backend stores in Redis.
 * @param {number} id
 * @param {number} userId
 */
export const joinAuction = (id, userId) =>
  api
    .post(`/auctions/${id}/join`, null, { params: { userId } })
    .then((r) => r.data);

/**
 * POST /api/auctions/{id}/bids
 * Rate-limited: 10 bids/min (429 = retry after 60s)
 * @param {number} id
 * @param {{ amount: number, userName: string, userId: number }} data
 */
export const placeBid = (id, data) =>
  api.post(`/auctions/${id}/bids`, data).then((r) => r.data);
