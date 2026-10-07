import { test, expect } from '@playwright/test'
import { setupApiMocks, setAuthState } from './fixtures/mock-api'

test.describe('Proteção de Rotas e Controle de Acesso (RBAC)', () => {
  test('Usuário não autenticado tentando acessar "/admin" deve ser redirecionado para "/login"', async ({ page }) => {
    await setAuthState(page, 'none')
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
  })

  test('Usuário não autenticado tentando acessar "/morador" deve ser redirecionado para "/login"', async ({ page }) => {
    await setAuthState(page, 'none')
    await page.goto('/morador')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
  })

  test('Usuário não autenticado tentando acessar sub-rota protegida deve ser redirecionado', async ({ page }) => {
    await setAuthState(page, 'none')
    await page.goto('/admin/moradores')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
  })

  test('Morador sem privilégio administrativo tentando acessar "/admin" deve ter acesso negado ou ser redirecionado', async ({ page }) => {
    await setAuthState(page, 'morador')
    await setupApiMocks(page, { role: 'morador' })

    await page.goto('/admin')

    // Espera redirecionamento para /morador
    await expect(page).toHaveURL(/\/morador/)
  })

  test('Administrador pode alternar visualização entre Administração e Área do Morador', async ({ page }) => {
    await setAuthState(page, 'admin')
    await setupApiMocks(page, { role: 'admin' })

    await page.goto('/admin')

    // Clica no link de alternância no menu lateral do AppShell
    const switchLink = page.getByRole('link', { name: /Ir para área do Morador/i })
    await expect(switchLink).toBeVisible()
    await switchLink.click()

    await expect(page).toHaveURL(/\/morador/)

    // Do morador, volta para administração
    const backToAdminLink = page.getByRole('link', { name: /Ir para Administração/i })
    await expect(backToAdminLink).toBeVisible()
    await backToAdminLink.click()
    await expect(page).toHaveURL(/\/admin/)
  })

  test('Logout deve encerrar a sessão e redirecionar para a tela de login', async ({ page }) => {
    await setAuthState(page, 'admin')
    await setupApiMocks(page, { role: 'admin' })

    await page.goto('/admin')

    // Clica no botão de logout no menu lateral
    const logoutBtn = page.getByRole('button', { name: /Sair da conta/i })
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    await expect(page).toHaveURL(/\/login/)
  })
})
