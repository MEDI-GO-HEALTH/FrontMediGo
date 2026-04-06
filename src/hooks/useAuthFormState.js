import { useState } from 'react'

export function useAuthFormState(initialForm) {
  const [form, setForm] = useState(initialForm)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleBlur = (e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }))
  }

  return {
    form,
    setForm,
    showPass,
    setShowPass,
    loading,
    setLoading,
    error,
    setError,
    touched,
    setTouched,
    handleChange,
    handleBlur,
  }
}
