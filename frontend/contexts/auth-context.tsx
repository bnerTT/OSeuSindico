'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import type { AuthTokens, LoginCredentials, UserProfile } from '@/lib/types'

export type UserRole = 'admin' | 'morador'

export interface AuthUser {
  id?: number
  username: string
  nome?: string
  apartamento?: string
  cpf?: string
  data_nascimento?: string
  is_staff: boolean
}

interface AuthContextType {
  user: AuthUser | null
  role: UserRole | null
  isAdmin: boolean
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<{ role: UserRole; redirectTo: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setRole(null)
      setIsLoading(false)
      return
    }

    try {
      // 1. Tenta obter perfil como morador autenticado
      try {
        const moradorProfile = await api.get<UserProfile>('/api/moradores/me/')
        const savedUsername =
          localStorage.getItem('saved_username') ||
          (moradorProfile.apartamento ? `Morador ${moradorProfile.apartamento}` : 'Morador')

        const authUserData: AuthUser = {
          id: moradorProfile.id,
          username: savedUsername,
          nome: moradorProfile.nome || savedUsername,
          apartamento: moradorProfile.apartamento,
          cpf: moradorProfile.cpf,
          data_nascimento: moradorProfile.data_nascimento,
          is_staff: false,
        }
        setUser(authUserData)
        setRole('morador')
        localStorage.setItem('user_role', 'morador')
        localStorage.setItem('user_profile', JSON.stringify(authUserData))
        return
      } catch (err: any) {
        // Se deu 401, a sessão expirou
        if (err.status === 401) {
          throw err
        }
        // Se deu 404, o usuário não tem perfil de morador vinculado. Verifica se tem permissão Staff.
      }

      // 2. Valida se o usuário tem permissão de Administrador / Portaria (IsAdminUser no Django)
      try {
        await api.get('/veiculos/?page=1')
        // Sucesso: possui permissão de Staff / Administrador
        const savedUsername = localStorage.getItem('saved_username') || 'Administração'
        const authUserData: AuthUser = {
          username: savedUsername,
          is_staff: true,
        }
        setUser(authUserData)
        setRole('admin')
        localStorage.setItem('user_role', 'admin')
        localStorage.setItem('user_profile', JSON.stringify(authUserData))
      } catch (staffErr: any) {
        if (staffErr.status === 403) {
          // 403 Forbidden: Usuário comum sem permissão de staff
          const savedUsername = localStorage.getItem('saved_username') || 'Usuário'
          const authUserData: AuthUser = {
            username: savedUsername,
            is_staff: false,
          }
          setUser(authUserData)
          setRole('morador')
          localStorage.setItem('user_role', 'morador')
          localStorage.setItem('user_profile', JSON.stringify(authUserData))
        } else {
          throw staffErr
        }
      }
    } catch (err: any) {
      // Falha de autenticação
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_profile')
      setUser(null)
      setRole(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Inicialização a partir do cache local
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('user_role') as UserRole | null
      const savedProfile = localStorage.getItem('user_profile')
      if (savedProfile) {
        try {
          setUser(JSON.parse(savedProfile))
          setRole(savedRole)
        } catch {
          // ignora
        }
      }
    }
    refreshUser()
  }, [refreshUser])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const data = await api.post<AuthTokens>('/api/token/', credentials, { skipAuth: true })

      if (!data?.access) {
        throw new Error('Tokens não retornados pela API.')
      }

      localStorage.setItem('access_token', data.access)
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh)
      }
      localStorage.setItem('saved_username', credentials.username)

      // Identifica o perfil chamando /api/moradores/me/
      try {
        const moradorProfile = await api.get<UserProfile>('/api/moradores/me/')
        const authUserData: AuthUser = {
          id: moradorProfile.id,
          username: credentials.username,
          nome: moradorProfile.nome || credentials.username,
          apartamento: moradorProfile.apartamento,
          cpf: moradorProfile.cpf,
          data_nascimento: moradorProfile.data_nascimento,
          is_staff: false,
        }
        setUser(authUserData)
        setRole('morador')
        localStorage.setItem('user_role', 'morador')
        localStorage.setItem('user_profile', JSON.stringify(authUserData))
        return { role: 'morador' as UserRole, redirectTo: '/morador' }
      } catch (err: any) {
        // Se não for morador, testa se tem permissão administrativa
        try {
          await api.get('/veiculos/?page=1')
          const authUserData: AuthUser = {
            username: credentials.username,
            is_staff: true,
          }
          setUser(authUserData)
          setRole('admin')
          localStorage.setItem('user_role', 'admin')
          localStorage.setItem('user_profile', JSON.stringify(authUserData))
          return { role: 'admin' as UserRole, redirectTo: '/admin' }
        } catch (staffErr: any) {
          // Não é staff
          const authUserData: AuthUser = {
            username: credentials.username,
            is_staff: false,
          }
          setUser(authUserData)
          setRole('morador')
          localStorage.setItem('user_role', 'morador')
          localStorage.setItem('user_profile', JSON.stringify(authUserData))
          return { role: 'morador' as UserRole, redirectTo: '/morador' }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_profile')
      localStorage.removeItem('saved_username')
    }
    setUser(null)
    setRole(null)
    router.push('/login')
  }

  const isAdmin = role === 'admin' && !!user?.is_staff

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isAuthenticated: !!user && (typeof window !== 'undefined' ? !!localStorage.getItem('access_token') : false),
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
