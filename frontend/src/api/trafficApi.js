import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
})

export const fetchCombined   = () => api.get('/combined').then(r => r.data)
export const fetchTraffic    = () => api.get('/traffic').then(r => r.data)
export const fetchSignal     = () => api.get('/signal').then(r => r.data)
export const fetchEmergency  = () => api.get('/emergency').then(r => r.data)
export const fetchRoute      = () => api.get('/route').then(r => r.data)
export const switchScenario  = (name) => api.post(`/scenario/${name}`).then(r => r.data)
export const uploadImage     = (formData) => api.post('/upload/image', formData).then(r => r.data)

export default api
