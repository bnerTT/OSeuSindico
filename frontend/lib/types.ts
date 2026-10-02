// Tipagens TypeScript sincronizadas com o backend Django de O Seu Síndico

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface UserProfile {
  id: number
  cpf: string
  data_nascimento: string // Formato YYYY-MM-DD
  apartamento: string
  username?: string
  nome?: string
  is_staff?: boolean
}

export interface Morador {
  id: number
  cpf: string
  data_nascimento: string
  apartamento: string
  username?: string
  nome?: string
}

export interface CreateMoradorInput {
  username: string
  password: string
  cpf?: string
  data_nascimento: string
  apartamento: string
}

export interface UpdateMoradorInput {
  username?: string
  password?: string
  cpf?: string
  data_nascimento?: string
  apartamento?: string
}

export interface Veiculo {
  id: number
  morador: number // ID do morador
  morador_nome?: string
  morador_apartamento?: string
  placa: string
  modelo: string
  cor: string
}

export interface CreateVeiculoInput {
  morador: number
  placa: string
  modelo: string
  cor: string
}

export interface UpdateVeiculoInput {
  morador?: number
  placa?: string
  modelo?: string
  cor?: string
}

export interface Encomenda {
  id: number
  codigo: string
  morador: number // ID do morador destinatário
  morador_nome?: string
  morador_apartamento?: string
  data_chegada: string // ISO 8601
  data_retirada: string | null // ISO 8601 ou null quando pendente
}

export interface CreateEncomendaInput {
  codigo: string
  morador: number
}

export interface UpdateEncomendaInput {
  codigo?: string
  morador?: number
  data_retirada?: string | null
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Area {
  id: number
  nome: string
  descricao: string
}

export interface CreateAreaInput {
  nome: string
  descricao: string
}

export type ReservaStatus = 'pendente' | 'confirmada' | 'cancelada'

export interface ReservaArea {
  id: number
  area: number // ID da Área
  area_detalhes?: Area
  morador: number // ID do Morador
  morador_nome?: string
  morador_apartamento?: string
  data_inicio: string // ISO 8601
  data_fim: string // ISO 8601
  status: ReservaStatus
  criada_em?: string
}

export interface CreateReservaInput {
  area: number
  morador: number
  data_inicio: string
  data_fim: string
  status?: ReservaStatus
}

export interface UpdateReservaInput {
  area?: number
  morador?: number
  data_inicio?: string
  data_fim?: string
  status?: ReservaStatus
}

export interface Maquina {
  id: number
  numero: number
  capacidade: number
  preco: number
}

export interface CreateMaquinaInput {
  numero: number
  capacidade: number
  preco: number
}

export interface ReservaMaquina {
  id: number
  maquina: number
  morador: number
  horario_inicio: string
  horario_final: string
  morador_nome?: string
  morador_apartamento?: string
  maquina_numero?: number
  maquina_capacidade?: number
  maquina_preco?: number
}

export interface CreateReservaMaquinaInput {
  maquina: number
  morador: number
  horario_inicio: string
  horario_final: string
}


