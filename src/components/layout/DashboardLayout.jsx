import Sidebar from './Sidebar'

export default function DashboardLayout({ children, title, subtitle, actions }) {
  return (
    <div style={styles.wrapper}>
      <Sidebar />
      <div style={styles.main}>
        {(title || actions) && (
          <header style={styles.header}>
            <div>
              {title    && <h1 style={styles.title}>{title}</h1>}
              {subtitle && <p  style={styles.subtitle}>{subtitle}</p>}
            </div>
            {actions && <div style={styles.headerActions}>{actions}</div>}
          </header>
        )}
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--surface)',
  },
  main: {
    marginLeft: 260,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: `var(--gradient-glow), var(--surface)`,
  },
  header: {
    padding: '2rem 2.5rem 1rem',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    borderBottom: '1px solid rgba(74,68,85,0.2)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--on-surface)',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '0.88rem',
    color: 'var(--on-surface-variant)',
    marginTop: '0.25rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  content: {
    padding: '2rem 2.5rem',
    flex: 1,
  },
}
