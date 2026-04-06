import { useEffect, useMemo, useState } from 'react'
import AffiliateShell from '../../components/layout/AffiliateShell'
import { getSubastas } from '../../api/subastaService'
import '../../styles/affiliate/perfil-afiliado.css'
import '../../styles/affiliate/centro-subastas.css'

const FALLBACK_DASHBOARD = {
  partnerName: 'Farmaceutica Central',
  stats: {
    participations: 24,
    won: 8,
  },
  activeAuctions: [
    {
      id: 'EPS-COL-2023-882',
      name: 'Insulina Glargina 100 UI/mL',
      category: 'FRIO',
      currentBid: 12450000,
      quantity: '2,500 Unid.',
      timeLeft: '02:14:55',
      skin: 'aqua',
    },
    {
      id: 'EPS-COL-2023-901',
      name: 'Amoxicilina + Clavulanico 875mg',
      category: 'ESTANDAR',
      currentBid: 8120000,
      quantity: '10,000 Unid.',
      timeLeft: '00:45:12',
      skin: 'map',
    },
  ],
  featuredAuction: {
    name: 'Suministro Oncologico Especializado Trimestral',
    context: 'Urgencia Hospitalaria',
    description:
      'Complejo hospitalario nivel 4 requiere abastecimiento de farmacos oncologicos de alta complejidad para el Q4.',
    baseOffer: 342900000,
    leader: true,
  },
  history: [
    {
      id: 'H-01',
      icon: 'inventory_2',
      title: 'Paracetamol 500mg - Caja x100',
      detail: 'Finalizada hace 2 dias - EPS Sanitas',
      amount: 5400000,
      result: 'NO GANADA',
      tone: 'lost',
    },
    {
      id: 'H-02',
      icon: 'vaccines',
      title: 'Kit de Vacunacion Influenza (1000u)',
      detail: 'Finalizada hace 5 dias - EPS Sura',
      amount: 18920000,
      result: 'GANADA',
      tone: 'won',
    },
    {
      id: 'H-03',
      icon: 'fire_extinguisher',
      title: 'Compresas Gasa Esteril 10x10',
      detail: 'Finalizada hace 1 semana - Hospital Militar',
      amount: 1200000,
      result: 'GANADA',
      tone: 'won',
    },
  ],
  insight: {
    title: 'Analisis de Mercado',
    text: 'Las ofertas de farmacos para hipertension han bajado un 12% este mes. Es un buen momento para diversificar inventario.',
    progress: 75,
  },
  upcomingClosings: [
    {
      id: 'U-01',
      day: '12',
      month: 'OCT',
      name: 'Antibioticos Pediatricos',
      owner: 'Licitacion Nacional',
    },
    {
      id: 'U-02',
      day: '15',
      month: 'OCT',
      name: 'Material de Osteosintesis',
      owner: 'EPS Sanitas Regional',
    },
  ],
}

const FALLBACK_AUCTIONS = [
  {
    id: 'AUC-1023',
    nombre: 'Insulina Glargina 100 UI/mL',
    montoActual: 12450000,
    cantidad: '2,500 Unid.',
    tiempoRestante: '02:40:00',
    categoria: 'FRIO',
  },
  {
    id: 'AUC-0991',
    nombre: 'Amoxicilina 500mg',
    montoActual: 8750000,
    cantidad: '1,800 Unid.',
    tiempoRestante: '01:10:00',
    categoria: 'ESTANDAR',
  },
  {
    id: 'AUC-0930',
    nombre: 'Dipirona 500mg',
    montoActual: 5200000,
    cantidad: '1,100 Unid.',
    tiempoRestante: '03:55:00',
    categoria: 'ESTANDAR',
  },
]

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const normalizeCategory = (category) => {
  const raw = String(category || '').toLowerCase()
  if (raw.includes('frio')) {
    return 'FRIO'
  }

  if (raw.includes('premium') || raw.includes('urgente')) {
    return 'PREMIUM'
  }

  return 'ESTANDAR'
}

const getAuctionSkin = (index) => {
  if (index === 0) {
    return 'aqua'
  }

  if (index === 1) {
    return 'map'
  }

  return 'capsule'
}

const mapApiAuction = (item, index) => ({
  id: item?.id || item?.codigo || `AUC-${String(index + 1).padStart(3, '0')}`,
  name: item?.nombre || item?.medicamento || item?.titulo || 'Subasta en vivo',
  category: normalizeCategory(item?.categoria || item?.tipo),
  currentBid: Number(item?.montoActual || item?.ofertaActual || item?.precioBase || 0),
  quantity: item?.cantidadTexto || item?.cantidad || 'Disponible',
  timeLeft: item?.tiempoRestante || item?.cierre || '00:30:00',
  skin: getAuctionSkin(index),
})

export default function CentroSubastas() {
  const [dashboard, setDashboard] = useState(FALLBACK_DASHBOARD)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        const response = await getSubastas({ estado: 'ACTIVA' })
        const list = Array.isArray(response) ? response : response?.data

        if (!mounted || !Array.isArray(list) || list.length === 0) {
          return
        }

        const mapped = list.map((item, index) => mapApiAuction(item, index))
        const [first, second, ...rest] = mapped

        const featuredSource = rest[0] || second || first
        const featuredAuction = {
          name: featuredSource?.name || FALLBACK_DASHBOARD.featuredAuction.name,
          context: 'Urgencia Hospitalaria',
          description: FALLBACK_DASHBOARD.featuredAuction.description,
          baseOffer: featuredSource?.currentBid || FALLBACK_DASHBOARD.featuredAuction.baseOffer,
          leader: true,
        }

        setDashboard((previous) => ({
          ...previous,
          activeAuctions: [first, second].filter(Boolean),
          featuredAuction,
        }))
      } catch {
        if (mounted) {
          setError('No se pudo sincronizar con el backend. Mostrando datos de respaldo.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      mounted = false
    }
  }, [])

  const filteredAuctions = useMemo(() => {
    const query = search.trim().toLowerCase()
    const source =
      dashboard.activeAuctions.length > 0
        ? dashboard.activeAuctions
        : FALLBACK_AUCTIONS.map((item, index) => mapApiAuction(item, index))

    return source.filter((item) => {
      const bySearch = !query || `${item.id} ${item.name}`.toLowerCase().includes(query)
      const byFilter =
        filter === 'ALL' ||
        (filter === 'FRIO' && item.category === 'FRIO') ||
        (filter === 'ESTANDAR' && item.category === 'ESTANDAR') ||
        (filter === 'PREMIUM' && item.category === 'PREMIUM')
      return bySearch && byFilter
    })
  }, [dashboard.activeAuctions, filter, search])

  return (
    <AffiliateShell active="auctions">
      <section className="affiliate-auctions-page" aria-label="Centro de subastas">
        <header className="affiliate-auctions-hero">
          <div>
            <h2 className="affiliate-auctions-title">Centro de Subastas</h2>
            <p className="affiliate-auctions-subtitle">
              Bienvenido de nuevo, <strong>{dashboard.partnerName}</strong>.
            </p>
          </div>

          <div className="affiliate-auctions-stats" aria-label="Resumen de rendimiento">
            <article className="metric-card">
              <p>Participaciones</p>
              <strong>{dashboard.stats.participations}</strong>
            </article>
            <article className="metric-card">
              <p>Ganadas</p>
              <strong className="success">{String(dashboard.stats.won).padStart(2, '0')}</strong>
            </article>
          </div>
        </header>

        <section className="live-auctions" aria-label="Subastas activas en vivo">
          <div className="live-auctions-head">
            <h3>
              <span className="material-symbols-outlined">bolt</span>
              {' '}Subastas Activas en Vivo
            </h3>

            <div className="live-auctions-tools">
              <label className="live-search" aria-label="Buscar subastas">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="Buscar subastas..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <div className="live-filters" role="tablist" aria-label="Filtro de subastas">
                {['ALL', 'FRIO', 'ESTANDAR', 'PREMIUM'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={filter === item}
                    className={filter === item ? 'active' : ''}
                    onClick={() => setFilter(item)}
                  >
                    {item === 'ALL' ? 'TODAS' : item}
                  </button>
                ))}
              </div>
              <span className="live-badge">EN TIEMPO REAL</span>
            </div>
          </div>

          {error ? <p className="auctions-alert">{error}</p> : null}
          {loading ? <p className="auctions-loading">Sincronizando subastas...</p> : null}

          <div className="live-auctions-grid">
            {filteredAuctions.map((auction) => (
              <article key={auction.id} className="auction-card" aria-label={`Subasta ${auction.name}`}>
                <div className={`auction-card-visual ${auction.skin}`} aria-hidden="true">
                  <div className="auction-live-timer">
                    <span />
                    {' '}{auction.timeLeft}
                  </div>
                </div>

                <div className="auction-card-body">
                  <div className="auction-card-head">
                    <div>
                      <h4>{auction.name}</h4>
                      <p>Lote: {auction.id}</p>
                    </div>
                    <span>{auction.category}</span>
                  </div>

                  <div className="auction-price-box">
                    <div>
                      <small>Oferta Actual</small>
                      <strong>{formatCurrency(auction.currentBid)}</strong>
                    </div>
                    <div className="right">
                      <small>Cantidad</small>
                      <strong>{auction.quantity}</strong>
                    </div>
                  </div>

                  <button type="button" className="auction-bid-btn">
                    Pujar Ahora{' '}
                    <span className="material-symbols-outlined">trending_up</span>
                  </button>
                </div>
              </article>
            ))}

            <article className="auction-card-featured" aria-label="Subasta destacada">
              <div className="featured-pill-row">
                <span className="featured-pill">Premium</span>
                <p>{dashboard.featuredAuction.context}</p>
              </div>

              <h4>{dashboard.featuredAuction.name}</h4>
              <p className="featured-description">{dashboard.featuredAuction.description}</p>

              <div className="featured-offer">
                <div>
                  <small>Oferta Base</small>
                  <strong>{formatCurrency(dashboard.featuredAuction.baseOffer)}</strong>
                </div>
                {dashboard.featuredAuction.leader ? <span>SU OFERTA ES LIDER</span> : null}
              </div>

              <button type="button" className="featured-improve-btn">
                Mejorar Oferta{' '}
                <span className="material-symbols-outlined">edit</span>
              </button>
            </article>
          </div>
        </section>

        <section className="auction-bottom-layout" aria-label="Historial y analitica">
          <div className="auction-history-wrap">
            <div className="auction-section-head">
              <h3>Historial de Participacion</h3>
              <button type="button">Ver todo</button>
            </div>

            <div className="auction-history-list">
              {dashboard.history.map((entry) => (
                <article key={entry.id} className="history-row">
                  <div className="history-left">
                    <div className="history-icon">
                      <span className="material-symbols-outlined">{entry.icon}</span>
                    </div>
                    <div>
                      <h4>{entry.title}</h4>
                      <p>{entry.detail}</p>
                    </div>
                  </div>

                  <div className="history-right">
                    <strong>{formatCurrency(entry.amount)}</strong>
                    <span className={entry.tone === 'won' ? 'won' : 'lost'}>{entry.result}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="auction-side-insights" aria-label="Panel lateral">
            <article className="insight-card">
              <h4>{dashboard.insight.title}</h4>
              <p>{dashboard.insight.text}</p>
              <div className="insight-progress-track" role="img" aria-label={`Progreso ${dashboard.insight.progress}%`}>
                <span style={{ width: `${dashboard.insight.progress}%` }} />
              </div>
              <small>Optimizacion de puja: {dashboard.insight.progress}%</small>
            </article>

            <article className="closing-card">
              <h4>Proximos Cierres</h4>
              <div className="closing-list">
                {dashboard.upcomingClosings.map((closing) => (
                  <div key={closing.id} className="closing-item">
                    <div className="closing-date">
                      <strong>{closing.day}</strong>
                      <span>{closing.month}</span>
                    </div>
                    <div>
                      <p>{closing.name}</p>
                      <small>{closing.owner}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </section>
    </AffiliateShell>
  )
}
