import { test, expect } from '@playwright/test'
import { setupApiMocks, setAuthState } from './fixtures/mock-api'

test.describe('Rotas Administrativas (/admin/*)', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page, 'admin')
    await setupApiMocks(page, { role: 'admin' })
  })

  test('Rota "/admin" (Painel Geral) deve carregar indicadores e lista de encomendas', async ({ page }) => {
    await page.goto('/admin')

    // Verifica cabeçalho da página
    await expect(page.getByRole('heading', { name: /Painel da administração/i })).toBeVisible()

    // Verifica cards de estatísticas / métricas
    await expect(page.getByText(/Moradores cadastrados/i).first()).toBeVisible()
    await expect(page.getByText(/Encomendas pendentes/i).first()).toBeVisible()
    await expect(page.getByText(/Total de encomendas/i).first()).toBeVisible()

    // Verifica lista de encomendas pendentes
    await expect(page.getByText(/BR123456789/i)).toBeVisible()
    await expect(page.getByText(/Carlos Silva/i).first()).toBeVisible()
  })

  test('Rota "/admin/moradores" deve exibir tabela, busca e abrir modal de cadastro', async ({ page }) => {
    await page.goto('/admin/moradores')

    await expect(page.getByRole('heading', { name: /^Moradores$/i }).first()).toBeVisible()
    await expect(page.getByPlaceholder(/Buscar por unidade, CPF ou usuário/i)).toBeVisible()

    // Verifica que moradores mockados são renderizados na tabela
    await expect(page.getByText('Carlos Silva')).toBeVisible()
    await expect(page.getByText('Mariana Costa')).toBeVisible()
    await expect(page.getByText('101')).toBeVisible()
    await expect(page.getByText('202')).toBeVisible()

    // Abre Sheet de Novo Morador
    const novoMoradorBtn = page.getByRole('button', { name: /Novo morador/i })
    await expect(novoMoradorBtn).toBeVisible()
    await novoMoradorBtn.click()

    await expect(page.getByRole('heading', { name: /^Novo Morador$/i })).toBeVisible()
    await expect(page.getByLabel(/Nome de Usuário/i)).toBeVisible()
    await expect(page.getByLabel(/Senha de Acesso/i)).toBeVisible()
  })

  test('Rota "/admin/encomendas" deve exibir abas de filtragem e permitir registrar nova encomenda', async ({ page }) => {
    await page.goto('/admin/encomendas')

    await expect(page.getByRole('heading', { name: /Encomendas da Portaria/i })).toBeVisible()

    // Abas de status com contadores
    await expect(page.getByRole('tab', { name: /Aguardando/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Concluídas/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Todas/i })).toBeVisible()

    // Verifica listagem da tabela
    await expect(page.getByText('BR123456789')).toBeVisible()

    // Abre Sheet de Nova Encomenda
    const novaEncomendaBtn = page.getByRole('button', { name: /Registrar encomenda/i })
    await expect(novaEncomendaBtn).toBeVisible()
    await novaEncomendaBtn.click()

    await expect(page.getByRole('heading', { name: /Registrar Encomenda/i })).toBeVisible()
    await expect(page.getByLabel(/Código de Rastreio/i)).toBeVisible()
  })

  test('Rota "/admin/veiculos" deve exibir veículos cadastrados e abrir modal de novo veículo', async ({ page }) => {
    await page.goto('/admin/veiculos')

    await expect(page.getByRole('heading', { name: /^Veículos$/i })).toBeVisible()

    // Tabela com veículos mockados
    await expect(page.getByText('ABC-1234')).toBeVisible()
    await expect(page.getByText('Toyota Corolla')).toBeVisible()
    await expect(page.getByText('XYZ-9876')).toBeVisible()

    // Abre Sheet de Novo Veículo
    const novoVeiculoBtn = page.getByRole('button', { name: /Cadastrar veículo/i })
    await expect(novoVeiculoBtn).toBeVisible()
    await novoVeiculoBtn.click()

    await expect(page.getByRole('heading', { name: /Cadastrar Veículo/i })).toBeVisible()
    await expect(page.getByLabel(/Placa do Veículo/i)).toBeVisible()
    await expect(page.getByLabel(/Modelo/i)).toBeVisible()
  })

  test('Rota "/admin/reservas" deve exibir abas de reservas e gestão de áreas', async ({ page }) => {
    await page.goto('/admin/reservas')

    await expect(page.getByRole('heading', { name: /Gestão de Áreas & Reservas/i })).toBeVisible()

    // Verifica abas
    const tabReservas = page.getByRole('tab', { name: /Reservas/i })
    const tabAreas = page.getByRole('tab', { name: /Áreas Cadastradas/i })
    await expect(tabReservas).toBeVisible()
    await expect(tabAreas).toBeVisible()

    // Alterna para aba de Áreas Cadastradas
    await tabAreas.click()
    await expect(page.getByText('Churrasqueira Gourmet')).toBeVisible()
    await expect(page.getByText('Salão de Festas Principal')).toBeVisible()

    // Abre Sheet de Nova Área
    const novaAreaBtn = page.getByRole('button', { name: /Cadastrar Nova Área/i })
    await expect(novaAreaBtn).toBeVisible()
    await novaAreaBtn.click()

    await expect(page.getByRole('heading', { name: /Cadastrar Nova Área/i })).toBeVisible()
  })

  test('Rota "/admin/lavanderia" deve exibir agendamentos e gestão de máquinas', async ({ page }) => {
    await page.goto('/admin/lavanderia')

    await expect(page.getByRole('heading', { name: /Gestão de Máquinas & Lavanderia/i })).toBeVisible()

    // Abas de Lavanderia
    const tabMaquinas = page.getByRole('tab', { name: /Máquinas Cadastradas/i })
    const tabReservas = page.getByRole('tab', { name: /Reservas dos Moradores/i })
    await expect(tabMaquinas).toBeVisible()
    await expect(tabReservas).toBeVisible()

    // Verifica máquina na lista
    await expect(page.getByText(/Máquina #1/i).first()).toBeVisible()

    // Abre Sheet de Nova Máquina
    const novaMaquinaBtn = page.getByRole('button', { name: /Cadastrar Nova Máquina/i })
    await expect(novaMaquinaBtn).toBeVisible()
    await novaMaquinaBtn.click()

    await expect(page.getByRole('heading', { name: /Cadastrar Nova Máquina/i })).toBeVisible()
  })

  test('Navegação lateral do AppShell deve transitar entre todas as telas administrativas', async ({ page }) => {
    await page.goto('/admin')

    // Navega para Moradores
    await page.getByRole('link', { name: /Moradores/i }).click()
    await expect(page).toHaveURL(/\/admin\/moradores/)

    // Navega para Encomendas
    await page.getByRole('link', { name: /Encomendas/i }).click()
    await expect(page).toHaveURL(/\/admin\/encomendas/)

    // Navega para Veículos
    await page.getByRole('link', { name: /Veículos/i }).click()
    await expect(page).toHaveURL(/\/admin\/veiculos/)

    // Navega para Áreas & Reservas
    await page.getByRole('link', { name: /Áreas & Reservas/i }).click()
    await expect(page).toHaveURL(/\/admin\/reservas/)

    // Navega para Lavanderia
    await page.getByRole('link', { name: /Lavanderia/i }).click()
    await expect(page).toHaveURL(/\/admin\/lavanderia/)

    // Retorna para o Painel
    await page.getByRole('link', { name: /Painel/i }).click()
    await expect(page).toHaveURL(/\/admin$/)
  })
})
