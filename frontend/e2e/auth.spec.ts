import { test, expect } from '@playwright/test'
import { setupApiMocks, setAuthState } from './fixtures/mock-api'

test.describe('Rotas de Autenticação e Recuperação de Senha', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page, 'none')
    await setupApiMocks(page, { role: 'none' as any })
  })

  test('Rota "/" deve exibir a tela de autenticação', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Seu Síndico/i)
    await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
    await expect(page.getByLabel(/Usuário/i)).toBeVisible()
    await expect(page.getByLabel(/Senha/i)).toBeVisible()
  })

  test('Rota "/login" deve permitir alternar entre login e cadastro de morador', async ({ page }) => {
    await page.goto('/login')

    // Modo login por padrão
    await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Entrar/i })).toBeVisible()

    // Alternar para modo cadastro
    const cadastrarButton = page.getByRole('button', { name: /Cadastre-se/i })
    await cadastrarButton.click()

    await expect(page.getByText('Crie sua conta')).toBeVisible()
    await expect(page.getByLabel(/Apartamento/i)).toBeVisible()
    await expect(page.getByLabel(/CPF/i)).toBeVisible()
    await expect(page.getByLabel(/Nascimento/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^Cadastrar/i })).toBeVisible()

    // Voltar para login
    const jaTemContaButton = page.getByRole('button', { name: /Faça login/i })
    await jaTemContaButton.click()
    await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
  })

  test('Rota "/login" deve validar credenciais e autenticar morador', async ({ page }) => {
    await setupApiMocks(page, { role: 'morador' })
    await page.goto('/login')

    await page.getByLabel(/Usuário/i).fill('carlos101')
    await page.getByLabel(/Senha/i).fill('senha123')
    await page.getByRole('button', { name: /^Entrar/i }).click()

    // Redireciona para /morador
    await expect(page).toHaveURL(/\/morador/)
  })

  test('Rota "/login" deve exibir mensagem de erro para credenciais inválidas', async ({ page }) => {
    await setupApiMocks(page, { role: 'none' as any })
    await page.goto('/login')

    await page.getByLabel(/Usuário/i).fill('invalido')
    await page.getByLabel(/Senha/i).fill('errada')
    await page.getByRole('button', { name: /^Entrar/i }).click()

    await expect(page.getByText(/Credenciais inválidas/i)).toBeVisible()
  })

  test('Rota "/recuperar-senha" deve exibir instruções e permitir retorno ao login', async ({ page }) => {
    await page.goto('/login')

    const esqueceuSenhaLink = page.getByRole('link', { name: /Esqueceu a senha\?/i })
    await esqueceuSenhaLink.click()

    await expect(page).toHaveURL(/\/recuperar-senha/)
    await expect(page.getByText('Recuperação de Acesso')).toBeVisible()
    await expect(page.getByText(/Segurança Condominial/i)).toBeVisible()

    // Clicar em voltar
    const voltarButton = page.getByRole('button', { name: /Voltar para o Login/i })
    await voltarButton.click()

    await expect(page).toHaveURL(/\/login/)
  })
})
