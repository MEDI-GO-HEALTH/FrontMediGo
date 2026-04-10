/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import {
  getActiveAuctions,
  getAuctionBids,
  getAuctionById,
  getAuctionWinner,
  placeAuctionBid,
  updateAuction,
} from '../../api/subastaService'

const toDateTimeLocal = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  const value = new Date(dateValue)
  if (Number.isNaN(value.getTime())) {
    return ''
  }

  const offset = value.getTimezoneOffset() * 60 * 1000
  const local = new Date(value.getTime() - offset)
  return local.toISOString().slice(0, 16)
}

const normalizeApiData = (source) => source?.data || source

const toApiLocalDateTime = (dateTimeLocalValue) => {
  if (!dateTimeLocalValue) {
    return null
  }

  return `${dateTimeLocalValue}:00`
}

const buildEditFormFromDetail = (detail) => ({
  basePrice: Number(detail?.basePrice ?? detail?.precioBase ?? 0),
  startTime: toDateTimeLocal(detail?.startTime || detail?.inicio),
  endTime: toDateTimeLocal(detail?.endTime || detail?.fin),
})

export default function AuctionAdminActions({ initialAuctionId = '', onNotice }) {
  const [auctionId, setAuctionId] = useState(String(initialAuctionId || ''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [auctionDetail, setAuctionDetail] = useState(null)
  const [auctionBids, setAuctionBids] = useState([])
  const [auctionWinner, setAuctionWinner] = useState(null)
  const [activeAuctions, setActiveAuctions] = useState([])

  const [editForm, setEditForm] = useState({
    basePrice: 0,
    startTime: '',
    endTime: '',
  })

  const [selectedOption, setSelectedOption] = useState('DETAIL')
  const [bidUserId, setBidUserId] = useState('')
  const [bidUserName, setBidUserName] = useState('')
  const [bidAmount, setBidAmount] = useState('')

  useEffect(() => {
    setAuctionId(String(initialAuctionId || ''))
  }, [initialAuctionId])

  const hasAuctionId = useMemo(() => Boolean(String(auctionId).trim()), [auctionId])

  const runAction = async (fn, successMessage) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await fn()
      if (successMessage) {
        onNotice?.(successMessage)
      }
      return result
    } catch (actionError) {
      const errorCode = actionError?.response?.data?.errorCode
      const details = actionError?.response?.data?.details
      const backendMessage =
        actionError?.response?.data?.message ||
        actionError?.response?.data?.error ||
        'No fue posible completar la operacion en backend.'
      const normalizedMessage = [backendMessage, errorCode ? `(${errorCode})` : '', details || '']
        .filter(Boolean)
        .join(' ')
      setError(normalizedMessage)
      setSuccess('')
      return null
    } finally {
      setLoading(false)
    }
  }

  const validateAuctionId = () => {
    if (!hasAuctionId) {
      setError('Debes ingresar el ID de la subasta para ejecutar esta accion.')
      return false
    }

    return true
  }

  const handleGetById = async () => {
    if (!validateAuctionId()) {
      return
    }

    const response = await runAction(
      () => getAuctionById(String(auctionId).trim()),
      'Detalle de subasta cargado correctamente.',
    )

    const detail = normalizeApiData(response)
    if (detail) {
      setAuctionDetail(detail)
      setEditForm(buildEditFormFromDetail(detail))
    }
  }

  const handleUpdateAuction = async (event) => {
    event.preventDefault()
    if (!validateAuctionId()) {
      return
    }

    if (new Date(editForm.endTime) <= new Date(editForm.startTime)) {
      setError('La fecha/hora de fin debe ser posterior a la fecha/hora de inicio.')
      return
    }

    const payload = {
      basePrice: Number(editForm.basePrice),
      startTime: toApiLocalDateTime(editForm.startTime),
      endTime: toApiLocalDateTime(editForm.endTime),
    }

    const response = await runAction(
      () => updateAuction(String(auctionId).trim(), payload),
      'Subasta actualizada correctamente.',
    )

    const detail = normalizeApiData(response)
    if (detail) {
      setAuctionDetail(detail)
    }

    if (response !== null) {
      setSuccess('Subasta modificada correctamente.')
    }
  }

  const handleGetBids = async () => {
    if (!validateAuctionId()) {
      return
    }

    const response = await runAction(
      () => getAuctionBids(String(auctionId).trim()),
      'Historial de pujas cargado correctamente.',
    )

    const bids = normalizeApiData(response)
    setAuctionBids(Array.isArray(bids) ? bids : [])
  }

  const handlePlaceBid = async () => {
    if (!validateAuctionId()) {
      return
    }

    const numericUserId = Number(bidUserId)
    const numericAmount = Number(bidAmount)
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      setError('El userId de la puja debe ser mayor a 0.')
      return
    }

    if (!String(bidUserName).trim()) {
      setError('El userName de la puja es obligatorio.')
      return
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('El valor de la puja debe ser mayor a 0.')
      return
    }

    await runAction(
      () => placeAuctionBid(String(auctionId).trim(), {
        userId: numericUserId,
        userName: String(bidUserName).trim(),
        amount: numericAmount,
      }),
      'Puja registrada correctamente.',
    )
  }

  const handleGetWinner = async () => {
    if (!validateAuctionId()) {
      return
    }

    const response = await runAction(
      () => getAuctionWinner(String(auctionId).trim()),
      'Ganador de subasta cargado correctamente.',
    )

    const winner = normalizeApiData(response)
    setAuctionWinner(winner || null)
  }

  const handleGetActive = async () => {
    const response = await runAction(
      () => getActiveAuctions(),
      'Listado de subastas activas cargado correctamente.',
    )

    const source = normalizeApiData(response)
    setActiveAuctions(Array.isArray(source) ? source : [])
  }

  return (
    <section className="auction-admin-actions" aria-label="Panel de operaciones de subastas">
      <div className="auction-admin-actions-header">
        <h3>Otras opciones</h3>
        <p>Selecciona una accion para administrar subastas desde el frontend.</p>
      </div>

      <div className="auction-admin-id-row">
        <label>
          <span>Auction ID</span>
          <input
            value={auctionId}
            onChange={(event) => setAuctionId(event.target.value)}
            placeholder="Ej: 123 o UUID"
          />
        </label>
        <button type="button" onClick={handleGetById} disabled={loading}>
          Obtener por ID
        </button>
      </div>

      {success ? <p className="auction-admin-success">{success}</p> : null}
      {error ? <p className="auction-admin-error">{error}</p> : null}

      <div className="auction-admin-options-row">
        <label>
          <span>Menu de opciones</span>
          <select value={selectedOption} onChange={(event) => setSelectedOption(event.target.value)}>
            <option value="DETAIL">Consultar detalle de subasta</option>
            <option value="UPDATE">Modificar subasta</option>
            <option value="BIDS">Consultar pujas por subasta</option>
            <option value="PLACE_BID">Registrar nueva puja</option>
            <option value="WINNER">Consultar ganador de subasta</option>
            <option value="ACTIVE">Consultar subastas activas</option>
          </select>
        </label>
      </div>

      <div className="auction-admin-grid">
        {selectedOption === 'DETAIL' ? (
          <article className="endpoint-card compact">
            <header>
              <h4>Consultar detalle de subasta</h4>
            </header>
            <button type="button" onClick={handleGetById} disabled={loading || !hasAuctionId}>Consultar</button>
            {auctionDetail ? (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field">
                    <span>ID</span>
                    <p>{auctionDetail?.id || auctionDetail?.codigo || 'N/A'}</p>
                  </div>
                  <div className="detail-field">
                    <span>Medicamento</span>
                    <p>{auctionDetail?.medicationName || auctionDetail?.nombre || 'N/A'}</p>
                  </div>
                  <div className="detail-field">
                    <span>Lote</span>
                    <p>{auctionDetail?.lote || auctionDetail?.batch || 'N/A'}</p>
                  </div>
                  <div className="detail-field">
                    <span>Estado</span>
                    <p className={`status-badge status-${(auctionDetail?.status || auctionDetail?.estado || '').toLowerCase()}`}>
                      {auctionDetail?.status || auctionDetail?.estado || 'N/A'}
                    </p>
                  </div>
                  <div className="detail-field">
                    <span>Precio Base</span>
                    <p className="currency">${(Number(auctionDetail?.basePrice ?? auctionDetail?.precioBase ?? 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="detail-field">
                    <span>Precio Actual</span>
                    <p className="currency">${(Number(auctionDetail?.montoActual ?? auctionDetail?.currentPrice ?? 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="detail-field">
                    <span>Inicio</span>
                    <p>{auctionDetail?.startTime ? new Date(auctionDetail.startTime).toLocaleString('es-CO') : 'N/A'}</p>
                  </div>
                  <div className="detail-field">
                    <span>Fin</span>
                    <p>{auctionDetail?.endTime ? new Date(auctionDetail.endTime).toLocaleString('es-CO') : 'N/A'}</p>
                  </div>
                  <div className="detail-field">
                    <span>Tipo Cierre</span>
                    <p>{auctionDetail?.closureType || auctionDetail?.tipoCierre || 'N/A'}</p>
                  </div>
                  <div className="detail-field">
                    <span>ID Sede</span>
                    <p>{auctionDetail?.branchId || auctionDetail?.sedeId || 'N/A'}</p>
                  </div>
                  <div className="detail-field">
                    <span>ID Medicamento</span>
                    <p>{auctionDetail?.medicationId || auctionDetail?.medicamentoId || 'N/A'}</p>
                  </div>
                  {auctionDetail?.maxPrice ? (
                    <div className="detail-field">
                      <span>Precio Máximo</span>
                      <p className="currency">${(Number(auctionDetail.maxPrice) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  ) : null}
                  {auctionDetail?.inactivityMinutes ? (
                    <div className="detail-field">
                      <span>Minutos Inactividad</span>
                      <p>{auctionDetail.inactivityMinutes}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No hay datos. Presiona "Consultar" para cargar.</p>
              </div>
            )}
          </article>
        ) : null}

        {selectedOption === 'UPDATE' ? (
          <article className="endpoint-card">
            <header>
              <h4>Modificar subasta</h4>
              <button type="button" onClick={handleGetById} disabled={loading || !hasAuctionId}>Cargar datos</button>
            </header>

            <form onSubmit={handleUpdateAuction} className="endpoint-form-grid">
              <label>
                <span>Base Price</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={editForm.basePrice}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, basePrice: Number(event.target.value) }))}
                  required
                />
              </label>

              <label>
                <span>Start Time</span>
                <input
                  type="datetime-local"
                  value={editForm.startTime}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, startTime: event.target.value }))}
                  required
                />
              </label>

              <label>
                <span>End Time</span>
                <input
                  type="datetime-local"
                  value={editForm.endTime}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, endTime: event.target.value }))}
                  required
                />
              </label>

              <footer>
                <button type="submit" disabled={loading || !hasAuctionId}>Guardar cambios</button>
              </footer>
            </form>
          </article>
        ) : null}

        {selectedOption === 'BIDS' ? (
          <article className="endpoint-card compact">
            <header>
              <h4>Consultar pujas por subasta</h4>
            </header>
            <button type="button" onClick={handleGetBids} disabled={loading || !hasAuctionId}>Consultar pujas</button>
            {Array.isArray(auctionBids) && auctionBids.length > 0 ? (
              <div className="bids-view">
                <div className="bids-summary">
                  <p><strong>Total de pujas:</strong> {auctionBids.length}</p>
                  {auctionBids.length > 0 && (
                    <>
                      <p><strong>Puja más alta:</strong> ${(Math.max(...auctionBids.map(b => Number(b?.amount ?? b?.monto ?? 0))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</p>
                      <p><strong>Puja más baja:</strong> ${(Math.min(...auctionBids.map(b => Number(b?.amount ?? b?.monto ?? 0))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</p>
                    </>
                  )}
                </div>
                <table className="bids-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Usuario</th>
                      <th>ID Usuario</th>
                      <th>Monto</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auctionBids.map((bid, idx) => (
                      <tr key={`bid-${bid?.userId}-${idx}`}>
                        <td>{idx + 1}</td>
                        <td>{bid?.userName || bid?.nombreUsuario || 'N/A'}</td>
                        <td>{bid?.userId || bid?.usuarioId || 'N/A'}</td>
                        <td className="currency">${(Number(bid?.amount ?? bid?.monto ?? 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{bid?.timestamp || bid?.fecha ? new Date(bid.timestamp || bid.fecha).toLocaleString('es-CO') : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No hay pujas registradas para esta subasta.</p>
              </div>
            )}
          </article>
        ) : null}

        {selectedOption === 'PLACE_BID' ? (
          <article className="endpoint-card compact">
            <header>
              <h4>Registrar nueva puja</h4>
            </header>
            <label>
              <span>User ID</span>
              <input
                type="number"
                min="1"
                value={bidUserId}
                onChange={(event) => setBidUserId(event.target.value)}
                placeholder="ID del usuario"
              />
            </label>
            <label>
              <span>User Name</span>
              <input
                value={bidUserName}
                onChange={(event) => setBidUserName(event.target.value)}
                placeholder="Nombre de usuario"
              />
            </label>
            <label>
              <span>Amount</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={bidAmount}
                onChange={(event) => setBidAmount(event.target.value)}
                placeholder="Monto de puja"
              />
            </label>
            <button type="button" onClick={handlePlaceBid} disabled={loading || !hasAuctionId}>Registrar puja</button>
          </article>
        ) : null}

        {selectedOption === 'WINNER' ? (
          <article className="endpoint-card compact">
            <header>
              <h4>Consultar ganador de subasta</h4>
            </header>
            <button type="button" onClick={handleGetWinner} disabled={loading || !hasAuctionId}>Consultar ganador</button>
            {auctionWinner ? (
              <div className="winner-view">
                <div className="winner-card">
                  <div className="winner-badge">👑</div>
                  <div className="winner-info">
                    <h5>Ganador</h5>
                    <p className="winner-name">{auctionWinner?.winnerName || auctionWinner?.userName || auctionWinner?.nombreUsuario || 'N/A'}</p>
                    <div className="winner-details">
                      <div className="detail-item">
                        <span>ID Usuario</span>
                        <span>{auctionWinner?.winnerId || auctionWinner?.userId || auctionWinner?.usuarioId || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span>Monto Ganador</span>
                        <span className="currency">${(Number(auctionWinner?.winningAmount ?? auctionWinner?.montoGanador ?? 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {auctionWinner?.winTime || auctionWinner?.fechaGano ? (
                        <div className="detail-item">
                          <span>Hora de Victoria</span>
                          <span>{new Date(auctionWinner.winTime || auctionWinner.fechaGano).toLocaleString('es-CO')}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No hay ganador registrado para esta subasta.</p>
              </div>
            )}
          </article>
        ) : null}

        {selectedOption === 'ACTIVE' ? (
          <article className="endpoint-card compact">
            <header>
              <h4>Consultar subastas activas</h4>
            </header>
            <button type="button" onClick={handleGetActive} disabled={loading}>Consultar activas</button>
            {Array.isArray(activeAuctions) && activeAuctions.length > 0 ? (
              <div className="active-auctions-view">
                <div className="auctions-summary">
                  <p><strong>Total de subastas activas:</strong> {activeAuctions.length}</p>
                </div>
                <table className="auctions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Medicamento</th>
                      <th>Lote</th>
                      <th>Estado</th>
                      <th>Precio Base</th>
                      <th>Precio Actual</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAuctions.map((auction, idx) => (
                      <tr key={`auction-${auction?.id || idx}`}>
                        <td className="id-cell">{auction?.id || auction?.codigo || 'N/A'}</td>
                        <td>{auction?.medicationName || auction?.nombre || 'N/A'}</td>
                        <td>{auction?.lote || auction?.batch || 'N/A'}</td>
                        <td>
                          <span className={`status-badge status-${(auction?.status || auction?.estado || '').toLowerCase()}`}>
                            {auction?.status || auction?.estado || 'N/A'}
                          </span>
                        </td>
                        <td className="currency">${(Number(auction?.basePrice ?? auction?.precioBase ?? 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="currency">${(Number(auction?.montoActual ?? auction?.currentPrice ?? 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{auction?.startTime ? new Date(auction.startTime).toLocaleString('es-CO') : 'N/A'}</td>
                        <td>{auction?.endTime ? new Date(auction.endTime).toLocaleString('es-CO') : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No hay subastas activas en este momento.</p>
              </div>
            )}
          </article>
        ) : null}
      </div>
    </section>
  )
}
