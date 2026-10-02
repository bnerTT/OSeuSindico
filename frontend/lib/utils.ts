import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarData(dataIso: string, incluirHora: boolean = false) {
  if (!dataIso) return ''
  
  const data = new Date(dataIso)
  
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(data)

  if (incluirHora) {
    const horaFormatada = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(data)
    
    return `${dataFormatada} às ${horaFormatada}`
  }

  return dataFormatada
}

/**
 * Censura os dígitos do CPF para conformidade com a LGPD.
 * Exemplo: "12345678901" ou "123.456.789-01" -> "***.456.789-**"
 */
export function censurarCPF(cpf?: string | null): string {
  if (!cpf) return '—'
  const limpo = String(cpf).replace(/\D/g, '')
  if (limpo.length === 11) {
    return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-**`
  }
  if (limpo.length >= 6) {
    return `***.${limpo.slice(3, 6)}.-**`
  }
  return '***.***.***-**'
}

/**
 * Obtém o nome legível e formatado do morador, garantindo que nunca
 * sejam exibidos identificadores numéricos ("Morador #1", "ID 1")
 * ou objetos brutos ("[object Object]").
 */
export function formatarNomeMorador(
  moradorData?: any,
  moradoresMap?: Map<number, any>
): string {
  if (!moradorData && moradorData !== 0) return 'Morador'

  // Se já for uma string válida (e não for "[object Object]" nem "Morador #...")
  if (typeof moradorData === 'string') {
    const trimmed = moradorData.trim()
    if (
      trimmed &&
      trimmed !== '[object Object]' &&
      !trimmed.startsWith('Morador #') &&
      !trimmed.startsWith('ID #')
    ) {
      return trimmed
    }
  }

  // Se for um número (ID do morador) e tivermos o mapa de moradores
  if (typeof moradorData === 'number') {
    const encontrado = moradoresMap?.get(moradorData)
    if (encontrado) {
      return formatarNomeMorador(encontrado)
    }
    return 'Morador'
  }

  // Se for um objeto com informações do morador
  if (typeof moradorData === 'object') {
    if (moradorData.nome && typeof moradorData.nome === 'string' && moradorData.nome.trim()) {
      return moradorData.nome.trim()
    }
    if (moradorData.user?.first_name || moradorData.user?.last_name) {
      const completo = `${moradorData.user.first_name || ''} ${moradorData.user.last_name || ''}`.trim()
      if (completo) return completo
    }
    if (moradorData.username && typeof moradorData.username === 'string' && moradorData.username.trim()) {
      return moradorData.username.trim()
    }
    if (moradorData.user?.username && typeof moradorData.user.username === 'string' && moradorData.user.username.trim()) {
      return moradorData.user.username.trim()
    }
    if (moradorData.apartamento) {
      return `Morador (Apto ${moradorData.apartamento})`
    }
  }

  return 'Morador'
}

/**
 * Extrai até 2 letras iniciais para o Avatar do morador
 */
export function obterIniciais(nome?: string | null): string {
  if (!nome) return 'MO'
  const partes = nome.trim().split(/\s+/)
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }
  return nome.slice(0, 2).toUpperCase()
}