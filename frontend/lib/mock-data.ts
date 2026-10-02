export type StatusEncomenda = 'aguardando' | 'retirada' | 'devolvida'
export type TipoVeiculo = 'carro' | 'moto' | 'bicicleta'

export type Encomenda = {
  id: string
  descricao: string
  remetente: string
  transportadora: string
  unidade: string
  morador: string
  status: StatusEncomenda
  recebidaEm: string
  retiradaEm?: string
}

export type Veiculo = {
  id: string
  placa: string
  modelo: string
  cor: string
  tipo: TipoVeiculo
  vaga: string
  unidade: string
  morador: string
}

export type Morador = {
  id: string
  nome: string
  unidade: string
  bloco: string
  email: string
  telefone: string
  status: 'ativo' | 'inativo'
  desde: string
  encomendasPendentes: number
  veiculos: number
}

export const moradorAtual = {
  nome: 'Ana Beatriz Costa',
  unidade: 'Apto 302',
  bloco: 'Bloco B',
  email: 'ana.costa@email.com',
  telefone: '(11) 98765-4321',
  iniciais: 'AC',
}

export const encomendas: Encomenda[] = [
  {
    id: 'ENC-1042',
    descricao: 'Caixa média — Amazon',
    remetente: 'Amazon.com.br',
    transportadora: 'Correios',
    unidade: 'Apto 302 · Bloco B',
    morador: 'Ana Beatriz Costa',
    status: 'aguardando',
    recebidaEm: '2026-09-25T14:20:00',
  },
  {
    id: 'ENC-1041',
    descricao: 'Envelope — documento',
    remetente: 'Cartório Central',
    transportadora: 'Motoboy',
    unidade: 'Apto 302 · Bloco B',
    morador: 'Ana Beatriz Costa',
    status: 'aguardando',
    recebidaEm: '2026-09-24T09:05:00',
  },
  {
    id: 'ENC-1038',
    descricao: 'Pacote pequeno — Mercado Livre',
    remetente: 'Mercado Livre',
    transportadora: 'Mercado Envios',
    unidade: 'Apto 302 · Bloco B',
    morador: 'Ana Beatriz Costa',
    status: 'retirada',
    recebidaEm: '2026-09-20T16:40:00',
    retiradaEm: '2026-09-21T19:12:00',
  },
  {
    id: 'ENC-1035',
    descricao: 'Caixa grande — eletrodoméstico',
    remetente: 'Magazine Luiza',
    transportadora: 'Transportadora Log',
    unidade: 'Apto 302 · Bloco B',
    morador: 'Ana Beatriz Costa',
    status: 'retirada',
    recebidaEm: '2026-09-12T11:30:00',
    retiradaEm: '2026-09-12T20:00:00',
  },
  {
    id: 'ENC-1051',
    descricao: 'Sacola — farmácia',
    remetente: 'Drogaria São Paulo',
    transportadora: 'iFood',
    unidade: 'Apto 101 · Bloco A',
    morador: 'Carlos Mendes',
    status: 'aguardando',
    recebidaEm: '2026-09-26T08:15:00',
  },
  {
    id: 'ENC-1050',
    descricao: 'Caixa média — Shopee',
    remetente: 'Shopee',
    transportadora: 'Correios',
    unidade: 'Apto 504 · Bloco A',
    morador: 'Juliana Prado',
    status: 'aguardando',
    recebidaEm: '2026-09-26T07:50:00',
  },
  {
    id: 'ENC-1049',
    descricao: 'Pacote — livros',
    remetente: 'Livraria Cultura',
    transportadora: 'Jadlog',
    unidade: 'Apto 208 · Bloco C',
    morador: 'Roberto Alves',
    status: 'devolvida',
    recebidaEm: '2026-09-22T13:00:00',
  },
]

export const veiculos: Veiculo[] = [
  {
    id: 'VEI-01',
    placa: 'FKR-2B18',
    modelo: 'Honda Civic',
    cor: 'Prata',
    tipo: 'carro',
    vaga: 'G2-142',
    unidade: 'Apto 302 · Bloco B',
    morador: 'Ana Beatriz Costa',
  },
  {
    id: 'VEI-02',
    placa: 'GHT-9021',
    modelo: 'Honda PCX',
    cor: 'Preta',
    tipo: 'moto',
    vaga: 'M-18',
    unidade: 'Apto 302 · Bloco B',
    morador: 'Ana Beatriz Costa',
  },
  {
    id: 'VEI-03',
    placa: 'RTA-4C55',
    modelo: 'Toyota Corolla',
    cor: 'Branco',
    tipo: 'carro',
    vaga: 'G1-030',
    unidade: 'Apto 101 · Bloco A',
    morador: 'Carlos Mendes',
  },
  {
    id: 'VEI-04',
    placa: 'PLQ-7788',
    modelo: 'Jeep Renegade',
    cor: 'Cinza',
    tipo: 'carro',
    vaga: 'G1-031',
    unidade: 'Apto 504 · Bloco A',
    morador: 'Juliana Prado',
  },
  {
    id: 'VEI-05',
    placa: 'Caloi Elite',
    modelo: 'Caloi Elite Carbon',
    cor: 'Vermelha',
    tipo: 'bicicleta',
    vaga: 'BIC-07',
    unidade: 'Apto 208 · Bloco C',
    morador: 'Roberto Alves',
  },
]

export const moradores: Morador[] = [
  {
    id: 'MOR-001',
    nome: 'Ana Beatriz Costa',
    unidade: 'Apto 302',
    bloco: 'Bloco B',
    email: 'ana.costa@email.com',
    telefone: '(11) 98765-4321',
    status: 'ativo',
    desde: '2023-02-10',
    encomendasPendentes: 2,
    veiculos: 2,
  },
  {
    id: 'MOR-002',
    nome: 'Carlos Mendes',
    unidade: 'Apto 101',
    bloco: 'Bloco A',
    email: 'carlos.mendes@email.com',
    telefone: '(11) 99123-4567',
    status: 'ativo',
    desde: '2021-07-22',
    encomendasPendentes: 1,
    veiculos: 1,
  },
  {
    id: 'MOR-003',
    nome: 'Juliana Prado',
    unidade: 'Apto 504',
    bloco: 'Bloco A',
    email: 'juliana.prado@email.com',
    telefone: '(11) 98800-1122',
    status: 'ativo',
    desde: '2024-11-05',
    encomendasPendentes: 1,
    veiculos: 1,
  },
  {
    id: 'MOR-004',
    nome: 'Roberto Alves',
    unidade: 'Apto 208',
    bloco: 'Bloco C',
    email: 'roberto.alves@email.com',
    telefone: '(11) 97777-8899',
    status: 'ativo',
    desde: '2022-03-18',
    encomendasPendentes: 0,
    veiculos: 1,
  },
  {
    id: 'MOR-005',
    nome: 'Fernanda Lima',
    unidade: 'Apto 402',
    bloco: 'Bloco B',
    email: 'fernanda.lima@email.com',
    telefone: '(11) 96543-2211',
    status: 'inativo',
    desde: '2020-09-30',
    encomendasPendentes: 0,
    veiculos: 0,
  },
]

export const statusEncomendaLabel: Record<StatusEncomenda, string> = {
  aguardando: 'Aguardando retirada',
  retirada: 'Retirada',
  devolvida: 'Devolvida',
}

export const tipoVeiculoLabel: Record<TipoVeiculo, string> = {
  carro: 'Carro',
  moto: 'Moto',
  bicicleta: 'Bicicleta',
}

export function formatarData(iso: string, comHora = false) {
  const data = new Date(iso)
  const opcoes: Intl.DateTimeFormatOptions = comHora
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }
  return data.toLocaleString('pt-BR', opcoes)
}
