import { Page } from '@playwright/test'

export const mockMoradores = [
  {
    id: 1,
    username: 'carlos101',
    nome: 'Carlos Silva',
    apartamento: '101',
    cpf: '12345678900',
    data_nascimento: '1990-01-15',
  },
  {
    id: 2,
    username: 'mariana202',
    nome: 'Mariana Costa',
    apartamento: '202',
    cpf: '98765432100',
    data_nascimento: '1985-05-20',
  },
]

export const mockEncomendas = [
  {
    id: 101,
    codigo: 'BR123456789',
    morador: 1,
    morador_nome: 'Carlos Silva',
    morador_apartamento: '101',
    data_chegada: '2026-10-01T10:00:00Z',
    data_retirada: null,
  },
  {
    id: 102,
    codigo: 'BR987654321',
    morador: 1,
    morador_nome: 'Carlos Silva',
    morador_apartamento: '101',
    data_chegada: '2026-09-25T14:30:00Z',
    data_retirada: '2026-09-26T18:00:00Z',
  },
]

export const mockVeiculos = [
  {
    id: 1,
    morador: 1,
    morador_nome: 'Carlos Silva',
    morador_apartamento: '101',
    placa: 'ABC-1234',
    modelo: 'Toyota Corolla',
    cor: 'Prata',
  },
  {
    id: 2,
    morador: 2,
    morador_nome: 'Mariana Costa',
    morador_apartamento: '202',
    placa: 'XYZ-9876',
    modelo: 'Honda Civic',
    cor: 'Preto',
  },
]

export const mockAreas = [
  {
    id: 1,
    nome: 'Churrasqueira Gourmet',
    descricao: 'Área com churrasqueira a carvão e bancada completa',
  },
  {
    id: 2,
    nome: 'Salão de Festas Principal',
    descricao: 'Salão climatizado com capacidade para 60 convidados',
  },
]

export const mockReservasAreas = [
  {
    id: 1,
    area: 1,
    area_detalhes: {
      id: 1,
      nome: 'Churrasqueira Gourmet',
      descricao: 'Área com churrasqueira a carvão e bancada completa',
    },
    morador: 1,
    morador_nome: 'Carlos Silva',
    morador_apartamento: '101',
    data_inicio: '2026-10-15T12:00:00Z',
    data_fim: '2026-10-15T18:00:00Z',
    status: 'confirmada',
    criada_em: '2026-10-01T10:00:00Z',
  },
]

export const mockMaquinas = [
  {
    id: 1,
    numero: 1,
    capacidade: 11,
    preco: 15.0,
  },
  {
    id: 2,
    numero: 2,
    capacidade: 15,
    preco: 20.0,
  },
]

export const mockReservasMaquinas = [
  {
    id: 1,
    maquina: 1,
    morador: 1,
    morador_nome: 'Carlos Silva',
    morador_apartamento: '101',
    horario_inicio: '2026-10-08T08:00:00Z',
    horario_final: '2026-10-08T10:00:00Z',
    maquina_numero: 1,
    maquina_capacidade: 11,
    maquina_preco: 15.0,
  },
]

export interface SetupApiOptions {
  role?: 'admin' | 'morador'
}

export async function setupApiMocks(page: Page, options: SetupApiOptions = { role: 'admin' }) {
  await page.route('**/*', async (route) => {
    const reqUrl = route.request().url()

    // Somente intercepta chamadas para a API (porta 8000 ou rotas de proxy)
    if (!reqUrl.includes('8000') && !reqUrl.includes('/api/proxy')) {
      await route.continue()
      return
    }

    const url = new URL(reqUrl)
    const pathname = url.pathname
    const method = route.request().method()

    // 1. /api/token/ (Login)
    if (pathname.includes('/token')) {
      if (method === 'POST') {
        const postData = route.request().postDataJSON() || {}
        if (postData.username === 'invalido') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'Credenciais inválidas' }),
          })
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access: 'mock-access-token-xyz',
            refresh: 'mock-refresh-token-xyz',
          }),
        })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      return
    }

    // 2. /api/moradores/me/ (Perfil morador autenticado)
    if (pathname.includes('/moradores/me')) {
      if (options.role === 'morador') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockMoradores[0],
            is_staff: false,
          }),
        })
        return
      } else {
        // Admin não possui perfil de morador -> 404
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Perfil não encontrado' }),
        })
        return
      }
    }

    // 3. /moradores/ (CRUD de moradores)
    if (pathname.includes('/moradores')) {
      if (method === 'POST') {
        const data = route.request().postDataJSON() || {}
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 99, ...data }),
        })
        return
      }
      if (method === 'DELETE' || method === 'PUT') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: mockMoradores.length,
          next: null,
          previous: null,
          results: mockMoradores,
        }),
      })
      return
    }

    // 4. /encomendas/ (CRUD de encomendas)
    if (pathname.includes('/encomendas')) {
      if (method === 'POST') {
        const data = route.request().postDataJSON() || {}
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 103,
            codigo: data.codigo || 'BR999999999',
            morador: data.morador || 1,
            morador_nome: 'Carlos Silva',
            morador_apartamento: '101',
            data_chegada: new Date().toISOString(),
            data_retirada: null,
          }),
        })
        return
      }
      if (method === 'PUT' || method === 'DELETE') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        return
      }

      const retiradaParam = url.searchParams.get('retirada')
      if (retiradaParam === 'false') {
        const pendentes = mockEncomendas.filter((e) => !e.data_retirada)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: pendentes.length,
            next: null,
            previous: null,
            results: pendentes,
          }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: mockEncomendas.length,
          next: null,
          previous: null,
          results: mockEncomendas,
        }),
      })
      return
    }

    // 5. /veiculos/ (CRUD de veículos)
    if (pathname.includes('/veiculos')) {
      if (method === 'POST') {
        const data = route.request().postDataJSON() || {}
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 99,
            ...data,
            morador_nome: 'Carlos Silva',
            morador_apartamento: '101',
          }),
        })
        return
      }
      if (method === 'DELETE' || method === 'PUT') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: mockVeiculos.length,
          next: null,
          previous: null,
          results: mockVeiculos,
        }),
      })
      return
    }

    // 6. /maquinas/ e agendamentos de lavanderia
    if (pathname.includes('/maquinas') || pathname.includes('/reservas-maquinas')) {
      if (pathname.includes('reservas')) {
        if (method === 'POST') {
          const data = route.request().postDataJSON() || {}
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 99, ...data }),
          })
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockReservasMaquinas),
        })
        return
      }

      if (method === 'POST') {
        const data = route.request().postDataJSON() || {}
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 99, ...data }),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockMaquinas),
      })
      return
    }

    // 7. /reservas/ (Reservas de áreas comuns)
    if (pathname.includes('/reservas')) {
      if (method === 'POST') {
        const data = route.request().postDataJSON() || {}
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 99, ...data, status: 'confirmada' }),
        })
        return
      }
      if (method === 'PUT' || method === 'DELETE') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockReservasAreas),
      })
      return
    }

    // 8. /areas/ (Áreas comuns)
    if (pathname.includes('/areas')) {
      if (method === 'POST') {
        const data = route.request().postDataJSON() || {}
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 99, ...data }),
        })
        return
      }
      if (method === 'PUT' || method === 'DELETE') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAreas),
      })
      return
    }

    await route.continue()
  })
}

export async function setAuthState(page: Page, role: 'admin' | 'morador' | 'none') {
  if (role === 'none') {
    await page.addInitScript(() => {
      localStorage.clear()
    })
    return
  }

  if (role === 'admin') {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-admin-token')
      localStorage.setItem('refresh_token', 'mock-admin-refresh')
      localStorage.setItem('user_role', 'admin')
      localStorage.setItem('saved_username', 'SindicoAdmin')
      localStorage.setItem(
        'user_profile',
        JSON.stringify({
          username: 'SindicoAdmin',
          is_staff: true,
        })
      )
    })
  } else if (role === 'morador') {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-morador-token')
      localStorage.setItem('refresh_token', 'mock-morador-refresh')
      localStorage.setItem('user_role', 'morador')
      localStorage.setItem('saved_username', 'Carlos Silva')
      localStorage.setItem(
        'user_profile',
        JSON.stringify({
          id: 1,
          username: 'carlos101',
          nome: 'Carlos Silva',
          apartamento: '101',
          cpf: '12345678900',
          data_nascimento: '1990-01-15',
          is_staff: false,
        })
      )
    })
  }
}
