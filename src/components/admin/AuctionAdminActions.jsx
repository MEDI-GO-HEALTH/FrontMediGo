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
            <pre>{JSON.stringify(auctionDetail, null, 2)}</pre>
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
            <pre>{JSON.stringify(auctionBids, null, 2)}</pre>
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
            <pre>{JSON.stringify(auctionWinner, null, 2)}</pre>
          </article>
        ) : null}

        {selectedOption === 'ACTIVE' ? (
          <article className="endpoint-card compact">
            <header>
              <h4>Consultar subastas activas</h4>
            </header>
            <button type="button" onClick={handleGetActive} disabled={loading}>Consultar activas</button>
            <p>Total activas: {activeAuctions.length}</p>
            <pre>{JSON.stringify(activeAuctions, null, 2)}</pre>
          </article>
        ) : null}
      </div>
    </section>
  )
}
