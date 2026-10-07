import { test, expect } from '@playwright/test'
import { setupApiMocks, setAuthState } from './fixtures/mock-api'

test.describe('Rotas do Morador (/morador/*)', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page, 'morador')
    await setupApiMocks(page, { role: 'morador' })
  })

  test('Rota "/morador" (Painel do Morador) deve carregar resumo e atalhos da unidade', async ({ page }) => {
    await page.goto('/morador')

    await expect(page.getByRole('heading', { name: /Olá, Carlos Silva/i })).toBeVisible()

    // Verifica cards de status e contadores
    await expect(page.getByText(/Encomendas a retirar/i)).toBeVisible()
    await expect(page.getByText(/Veículos cadastrados/i)).toBeVisible()
    await expect(page.getByText(/Áreas de lazer/i)).toBeVisible()
    await expect(page.getByText(/Lavanderia/i).first()).toBeVisible()

    // Verifica encomenda pendente no resumo
    await expect(page.getByText('BR123456789')).toBeVisible()
  })

  test('Rota "/morador/encomendas" deve exibir encomendas do morador e abas de status', async ({ page }) => {
    await page.goto('/morador/encomendas')

    await expect(page.getByRole('heading', { name: /Minhas encomendas/i })).toBeVisible()

    // Abas de visualização
    const tabAguardando = page.getByRole('tab', { name: /A retirar/i })
    const tabTodas = page.getByRole('tab', { name: /Todas/i })
    await expect(tabAguardando).toBeVisible()
    await expect(tabTodas).toBeVisible()

    // Verifica encomenda na lista
    await expect(page.getByText('BR123456789')).toBeVisible()
    await expect(page.getByText(/Aguardando retirada/i)).toBeVisible()

    // Alterna para todas
    await tabTodas.click()
    await expect(page.getByText('BR123456789')).toBeVisible()
    await expect(page.getByText('BR987654321')).toBeVisible()
  })

  test('Rota "/morador/veiculos" deve exibir os veículos vinculados à unidade', async ({ page }) => {
    await page.goto('/morador/veiculos')

    await expect(page.getByRole('heading', { name: /Meus Veículos/i })).toBeVisible()

    // Verifica veículo cadastrado para a unidade
    await expect(page.getByText('ABC-1234')).toBeVisible()
    await expect(page.getByText('Toyota Corolla')).toBeVisible()
    await expect(page.getByText('Prata')).toBeVisible()
  })

  test('Rota "/morador/reservas" deve exibir áreas disponíveis e permitir agendar', async ({ page }) => {
    await page.goto('/morador/reservas')

    await expect(page.getByRole('heading', { name: /Reservas de Áreas Comuns/i })).toBeVisible()

    // Abas
    const tabDisponiveis = page.getByRole('tab', { name: /^Áreas/i })
    const tabMinhas = page.getByRole('tab', { name: /^Minhas Reservas/i })
    await expect(tabDisponiveis).toBeVisible()
    await expect(tabMinhas).toBeVisible()

    // Áreas disponíveis
    await expect(page.getByText('Churrasqueira Gourmet')).toBeVisible()
    await expect(page.getByText('Salão de Festas Principal')).toBeVisible()

    // Abre Sheet de Nova Reserva
    const novaReservaBtn = page.getByRole('button', { name: /Nova Reserva/i })
    await expect(novaReservaBtn).toBeVisible()
    await novaReservaBtn.click()

    await expect(page.getByRole('heading', { name: /Reservar Área Comum/i })).toBeVisible()
  })

  test('Rota "/morador/lavanderia" deve exibir máquinas de lavar e agendamentos', async ({ page }) => {
    await page.goto('/morador/lavanderia')

    await expect(page.getByRole('heading', { name: /Lavanderia & Máquinas/i })).toBeVisible()

    // Abas
    const tabMaquinas = page.getByRole('tab', { name: /^Máquinas$/i })
    const tabAgendamentos = page.getByRole('tab', { name: /^Minhas Reservas/i })
    await expect(tabMaquinas).toBeVisible()
    await expect(tabAgendamentos).toBeVisible()

    // Máquinas disponíveis
    await expect(page.getByText(/Máquina #1/i).first()).toBeVisible()
    await expect(page.getByText(/Máquina #2/i).first()).toBeVisible()

    // Abre Sheet de Agendar Lavagem
    const agendarBtn = page.getByRole('button', { name: /Reservar Máquina/i })
    await expect(agendarBtn).toBeVisible()
    await agendarBtn.click()

    await expect(page.getByRole('heading', { name: /Agendar Máquina de Lavar/i })).toBeVisible()
  })

  test('Navegação lateral do morador deve transitar entre todas as áreas do morador', async ({ page }) => {
    await page.goto('/morador')

    // Navega para Encomendas
    await page.getByRole('link', { name: /Encomendas/i }).click()
    await expect(page).toHaveURL(/\/morador\/encomendas/)

    // Navega para Veículos
    await page.getByRole('link', { name: /Veículos/i }).click()
    await expect(page).toHaveURL(/\/morador\/veiculos/)

    // Navega para Reservas de Áreas
    await page.getByRole('link', { name: /Reservas de Áreas/i }).click()
    await expect(page).toHaveURL(/\/morador\/reservas/)

    // Navega para Lavanderia
    await page.getByRole('link', { name: /Lavanderia/i }).click()
    await expect(page).toHaveURL(/\/morador\/lavanderia/)

    // Retorna para Início
    await page.getByRole('link', { name: /Início/i }).click()
    await expect(page).toHaveURL(/\/morador$/)
  })
})
