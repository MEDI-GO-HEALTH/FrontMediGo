export function isLikelyValidEmail(value) {
  const email = value.trim()
  if (email.length < 5 || email.length > 254) return false
  if (email.includes(' ')) return false

  const atIndex = email.indexOf('@')
  if (atIndex <= 0 || atIndex !== email.lastIndexOf('@') || atIndex === email.length - 1) {
    return false
  }

  const localPart = email.slice(0, atIndex)
  const domainPart = email.slice(atIndex + 1)

  if (!localPart || !domainPart) return false
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false
  if (!domainPart.includes('.')) return false
  if (domainPart.includes('..')) return false

  return true
}
