import { useEffect, useState } from 'react'

export default function useCappedLoading(loading, maxMs = 3000) {
  const [visible, setVisible] = useState(Boolean(loading))

  useEffect(() => {
    if (!loading) {
      setVisible(false)
      return undefined
    }

    setVisible(true)
    const timeoutId = globalThis.setTimeout(() => {
      setVisible(false)
    }, maxMs)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [loading, maxMs])

  return visible
}
