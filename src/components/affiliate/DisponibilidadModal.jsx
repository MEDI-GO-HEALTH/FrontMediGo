/**
 * DisponibilidadModal.jsx — Modal de disponibilidad por sucursal (HU-04)
 *
 * Muestra la disponibilidad de un medicamento en todas las sucursales.
 * Se actualiza automáticamente (polling) sin recargar la página.
 *
 * Props:
 *  - medication: { medicationId, name, unit } — medicamento seleccionado (null = cerrado)
 *  - branches: [{ id, name }] — lista de sucursales para enriquecer la respuesta
 *  - selectedBranchId: number — sucursal activa en la página (se resalta en el listado)
 *  - onClose: () => void
 */

import useMedicationAvailability from '../../hooks/useMedicationAvailability'
import '../../styles/affiliate/disponibilidad.css'

const formatTimestamp = (date) => {
  if (!date) {
    return '—'
  }
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function AvailabilityBadge({ isAvailable, quantity }) {
  return isAvailable ? (
    <span className="disp-badge disp-badge--ok" aria-label="Disponible">
      <span className="material-symbols-outlined disp-badge-icon">check_circle</span>
      Disponible · {quantity} uds.
    </span>
  ) : (
    <span className="disp-badge disp-badge--no" aria-label="No disponible">
      <span className="material-symbols-outlined disp-badge-icon">cancel</span>
      No disponible
    </span>
  )
}

export default function DisponibilidadModal({ medication, branches, selectedBranchId, onClose }) {
  const { availability, isLoading, lastUpdated, isPolling, branchesWithStock, totalAvailable, refresh } =
    useMedicationAvailability(medication?.medicationId ?? null, branches)

  if (!medication) {
    return null
  }

  return (
    <div
      className="disp-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Disponibilidad de ${medication.name}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          onClose()
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="disp-modal">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="disp-header">
          <div className="disp-header-left">
            <span className="material-symbols-outlined disp-header-icon">inventory_2</span>
            <div>
              <h3 className="disp-title">{medication.name}</h3>
              <span className="disp-unit">{medication.unit}</span>
            </div>
          </div>
          <button type="button" className="disp-close" aria-label="Cerrar modal" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* ── Barra de estado de polling ──────────────────────────── */}
        <div className="disp-status-bar">
          <span className={`disp-pulse${isPolling ? ' active' : ''}`} aria-hidden="true" />
          <span className="disp-status-text">
            {isPolling ? 'Actualizando...' : `Última actualización: ${formatTimestamp(lastUpdated)}`}
          </span>
          <button
            type="button"
            className="disp-refresh-btn"
            aria-label="Refrescar disponibilidad"
            disabled={isLoading || isPolling}
            onClick={refresh}
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        {/* ── Resumen ─────────────────────────────────────────────── */}
        {!isLoading && availability.length > 0 ? (
          <div className="disp-summary">
            <div className="disp-summary-card disp-summary-card--ok">
              <span className="material-symbols-outlined">store</span>
              <span className="disp-summary-num">{branchesWithStock}</span>
              <span className="disp-summary-label">sucursal(es) con stock</span>
            </div>
            <div className="disp-summary-card disp-summary-card--total">
              <span className="material-symbols-outlined">inventory</span>
              <span className="disp-summary-num">{totalAvailable}</span>
              <span className="disp-summary-label">unidades totales</span>
            </div>
          </div>
        ) : null}

        {/* ── Lista de sucursales ──────────────────────────────────── */}
        <div className="disp-body">
          {isLoading ? (
            <div className="disp-loading" role="status" aria-label="Cargando disponibilidad">
              <span className="disp-spinner" aria-hidden="true" />
              <span>Consultando disponibilidad...</span>
            </div>
          ) : availability.length === 0 ? (
            <div className="disp-empty">
              <span className="material-symbols-outlined">search_off</span>
              <p>No se encontraron datos de disponibilidad</p>
            </div>
          ) : (
            <ul className="disp-list" role="list">
              {availability.map((item) => {
                const isSelected = Number(item.branchId) === Number(selectedBranchId)
                return (
                  <li
                    key={item.branchId}
                    className={`disp-item${isSelected ? ' disp-item--selected' : ''}`}
                    aria-current={isSelected ? 'location' : undefined}
                  >
                    <div className="disp-item-branch">
                      <span className="material-symbols-outlined disp-branch-icon">
                        {isSelected ? 'location_on' : 'storefront'}
                      </span>
                      <div>
                        <span className="disp-branch-name">{item.branchName}</span>
                        {isSelected ? <span className="disp-branch-tag">Sucursal seleccionada</span> : null}
                      </div>
                    </div>
                    <AvailabilityBadge isAvailable={item.isAvailable} quantity={item.quantity} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="disp-footer">
          <span className="material-symbols-outlined disp-footer-icon">schedule</span>
          <span>Los datos se actualizan automáticamente cada 15 segundos</span>
        </footer>
      </div>
    </div>
  )
}
