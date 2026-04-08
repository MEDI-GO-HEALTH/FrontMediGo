import '../../styles/common/page-loading-overlay.css'

export default function PageLoadingOverlay({ visible, message = 'Cargando datos...' }) {
  if (!visible) {
    return null
  }

  return (
    <div className="page-loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="page-loading-overlay-card">
        <span className="material-symbols-outlined page-loading-overlay-icon">progress_activity</span>
        <p>{message}</p>
      </div>
    </div>
  )
}
