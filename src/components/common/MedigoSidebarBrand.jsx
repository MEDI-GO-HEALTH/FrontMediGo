import medigoLogo from '../../assets/Logo.png'

export default function MedigoSidebarBrand({
  containerClassName,
  logoContainerClassName,
  textContainerClassName,
  title = 'MediGo',
  subtitle = 'Clinical Logistics Unit',
  titleClassName,
  subtitleClassName,
  titleTag = 'h1',
  logoAlt = 'MediGo cross logo',
}) {
  const TitleTag = titleTag

  return (
    <div className={containerClassName}>
      <div className={logoContainerClassName}>
        <img
          src={medigoLogo}
          alt={logoAlt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
        />
      </div>
      <div className={textContainerClassName}>
        <TitleTag className={titleClassName}>{title}</TitleTag>
        <p className={subtitleClassName}>{subtitle}</p>
      </div>
    </div>
  )
}