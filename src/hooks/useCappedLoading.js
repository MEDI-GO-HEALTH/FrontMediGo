import { useEffect, useState } from 'react'

export default function useCappedLoading(loading, maxMs = 3000) {
  const [visible, setVisible] = useState(Boolean(loading))

  useEffect(() => {
    const immediateId = globalThis.setTimeout(() => {
      setVisible(Boolean(loading))
    }, 0)

    if (!loading) {
      return () => {
        globalThis.clearTimeout(immediateId)
      }
    }

    const timeoutId = globalThis.setTimeout(() => {
      setVisible(false)
    }, maxMs)

    return () => {
      globalThis.clearTimeout(immediateId)
      globalThis.clearTimeout(timeoutId)
    }
  }, [loading, maxMs])

  return visible
}
