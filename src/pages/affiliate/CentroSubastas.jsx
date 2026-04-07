/* eslint-disable sonarjs/cognitive-complexity */
import { useEffect, useMemo, useState } from 'react'
import AffiliateShell from '../../components/layout/AffiliateShell'
import {
  getActiveAuctions,
  getAuctionBids,
  getAuctionById,
  joinAuction,
  placeAuctionBid,
} from '../../api/subastaService'
import useAuctionLivePrices from '../../hooks/useAuctionLivePrices'
import '../../styles/affiliate/perfil-afiliado.css'
import '../../styles/affiliate/centro-subastas.css'

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const formatRemainingTime = (rawSeconds) => {
  const total = Math.max(0, Number(rawSeconds || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const getAuctionRemainingSeconds = (auction, currentTime) => {
  const endTimeValue = auction?.endTime
  const parsedEndTime = endTimeValue ? new Date(endTimeValue) : null

  if (parsedEndTime && !Number.isNaN(parsedEndTime.getTime())) {
    return Math.max(0, Math.floor((parsedEndTime.getTime() - currentTime.getTime()) / 1000))
  }

  const fallbackRemaining = auction?.remainingSeconds
  if (fallbackRemaining === null || fallbackRemaining === undefined) {
    return 0
  }

  const loadedAtMs = Number(auction?.loadedAtMs || Date.now())
  const elapsedSeconds = Math.max(0, Math.floor((currentTime.getTime() - loadedAtMs) / 1000))
  return Math.max(0, Number(fallbackRemaining) - elapsedSeconds)
}

const normalizeCategory = (closureType, index) => {
  const value = String(closureType || '').toUpperCase()
  if (value === 'MAX_PRICE') {
    return 'PREMIUM'
  }

  if (value === 'INACTIVITY') {
    return 'CIERRE INMINENTE'
  }

  return index === 0 ? 'PREMIUM' : 'ESTANDAR'
}

const readCurrentPrice = (item) =>
  Number(
    item?.currentPrice ??
      item?.currentprice ??
      item?.current_price ??
      item?.currentOffer ??
      item?.currentoffer ??
      item?.current_offer ??
      item?.basePrice ??
      0,
  )

const mapAuctionFromApi = (item, index) => ({
  id: String(item?.id ?? index + 1),
  medicationName: item?.medicationName || `Medicamento #${item?.medicationId ?? index + 1}`,
  lotLabel: `Lote #${item?.id ?? index + 1} - Sede ${item?.branchId ?? 'N/A'}`,
  basePrice: Number(item?.basePrice ?? 0),
  currentOffer: readCurrentPrice(item),
  remainingSeconds: item?.remainingSeconds,
  endTime: item?.endTime || null,
  loadedAtMs: Date.now(),
  status: String(item?.status || 'ACTIVE').toUpperCase(),
  category: normalizeCategory(item?.closureType, index),
  urgency: index === 0 ? 'URGENCIA HOSPITALARIA' : null,
})

const parseJwtPayload = (token) => {
  try {
    const parts = String(token || '').split('.')
    if (parts.length < 2) {
      return null
    }

    const base64 = parts[1].replaceAll('-', '+').replaceAll('_', '/')
    const decoded = globalThis.atob(base64)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

const pickUserId = (rawUser, token) => {
  const directCandidate =
    rawUser?.id ??
    rawUser?.userId ??
    rawUser?.user_id ??
    rawUser?.usuarioId ??
    rawUser?.uid

  if (directCandidate !== null && directCandidate !== undefined && String(directCandidate).trim() !== '') {
    return Number(directCandidate)
  }

  const jwtPayload = parseJwtPayload(token)
  const tokenCandidate = jwtPayload?.userId ?? jwtPayload?.uid ?? jwtPayload?.sub
  if (tokenCandidate !== null && tokenCandidate !== undefined && String(tokenCandidate).trim() !== '') {
    return Number(tokenCandidate)
  }

  return null
}

const getCurrentAffiliateUser = () => {
  try {
    const rawUser = localStorage.getItem('medigo_user')
    const token = localStorage.getItem('medigo_token')
    const parsed = rawUser ? JSON.parse(rawUser) : {}
    const resolvedId = pickUserId(parsed, token)

    if (!Number.isFinite(resolvedId) || resolvedId <= 0) {
      return null
    }

    return {
      id: resolvedId,
      name: parsed.name || parsed.username || parsed.email || `afiliado-${resolvedId}`,
    }
  } catch {
    return null
  }
}

const extractErrorMessage = (apiError) => {
  const data = apiError?.response?.data
  const message = data?.message || 'No se pudo completar la operacion en subastas.'
  const details = data?.details ? ` ${data.details}` : ''
  return `${message}${details}`
}

const parseRetryAfterMs = (apiError) => {
  const rawHeader = apiError?.response?.headers?.['retry-after']
  if (!rawHeader) {
    return 0
  }

  const asNumber = Number(rawHeader)
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber * 1000
  }

  const asDate = new Date(rawHeader)
  if (!Number.isNaN(asDate.getTime())) {
    return Math.max(0, asDate.getTime() - Date.now())
  }

  return 0
}

const getCategoryTone = (category) => {
  if (category === 'PREMIUM') {
    return 'premium'
  }

  if (category === 'CIERRE INMINENTE') {
    return 'danger'
  }

  return ''
}

const getParticipationStorageKey = (userId) => `medigo_affiliate_participations_${userId}`

const readStoredParticipations = (userId) => {
  if (!userId) {
    return []
  }

  try {
    const raw = localStorage.getItem(getParticipationStorageKey(userId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

const storeParticipations = (userId, auctionIds) => {
  if (!userId) {
    return
  }

  try {
    localStorage.setItem(getParticipationStorageKey(userId), JSON.stringify(auctionIds))
  } catch {
    // Ignore storage errors (private mode/quota), UI still works in-memory.
  }
}

export default function CentroSubastas() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [selectedAuctionId, setSelectedAuctionId] = useState('')
  const [selectedBidAuctionId, setSelectedBidAuctionId] = useState('')
  const [selectedAuctionDetail, setSelectedAuctionDetail] = useState(null)
  const [selectedAuctionBids, setSelectedAuctionBids] = useState([])
  const [participantAuctionIds, setParticipantAuctionIds] = useState([])
  const [participationStorageReady, setParticipationStorageReady] = useState(false)
  const [participationsCount, setParticipationsCount] = useState(0)
  const [wonCount, setWonCount] = useState(0)
  const [bidAmount, setBidAmount] = useState('')
  const [clock, setClock] = useState(new Date())
  const [lastBidAtMs, setLastBidAtMs] = useState(0)
  const [bidCooldownMs, setBidCooldownMs] = useState(5000)

  const currentUser = getCurrentAffiliateUser()

  // ── Tiempo real: actualización de "Monto actual" vía WebSocket STOMP ──
  // Cuando cualquier usuario registra una puja, el backend publica en
  // /topic/auctions y este hook actualiza el estado local de forma inmediata.
  useAuctionLivePrices((auctionId, newPrice) => {
    // 1. Actualiza el precio en la tarjeta de la lista de subastas
    setAuctions((prev) =>
      prev.map((a) =>
        String(a.id) === auctionId ? { ...a, currentOffer: newPrice } : a,
      ),
    )
    // 2. Actualiza el detalle abierto en el panel lateral (afecta "Oferta actual")
    setSelectedAuctionDetail((prev) =>
      prev && String(prev.id) === auctionId ? { ...prev, currentPrice: newPrice } : prev,
    )
  })

  // ── Polling silencioso: fallback garantizado cada 5 s ──────────────────
  // Asegura que User B vea cambios incluso si la conexión WebSocket falla
  // o el mensaje no llega. No muestra spinner ni sobreescribe datos más
  // recientes que el backend retorne.
  useEffect(() => {
    const pollId = globalThis.setInterval(async () => {
      try {
        const response = await getActiveAuctions()
        const source = Array.isArray(response) ? response : response?.data
        const list = Array.isArray(source) ? source : []
        if (list.length === 0) return
        setAuctions((prev) =>
          prev.map((a) => {
            const fresh = list.find((item) => String(item?.id) === String(a.id))
            if (!fresh) return a
            const freshPrice = readCurrentPrice(fresh)
            return freshPrice !== a.currentOffer ? { ...a, currentOffer: freshPrice } : a
          }),
        )
      } catch {
        // Silencioso — no mostrar error por fallo de polling en segundo plano
      }
    }, 5000)
    return () => globalThis.clearInterval(pollId)
  }, [])

  useEffect(() => {
    const storedIds = readStoredParticipations(currentUser?.id)
    setParticipantAuctionIds(storedIds)
    setParticipationsCount(storedIds.length)
    setParticipationStorageReady(true)
  }, [currentUser?.id])

  useEffect(() => {
    if (!participationStorageReady) {
      return
    }

    storeParticipations(currentUser?.id, participantAuctionIds)
  }, [currentUser?.id, participantAuctionIds, participationStorageReady])

  useEffect(() => {
    const timerId = globalThis.setInterval(() => {
      setClock(new Date())
    }, 1000)

    return () => {
      globalThis.clearInterval(timerId)
    }
  }, [])

  const loadActiveAuctions = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getActiveAuctions()
      const source = Array.isArray(response) ? response : response?.data
      const list = Array.isArray(source) ? source : []
      const mapped = list.map((item, index) => mapAuctionFromApi(item, index))

      setAuctions(mapped)
      setSelectedAuctionId((previous) => previous || mapped[0]?.id || '')
    } catch (apiError) {
      setError(extractErrorMessage(apiError))
      setAuctions([])
      setSelectedAuctionId('')
      setParticipantAuctionIds([])
      setParticipationsCount(0)
      setWonCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActiveAuctions()
  }, [])

  const runAction = async (action) => {
    setActionLoading(true)
    setError('')

    try {
      return await action()
    } catch (apiError) {
      setError(extractErrorMessage(apiError))
      return null
    } finally {
      setActionLoading(false)
    }
  }

  const fetchAuctionContext = async (auctionId) => {
    const [detailResponse, bidsResponse] = await Promise.all([
      runAction(() => getAuctionById(auctionId)),
      runAction(() => getAuctionBids(auctionId)),
    ])

    if (detailResponse) {
      const detail = detailResponse?.data || detailResponse
      setSelectedAuctionDetail(detail)

      setAuctions((previous) =>
        previous.map((auction) =>
          String(auction.id) === String(auctionId)
            ? {
                ...auction,
                currentOffer: readCurrentPrice(detail),
              }
            : auction,
        ),
      )
    }

    const bidsSource = bidsResponse?.data || bidsResponse
    const bids = Array.isArray(bidsSource) ? bidsSource : []
    setSelectedAuctionBids(bids)

    if (currentUser?.id) {
      const participates = bids.some((bid) => Number(bid?.userId) === Number(currentUser.id))
      if (participates) {
        setParticipantAuctionIds((previous) => {
          const asString = String(auctionId)
          if (previous.includes(asString)) {
            return previous
          }

          return [...previous, asString]
        })
      }
    }
  }

  useEffect(() => {
    if (!selectedAuctionId) {
      return
    }

    fetchAuctionContext(selectedAuctionId)
  }, [selectedAuctionId])

  const filteredAuctions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return auctions
    }

    return auctions.filter((auction) => `${auction.id} ${auction.medicationName}`.toLowerCase().includes(query))
  }, [auctions, search])

  const selectedAuction = useMemo(
    () => auctions.find((auction) => String(auction.id) === String(selectedAuctionId)) || null,
    [auctions, selectedAuctionId],
  )

  const participantAuctions = useMemo(
    () => auctions.filter((auction) => participantAuctionIds.includes(String(auction.id))),
    [auctions, participantAuctionIds],
  )

  useEffect(() => {
    setParticipationsCount(participantAuctionIds.length)
  }, [participantAuctionIds])

  const selectedBidAuction = useMemo(
    () => auctions.find((auction) => String(auction.id) === String(selectedBidAuctionId)) || null,
    [auctions, selectedBidAuctionId],
  )

  const panelAuction = selectedBidAuction || selectedAuction

  useEffect(() => {
    if (participantAuctions.length === 0) {
      setSelectedBidAuctionId('')
      return
    }

    const exists = participantAuctions.some((auction) => String(auction.id) === String(selectedBidAuctionId))
    if (!exists) {
      setSelectedBidAuctionId(String(participantAuctions[0].id))
    }
  }, [participantAuctions, selectedBidAuctionId])

  useEffect(() => {
    if (!selectedBidAuctionId) {
      return
    }

    fetchAuctionContext(selectedBidAuctionId)
  }, [selectedBidAuctionId])

  const isParticipatingSelectedAuction = useMemo(
    () => panelAuction?.id && participantAuctionIds.includes(String(panelAuction.id)),
    [participantAuctionIds, panelAuction],
  )

  const maxBidAmount = useMemo(() => {
    const detailAuctionId = String(selectedAuctionDetail?.id || '')
    const panelAuctionId = String(panelAuction?.id || '')
    const detailCurrentPrice = readCurrentPrice(selectedAuctionDetail)
    if (detailAuctionId && panelAuctionId && detailAuctionId === panelAuctionId && Number.isFinite(detailCurrentPrice) && detailCurrentPrice > 0) {
      return detailCurrentPrice
    }

    if (!selectedAuctionBids.length) {
      return Number(selectedAuction?.currentOffer ?? selectedAuction?.basePrice ?? 0)
    }

    return Math.max(
      ...selectedAuctionBids.map((bid) => Number(bid?.amount || 0)),
      Number(selectedAuction?.currentOffer ?? selectedAuction?.basePrice ?? 0),
    )
  }, [selectedAuctionBids, selectedAuction, selectedAuctionDetail, panelAuction])

  const myTopBid = useMemo(() => {
    if (!currentUser?.id || !selectedAuctionBids.length) {
      return null
    }

    const myBids = selectedAuctionBids
      .filter((bid) => Number(bid?.userId) === Number(currentUser.id))
      .map((bid) => Number(bid?.amount || 0))

    if (!myBids.length) {
      return null
    }

    return Math.max(...myBids)
  }, [currentUser, selectedAuctionBids])

  const isLeader = myTopBid !== null && Number(myTopBid) >= Number(maxBidAmount)

  const handleJoinAuction = async (auctionId) => {
    if (!currentUser?.id) {
      setError('No se encontro el usuario afiliado en sesion para unirse a la subasta.')
      return
    }

    const response = await runAction(() => joinAuction(auctionId, currentUser.id))
    if (response !== null) {
      setNotice('Te uniste a la subasta correctamente.')
      setSelectedAuctionId(String(auctionId))
      setSelectedBidAuctionId(String(auctionId))
      setParticipantAuctionIds((previous) => {
        const asString = String(auctionId)
        if (previous.includes(asString)) {
          return previous
        }

        setParticipationsCount(previous.length + 1)
        return [...previous, asString]
      })
      await fetchAuctionContext(auctionId)
    }
  }

  const handlePlaceBid = async () => {
    if (!selectedBidAuctionId) {
      setError('Selecciona una subasta para registrar la puja.')
      return
    }

    if (!currentUser?.id || !currentUser?.name) {
      setError('No se encontro el usuario afiliado en sesion para registrar la puja.')
      return
    }

    const nowMs = Date.now()
    if (nowMs - lastBidAtMs < bidCooldownMs) {
      const pendingSeconds = Math.ceil((bidCooldownMs - (nowMs - lastBidAtMs)) / 1000)
      setError(`Espera ${pendingSeconds}s antes de enviar otra puja para evitar limite de peticiones.`)
      return
    }

    const amount = Number(bidAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('El monto de puja debe ser mayor a 0.')
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const response = await placeAuctionBid(selectedBidAuctionId, {
        userId: currentUser.id,
        userName: currentUser.name,
        amount,
      })

      setLastBidAtMs(Date.now())
      setBidCooldownMs(5000)
      setNotice('Oferta confirmada correctamente.')
      setBidAmount('')
      setSelectedAuctionId(String(selectedBidAuctionId))
      setParticipantAuctionIds((previous) => {
        const asString = String(selectedBidAuctionId)
        return previous.includes(asString) ? previous : [...previous, asString]
      })
      setAuctions((previous) =>
        previous.map((auction) =>
          String(auction.id) === String(selectedBidAuctionId)
            ? {
                ...auction,
                currentOffer: Math.max(Number(auction.currentOffer || 0), amount),
              }
            : auction,
        ),
      )
      const createdBid = response?.data || response
      setSelectedAuctionBids((previous) => {
        if (createdBid && typeof createdBid === 'object' && !Array.isArray(createdBid)) {
          return [...previous, createdBid]
        }

        return [
          ...previous,
          {
            id: `LOCAL-${Date.now()}`,
            auctionId: Number(selectedBidAuctionId),
            userId: currentUser.id,
            userName: currentUser.name,
            amount,
            placedAt: new Date().toISOString(),
          },
        ]
      })
    } catch (apiError) {
      if (apiError?.response?.status === 429) {
        const retryAfterMs = parseRetryAfterMs(apiError)
        const nextCooldownMs = Math.max(5000, retryAfterMs)
        setBidCooldownMs(nextCooldownMs)
        setLastBidAtMs(Date.now())
        const waitSeconds = Math.max(1, Math.ceil(nextCooldownMs / 1000))
        setError(`Limite de peticiones por usuario excedido. Espera ${waitSeconds}s e intenta de nuevo.`)
        return
      }

      setError(extractErrorMessage(apiError))
    } finally {
      setActionLoading(false)
    }
  }

  const clockLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(clock),
    [clock],
  )

  return (
    <AffiliateShell active="auctions">
      <section className="affiliate-auctions-v2" aria-label="Centro de subastas afiliado">
        <header className="auctions-v2-head">
          <h2>Centro de Subastas</h2>
          <div className="auctions-v2-head-right">
            <span>{auctions.length} EN VIVO</span>
            <strong>{clockLabel}</strong>
          </div>
        </header>

        <section className="auctions-v2-metrics">
          <article>
            <small>Participaciones</small>
            <strong>{String(participationsCount).padStart(2, '0')}</strong>
            <p>Total historico</p>
          </article>
          <article>
            <small>Ganadas</small>
            <strong className="accent">{String(wonCount).padStart(2, '0')}</strong>
            <p>Subastas lider</p>
          </article>
        </section>

        <label className="auctions-v2-search" aria-label="Buscar subastas activas">
          <span className="material-symbols-outlined">search</span>
          <input
            placeholder="Buscar subastas por nombre de medicamento..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        {error ? <p className="auctions-alert">{error}</p> : null}
        {notice ? <p className="auctions-success">{notice}</p> : null}
        {loading ? <p className="auctions-loading">Sincronizando subastas...</p> : null}

        <div className="auctions-v2-grid">
          <section className="auctions-v2-list" aria-label="Subastas activas">
            <div className="auctions-v2-section-head">
              <h3>
                <span />
                {' '}Subastas Activas
              </h3>
              <small>{filteredAuctions.length} subastas disponibles</small>
            </div>

            <div className="auctions-v2-list-wrap">
              {filteredAuctions.length === 0 && !loading ? (
                <article className="auction-row-card empty">
                  <p>No hay subastas activas disponibles por el momento.</p>
                </article>
              ) : null}

              {filteredAuctions.map((auction, index) => {
                const isSelected = String(selectedAuctionId) === String(auction.id)
                const remainingSeconds = getAuctionRemainingSeconds(auction, clock)
                const isCritical = remainingSeconds < 300
                const rowCurrentOffer = Number(auction.currentOffer)
                const categoryTone = getCategoryTone(auction.category)
                const isJoined = participantAuctionIds.includes(String(auction.id))

                return (
                  <article key={auction.id} className={`auction-row-card${isSelected ? ' selected' : ''}`}>
                    <header>
                      <div>
                        <span className={`auction-chip ${categoryTone}`}>
                          {auction.category}{auction.urgency ? ` · ${auction.urgency}` : ''}
                        </span>
                        <h4>{auction.medicationName}</h4>
                        <p>{auction.lotLabel}</p>
                      </div>

                      <div className={`auction-time${isCritical ? ' critical' : ''}`}>
                        <strong>{formatRemainingTime(remainingSeconds)}</strong>
                        <small>{isCritical ? 'CIERRA PRONTO' : 'RESTANTES'}</small>
                      </div>
                    </header>

                    <div className="auction-row-body">
                      <div>
                        <small>Medicamento</small>
                        <strong>{auction.medicationName}</strong>
                      </div>
                      <div>
                        <small>Oferta base</small>
                        <strong>{formatCurrency(auction.basePrice)}</strong>
                      </div>
                      <div>
                        <small>Monto actual</small>
                        <strong>{formatCurrency(rowCurrentOffer)}</strong>
                      </div>
                    </div>

                    <footer>
                      {isJoined ? (
                        <button
                          type="button"
                          className="primary"
                          onClick={() => setSelectedAuctionId(String(auction.id))}
                          disabled={actionLoading}
                        >
                          Mejorar oferta
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => handleJoinAuction(auction.id)}
                          disabled={actionLoading}
                        >
                          Unirme a la subasta
                        </button>
                      )}
                    </footer>
                  </article>
                )
              })}
            </div>
          </section>

          <aside className="auctions-v2-side" aria-label="Panel de puja">
            <section className="participation-card">
              <header>
                <h4>Participando</h4>
                <span>{isParticipatingSelectedAuction ? selectedAuction?.status?.toLowerCase() || 'activa' : 'sin participacion'}</span>
              </header>

              <div className="participation-main">
                {isParticipatingSelectedAuction ? (
                  <>
                    <h5>{panelAuction?.medicationName || 'Selecciona una subasta'}</h5>
                    <div>
                      <small>Oferta base</small>
                      <strong>{formatCurrency(panelAuction?.basePrice || 0)}</strong>
                    </div>
                    <div>
                      <small>Mi oferta</small>
                      <strong>{formatCurrency(myTopBid || 0)}</strong>
                    </div>
                    <div>
                      <small>Detalle</small>
                      <strong>{selectedAuctionDetail?.closureType || 'Sin detalle'}</strong>
                    </div>
                    <div>
                      <small>Estado</small>
                      <strong className={isLeader ? 'leader' : 'regular'}>{isLeader ? 'Lider' : 'Pendiente'}</strong>
                    </div>
                  </>
                ) : (
                  <p className="participation-empty">Actualmente no esta participando en alguna subasta.</p>
                )}
              </div>
            </section>

            {participantAuctions.length > 0 ? (
              <section className="bid-panel-card">
                <h4>Hacer puja</h4>
                <p>{panelAuction ? `${panelAuction.medicationName} · ${panelAuction.lotLabel}` : 'Selecciona subasta'}</p>

                <label>
                  <span>Subasta</span>
                  <select
                    value={selectedBidAuctionId}
                    onChange={(event) => {
                      const nextAuctionId = String(event.target.value)
                      setSelectedBidAuctionId(nextAuctionId)
                      setSelectedAuctionId(nextAuctionId)
                    }}
                  >
                    {participantAuctions.map((auction) => (
                      <option key={auction.id} value={auction.id}>
                        {auction.medicationName} · Lote #{auction.id}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Monto (COP $)</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={bidAmount}
                    onChange={(event) => setBidAmount(event.target.value)}
                    placeholder="0"
                  />
                </label>

                <small>Minimo recomendado: {formatCurrency(Math.max(0, Number(maxBidAmount) + 1000))}</small>

                <button type="button" onClick={handlePlaceBid} disabled={actionLoading || !selectedBidAuctionId}>
                  <span className="material-symbols-outlined">monitoring</span>
                  {' '}Confirmar Oferta
                </button>

                <footer>
                  <span>Oferta actual:</span>
                  <strong>{formatCurrency(maxBidAmount)}</strong>
                </footer>
              </section>
            ) : null}

            <section className="bid-history-card">
              <h4>Ultimas pujas</h4>
              <div>
                {selectedAuctionBids.slice(0, 4).map((bid) => (
                  <article key={bid.id || `${bid.userId}-${bid.amount}-${bid.placedAt}`}>
                    <div>
                      <strong>{bid.userName || `Usuario #${bid.userId}`}</strong>
                      <small>{bid.placedAt || 'Sin fecha'}</small>
                    </div>
                    <span>{formatCurrency(bid.amount)}</span>
                  </article>
                ))}
                {selectedAuctionBids.length === 0 ? <p>Sin pujas registradas para esta subasta.</p> : null}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </AffiliateShell>
  )
}
