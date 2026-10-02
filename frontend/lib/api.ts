// Cliente centralizado de API REST com suporte a Bearer JWT e auto-refresh de token SimpleJWT

const getBaseUrl = (): string => {
  const configured = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).replace(/\/$/, '')

  // Se o frontend estiver rodando em HTTPS no navegador e o backend for HTTP,
  // roteia através do proxy interno do Next.js para eliminar o bloqueio de Mixed Content
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:' && configured.startsWith('http://')) {
      return '/api/proxy'
    }
  }

  return configured
}

export class ApiError extends Error {
  status: number
  data: any

  constructor(status: number, message: string, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
  skipAuth?: boolean
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null

  try {
    const baseUrl = getBaseUrl()
    const refreshPath = baseUrl === '/api/proxy' ? '/api/token/refresh' : '/api/token/refresh/'
    const response = await fetch(`${baseUrl}${refreshPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Falha ao renovar token')
    }

    const data = await response.json()
    const newAccessToken = data.access

    if (newAccessToken) {
      localStorage.setItem('access_token', newAccessToken)
      return newAccessToken
    }
    return null
  } catch (err) {
    // Se o refresh token for inválido ou expirado, encerra a sessão
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_profile')
    return null
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = getBaseUrl()
  const { params, skipAuth = false, headers: customHeaders, ...fetchOptions } = options

  // Garante a barra inicial no endpoint
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  // Quando usando o proxy Next.js, remove a barra final para evitar 308 redirect do Next.js
  // O route handler do proxy se encarrega de recolocar a barra para o Django
  if (baseUrl === '/api/proxy' && path.endsWith('/') && path.length > 1) {
    path = path.slice(0, -1)
  }
  let url = `${baseUrl}${path}`

  // Monta Query Parameters caso fornecidos
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  }

  if (!skipAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  let response: Response

  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    })
  } catch (networkError: any) {
    throw new ApiError(0, `Falha de conexão com o servidor: ${networkError.message || networkError}`)
  }

  // Tratamento de expiração de token (401 Unauthorized)
  if (response.status === 401 && !skipAuth && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await refreshAccessToken()
        isRefreshing = false

        if (newToken) {
          onRefreshed(newToken)
          headers['Authorization'] = `Bearer ${newToken}`
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers,
          })
          if (retryResponse.status === 204) {
            return null as T
          }
          const retryData = await retryResponse.json().catch(() => null)
          if (!retryResponse.ok) {
            throw new ApiError(
              retryResponse.status,
              retryData?.detail || retryData?.erro || 'Erro na requisição',
              retryData
            )
          }
          return retryData as T
        } else {
          // Token inválido, redireciona para login se estiver em rota autenticada
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          throw new ApiError(401, 'Sessão expirada. Por favor, faça login novamente.')
        }
      } else {
        // Aguarda a renovação em andamento
        return new Promise<T>((resolve, reject) => {
          addRefreshSubscriber(async (newToken) => {
            try {
              headers['Authorization'] = `Bearer ${newToken}`
              const retryResponse = await fetch(url, {
                ...fetchOptions,
                headers,
              })
              if (retryResponse.status === 204) {
                return resolve(null as T)
              }
              const retryData = await retryResponse.json().catch(() => null)
              if (!retryResponse.ok) {
                return reject(
                  new ApiError(
                    retryResponse.status,
                    retryData?.detail || retryData?.erro || 'Erro na requisição',
                    retryData
                  )
                )
              }
              resolve(retryData as T)
            } catch (err) {
              reject(err)
            }
          })
        })
      }
    }
  }

  if (response.status === 204) {
    return null as T
  }

  const responseData = await response.json().catch(() => null)

  if (!response.ok) {
    let errorMessage = 'Ocorreu um erro no servidor.'
    if (responseData) {
      if (typeof responseData === 'string') {
        errorMessage = responseData
      } else if (responseData.detail) {
        errorMessage = responseData.detail
      } else if (responseData.erro || responseData.Erro || responseData.mensagem || responseData.Mensagem) {
        errorMessage = responseData.erro || responseData.Erro || responseData.mensagem || responseData.Mensagem
      } else {
        // Extrai o primeiro erro dos campos
        const firstKey = Object.keys(responseData)[0]
        if (firstKey && Array.isArray(responseData[firstKey])) {
          errorMessage = `${firstKey}: ${responseData[firstKey][0]}`
        }
      }
    }
    throw new ApiError(response.status, errorMessage, responseData)
  }

  return responseData as T
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}

export default api
