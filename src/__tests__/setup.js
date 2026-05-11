import '@testing-library/jest-dom'

// localStorage mock para el entorno de pruebas
const localStorageStore = {}
const localStorageMock = {
  getItem: (key) => localStorageStore[key] ?? null,
  setItem: (key, value) => { localStorageStore[key] = String(value) },
  removeItem: (key) => { delete localStorageStore[key] },
  clear: () => Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]),
  get length() { return Object.keys(localStorageStore).length },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})
