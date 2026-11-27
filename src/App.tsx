import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Flame,
  Wallet,
  Cookie,
  Package,
  Settings,
  Plus,
  Minus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Search,
  Download,
  Upload,
  RotateCcw,
  Copy,
  ArrowRight,
  X,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  Check,
  Calculator,
  Users,
  Undo2,
  Sparkles,
  Layers,
  Calendar,
  Cloud,
  CloudOff,
  RefreshCw,
  Percent,
  Scale,
  BadgeAlert,
  FileCheck2,
  Phone,
  Target,
  HeartHandshake,
  Database,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

// ============================================================================
// 1. TIPAGENS E MODELAGEM DE DADOS (ERP COMPLETO + SUB-RECEITAS + ENCOMENDAS)
// ============================================================================

export type CategoriaInsumo = 'Ingredientes' | 'Embalagens' | 'Etiquetas';
export type UnidadeInsumo = 'g' | 'ml' | 'un';
export type StatusInsumo = 'REPOR' | 'ATENCAO' | 'OK';
export type FormaPagamentoCompra =
  | 'Pix'
  | 'Cartão Crédito'
  | 'Débito'
  | 'Dinheiro';
export type FormaPagamentoVenda =
  | 'Pix'
  | 'Dinheiro'
  | 'Débito'
  | 'Crédito à Vista'
  | 'Crédito Parcelado'
  | 'App / iFood';

export type TipoMovimentoCaixa =
  | 'Venda Direta'
  | 'Venda Revendedor'
  | 'Sinal Encomenda'
  | 'Despesa Operacional'
  | 'Perda / Avaria';

export type StatusPagamento = 'Pago' | 'Pendente/Consignado';
export type MetodoCusteio = 'media_ponderada' | 'ultimo_preco';
export type StatusEncomenda =
  | 'Orçamento'
  | 'Confirmada'
  | 'Em Produção'
  | 'Pronta'
  | 'Entregue';
export type MotivoPerda =
  | 'Quebra / Forno'
  | 'Vencimento'
  | 'Degustação / Amostra'
  | 'Avaria Transporte';

export type TabKey =
  | 'dashboard'
  | 'planejador'
  | 'producao'
  | 'vendas'
  | 'produtos'
  | 'estoque';

export interface Insumo {
  id: string;
  nome: string;
  categoria: CategoriaInsumo;
  unidade: UnidadeInsumo;
  estoque_atual: number;
  estoque_minimo: number;
  custo_medio_unitario: number; // R$ por 1g, 1ml ou 1un
}

export interface Compra {
  id: string;
  data: string;
  fornecedor: string;
  insumo_id: string;
  quantidade_comprada: number;
  valor_total_pago: number;
  forma_pagamento: FormaPagamentoCompra;
  volumes_qtd?: number;
  conteudo_por_volume?: number;
}

export interface SubReceita {
  id: string;
  nome: string;
  unidade: 'g' | 'ml';
  rendimento_padrao: number; // em g ou ml
  estoque_pronto: number; // saldo pronto em g ou ml (opcionalmente usado antes de explodir)
  observacoes?: string;
}

export interface SubReceitaItem {
  id: string;
  sub_receita_id: string;
  insumo_id: string;
  quantidade_usada: number;
}

export interface Produto {
  id: string;
  nome: string;
  preco_venda: number;
  rendimento_padrao: number;
  comissao_revendedor_pct: number;
  estoque_pronto: number;
  validade_dias: number; // vida útil padrão em dias
  custo_indireto_receita: number; // rateio fixo de gás/luz/mão de obra por receita (R$)
}

export interface FichaTecnicaItem {
  id: string;
  produto_id: string;
  tipo_item: 'insumo' | 'sub_receita';
  insumo_id?: string;
  sub_receita_id?: string;
  quantidade_usada: number; // para 1 receita padrão
}

export interface Producao {
  id: string;
  data: string;
  data_validade: string;
  lote_codigo: string;
  tipo_producao: 'produto' | 'sub_receita';
  produto_id?: string;
  sub_receita_id?: string;
  multiplicador_receita: number;
  unidades_reais_produzidas: number; // unidades para produto, ou g/ml para sub_receita
  observacoes: string;
  custo_estimado_lote?: number;
  alerta_validade_resolvido?: boolean;
}

export interface VendaFluxo {
  id: string;
  data: string;
  tipo: TipoMovimentoCaixa;
  produto_id?: string;
  quantidade: number;
  canal_ou_revendedor: string;
  forma_pagamento?: FormaPagamentoVenda;
  status_pagamento: StatusPagamento;
  valor_total: number;
  valor_comissao: number;
  taxa_pagamento_rs: number;
  lucro_liquido: number;
  descricao?: string;
  encomenda_id?: string;
}

export interface EncomendaItem {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
}

export interface Encomenda {
  id: string;
  codigo: string;
  cliente: string;
  whatsapp: string;
  data_pedido: string;
  data_entrega: string;
  itens: EncomendaItem[];
  valor_total: number;
  valor_sinal: number;
  forma_pagamento_sinal: FormaPagamentoVenda;
  status: StatusEncomenda;
  observacoes: string;
}

export interface OrdemPlanejada {
  id: string;
  produto_id: string;
  quantidade_meta: number;
  multiplicador_sugerido: number;
  unidades_previstas: number;
  criado_em: string;
  observacao: string;
}

export interface TaxasPagamentoConfig {
  Pix: number;
  Dinheiro: number;
  Débito: number;
  'Crédito à Vista': number;
  'Crédito Parcelado': number;
  'App / iFood': number;
}

export interface SupabaseSyncConfig {
  url: string;
  anon_key: string;
  table_name: string;
  workspace_id: string;
  last_sync_at?: string;
}

export interface AppConfig {
  metodo_custeio: MetodoCusteio;
  chave_pix: string;
  nome_beneficiario_pix: string;
  percentual_rateio_indireto: number; // % extra sobre CMV para rateio de custos indiretos
  taxas_pagamento: TaxasPagamentoConfig;
  supabase: SupabaseSyncConfig;
}

export interface ERPDatabase {
  version: number;
  updated_at: string;
  config: AppConfig;
  insumos: Insumo[];
  compras: Compra[];
  sub_receitas: SubReceita[];
  sub_receita_itens: SubReceitaItem[];
  produtos: Produto[];
  ficha_tecnica: FichaTecnicaItem[];
  producoes: Producao[];
  vendas_fluxo: VendaFluxo[];
  encomendas: Encomenda[];
  ordens_planejadas: OrdemPlanejada[];
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

// ============================================================================
// 2. UTILITÁRIOS DE FORMATAÇÃO, DATAS E CÁLCULOS RECURSIVOS (BOM + SUB-RECEITAS)
// ============================================================================

const STORAGE_KEY = 'lua_de_mel_erp_db_v2';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = (decimals = 2) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) return 'R$ 0,00';
  return currencyFormatter.format(value);
}

export function formatQty(value: number, unidade: UnidadeInsumo): string {
  if (!Number.isFinite(value)) return `0 ${unidade}`;
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (unidade === 'g') {
    if (abs >= 1000)
      return `${sign}${numberFormatter(2).format(abs / 1000)} kg`;
    return `${sign}${numberFormatter(abs % 1 === 0 ? 0 : 1).format(abs)} g`;
  }
  if (unidade === 'ml') {
    if (abs >= 1000) return `${sign}${numberFormatter(2).format(abs / 1000)} L`;
    return `${sign}${numberFormatter(abs % 1 === 0 ? 0 : 1).format(abs)} ml`;
  }
  return `${sign}${numberFormatter(abs % 1 === 0 ? 0 : 1).format(abs)} un`;
}

export function formatUnitCostReadable(
  custoUnitario: number,
  unidade: UnidadeInsumo
): string {
  if (unidade === 'g') return `${formatBRL(custoUnitario * 1000)}/kg`;
  if (unidade === 'ml') return `${formatBRL(custoUnitario * 1000)}/L`;
  return `${formatBRL(custoUnitario)}/un`;
}

export function getInsumoStatus(insumo: Insumo): StatusInsumo {
  if (insumo.estoque_atual <= insumo.estoque_minimo) return 'REPOR';
  if (insumo.estoque_atual <= insumo.estoque_minimo * 1.25) return 'ATENCAO';
  return 'OK';
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(baseISO: string, days: number): string {
  const parts = baseISO.split('-').map(Number);
  const d =
    parts.length === 3
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date();
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDateISO(d);
}

export function daysUntilISO(targetISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = targetISO.split('-').map(Number);
  if (parts.length !== 3) return 999;
  const target = new Date(parts[0], parts[1] - 1, parts[2]);
  target.setHours(0, 0, 0, 0);
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function formatDateBR(iso: string): string {
  if (!iso) return '-';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getNextLoteCode(producoes: Producao[]): string {
  let maxNum = 0;
  for (const p of producoes) {
    const match = p.lote_codigo.match(/LOTE-(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `LOTE-${String(maxNum + 1).padStart(3, '0')}`;
}

export function getNextEncomendaCode(encomendas: Encomenda[]): string {
  let maxNum = 0;
  for (const e of encomendas) {
    const match = e.codigo.match(/ENC-(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `ENC-${String(maxNum + 1).padStart(3, '0')}`;
}

export interface SubReceitaMetricas {
  custo_receita: number;
  custo_unitario: number; // por 1g ou 1ml
  itens_count: number;
}

export function calcularMetricasSubReceita(
  sub: SubReceita,
  itens: SubReceitaItem[],
  insumosMap: Map<string, Insumo>
): SubReceitaMetricas {
  const vinculados = itens.filter((i) => i.sub_receita_id === sub.id);
  const custo_receita = vinculados.reduce((acc, item) => {
    const ins = insumosMap.get(item.insumo_id);
    if (!ins) return acc;
    return acc + item.quantidade_usada * ins.custo_medio_unitario;
  }, 0);
  const custo_unitario =
    sub.rendimento_padrao > 0 ? custo_receita / sub.rendimento_padrao : 0;
  return {
    custo_receita,
    custo_unitario,
    itens_count: vinculados.length,
  };
}

export interface ProdutoMetricas {
  custo_cmv_receita: number; // apenas insumos + sub-receitas
  custo_indireto_total_receita: number; // rateio fixo + % indireto
  custo_total_receita: number;
  custo_unitario_cmv: number;
  custo_unitario_total: number;
  margem_contribuicao_rs: number; // preco_venda - custo_unitario_cmv
  margem_contribuicao_pct: number;
  lucro_liquido_unit_rs: number; // preco_venda - custo_unitario_total
  lucro_liquido_unit_pct: number;
  itens_count: number;
}

export function calcularMetricasProduto(
  produto: Produto,
  fichas: FichaTecnicaItem[],
  insumosMap: Map<string, Insumo>,
  subReceitasMap: Map<string, SubReceita>,
  subMetricasMap: Map<string, SubReceitaMetricas>,
  percentualRateioIndireto: number
): ProdutoMetricas {
  const itens = fichas.filter((f) => f.produto_id === produto.id);
  const custo_cmv_receita = itens.reduce((acc, item) => {
    if (item.tipo_item === 'sub_receita' && item.sub_receita_id) {
      const subM = subMetricasMap.get(item.sub_receita_id);
      if (!subM) return acc;
      return acc + item.quantidade_usada * subM.custo_unitario;
    }
    if (item.insumo_id) {
      const ins = insumosMap.get(item.insumo_id);
      if (!ins) return acc;
      return acc + item.quantidade_usada * ins.custo_medio_unitario;
    }
    return acc;
  }, 0);

  const custo_indireto_total_receita =
    (produto.custo_indireto_receita || 0) +
    custo_cmv_receita * ((percentualRateioIndireto || 0) / 100);

  const custo_total_receita = custo_cmv_receita + custo_indireto_total_receita;

  const rendimento =
    produto.rendimento_padrao > 0 ? produto.rendimento_padrao : 1;
  const custo_unitario_cmv = custo_cmv_receita / rendimento;
  const custo_unitario_total = custo_total_receita / rendimento;

  const margem_contribuicao_rs = produto.preco_venda - custo_unitario_cmv;
  const margem_contribuicao_pct =
    produto.preco_venda > 0
      ? (margem_contribuicao_rs / produto.preco_venda) * 100
      : 0;

  const lucro_liquido_unit_rs = produto.preco_venda - custo_unitario_total;
  const lucro_liquido_unit_pct =
    produto.preco_venda > 0
      ? (lucro_liquido_unit_rs / produto.preco_venda) * 100
      : 0;

  return {
    custo_cmv_receita,
    custo_indireto_total_receita,
    custo_total_receita,
    custo_unitario_cmv,
    custo_unitario_total,
    margem_contribuicao_rs,
    margem_contribuicao_pct,
    lucro_liquido_unit_rs,
    lucro_liquido_unit_pct,
    itens_count: itens.length,
  };
}

// ============================================================================
// 3. SEED DATA COMPLETO E REALISTA (COM SUB-RECEITAS, ENCOMENDAS, LOTES, TAXAS)
// ============================================================================

function createSeedDatabase(): ERPDatabase {
  const config: AppConfig = {
    metodo_custeio: 'media_ponderada',
    chave_pix: 'luademel.confeitaria@pix.com.br',
    nome_beneficiario_pix: 'Confeitaria Artesanal Lua de Mel',
    percentual_rateio_indireto: 8, // 8% rateio gás/energia/utensílios
    taxas_pagamento: {
      Pix: 0,
      Dinheiro: 0,
      Débito: 1.49,
      'Crédito à Vista': 3.19,
      'Crédito Parcelado': 5.89,
      'App / iFood': 12.0,
    },
    supabase: {
      url: '',
      anon_key: '',
      table_name: 'lua_de_mel_erp_snapshots',
      workspace_id: 'matriz-lua-de-mel',
    },
  };

  const insumos: Insumo[] = [
    {
      id: 'ins-1',
      nome: 'Chocolate Nobre Meio Amargo',
      categoria: 'Ingredientes',
      unidade: 'g',
      estoque_atual: 1150,
      estoque_minimo: 1000,
      custo_medio_unitario: 0.088, // R$ 88/kg
    },
    {
      id: 'ins-2',
      nome: 'Cobertura Fracionada Blend',
      categoria: 'Ingredientes',
      unidade: 'g',
      estoque_atual: 3600,
      estoque_minimo: 1500,
      custo_medio_unitario: 0.036,
    },
    {
      id: 'ins-3',
      nome: 'Doce de Leite Cozido Base',
      categoria: 'Ingredientes',
      unidade: 'g',
      estoque_atual: 2100,
      estoque_minimo: 1200,
      custo_medio_unitario: 0.028,
    },
    {
      id: 'ins-4',
      nome: 'Creme de Leite UHT 20%',
      categoria: 'Ingredientes',
      unidade: 'g',
      estoque_atual: 1600,
      estoque_minimo: 800,
      custo_medio_unitario: 0.019,
    },
    {
      id: 'ins-5',
      nome: 'Farinha de Trigo Especial',
      categoria: 'Ingredientes',
      unidade: 'g',
      estoque_atual: 4800,
      estoque_minimo: 2000,
      custo_medio_unitario: 0.0068,
    },
    {
      id: 'ins-6',
      nome: 'Manteiga Sem Sal Extra',
      categoria: 'Ingredientes',
      unidade: 'g',
      estoque_atual: 1900,
      estoque_minimo: 800,
      custo_medio_unitario: 0.058,
    },
    {
      id: 'ins-7',
      nome: 'Mel Silvestre Puro',
      categoria: 'Ingredientes',
      unidade: 'g',
      estoque_atual: 420, // REPOR
      estoque_minimo: 600,
      custo_medio_unitario: 0.065,
    },
    {
      id: 'ins-8',
      nome: 'Açúcar Mascavo',
      categoria: 'Ingredientes',
      unidade: 'g',
      estoque_atual: 2300,
      estoque_minimo: 800,
      custo_medio_unitario: 0.018,
    },
    {
      id: 'ins-9',
      nome: 'Cacau em Pó 50%',
      categoria: 'Ingredientes',
      unidade: 'g',
      estoque_atual: 1150,
      estoque_minimo: 500,
      custo_medio_unitario: 0.062,
    },
    {
      id: 'ins-10',
      nome: 'Ovos Médios Caipira',
      categoria: 'Ingredientes',
      unidade: 'un',
      estoque_atual: 48,
      estoque_minimo: 24,
      custo_medio_unitario: 0.85,
    },
    {
      id: 'ins-11',
      nome: 'Especiarias / Extrato Baunilha',
      categoria: 'Ingredientes',
      unidade: 'ml',
      estoque_atual: 340,
      estoque_minimo: 150,
      custo_medio_unitario: 0.095,
    },
    {
      id: 'ins-12',
      nome: 'Saquinho Celofane Pão de Mel',
      categoria: 'Embalagens',
      unidade: 'un',
      estoque_atual: 185,
      estoque_minimo: 80,
      custo_medio_unitario: 0.22,
    },
    {
      id: 'ins-13',
      nome: 'Embalagem Kraft Cookie/Brownie',
      categoria: 'Embalagens',
      unidade: 'un',
      estoque_atual: 120,
      estoque_minimo: 60,
      custo_medio_unitario: 0.55,
    },
    {
      id: 'ins-14',
      nome: 'Caixa Chocotone 500g',
      categoria: 'Embalagens',
      unidade: 'un',
      estoque_atual: 16,
      estoque_minimo: 10,
      custo_medio_unitario: 4.8,
    },
    {
      id: 'ins-15',
      nome: 'Etiqueta Adesiva Lua de Mel',
      categoria: 'Etiquetas',
      unidade: 'un',
      estoque_atual: 38, // REPOR
      estoque_minimo: 100,
      custo_medio_unitario: 0.18,
    },
  ];

  // Sub-receitas (Bases intermediárias)
  const sub_receitas: SubReceita[] = [
    {
      id: 'sub-1',
      nome: 'Recheio de Doce de Leite Cremoso (Base)',
      unidade: 'g',
      rendimento_padrao: 1000,
      estoque_pronto: 450,
      observacoes:
        'Doce de leite cozido batido com creme de leite e toque de baunilha.',
    },
    {
      id: 'sub-2',
      nome: 'Ganache Trufada Meio Amarga (Base)',
      unidade: 'g',
      rendimento_padrao: 900,
      estoque_pronto: 300,
      observacoes:
        'Chocolate nobre meio amargo emulsionado com creme de leite e mel.',
    },
  ];

  const sub_receita_itens: SubReceitaItem[] = [
    // Recheio de Doce de Leite Cremoso (1000g)
    {
      id: 'sri-1',
      sub_receita_id: 'sub-1',
      insumo_id: 'ins-3',
      quantidade_usada: 800,
    },
    {
      id: 'sri-2',
      sub_receita_id: 'sub-1',
      insumo_id: 'ins-4',
      quantidade_usada: 200,
    },
    {
      id: 'sri-3',
      sub_receita_id: 'sub-1',
      insumo_id: 'ins-11',
      quantidade_usada: 10,
    },
    // Ganache Trufada Meio Amarga (900g)
    {
      id: 'sri-4',
      sub_receita_id: 'sub-2',
      insumo_id: 'ins-1',
      quantidade_usada: 550,
    },
    {
      id: 'sri-5',
      sub_receita_id: 'sub-2',
      insumo_id: 'ins-4',
      quantidade_usada: 320,
    },
    {
      id: 'sri-6',
      sub_receita_id: 'sub-2',
      insumo_id: 'ins-7',
      quantidade_usada: 30,
    },
  ];

  const produtos: Produto[] = [
    {
      id: 'prod-1',
      nome: 'Pão de Mel Clássico (Doce de Leite)',
      preco_venda: 12.0,
      rendimento_padrao: 24,
      comissao_revendedor_pct: 20,
      estoque_pronto: 14,
      validade_dias: 7,
      custo_indireto_receita: 14.0,
    },
    {
      id: 'prod-2',
      nome: 'Cookie Artesanal Gotas Belga',
      preco_venda: 14.0,
      rendimento_padrao: 16,
      comissao_revendedor_pct: 15,
      estoque_pronto: 8,
      validade_dias: 10,
      custo_indireto_receita: 10.0,
    },
    {
      id: 'prod-3',
      nome: 'Brownie Super Cremoso',
      preco_venda: 13.0,
      rendimento_padrao: 12,
      comissao_revendedor_pct: 15,
      estoque_pronto: 10,
      validade_dias: 8,
      custo_indireto_receita: 9.5,
    },
    {
      id: 'prod-4',
      nome: 'Chocotone Trufado 500g (Sazonal)',
      preco_venda: 78.0,
      rendimento_padrao: 4,
      comissao_revendedor_pct: 15,
      estoque_pronto: 2,
      validade_dias: 15,
      custo_indireto_receita: 18.0,
    },
  ];

  const ficha_tecnica: FichaTecnicaItem[] = [
    // Pão de Mel Clássico (usa sub-receita Recheio Doce de Leite + insumos diretos)
    {
      id: 'ft-1',
      produto_id: 'prod-1',
      tipo_item: 'insumo',
      insumo_id: 'ins-5',
      quantidade_usada: 500,
    },
    {
      id: 'ft-2',
      produto_id: 'prod-1',
      tipo_item: 'insumo',
      insumo_id: 'ins-7',
      quantidade_usada: 250,
    },
    {
      id: 'ft-3',
      produto_id: 'prod-1',
      tipo_item: 'insumo',
      insumo_id: 'ins-8',
      quantidade_usada: 200,
    },
    {
      id: 'ft-4',
      produto_id: 'prod-1',
      tipo_item: 'insumo',
      insumo_id: 'ins-9',
      quantidade_usada: 80,
    },
    {
      id: 'ft-5',
      produto_id: 'prod-1',
      tipo_item: 'insumo',
      insumo_id: 'ins-10',
      quantidade_usada: 3,
    },
    {
      id: 'ft-6',
      produto_id: 'prod-1',
      tipo_item: 'insumo',
      insumo_id: 'ins-11',
      quantidade_usada: 25,
    },
    {
      id: 'ft-7',
      produto_id: 'prod-1',
      tipo_item: 'sub_receita',
      sub_receita_id: 'sub-1',
      quantidade_usada: 720,
    },
    {
      id: 'ft-8',
      produto_id: 'prod-1',
      tipo_item: 'insumo',
      insumo_id: 'ins-2',
      quantidade_usada: 600,
    },
    {
      id: 'ft-9',
      produto_id: 'prod-1',
      tipo_item: 'insumo',
      insumo_id: 'ins-12',
      quantidade_usada: 24,
    },
    {
      id: 'ft-10',
      produto_id: 'prod-1',
      tipo_item: 'insumo',
      insumo_id: 'ins-15',
      quantidade_usada: 24,
    },

    // Cookie Artesanal Gotas Belga
    {
      id: 'ft-11',
      produto_id: 'prod-2',
      tipo_item: 'insumo',
      insumo_id: 'ins-5',
      quantidade_usada: 450,
    },
    {
      id: 'ft-12',
      produto_id: 'prod-2',
      tipo_item: 'insumo',
      insumo_id: 'ins-6',
      quantidade_usada: 250,
    },
    {
      id: 'ft-13',
      produto_id: 'prod-2',
      tipo_item: 'insumo',
      insumo_id: 'ins-8',
      quantidade_usada: 220,
    },
    {
      id: 'ft-14',
      produto_id: 'prod-2',
      tipo_item: 'insumo',
      insumo_id: 'ins-10',
      quantidade_usada: 2,
    },
    {
      id: 'ft-15',
      produto_id: 'prod-2',
      tipo_item: 'insumo',
      insumo_id: 'ins-11',
      quantidade_usada: 15,
    },
    {
      id: 'ft-16',
      produto_id: 'prod-2',
      tipo_item: 'insumo',
      insumo_id: 'ins-1',
      quantidade_usada: 400,
    },
    {
      id: 'ft-17',
      produto_id: 'prod-2',
      tipo_item: 'insumo',
      insumo_id: 'ins-13',
      quantidade_usada: 16,
    },
    {
      id: 'ft-18',
      produto_id: 'prod-2',
      tipo_item: 'insumo',
      insumo_id: 'ins-15',
      quantidade_usada: 16,
    },

    // Brownie Super Cremoso
    {
      id: 'ft-19',
      produto_id: 'prod-3',
      tipo_item: 'insumo',
      insumo_id: 'ins-1',
      quantidade_usada: 350,
    },
    {
      id: 'ft-20',
      produto_id: 'prod-3',
      tipo_item: 'insumo',
      insumo_id: 'ins-6',
      quantidade_usada: 200,
    },
    {
      id: 'ft-21',
      produto_id: 'prod-3',
      tipo_item: 'insumo',
      insumo_id: 'ins-5',
      quantidade_usada: 180,
    },
    {
      id: 'ft-22',
      produto_id: 'prod-3',
      tipo_item: 'insumo',
      insumo_id: 'ins-8',
      quantidade_usada: 250,
    },
    {
      id: 'ft-23',
      produto_id: 'prod-3',
      tipo_item: 'insumo',
      insumo_id: 'ins-9',
      quantidade_usada: 60,
    },
    {
      id: 'ft-24',
      produto_id: 'prod-3',
      tipo_item: 'insumo',
      insumo_id: 'ins-10',
      quantidade_usada: 4,
    },
    {
      id: 'ft-25',
      produto_id: 'prod-3',
      tipo_item: 'insumo',
      insumo_id: 'ins-13',
      quantidade_usada: 12,
    },
    {
      id: 'ft-26',
      produto_id: 'prod-3',
      tipo_item: 'insumo',
      insumo_id: 'ins-15',
      quantidade_usada: 12,
    },

    // Chocotone Trufado 500g (usa sub-receita Ganache Trufada + Recheio Doce de Leite)
    {
      id: 'ft-27',
      produto_id: 'prod-4',
      tipo_item: 'insumo',
      insumo_id: 'ins-5',
      quantidade_usada: 800,
    },
    {
      id: 'ft-28',
      produto_id: 'prod-4',
      tipo_item: 'insumo',
      insumo_id: 'ins-6',
      quantidade_usada: 240,
    },
    {
      id: 'ft-29',
      produto_id: 'prod-4',
      tipo_item: 'insumo',
      insumo_id: 'ins-10',
      quantidade_usada: 6,
    },
    {
      id: 'ft-30',
      produto_id: 'prod-4',
      tipo_item: 'insumo',
      insumo_id: 'ins-7',
      quantidade_usada: 80,
    },
    {
      id: 'ft-31',
      produto_id: 'prod-4',
      tipo_item: 'sub_receita',
      sub_receita_id: 'sub-2',
      quantidade_usada: 650,
    },
    {
      id: 'ft-32',
      produto_id: 'prod-4',
      tipo_item: 'sub_receita',
      sub_receita_id: 'sub-1',
      quantidade_usada: 350,
    },
    {
      id: 'ft-33',
      produto_id: 'prod-4',
      tipo_item: 'insumo',
      insumo_id: 'ins-2',
      quantidade_usada: 300,
    },
    {
      id: 'ft-34',
      produto_id: 'prod-4',
      tipo_item: 'insumo',
      insumo_id: 'ins-14',
      quantidade_usada: 4,
    },
    {
      id: 'ft-35',
      produto_id: 'prod-4',
      tipo_item: 'insumo',
      insumo_id: 'ins-15',
      quantidade_usada: 4,
    },
  ];

  const compras: Compra[] = [
    {
      id: 'cmp-1',
      data: daysAgoISO(16),
      fornecedor: 'Distribuidora Cacau Sul',
      insumo_id: 'ins-1',
      quantidade_comprada: 2020,
      volumes_qtd: 2,
      conteudo_por_volume: 1010,
      valor_total_pago: 177.76,
      forma_pagamento: 'Pix',
    },
    {
      id: 'cmp-2',
      data: daysAgoISO(12),
      fornecedor: 'Atacadão Confeiteiro',
      insumo_id: 'ins-2',
      quantidade_comprada: 4000,
      volumes_qtd: 4,
      conteudo_por_volume: 1000,
      valor_total_pago: 144.0,
      forma_pagamento: 'Cartão Crédito',
    },
    {
      id: 'cmp-3',
      data: daysAgoISO(8),
      fornecedor: 'Laticínios Fazenda Boa',
      insumo_id: 'ins-3',
      quantidade_comprada: 2500,
      volumes_qtd: 1,
      conteudo_por_volume: 2500,
      valor_total_pago: 70.0,
      forma_pagamento: 'Pix',
    },
    {
      id: 'cmp-4',
      data: daysAgoISO(5),
      fornecedor: 'Apiário Florada Dourada',
      insumo_id: 'ins-7',
      quantidade_comprada: 1000,
      volumes_qtd: 2,
      conteudo_por_volume: 500,
      valor_total_pago: 65.0,
      forma_pagamento: 'Pix',
    },
  ];

  const insumosMap = new Map(insumos.map((i) => [i.id, i]));
  const subMap = new Map(sub_receitas.map((s) => [s.id, s]));
  const subMetricasMap = new Map(
    sub_receitas.map((s) => [
      s.id,
      calcularMetricasSubReceita(s, sub_receita_itens, insumosMap),
    ])
  );
  const metricasMap = new Map(
    produtos.map((p) => [
      p.id,
      calcularMetricasProduto(
        p,
        ficha_tecnica,
        insumosMap,
        subMap,
        subMetricasMap,
        config.percentual_rateio_indireto
      ),
    ])
  );

  // Lotes com validade (incluindo 1 lote vencendo em 1 dia para alerta FEFO)
  const producoes: Producao[] = [
    {
      id: 'prd-1',
      data: daysAgoISO(6),
      data_validade: addDaysISO(formatDateISO(new Date()), 1), // Vence amanhã (alerta <= 48h!)
      lote_codigo: 'LOTE-001',
      tipo_producao: 'produto',
      produto_id: 'prod-1',
      multiplicador_receita: 1,
      unidades_reais_produzidas: 24,
      observacoes: 'Lote vitrine semana (priorizar venda/promoção).',
      custo_estimado_lote: metricasMap.get('prod-1')?.custo_cmv_receita || 0,
    },
    {
      id: 'prd-2',
      data: daysAgoISO(4),
      data_validade: addDaysISO(formatDateISO(new Date()), 6),
      lote_codigo: 'LOTE-002',
      tipo_producao: 'produto',
      produto_id: 'prod-2',
      multiplicador_receita: 2,
      unidades_reais_produzidas: 31,
      observacoes: '1 unidade quebrou na assadeira.',
      custo_estimado_lote:
        (metricasMap.get('prod-2')?.custo_cmv_receita || 0) * 2,
    },
    {
      id: 'prd-3',
      data: daysAgoISO(2),
      data_validade: addDaysISO(formatDateISO(new Date()), 13),
      lote_codigo: 'LOTE-003',
      tipo_producao: 'produto',
      produto_id: 'prod-4',
      multiplicador_receita: 1,
      unidades_reais_produzidas: 4,
      observacoes: 'Chocotones trufados com ganache e doce de leite.',
      custo_estimado_lote: metricasMap.get('prod-4')?.custo_cmv_receita || 0,
    },
  ];

  const custoUnit = (pid: string) =>
    metricasMap.get(pid)?.custo_unitario_cmv || 0;

  const vendas_fluxo: VendaFluxo[] = [
    {
      id: 'vf-1',
      data: daysAgoISO(11),
      tipo: 'Venda Direta',
      produto_id: 'prod-1',
      quantidade: 18,
      canal_ou_revendedor: 'Instagram/WhatsApp',
      forma_pagamento: 'Pix',
      status_pagamento: 'Pago',
      valor_total: 216.0,
      valor_comissao: 0,
      taxa_pagamento_rs: 0,
      lucro_liquido: 216.0 - custoUnit('prod-1') * 18,
    },
    {
      id: 'vf-2',
      data: daysAgoISO(9),
      tipo: 'Venda Revendedor',
      produto_id: 'prod-1',
      quantidade: 20,
      canal_ou_revendedor: 'Cafeteria Central (Revendedor)',
      forma_pagamento: 'Pix',
      status_pagamento: 'Pago',
      valor_total: 240.0,
      valor_comissao: 48.0,
      taxa_pagamento_rs: 0,
      lucro_liquido: 240.0 - 48.0 - custoUnit('prod-1') * 20,
    },
    {
      id: 'vf-3',
      data: daysAgoISO(7),
      tipo: 'Despesa Operacional',
      quantidade: 1,
      canal_ou_revendedor: 'Energisa + Gás Cozinha',
      status_pagamento: 'Pago',
      valor_total: 210.0,
      valor_comissao: 0,
      taxa_pagamento_rs: 0,
      lucro_liquido: -210.0,
      descricao: 'Despesas fixas mensais da cozinha artesanal',
    },
    {
      id: 'vf-4',
      data: daysAgoISO(6),
      tipo: 'Venda Revendedor',
      produto_id: 'prod-2',
      quantidade: 15,
      canal_ou_revendedor: 'Empório Sabor (Revendedor)',
      forma_pagamento: 'Pix',
      status_pagamento: 'Pendente/Consignado',
      valor_total: 210.0,
      valor_comissao: 31.5,
      taxa_pagamento_rs: 0,
      lucro_liquido: 210.0 - 31.5 - custoUnit('prod-2') * 15,
    },
    {
      id: 'vf-5',
      data: daysAgoISO(4),
      tipo: 'Venda Direta',
      produto_id: 'prod-4',
      quantidade: 3,
      canal_ou_revendedor: 'Instagram/WhatsApp',
      forma_pagamento: 'Crédito à Vista',
      status_pagamento: 'Pago',
      valor_total: 234.0,
      valor_comissao: 0,
      taxa_pagamento_rs: Number((234.0 * 0.0319).toFixed(2)),
      lucro_liquido: 234.0 - 234.0 * 0.0319 - custoUnit('prod-4') * 3,
    },
    {
      id: 'vf-6',
      data: daysAgoISO(2),
      tipo: 'Sinal Encomenda',
      quantidade: 1,
      canal_ou_revendedor: 'Mariana Souza (ENC-001)',
      forma_pagamento: 'Pix',
      status_pagamento: 'Pago',
      valor_total: 180.0,
      valor_comissao: 0,
      taxa_pagamento_rs: 0,
      lucro_liquido: 180.0,
      descricao: 'Sinal 50% referente à encomenda ENC-001',
      encomenda_id: 'enc-1',
    },
  ];

  const encomendas: Encomenda[] = [
    {
      id: 'enc-1',
      codigo: 'ENC-001',
      cliente: 'Mariana Souza',
      whatsapp: '(66) 99912-4488',
      data_pedido: daysAgoISO(2),
      data_entrega: addDaysISO(formatDateISO(new Date()), 3),
      itens: [{ produto_id: 'prod-1', quantidade: 30, preco_unitario: 12.0 }],
      valor_total: 360.0,
      valor_sinal: 180.0,
      forma_pagamento_sinal: 'Pix',
      status: 'Confirmada',
      observacoes:
        'Caixinha presenteável com fita dourada para evento corporativo.',
    },
  ];

  return {
    version: 2,
    updated_at: new Date().toISOString(),
    config,
    insumos,
    compras,
    sub_receitas,
    sub_receita_itens,
    produtos,
    ficha_tecnica,
    producoes,
    vendas_fluxo,
    encomendas,
    ordens_planejadas: [],
  };
}

// ============================================================================
// 4. REPOSITÓRIO HÍBRIDO (LOCALSTORAGE + CONECTOR REST SUPABASE)
// ============================================================================

const ERPRepository = {
  load(): ERPDatabase {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = createSeedDatabase();
        this.save(seed);
        return seed;
      }
      const parsed = JSON.parse(raw) as ERPDatabase;
      if (!this.validate(parsed)) {
        const seed = createSeedDatabase();
        this.save(seed);
        return seed;
      }
      return parsed;
    } catch {
      const seed = createSeedDatabase();
      this.save(seed);
      return seed;
    }
  },

  save(db: ERPDatabase): void {
    try {
      const payload: ERPDatabase = {
        ...db,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  },

  validate(data: unknown): data is ERPDatabase {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      Array.isArray(d.insumos) &&
      Array.isArray(d.produtos) &&
      Array.isArray(d.ficha_tecnica) &&
      Array.isArray(d.producoes) &&
      Array.isArray(d.vendas_fluxo) &&
      Array.isArray(d.sub_receitas) &&
      Array.isArray(d.sub_receita_itens) &&
      Array.isArray(d.encomendas) &&
      typeof d.config === 'object' &&
      d.config !== null
    );
  },

  resetToSeed(): ERPDatabase {
    const seed = createSeedDatabase();
    this.save(seed);
    return seed;
  },

  async pushToSupabase(
    db: ERPDatabase
  ): Promise<{ ok: boolean; message: string }> {
    const { url, anon_key, table_name, workspace_id } = db.config.supabase;
    if (!url.trim() || !anon_key.trim()) {
      return {
        ok: false,
        message: 'Preencha SUPABASE_URL e SUPABASE_ANON_KEY.',
      };
    }
    try {
      const cleanUrl = url.replace(/\/+$/, '');
      const endpoint = `${cleanUrl}/rest/v1/${
        table_name || 'lua_de_mel_erp_snapshots'
      }`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon_key.trim(),
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          workspace_id: workspace_id || 'matriz-lua-de-mel',
          payload: db,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return {
          ok: false,
          message: `Erro HTTP ${res.status}: ${errText.slice(0, 140)}`,
        };
      }
      return {
        ok: true,
        message: 'Dados enviados para a nuvem Supabase com sucesso!',
      };
    } catch (err) {
      return {
        ok: false,
        message: `Falha de rede ao conectar ao Supabase: ${
          (err as Error).message
        }`,
      };
    }
  },

  async pullFromSupabase(
    cfg: SupabaseSyncConfig
  ): Promise<{ ok: boolean; message: string; data?: ERPDatabase }> {
    if (!cfg.url.trim() || !cfg.anon_key.trim()) {
      return {
        ok: false,
        message: 'Preencha SUPABASE_URL e SUPABASE_ANON_KEY.',
      };
    }
    try {
      const cleanUrl = cfg.url.replace(/\/+$/, '');
      const ws = encodeURIComponent(cfg.workspace_id || 'matriz-lua-de-mel');
      const endpoint = `${cleanUrl}/rest/v1/${
        cfg.table_name || 'lua_de_mel_erp_snapshots'
      }?workspace_id=eq.${ws}&select=payload,updated_at`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: cfg.anon_key.trim(),
        },
      });
      if (!res.ok) {
        const errText = await res.text();
        return {
          ok: false,
          message: `Erro HTTP ${res.status}: ${errText.slice(0, 140)}`,
        };
      }
      const rows = (await res.json()) as { payload?: ERPDatabase }[];
      if (!Array.isArray(rows) || rows.length === 0 || !rows[0].payload) {
        return {
          ok: false,
          message:
            'Nenhum snapshot encontrado para este workspace no Supabase.',
        };
      }
      if (!this.validate(rows[0].payload)) {
        return {
          ok: false,
          message: 'Snapshot remoto possui estrutura incompatível.',
        };
      }
      return {
        ok: true,
        message: 'Dados baixados e sincronizados da nuvem!',
        data: rows[0].payload,
      };
    } catch (err) {
      return {
        ok: false,
        message: `Falha de rede ao consultar o Supabase: ${
          (err as Error).message
        }`,
      };
    }
  },
};

// ============================================================================
// 5. COMPONENTES AUXILIARES DE UI
// ============================================================================

function StatusBadge({ status }: { status: StatusInsumo }) {
  if (status === 'REPOR') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <AlertCircle className="w-3.5 h-3.5" />
        REPOR
      </span>
    );
  }
  if (status === 'ATENCAO') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        ATENÇÃO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5" />
      OK
    </span>
  );
}

function ModalWrapper({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-2xl',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#291D18]/60 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200 max-h-[92vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-stone-200 bg-stone-50/80">
          <div>
            <h3 className="text-lg font-bold text-[#291D18]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-[#291D18] hover:bg-stone-200/70 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. COMPONENTE PRINCIPAL DA APLICAÇÃO
// ============================================================================

export default function App() {
  const [db, setDb] = useState<ERPDatabase>(() => ERPRepository.load());
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Modais globais
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [perdaModalOpen, setPerdaModalOpen] = useState(false);

  // Preloads entre telas
  const [quickCompraInsumoId, setQuickCompraInsumoId] = useState<string | null>(
    null
  );
  const [quickVendaProdutoId, setQuickVendaProdutoId] = useState<string | null>(
    null
  );
  const [quickProducaoPreload, setQuickProducaoPreload] = useState<{
    tipo_producao?: 'produto' | 'sub_receita';
    produto_id?: string;
    sub_receita_id?: string;
    multiplicador: number;
    ordem_id?: string;
    observacoes?: string;
  } | null>(null);

  useEffect(() => {
    ERPRepository.save(db);
  }, [db]);

  const addToast = (text: string, type: ToastMessage['type'] = 'success') => {
    const id = generateId('toast');
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const askConfirm = (opts: Omit<ConfirmState, 'open'>) => {
    setConfirmState({ ...opts, open: true });
  };

  // Mapas e métricas memoizadas
  const insumosMap = useMemo(
    () => new Map(db.insumos.map((i) => [i.id, i])),
    [db.insumos]
  );
  const subReceitasMap = useMemo(
    () => new Map(db.sub_receitas.map((s) => [s.id, s])),
    [db.sub_receitas]
  );
  const produtosMap = useMemo(
    () => new Map(db.produtos.map((p) => [p.id, p])),
    [db.produtos]
  );

  const subMetricasMap = useMemo(() => {
    const map = new Map<string, SubReceitaMetricas>();
    for (const s of db.sub_receitas) {
      map.set(
        s.id,
        calcularMetricasSubReceita(s, db.sub_receita_itens, insumosMap)
      );
    }
    return map;
  }, [db.sub_receitas, db.sub_receita_itens, insumosMap]);

  const produtoMetricasMap = useMemo(() => {
    const map = new Map<string, ProdutoMetricas>();
    for (const p of db.produtos) {
      map.set(
        p.id,
        calcularMetricasProduto(
          p,
          db.ficha_tecnica,
          insumosMap,
          subReceitasMap,
          subMetricasMap,
          db.config.percentual_rateio_indireto
        )
      );
    }
    return map;
  }, [
    db.produtos,
    db.ficha_tecnica,
    insumosMap,
    subReceitasMap,
    subMetricasMap,
    db.config.percentual_rateio_indireto,
  ]);

  const alertasCount = useMemo(
    () => db.insumos.filter((i) => getInsumoStatus(i) !== 'OK').length,
    [db.insumos]
  );

  // ==========================================================================
  // HANDLERS DE NEGÓCIO (INSUMOS, SUB-RECEITAS, PRODUÇÃO, VENDAS, ENCOMENDAS)
  // ==========================================================================

  const handleSaveInsumo = (insumo: Omit<Insumo, 'id'>, editId?: string) => {
    setDb((prev) => ({
      ...prev,
      insumos: editId
        ? prev.insumos.map((i) =>
            i.id === editId ? { ...insumo, id: editId } : i
          )
        : [...prev.insumos, { ...insumo, id: generateId('ins') }],
    }));
    addToast(editId ? 'Insumo atualizado!' : 'Novo insumo cadastrado!');
  };

  const handleDeleteInsumo = (insumo: Insumo) => {
    askConfirm({
      title: 'Excluir insumo?',
      description: `Tem certeza que deseja excluir "${insumo.nome}"? Ele também será removido das fichas técnicas e sub-receitas vinculadas.`,
      confirmLabel: 'Excluir Insumo',
      destructive: true,
      onConfirm: () => {
        setDb((prev) => ({
          ...prev,
          insumos: prev.insumos.filter((i) => i.id !== insumo.id),
          ficha_tecnica: prev.ficha_tecnica.filter(
            (f) => f.insumo_id !== insumo.id
          ),
          sub_receita_itens: prev.sub_receita_itens.filter(
            (s) => s.insumo_id !== insumo.id
          ),
        }));
        addToast('Insumo excluído.', 'info');
      },
    });
  };

  const handleRegisterCompra = (nova: Omit<Compra, 'id'>) => {
    setDb((prev) => {
      const insumo = prev.insumos.find((i) => i.id === nova.insumo_id);
      if (!insumo) return prev;

      const precoUnitarioCompra =
        nova.quantidade_comprada > 0
          ? nova.valor_total_pago / nova.quantidade_comprada
          : 0;
      const estoquePositivoAnterior = Math.max(0, insumo.estoque_atual);
      const novoEstoque = insumo.estoque_atual + nova.quantidade_comprada;

      let novoCustoMedio = insumo.custo_medio_unitario;
      if (prev.config.metodo_custeio === 'ultimo_preco') {
        novoCustoMedio = precoUnitarioCompra;
      } else {
        const denom = estoquePositivoAnterior + nova.quantidade_comprada;
        novoCustoMedio =
          denom > 0
            ? (estoquePositivoAnterior * insumo.custo_medio_unitario +
                nova.valor_total_pago) /
              denom
            : precoUnitarioCompra;
      }

      return {
        ...prev,
        compras: [{ ...nova, id: generateId('cmp') }, ...prev.compras],
        insumos: prev.insumos.map((i) =>
          i.id === insumo.id
            ? {
                ...i,
                estoque_atual: novoEstoque,
                custo_medio_unitario: novoCustoMedio,
              }
            : i
        ),
      };
    });
    addToast('Compra registrada e custo médio atualizado!');
  };

  const handleDeleteCompra = (compra: Compra) => {
    const insumo = insumosMap.get(compra.insumo_id);
    askConfirm({
      title: 'Estornar e excluir compra?',
      description: `O registro em "${compra.fornecedor}" será excluído e ${
        insumo
          ? formatQty(compra.quantidade_comprada, insumo.unidade)
          : compra.quantidade_comprada
      } serão descontados do estoque atual.`,
      confirmLabel: 'Estornar Compra',
      destructive: true,
      onConfirm: () => {
        setDb((prev) => ({
          ...prev,
          compras: prev.compras.filter((c) => c.id !== compra.id),
          insumos: prev.insumos.map((i) =>
            i.id === compra.insumo_id
              ? {
                  ...i,
                  estoque_atual: i.estoque_atual - compra.quantidade_comprada,
                }
              : i
          ),
        }));
        addToast('Compra estornada.', 'info');
      },
    });
  };

  // --- SUB-RECEITAS ---
  const handleSaveSubReceita = (
    subData: Omit<SubReceita, 'id'>,
    itens: { insumo_id: string; quantidade_usada: number }[],
    editId?: string
  ) => {
    const targetId = editId || generateId('sub');
    setDb((prev) => {
      const updatedSubs = editId
        ? prev.sub_receitas.map((s) =>
            s.id === editId ? { ...subData, id: editId } : s
          )
        : [...prev.sub_receitas, { ...subData, id: targetId }];
      const otherItens = prev.sub_receita_itens.filter(
        (i) => i.sub_receita_id !== targetId
      );
      const newItens: SubReceitaItem[] = itens
        .filter((i) => i.insumo_id && i.quantidade_usada > 0)
        .map((i) => ({
          id: generateId('sri'),
          sub_receita_id: targetId,
          insumo_id: i.insumo_id,
          quantidade_usada: i.quantidade_usada,
        }));
      return {
        ...prev,
        sub_receitas: updatedSubs,
        sub_receita_itens: [...otherItens, ...newItens],
      };
    });
    addToast(editId ? 'Sub-receita atualizada!' : 'Sub-receita cadastrada!');
  };

  const handleDeleteSubReceita = (sub: SubReceita) => {
    askConfirm({
      title: 'Excluir sub-receita?',
      description: `Deseja excluir a base "${sub.nome}"? Ela será removida das fichas técnicas onde estiver vinculada.`,
      confirmLabel: 'Excluir Sub-receita',
      destructive: true,
      onConfirm: () => {
        setDb((prev) => ({
          ...prev,
          sub_receitas: prev.sub_receitas.filter((s) => s.id !== sub.id),
          sub_receita_itens: prev.sub_receita_itens.filter(
            (i) => i.sub_receita_id !== sub.id
          ),
          ficha_tecnica: prev.ficha_tecnica.filter(
            (f) => f.sub_receita_id !== sub.id
          ),
        }));
        addToast('Sub-receita excluída.', 'info');
      },
    });
  };

  // --- PRODUTOS E BOM ---
  const handleSaveProdutoComFicha = (
    produtoData: Omit<Produto, 'id'>,
    itensFicha: {
      tipo_item: 'insumo' | 'sub_receita';
      insumo_id?: string;
      sub_receita_id?: string;
      quantidade_usada: number;
    }[],
    editId?: string
  ) => {
    const targetId = editId || generateId('prod');
    setDb((prev) => {
      const updatedProdutos = editId
        ? prev.produtos.map((p) =>
            p.id === editId ? { ...produtoData, id: editId } : p
          )
        : [...prev.produtos, { ...produtoData, id: targetId }];

      const otherFichas = prev.ficha_tecnica.filter(
        (f) => f.produto_id !== targetId
      );
      const newFichas: FichaTecnicaItem[] = itensFicha
        .filter(
          (item) =>
            item.quantidade_usada > 0 &&
            ((item.tipo_item === 'insumo' && item.insumo_id) ||
              (item.tipo_item === 'sub_receita' && item.sub_receita_id))
        )
        .map((item) => ({
          id: generateId('ft'),
          produto_id: targetId,
          tipo_item: item.tipo_item,
          insumo_id: item.tipo_item === 'insumo' ? item.insumo_id : undefined,
          sub_receita_id:
            item.tipo_item === 'sub_receita' ? item.sub_receita_id : undefined,
          quantidade_usada: item.quantidade_usada,
        }));

      return {
        ...prev,
        produtos: updatedProdutos,
        ficha_tecnica: [...otherFichas, ...newFichas],
      };
    });
    addToast(
      editId
        ? 'Produto e ficha técnica atualizados!'
        : 'Novo produto cadastrado!'
    );
  };

  const handleDeleteProduto = (produto: Produto) => {
    askConfirm({
      title: 'Excluir produto?',
      description: `Deseja excluir "${produto.nome}" e sua ficha técnica?`,
      confirmLabel: 'Excluir Produto',
      destructive: true,
      onConfirm: () => {
        setDb((prev) => ({
          ...prev,
          produtos: prev.produtos.filter((p) => p.id !== produto.id),
          ficha_tecnica: prev.ficha_tecnica.filter(
            (f) => f.produto_id !== produto.id
          ),
          ordens_planejadas: prev.ordens_planejadas.filter(
            (o) => o.produto_id !== produto.id
          ),
        }));
        addToast('Produto removido.', 'info');
      },
    });
  };

  // --- PRODUÇÃO (PRODUTOS FINAIS E SUB-RECEITAS COM EXPLOSÃO RECURSIVA) ---
  const handleRegisterProducao = (
    data: {
      data: string;
      data_validade: string;
      tipo_producao: 'produto' | 'sub_receita';
      produto_id?: string;
      sub_receita_id?: string;
      multiplicador_receita: number;
      unidades_reais_produzidas: number;
      observacoes: string;
      usar_saldo_sub_receita?: boolean;
    },
    ordemIdConcluida?: string
  ) => {
    setDb((prev) => {
      const lote_codigo = getNextLoteCode(prev.producoes);
      const consumoInsumoMap = new Map<string, number>();
      const consumoSubMap = new Map<string, number>();
      let custoLote = 0;

      if (data.tipo_producao === 'sub_receita' && data.sub_receita_id) {
        const subItens = prev.sub_receita_itens.filter(
          (i) => i.sub_receita_id === data.sub_receita_id
        );
        for (const si of subItens) {
          const qtd = si.quantidade_usada * data.multiplicador_receita;
          consumoInsumoMap.set(
            si.insumo_id,
            (consumoInsumoMap.get(si.insumo_id) || 0) + qtd
          );
          const ins = prev.insumos.find((i) => i.id === si.insumo_id);
          if (ins) custoLote += qtd * ins.custo_medio_unitario;
        }
      } else if (data.tipo_producao === 'produto' && data.produto_id) {
        const fichasProduto = prev.ficha_tecnica.filter(
          (f) => f.produto_id === data.produto_id
        );
        for (const f of fichasProduto) {
          const qtdNecessaria = f.quantidade_usada * data.multiplicador_receita;
          if (f.tipo_item === 'insumo' && f.insumo_id) {
            consumoInsumoMap.set(
              f.insumo_id,
              (consumoInsumoMap.get(f.insumo_id) || 0) + qtdNecessaria
            );
            const ins = prev.insumos.find((i) => i.id === f.insumo_id);
            if (ins) custoLote += qtdNecessaria * ins.custo_medio_unitario;
          } else if (f.tipo_item === 'sub_receita' && f.sub_receita_id) {
            const subObj = prev.sub_receitas.find(
              (s) => s.id === f.sub_receita_id
            );
            if (subObj) {
              const saldoSubUsado =
                data.usar_saldo_sub_receita !== false
                  ? Math.min(Math.max(0, subObj.estoque_pronto), qtdNecessaria)
                  : 0;
              if (saldoSubUsado > 0) {
                consumoSubMap.set(
                  subObj.id,
                  (consumoSubMap.get(subObj.id) || 0) + saldoSubUsado
                );
              }
              const restanteExplodir = Math.max(
                0,
                qtdNecessaria - saldoSubUsado
              );
              const fatorSub =
                subObj.rendimento_padrao > 0
                  ? restanteExplodir / subObj.rendimento_padrao
                  : 0;
              const subItens = prev.sub_receita_itens.filter(
                (si) => si.sub_receita_id === subObj.id
              );
              for (const si of subItens) {
                const qtdIns = si.quantidade_usada * fatorSub;
                consumoInsumoMap.set(
                  si.insumo_id,
                  (consumoInsumoMap.get(si.insumo_id) || 0) + qtdIns
                );
              }
              // Custo proporcional total da sub-receita usada
              const custoSubUnit =
                subObj.rendimento_padrao > 0
                  ? subItens.reduce((acc, si) => {
                      const ins = prev.insumos.find(
                        (i) => i.id === si.insumo_id
                      );
                      return (
                        acc +
                        (ins
                          ? si.quantidade_usada * ins.custo_medio_unitario
                          : 0)
                      );
                    }, 0) / subObj.rendimento_padrao
                  : 0;
              custoLote += qtdNecessaria * custoSubUnit;
            }
          }
        }
      }

      const novaProducao: Producao = {
        id: generateId('prd'),
        lote_codigo,
        data: data.data,
        data_validade: data.data_validade,
        tipo_producao: data.tipo_producao,
        produto_id: data.produto_id,
        sub_receita_id: data.sub_receita_id,
        multiplicador_receita: data.multiplicador_receita,
        unidades_reais_produzidas: data.unidades_reais_produzidas,
        observacoes: data.observacoes,
        custo_estimado_lote: custoLote,
      };

      return {
        ...prev,
        producoes: [novaProducao, ...prev.producoes],
        insumos: prev.insumos.map((i) => {
          const c = consumoInsumoMap.get(i.id);
          return c ? { ...i, estoque_atual: i.estoque_atual - c } : i;
        }),
        sub_receitas: prev.sub_receitas.map((s) => {
          let novoEstoque = s.estoque_pronto;
          const consumido = consumoSubMap.get(s.id) || 0;
          novoEstoque -= consumido;
          if (
            data.tipo_producao === 'sub_receita' &&
            data.sub_receita_id === s.id
          ) {
            novoEstoque += data.unidades_reais_produzidas;
          }
          return { ...s, estoque_pronto: novoEstoque };
        }),
        produtos:
          data.tipo_producao === 'produto' && data.produto_id
            ? prev.produtos.map((p) =>
                p.id === data.produto_id
                  ? {
                      ...p,
                      estoque_pronto:
                        p.estoque_pronto + data.unidades_reais_produzidas,
                    }
                  : p
              )
            : prev.produtos,
        ordens_planejadas: ordemIdConcluida
          ? prev.ordens_planejadas.filter((o) => o.id !== ordemIdConcluida)
          : prev.ordens_planejadas,
      };
    });
    addToast('Produção registrada e estoques atualizados!');
  };

  const handleEstornarProducao = (prod: Producao) => {
    askConfirm({
      title: `Estornar ${prod.lote_codigo}?`,
      description:
        'Os insumos consumidos pela receita serão devolvidos ao estoque e o saldo produzido será descontado.',
      confirmLabel: 'Confirmar Estorno',
      destructive: true,
      onConfirm: () => {
        setDb((prev) => {
          const devInsumos = new Map<string, number>();
          if (prod.tipo_producao === 'sub_receita' && prod.sub_receita_id) {
            const subItens = prev.sub_receita_itens.filter(
              (si) => si.sub_receita_id === prod.sub_receita_id
            );
            for (const si of subItens) {
              devInsumos.set(
                si.insumo_id,
                (devInsumos.get(si.insumo_id) || 0) +
                  si.quantidade_usada * prod.multiplicador_receita
              );
            }
          } else if (prod.produto_id) {
            const fichas = prev.ficha_tecnica.filter(
              (f) => f.produto_id === prod.produto_id
            );
            for (const f of fichas) {
              const qtd = f.quantidade_usada * prod.multiplicador_receita;
              if (f.tipo_item === 'insumo' && f.insumo_id) {
                devInsumos.set(
                  f.insumo_id,
                  (devInsumos.get(f.insumo_id) || 0) + qtd
                );
              } else if (f.tipo_item === 'sub_receita' && f.sub_receita_id) {
                const subObj = prev.sub_receitas.find(
                  (s) => s.id === f.sub_receita_id
                );
                if (subObj && subObj.rendimento_padrao > 0) {
                  const fator = qtd / subObj.rendimento_padrao;
                  const subItens = prev.sub_receita_itens.filter(
                    (si) => si.sub_receita_id === subObj.id
                  );
                  for (const si of subItens) {
                    devInsumos.set(
                      si.insumo_id,
                      (devInsumos.get(si.insumo_id) || 0) +
                        si.quantidade_usada * fator
                    );
                  }
                }
              }
            }
          }

          return {
            ...prev,
            producoes: prev.producoes.filter((p) => p.id !== prod.id),
            insumos: prev.insumos.map((i) => {
              const d = devInsumos.get(i.id);
              return d ? { ...i, estoque_atual: i.estoque_atual + d } : i;
            }),
            sub_receitas:
              prod.tipo_producao === 'sub_receita' && prod.sub_receita_id
                ? prev.sub_receitas.map((s) =>
                    s.id === prod.sub_receita_id
                      ? {
                          ...s,
                          estoque_pronto: Math.max(
                            0,
                            s.estoque_pronto - prod.unidades_reais_produzidas
                          ),
                        }
                      : s
                  )
                : prev.sub_receitas,
            produtos:
              prod.tipo_producao === 'produto' && prod.produto_id
                ? prev.produtos.map((p) =>
                    p.id === prod.produto_id
                      ? {
                          ...p,
                          estoque_pronto: Math.max(
                            0,
                            p.estoque_pronto - prod.unidades_reais_produzidas
                          ),
                        }
                      : p
                  )
                : prev.produtos,
          };
        });
        addToast(`${prod.lote_codigo} estornado com sucesso!`, 'info');
      },
    });
  };

  const handleResolverAlertaValidade = (prodId: string) => {
    setDb((prev) => ({
      ...prev,
      producoes: prev.producoes.map((p) =>
        p.id === prodId ? { ...p, alerta_validade_resolvido: true } : p
      ),
    }));
    addToast('Alerta de vencimento marcado como tratado.', 'info');
  };

  // --- BAIXA POR PERDA / DEGUSTAÇÃO / AVARIA ---
  const handleRegisterPerda = (payload: {
    alvo_tipo: 'produto' | 'insumo';
    alvo_id: string;
    quantidade: number;
    motivo: MotivoPerda;
    observacao: string;
  }) => {
    setDb((prev) => {
      let custoPerda = 0;
      let nomeAlvo = '';

      if (payload.alvo_tipo === 'produto') {
        const prod = prev.produtos.find((p) => p.id === payload.alvo_id);
        nomeAlvo = prod?.nome || 'Produto';
        const m = produtoMetricasMap.get(payload.alvo_id);
        custoPerda = (m?.custo_unitario_cmv || 0) * payload.quantidade;
      } else {
        const ins = prev.insumos.find((i) => i.id === payload.alvo_id);
        nomeAlvo = ins?.nome || 'Insumo';
        custoPerda = (ins?.custo_medio_unitario || 0) * payload.quantidade;
      }

      const registroPerda: VendaFluxo = {
        id: generateId('vf'),
        data: formatDateISO(new Date()),
        tipo: 'Perda / Avaria',
        produto_id:
          payload.alvo_tipo === 'produto' ? payload.alvo_id : undefined,
        quantidade: payload.quantidade,
        canal_ou_revendedor: `${payload.motivo} • ${nomeAlvo}`,
        status_pagamento: 'Pago',
        valor_total: 0, // Não infla faturamento
        valor_comissao: 0,
        taxa_pagamento_rs: 0,
        lucro_liquido: -Number(custoPerda.toFixed(2)),
        descricao: payload.observacao || `Baixa de estoque (${payload.motivo})`,
      };

      return {
        ...prev,
        vendas_fluxo: [registroPerda, ...prev.vendas_fluxo],
        produtos:
          payload.alvo_tipo === 'produto'
            ? prev.produtos.map((p) =>
                p.id === payload.alvo_id
                  ? {
                      ...p,
                      estoque_pronto: Math.max(
                        0,
                        p.estoque_pronto - payload.quantidade
                      ),
                    }
                  : p
              )
            : prev.produtos,
        insumos:
          payload.alvo_tipo === 'insumo'
            ? prev.insumos.map((i) =>
                i.id === payload.alvo_id
                  ? {
                      ...i,
                      estoque_atual: Math.max(
                        0,
                        i.estoque_atual - payload.quantidade
                      ),
                    }
                  : i
              )
            : prev.insumos,
      };
    });
    addToast(
      'Baixa por perda/degustação registrada no estoque e resultado!',
      'info'
    );
  };

  // --- VENDAS, ACERTO CONSIGNADO E FLUXO DE CAIXA ---
  const handleRegisterVendaFluxo = (novo: Omit<VendaFluxo, 'id'>) => {
    setDb((prev) => {
      const registro: VendaFluxo = { ...novo, id: generateId('vf') };
      const shouldDeductStock =
        (novo.tipo === 'Venda Direta' || novo.tipo === 'Venda Revendedor') &&
        novo.produto_id;

      return {
        ...prev,
        vendas_fluxo: [registro, ...prev.vendas_fluxo],
        produtos: shouldDeductStock
          ? prev.produtos.map((p) =>
              p.id === novo.produto_id
                ? {
                    ...p,
                    estoque_pronto: Math.max(
                      0,
                      p.estoque_pronto - novo.quantidade
                    ),
                  }
                : p
            )
          : prev.produtos,
      };
    });
    addToast(
      novo.tipo === 'Despesa Operacional'
        ? 'Despesa registrada no caixa!'
        : 'Venda registrada com desconto automático de taxas e estoque!'
    );
  };

  const handleMarcarComoPago = (id: string) => {
    setDb((prev) => ({
      ...prev,
      vendas_fluxo: prev.vendas_fluxo.map((v) =>
        v.id === id ? { ...v, status_pagamento: 'Pago' } : v
      ),
    }));
    addToast('Pagamento confirmado!');
  };

  const handleAcertoConsignacao = (
    venda: VendaFluxo,
    acerto: {
      qtd_vendida: number;
      qtd_devolvida: number;
      qtd_avaria: number;
      forma_pagamento: FormaPagamentoVenda;
    }
  ) => {
    setDb((prev) => {
      const prod = venda.produto_id
        ? prev.produtos.find((p) => p.id === venda.produto_id)
        : null;
      const precoUnit =
        venda.quantidade > 0
          ? venda.valor_total / venda.quantidade
          : prod?.preco_venda || 0;
      const pctComissao =
        venda.valor_total > 0
          ? (venda.valor_comissao / venda.valor_total) * 100
          : prod?.comissao_revendedor_pct || 0;

      const novoValorBruto = Number(
        (acerto.qtd_vendida * precoUnit).toFixed(2)
      );
      const novaComissao = Number(
        ((novoValorBruto * pctComissao) / 100).toFixed(2)
      );
      const taxaPct = prev.config.taxas_pagamento[acerto.forma_pagamento] || 0;
      const novaTaxa = Number(((novoValorBruto * taxaPct) / 100).toFixed(2));
      const custoUnit = venda.produto_id
        ? produtoMetricasMap.get(venda.produto_id)?.custo_unitario_cmv || 0
        : 0;

      // Custo das unidades vendidas + custo das avariadas no revendedor
      const custoTotalReal =
        custoUnit * (acerto.qtd_vendida + acerto.qtd_avaria);
      const novoLucroLiquido = Number(
        (novoValorBruto - novaComissao - novaTaxa - custoTotalReal).toFixed(2)
      );

      return {
        ...prev,
        vendas_fluxo: prev.vendas_fluxo.map((v) =>
          v.id === venda.id
            ? {
                ...v,
                quantidade: acerto.qtd_vendida,
                forma_pagamento: acerto.forma_pagamento,
                status_pagamento: 'Pago',
                valor_total: novoValorBruto,
                valor_comissao: novaComissao,
                taxa_pagamento_rs: novaTaxa,
                lucro_liquido: novoLucroLiquido,
                descricao: `Acerto consignado: ${acerto.qtd_vendida} vendidas, ${acerto.qtd_devolvida} devolvidas ao estoque, ${acerto.qtd_avaria} avaria(s).`,
              }
            : v
        ),
        produtos:
          venda.produto_id && acerto.qtd_devolvida > 0
            ? prev.produtos.map((p) =>
                p.id === venda.produto_id
                  ? {
                      ...p,
                      estoque_pronto: p.estoque_pronto + acerto.qtd_devolvida,
                    }
                  : p
              )
            : prev.produtos,
      };
    });
    addToast(
      'Acerto de consignação concluído! Estoque e comissão recalculados.'
    );
  };

  const handleDeleteVendaFluxo = (item: VendaFluxo) => {
    const isVenda =
      (item.tipo === 'Venda Direta' || item.tipo === 'Venda Revendedor') &&
      item.produto_id;
    askConfirm({
      title: 'Excluir lançamento financeiro?',
      description: isVenda
        ? `O lançamento de ${formatBRL(item.valor_total)} será excluído e ${
            item.quantidade
          } un retornarão à pronta entrega.`
        : `O lançamento de ${formatBRL(
            Math.abs(item.lucro_liquido)
          )} será removido do extrato.`,
      confirmLabel: 'Excluir Lançamento',
      destructive: true,
      onConfirm: () => {
        setDb((prev) => ({
          ...prev,
          vendas_fluxo: prev.vendas_fluxo.filter((v) => v.id !== item.id),
          produtos: isVenda
            ? prev.produtos.map((p) =>
                p.id === item.produto_id
                  ? { ...p, estoque_pronto: p.estoque_pronto + item.quantidade }
                  : p
              )
            : prev.produtos,
        }));
        addToast('Lançamento excluído.', 'info');
      },
    });
  };

  // --- AGENDA DE ENCOMENDAS (MRP -> ENCOMENDA -> CAIXA -> ENTREGA) ---
  const handleCreateEncomenda = (nova: Omit<Encomenda, 'id' | 'codigo'>) => {
    setDb((prev) => {
      const codigo = getNextEncomendaCode(prev.encomendas);
      const id = generateId('enc');
      const encomendaCompleta: Encomenda = { ...nova, id, codigo };

      // Se houve sinal pago > 0, lança entrada no fluxo de caixa
      const taxaPct =
        prev.config.taxas_pagamento[nova.forma_pagamento_sinal] || 0;
      const taxaSinal = Number(((nova.valor_sinal * taxaPct) / 100).toFixed(2));
      const movimentosExtra: VendaFluxo[] =
        nova.valor_sinal > 0
          ? [
              {
                id: generateId('vf'),
                data: nova.data_pedido,
                tipo: 'Sinal Encomenda',
                quantidade: 1,
                canal_ou_revendedor: `${nova.cliente} (${codigo})`,
                forma_pagamento: nova.forma_pagamento_sinal,
                status_pagamento: 'Pago',
                valor_total: nova.valor_sinal,
                valor_comissao: 0,
                taxa_pagamento_rs: taxaSinal,
                lucro_liquido: Number(
                  (nova.valor_sinal - taxaSinal).toFixed(2)
                ),
                descricao: `Sinal recebido na encomenda ${codigo}`,
                encomenda_id: id,
              },
            ]
          : [];

      return {
        ...prev,
        encomendas: [encomendaCompleta, ...prev.encomendas],
        vendas_fluxo: [...movimentosExtra, ...prev.vendas_fluxo],
      };
    });
    addToast('Encomenda salva na agenda e sinal registrado no caixa!');
  };

  const handleUpdateEncomendaStatus = (
    encomenda: Encomenda,
    novoStatus: StatusEncomenda,
    formaPagamentoSaldo: FormaPagamentoVenda = 'Pix'
  ) => {
    setDb((prev) => {
      let updatedVendas = [...prev.vendas_fluxo];
      let updatedProdutos = [...prev.produtos];

      // Ao marcar como Entregue (se ainda não estava Entregue):
      // 1) Baixa o estoque pronto dos itens entregues
      // 2) Lança o saldo restante (e ajusta o resultado descontando CMV total da encomenda)
      if (novoStatus === 'Entregue' && encomenda.status !== 'Entregue') {
        const saldoRestante = Math.max(
          0,
          encomenda.valor_total - encomenda.valor_sinal
        );
        const taxaPct = prev.config.taxas_pagamento[formaPagamentoSaldo] || 0;
        const taxaSaldo = Number(((saldoRestante * taxaPct) / 100).toFixed(2));

        let cmvTotalEncomenda = 0;
        for (const item of encomenda.itens) {
          const m = produtoMetricasMap.get(item.produto_id);
          cmvTotalEncomenda += (m?.custo_unitario_cmv || 0) * item.quantidade;
          updatedProdutos = updatedProdutos.map((p) =>
            p.id === item.produto_id
              ? {
                  ...p,
                  estoque_pronto: Math.max(
                    0,
                    p.estoque_pronto - item.quantidade
                  ),
                }
              : p
          );
        }

        updatedVendas = [
          {
            id: generateId('vf'),
            data: formatDateISO(new Date()),
            tipo: 'Venda Direta',
            quantidade: encomenda.itens.reduce(
              (acc, i) => acc + i.quantidade,
              0
            ),
            canal_ou_revendedor: `${encomenda.cliente} (Saldo ${encomenda.codigo})`,
            forma_pagamento: formaPagamentoSaldo,
            status_pagamento: 'Pago',
            valor_total: saldoRestante,
            valor_comissao: 0,
            taxa_pagamento_rs: taxaSaldo,
            lucro_liquido: Number(
              (saldoRestante - taxaSaldo - cmvTotalEncomenda).toFixed(2)
            ),
            descricao: `Fechamento e entrega da encomenda ${encomenda.codigo} (CMV total descontado)`,
            encomenda_id: encomenda.id,
          },
          ...updatedVendas,
        ];
      }

      return {
        ...prev,
        encomendas: prev.encomendas.map((e) =>
          e.id === encomenda.id ? { ...e, status: novoStatus } : e
        ),
        vendas_fluxo: updatedVendas,
        produtos: updatedProdutos,
      };
    });

    addToast(
      novoStatus === 'Entregue'
        ? `Encomenda ${encomenda.codigo} entregue! Saldo lançado e estoque baixado.`
        : `Status da ${encomenda.codigo} atualizado para ${novoStatus}.`
    );
  };

  const handleDeleteEncomenda = (enc: Encomenda) => {
    askConfirm({
      title: `Excluir ${enc.codigo}?`,
      description: `Deseja remover a encomenda de "${enc.cliente}" da agenda?`,
      confirmLabel: 'Excluir Encomenda',
      destructive: true,
      onConfirm: () => {
        setDb((prev) => ({
          ...prev,
          encomendas: prev.encomendas.filter((e) => e.id !== enc.id),
        }));
        addToast('Encomenda removida.', 'info');
      },
    });
  };

  // --- ORDENS PLANEJADAS (MRP -> PRODUÇÃO) ---
  const handleAddOrdensPlanejadas = (
    ordens: Omit<OrdemPlanejada, 'id' | 'criado_em'>[]
  ) => {
    if (ordens.length === 0) return;
    const now = new Date().toISOString();
    const novas: OrdemPlanejada[] = ordens.map((o) => ({
      ...o,
      id: generateId('ord'),
      criado_em: now,
    }));
    setDb((prev) => ({
      ...prev,
      ordens_planejadas: [...novas, ...prev.ordens_planejadas],
    }));
    addToast(`${novas.length} ordem(ns) enviada(s) para a fila de Produção!`);
  };

  const handleDeleteOrdemPlanejada = (id: string) => {
    setDb((prev) => ({
      ...prev,
      ordens_planejadas: prev.ordens_planejadas.filter((o) => o.id !== id),
    }));
    addToast('Ordem removida da fila.', 'info');
  };

  // --- CONFIGURAÇÕES, SUPABASE E BACKUP ---
  const handleUpdateConfig = (partial: Partial<AppConfig>) => {
    setDb((prev) => ({
      ...prev,
      config: { ...prev.config, ...partial },
    }));
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lua-de-mel-backup-${formatDateISO(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Backup JSON exportado!');
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!ERPRepository.validate(parsed)) {
          addToast('Arquivo JSON inválido ou incompatível.', 'error');
          return;
        }
        setDb(parsed);
        setSettingsOpen(false);
        addToast('Backup restaurado com sucesso!');
      } catch {
        addToast('Não foi possível ler o arquivo JSON.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSeed = () => {
    askConfirm({
      title: 'Restaurar dados iniciais?',
      description:
        'Os dados atuais serão substituídos pelos dados completos de demonstração da Lua de Mel.',
      confirmLabel: 'Restaurar Dados',
      destructive: true,
      onConfirm: () => {
        const fresh = ERPRepository.resetToSeed();
        setDb(fresh);
        setSettingsOpen(false);
        addToast('Dados iniciais restaurados!', 'info');
      },
    });
  };

  const encomendasAtivasCount = useMemo(
    () => db.encomendas.filter((e) => e.status !== 'Entregue').length,
    [db.encomendas]
  );

  const navItems: {
    key: TabKey;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Início',
      icon: LayoutDashboard,
    },
    {
      key: 'planejador',
      label: 'MRP & Encomendas',
      shortLabel: 'MRP/Enc.',
      icon: ClipboardList,
      badge: encomendasAtivasCount || undefined,
    },
    {
      key: 'producao',
      label: 'Produção & Bases',
      shortLabel: 'Produção',
      icon: Flame,
      badge: db.ordens_planejadas.length || undefined,
    },
    {
      key: 'vendas',
      label: 'Vendas & Caixa',
      shortLabel: 'Caixa',
      icon: Wallet,
    },
    {
      key: 'produtos',
      label: 'Produtos & BOM',
      shortLabel: 'Produtos',
      icon: Cookie,
    },
    {
      key: 'estoque',
      label: 'Estoque & Compras',
      shortLabel: 'Estoque',
      icon: Package,
      badge: alertasCount || undefined,
    },
  ];

  const activeNavObj = navItems.find((n) => n.key === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-800 flex flex-col lg:flex-row">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#291D18] text-stone-100 border-r border-stone-800 z-30">
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-950/40 shrink-0">
              <Cookie className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg leading-tight tracking-tight text-amber-50 truncate">
                Lua de Mel
              </h1>
              <p className="text-[11px] text-amber-300/80 font-medium tracking-wide uppercase">
                ERP Artesanal 2.0
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950/30'
                    : 'text-stone-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge ? (
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Ações Rápidas Sidebar */}
        <div className="p-3 border-t border-white/10 space-y-1.5">
          <button
            type="button"
            onClick={() => setPerdaModalOpen(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-200 hover:bg-white/10 transition-colors"
          >
            <BadgeAlert className="w-5 h-5 text-amber-400" />
            <span>Baixa Perda / Amostra</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-amber-400" />
              <span>Config. & Nuvem</span>
            </span>
            {db.config.supabase.url ? (
              <Cloud className="w-4 h-4 text-emerald-400" />
            ) : (
              <CloudOff className="w-4 h-4 text-stone-500" />
            )}
          </button>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#291D18] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center shrink-0">
            <Cookie className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-amber-300/90 font-semibold leading-none">
              Lua de Mel
            </p>
            <h1 className="text-base font-bold leading-tight truncate">
              {activeNavObj.label}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPerdaModalOpen(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200"
            aria-label="Registrar perda ou degustação"
            title="Registrar Perda / Amostra"
          >
            <BadgeAlert className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200"
            aria-label="Configurações e Nuvem"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          {activeTab === 'dashboard' && (
            <DashboardView
              db={db}
              produtosMap={produtosMap}
              produtoMetricasMap={produtoMetricasMap}
              onGoComprarInsumo={(insumoId) => {
                setQuickCompraInsumoId(insumoId);
                setActiveTab('estoque');
              }}
              onGoVenderProduto={(produtoId) => {
                setQuickVendaProdutoId(produtoId);
                setActiveTab('vendas');
              }}
              onGoProduzirProduto={(produtoId) => {
                setQuickProducaoPreload({
                  tipo_producao: 'produto',
                  produto_id: produtoId,
                  multiplicador: 1,
                });
                setActiveTab('producao');
              }}
              onOpenPerda={() => setPerdaModalOpen(true)}
              onResolverValidade={handleResolverAlertaValidade}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'planejador' && (
            <PlanejadorEncomendasView
              db={db}
              insumosMap={insumosMap}
              subReceitasMap={subReceitasMap}
              produtosMap={produtosMap}
              produtoMetricasMap={produtoMetricasMap}
              onToast={addToast}
              onConverterOrdens={(ordens) => {
                handleAddOrdensPlanejadas(ordens);
                setActiveTab('producao');
              }}
              onCreateEncomenda={handleCreateEncomenda}
              onUpdateEncomendaStatus={handleUpdateEncomendaStatus}
              onDeleteEncomenda={handleDeleteEncomenda}
            />
          )}

          {activeTab === 'producao' && (
            <ProducaoView
              db={db}
              insumosMap={insumosMap}
              subReceitasMap={subReceitasMap}
              subMetricasMap={subMetricasMap}
              produtosMap={produtosMap}
              produtoMetricasMap={produtoMetricasMap}
              preload={quickProducaoPreload}
              onClearPreload={() => setQuickProducaoPreload(null)}
              onRegisterProducao={handleRegisterProducao}
              onEstornarProducao={handleEstornarProducao}
              onDeleteOrdem={handleDeleteOrdemPlanejada}
              onSaveSubReceita={handleSaveSubReceita}
              onDeleteSubReceita={handleDeleteSubReceita}
              onOpenPerda={() => setPerdaModalOpen(true)}
            />
          )}

          {activeTab === 'vendas' && (
            <VendasCaixaView
              db={db}
              produtosMap={produtosMap}
              produtoMetricasMap={produtoMetricasMap}
              preloadProdutoId={quickVendaProdutoId}
              onClearPreload={() => setQuickVendaProdutoId(null)}
              onRegister={handleRegisterVendaFluxo}
              onMarcarPago={handleMarcarComoPago}
              onAcertoConsignacao={handleAcertoConsignacao}
              onDelete={handleDeleteVendaFluxo}
            />
          )}

          {activeTab === 'produtos' && (
            <ProdutosBOMView
              db={db}
              insumosMap={insumosMap}
              subReceitasMap={subReceitasMap}
              subMetricasMap={subMetricasMap}
              produtoMetricasMap={produtoMetricasMap}
              onSaveProdutoComFicha={handleSaveProdutoComFicha}
              onDeleteProduto={handleDeleteProduto}
            />
          )}

          {activeTab === 'estoque' && (
            <EstoqueComprasView
              db={db}
              insumosMap={insumosMap}
              preloadCompraInsumoId={quickCompraInsumoId}
              onClearPreload={() => setQuickCompraInsumoId(null)}
              onSaveInsumo={handleSaveInsumo}
              onDeleteInsumo={handleDeleteInsumo}
              onRegisterCompra={handleRegisterCompra}
              onDeleteCompra={handleDeleteCompra}
              onOpenPerda={() => setPerdaModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* BARRA DE NAVEGAÇÃO INFERIOR MOBILE */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(41,29,24,0.08)]">
        <div className="grid grid-cols-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`relative flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                  active
                    ? 'text-amber-600'
                    : 'text-stone-500 hover:text-[#291D18]'
                }`}
              >
                {active && (
                  <span className="absolute top-0 inset-x-3 h-0.5 bg-amber-600 rounded-b-full" />
                )}
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-semibold mt-1 truncate max-w-full">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MODAL BAIXA POR PERDA / DEGUSTAÇÃO / AVARIA */}
      <PerdaAvariaModal
        open={perdaModalOpen}
        onClose={() => setPerdaModalOpen(false)}
        produtos={db.produtos}
        insumos={db.insumos}
        produtoMetricasMap={produtoMetricasMap}
        onConfirm={handleRegisterPerda}
      />

      {/* MODAL CONFIGURAÇÕES, TAXAS, PIX & SINCRONIZAÇÃO SUPABASE */}
      <SettingsCloudModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        db={db}
        onUpdateConfig={handleUpdateConfig}
        onReplaceDb={(newDb) => setDb(newDb)}
        onExport={handleExportBackup}
        onImport={handleImportBackup}
        onReset={handleResetSeed}
        onToast={addToast}
      />

      {/* MODAL CONFIRMAÇÃO */}
      <ModalWrapper
        open={confirmState.open}
        onClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        title={confirmState.title}
        maxWidth="max-w-md"
      >
        <p className="text-sm text-stone-600 leading-relaxed">
          {confirmState.description}
        </p>
        <div className="flex justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={() => setConfirmState((s) => ({ ...s, open: false }))}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              confirmState.onConfirm();
              setConfirmState((s) => ({ ...s, open: false }));
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
              confirmState.destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {confirmState.confirmLabel || 'Confirmar'}
          </button>
        </div>
      </ModalWrapper>

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed top-16 lg:top-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
              t.type === 'success'
                ? 'bg-[#291D18] text-amber-50 border-amber-600/40'
                : t.type === 'error'
                ? 'bg-red-700 text-white border-red-800'
                : t.type === 'warning'
                ? 'bg-amber-100 text-amber-950 border-amber-300'
                : 'bg-white text-[#291D18] border-stone-200'
            }`}
          >
            {t.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            {t.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            {t.type === 'warning' && (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            {t.type === 'info' && (
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TELA 1: DASHBOARD EXECUTIVO (KPIs + BREAK-EVEN + ALERTAS VALIDADE FEFO)
// ============================================================================

function DashboardView({
  db,
  produtosMap,
  produtoMetricasMap,
  onGoComprarInsumo,
  onGoVenderProduto,
  onGoProduzirProduto,
  onOpenPerda,
  onResolverValidade,
  onNavigateTab,
}: {
  db: ERPDatabase;
  produtosMap: Map<string, Produto>;
  produtoMetricasMap: Map<string, ProdutoMetricas>;
  onGoComprarInsumo: (insumoId: string) => void;
  onGoVenderProduto: (produtoId: string) => void;
  onGoProduzirProduto: (produtoId: string) => void;
  onOpenPerda: () => void;
  onResolverValidade: (prodId: string) => void;
  onNavigateTab: (tab: TabKey) => void;
}) {
  const [periodo, setPeriodo] = useState<'30d' | 'mes' | 'todos'>('30d');

  const vendasFiltradas = useMemo(() => {
    const hoje = new Date();
    const anoMesAtual = `${hoje.getFullYear()}-${String(
      hoje.getMonth() + 1
    ).padStart(2, '0')}`;
    const limite30d = daysAgoISO(30);

    return db.vendas_fluxo.filter((v) => {
      if (periodo === 'todos') return true;
      if (periodo === 'mes') return v.data.startsWith(anoMesAtual);
      return v.data >= limite30d;
    });
  }, [db.vendas_fluxo, periodo]);

  const kpis = useMemo(() => {
    const isReceita = (t: TipoMovimentoCaixa) =>
      t === 'Venda Direta' ||
      t === 'Venda Revendedor' ||
      t === 'Sinal Encomenda';

    const faturamentoBruto = vendasFiltradas
      .filter((v) => isReceita(v.tipo))
      .reduce((acc, v) => acc + v.valor_total, 0);

    const lucroLiquido = vendasFiltradas.reduce(
      (acc, v) => acc + v.lucro_liquido,
      0
    );

    const valorImobilizadoInsumos = db.insumos.reduce(
      (acc, i) => acc + Math.max(0, i.estoque_atual) * i.custo_medio_unitario,
      0
    );

    const valoresAReceberConsignado = db.vendas_fluxo
      .filter(
        (v) => isReceita(v.tipo) && v.status_pagamento === 'Pendente/Consignado'
      )
      .reduce((acc, v) => acc + v.valor_total, 0);

    const saldoEncomendasAReceber = db.encomendas
      .filter((e) => e.status !== 'Entregue')
      .reduce((acc, e) => acc + Math.max(0, e.valor_total - e.valor_sinal), 0);

    return {
      faturamentoBruto,
      lucroLiquido,
      valorImobilizadoInsumos,
      valoresAReceberTotal: valoresAReceberConsignado + saldoEncomendasAReceber,
      valoresAReceberConsignado,
      saldoEncomendasAReceber,
    };
  }, [vendasFiltradas, db.insumos, db.vendas_fluxo, db.encomendas]);

  // Cálculo de Ponto de Equilíbrio (Break-Even Mensal)
  const breakEven = useMemo(() => {
    const hoje = new Date();
    const anoMesAtual = `${hoje.getFullYear()}-${String(
      hoje.getMonth() + 1
    ).padStart(2, '0')}`;
    const movMes = db.vendas_fluxo.filter((v) =>
      v.data.startsWith(anoMesAtual)
    );

    const despesasFixasMes = movMes
      .filter((v) => v.tipo === 'Despesa Operacional')
      .reduce((acc, v) => acc + v.valor_total, 0);

    const faturamentoMes = movMes
      .filter(
        (v) =>
          v.tipo === 'Venda Direta' ||
          v.tipo === 'Venda Revendedor' ||
          v.tipo === 'Sinal Encomenda'
      )
      .reduce((acc, v) => acc + v.valor_total, 0);

    // Margem de contribuição média ponderada dos produtos cadastrados
    const margens = Array.from(produtoMetricasMap.values()).map(
      (m) => m.margem_contribuicao_pct
    );
    const margemMediaPct =
      margens.length > 0
        ? margens.reduce((a, b) => a + b, 0) / margens.length
        : 60;

    const pontoEquilibrioFaturamento =
      margemMediaPct > 0
        ? despesasFixasMes / (margemMediaPct / 100)
        : despesasFixasMes;

    const progressoPct =
      pontoEquilibrioFaturamento > 0
        ? Math.min(100, (faturamentoMes / pontoEquilibrioFaturamento) * 100)
        : 100;

    const faltaFaturar = Math.max(
      0,
      pontoEquilibrioFaturamento - faturamentoMes
    );

    return {
      despesasFixasMes,
      faturamentoMes,
      margemMediaPct,
      pontoEquilibrioFaturamento,
      progressoPct,
      faltaFaturar,
    };
  }, [db.vendas_fluxo, produtoMetricasMap]);

  // Lotes vencendo em até 48h (FEFO)
  const lotesVencendo = useMemo(() => {
    return db.producoes
      .filter((p) => !p.alerta_validade_resolvido && p.data_validade)
      .map((p) => {
        const diasRestantes = daysUntilISO(p.data_validade);
        const prod = p.produto_id ? produtosMap.get(p.produto_id) : null;
        return { prodObj: p, produto: prod, diasRestantes };
      })
      .filter((x) => {
        if (x.diasRestantes > 2) return false;
        if (
          x.prodObj.tipo_producao === 'produto' &&
          x.produto &&
          x.produto.estoque_pronto <= 0
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [db.producoes, produtosMap]);

  const chartData = useMemo(() => {
    const map = new Map<
      string,
      { dataISO: string; label: string; faturamento: number; lucro: number }
    >();
    for (const v of vendasFiltradas) {
      const existing = map.get(v.data) || {
        dataISO: v.data,
        label: v.data.slice(8, 10) + '/' + v.data.slice(5, 7),
        faturamento: 0,
        lucro: 0,
      };
      if (
        v.tipo === 'Venda Direta' ||
        v.tipo === 'Venda Revendedor' ||
        v.tipo === 'Sinal Encomenda'
      ) {
        existing.faturamento += v.valor_total;
      }
      existing.lucro += v.lucro_liquido;
      map.set(v.data, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => a.dataISO.localeCompare(b.dataISO))
      .map((item) => ({
        ...item,
        faturamento: Number(item.faturamento.toFixed(2)),
        lucro: Number(item.lucro.toFixed(2)),
      }));
  }, [vendasFiltradas]);

  const alertasInsumos = useMemo(() => {
    return db.insumos
      .filter((i) => getInsumoStatus(i) !== 'OK')
      .sort((a, b) => {
        const score = (s: StatusInsumo) => (s === 'REPOR' ? 0 : 1);
        return score(getInsumoStatus(a)) - score(getInsumoStatus(b));
      });
  }, [db.insumos]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#291D18] tracking-tight">
            Dashboard Executivo
          </h2>
          <p className="text-sm text-stone-500">
            Saúde financeira real, ponto de equilíbrio, validade de lotes e
            reposição de estoque.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenPerda}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:border-amber-500 hover:text-[#291D18] transition-colors inline-flex items-center gap-1.5"
          >
            <BadgeAlert className="w-4 h-4 text-amber-600" />
            Registrar Perda / Amostra
          </button>
          <div className="inline-flex bg-white border border-stone-200 rounded-xl p-1 shadow-xs">
            {(
              [
                { id: '30d', label: '30 dias' },
                { id: 'mes', label: 'Mês Atual' },
                { id: 'todos', label: 'Tudo' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriodo(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  periodo === opt.id
                    ? 'bg-[#291D18] text-amber-50'
                    : 'text-stone-600 hover:text-[#291D18]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerta FEFO: Lotes Vencendo em até 48h */}
      {lotesVencendo.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#291D18]">
                Alerta FEFO: Lote(s) próximos do vencimento (até 48h)
              </h3>
              <div className="mt-1 space-y-1">
                {lotesVencendo.map(({ prodObj, produto, diasRestantes }) => (
                  <p key={prodObj.id} className="text-xs text-amber-950">
                    <strong>{prodObj.lote_codigo}</strong> —{' '}
                    {produto?.nome || 'Sub-receita'} • Validade:{' '}
                    <strong>{formatDateBR(prodObj.data_validade)}</strong> (
                    {diasRestantes < 0
                      ? `Vencido há ${Math.abs(diasRestantes)}d`
                      : diasRestantes === 0
                      ? 'Vence HOJE'
                      : `Vence em ${diasRestantes} dia(s)`}
                    ) • Pronto em estoque:{' '}
                    <strong>{produto?.estoque_pronto ?? '-'} un</strong>
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('vendas')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700"
            >
              Lançar Venda / Promoção
            </button>
            <button
              type="button"
              onClick={() => onResolverValidade(lotesVencendo[0].prodObj.id)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Dispensar Alerta
            </button>
          </div>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Faturamento Bruto
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#291D18] mt-3">
            {formatBRL(kpis.faturamentoBruto)}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Vendas diretas, revenda e sinais
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Lucro Líquido Real
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p
            className={`text-2xl font-bold mt-3 ${
              kpis.lucroLiquido >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatBRL(kpis.lucroLiquido)}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Descontado CMV, taxas, comissões, perdas e fixos
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Imobilizado em Insumos
            </span>
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-[#291D18] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#291D18] mt-3">
            {formatBRL(kpis.valorImobilizadoInsumos)}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {db.insumos.length} itens monitorados
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              A Receber (Consig. + Enc.)
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-3">
            {formatBRL(kpis.valoresAReceberTotal)}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Consignado: {formatBRL(kpis.valoresAReceberConsignado)} • Enc.:{' '}
            {formatBRL(kpis.saldoEncomendasAReceber)}
          </p>
        </div>
      </div>

      {/* Card de Ponto de Equilíbrio (Break-Even Mensal) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#291D18] text-amber-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#291D18]">
                Ponto de Equilíbrio Mensal (Break-Even)
              </h3>
              <p className="text-xs text-stone-500">
                Despesas fixas do mês:{' '}
                <strong>{formatBRL(breakEven.despesasFixasMes)}</strong> •
                Margem de contribuição média:{' '}
                <strong>{breakEven.margemMediaPct.toFixed(1)}%</strong>
              </p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <span className="text-xs text-stone-500 block">
              Meta de Faturamento p/ Empatar
            </span>
            <strong className="text-lg font-bold text-[#291D18]">
              {formatBRL(breakEven.pontoEquilibrioFaturamento)}
            </strong>
          </div>
        </div>

        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              breakEven.faltaFaturar === 0 ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
            style={{ width: `${breakEven.progressoPct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs">
          <span className="text-stone-600">
            Faturado no mês:{' '}
            <strong>{formatBRL(breakEven.faturamentoMes)}</strong> (
            {breakEven.progressoPct.toFixed(0)}%)
          </span>
          {breakEven.faltaFaturar === 0 ? (
            <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Custos fixos do mês 100% cobertos!
            </span>
          ) : (
            <span className="font-semibold text-amber-800">
              Faltam <strong>{formatBRL(breakEven.faltaFaturar)}</strong> em
              vendas para atingir o ponto de equilíbrio
            </span>
          )}
        </div>
      </div>

      {/* Gráfico + Alertas Urgentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#291D18]">
                Faturamento Bruto x Lucro Líquido Real
              </h3>
              <p className="text-xs text-stone-500">
                Receitas versus resultado líquido após taxas, comissões, perdas
                e despesas
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('vendas')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
            >
              Ver extrato <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-stone-400">
                Sem movimentações no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E7E5E4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#78716C' }}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#78716C' }}
                    axisLine={false}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatBRL(value)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E7E5E4',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="faturamento"
                    name="Faturamento Bruto"
                    fill="#D97706"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="lucro"
                    name="Lucro Líquido Real"
                    fill="#291D18"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Compras Urgentes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-[#291D18] leading-tight">
                  Compras Urgentes
                </h3>
                <p className="text-xs text-stone-500">
                  Insumos em REPOR ou ATENÇÃO
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {alertasInsumos.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-72 pr-1">
            {alertasInsumos.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-700">
                  Estoque saudável!
                </p>
                <p className="text-xs text-stone-500">
                  Nenhum insumo abaixo do mínimo.
                </p>
              </div>
            ) : (
              alertasInsumos.map((insumo) => {
                const status = getInsumoStatus(insumo);
                const pct =
                  insumo.estoque_minimo > 0
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          (insumo.estoque_atual / insumo.estoque_minimo) * 100
                        )
                      )
                    : 100;
                return (
                  <div
                    key={insumo.id}
                    className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#291D18] truncate">
                          {insumo.nome}
                        </p>
                        <p className="text-xs text-stone-500">
                          Atual:{' '}
                          <strong className="text-stone-700">
                            {formatQty(insumo.estoque_atual, insumo.unidade)}
                          </strong>{' '}
                          • Mín:{' '}
                          {formatQty(insumo.estoque_minimo, insumo.unidade)}
                        </p>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          status === 'REPOR' ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onGoComprarInsumo(insumo.id)}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-[#291D18] hover:border-amber-500 hover:text-amber-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Registrar Compra
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pronta Entrega */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-[#291D18]">
              Pronta Entrega (Estoque de Produtos Acabados)
            </h3>
            <p className="text-xs text-stone-500">
              Unidades disponíveis para venda imediata e margens líquidas
              unitárias
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('planejador')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors self-start sm:self-auto"
          >
            <ClipboardList className="w-4 h-4" />
            Abrir MRP & Encomendas
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {db.produtos.map((prod) => {
            const metricas = produtoMetricasMap.get(prod.id);
            return (
              <div
                key={prod.id}
                className="rounded-xl border border-stone-200 p-4 bg-stone-50/50 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-[#291D18] leading-snug">
                      {prod.nome}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                        prod.estoque_pronto === 0
                          ? 'bg-red-100 text-red-700'
                          : prod.estoque_pronto <= 5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {prod.estoque_pronto} un
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-1 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Preço de venda:</span>
                      <span className="font-semibold text-[#291D18]">
                        {formatBRL(prod.preco_venda)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margem Contrib. (CMV):</span>
                      <span className="font-semibold text-emerald-700">
                        {metricas
                          ? `${metricas.margem_contribuicao_pct.toFixed(0)}%`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lucro Líq. (c/ rateio):</span>
                      <span className="font-semibold text-amber-800">
                        {metricas
                          ? formatBRL(metricas.lucro_liquido_unit_rs)
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/80">
                  <button
                    type="button"
                    onClick={() => onGoVenderProduto(prod.id)}
                    className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                  >
                    Vender
                  </button>
                  <button
                    type="button"
                    onClick={() => onGoProduzirProduto(prod.id)}
                    className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-[#291D18] hover:bg-stone-100 transition-colors"
                  >
                    Produzir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TELA 2: PLANEJADOR MRP & AGENDA DE ENCOMENDAS (COM SINAL 50% E RECIBO WHATSAPP)
// ============================================================================

function PlanejadorEncomendasView({
  db,
  insumosMap,
  subReceitasMap,
  produtosMap,
  produtoMetricasMap,
  onToast,
  onConverterOrdens,
  onCreateEncomenda,
  onUpdateEncomendaStatus,
  onDeleteEncomenda,
}: {
  db: ERPDatabase;
  insumosMap: Map<string, Insumo>;
  subReceitasMap: Map<string, SubReceita>;
  produtosMap: Map<string, Produto>;
  produtoMetricasMap: Map<string, ProdutoMetricas>;
  onToast: (msg: string, type?: ToastMessage['type']) => void;
  onConverterOrdens: (
    ordens: Omit<OrdemPlanejada, 'id' | 'criado_em'>[]
  ) => void;
  onCreateEncomenda: (nova: Omit<Encomenda, 'id' | 'codigo'>) => void;
  onUpdateEncomendaStatus: (
    enc: Encomenda,
    status: StatusEncomenda,
    formaPagamentoSaldo?: FormaPagamentoVenda
  ) => void;
  onDeleteEncomenda: (enc: Encomenda) => void;
}) {
  const [subTab, setSubTab] = useState<'mrp' | 'agenda'>('mrp');

  // Metas MRP
  const [metas, setMetas] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (db.produtos.some((p) => p.id === 'prod-1')) init['prod-1'] = 50;
    if (db.produtos.some((p) => p.id === 'prod-2')) init['prod-2'] = 30;
    if (db.produtos.some((p) => p.id === 'prod-4')) init['prod-4'] = 10;
    return init;
  });

  const [considerarEstoquePronto, setConsiderarEstoquePronto] = useState(true);
  const [arredondarFornadas, setArredondarFornadas] = useState(false);
  const [somenteFaltantes, setSomenteFaltantes] = useState(false);

  // Modal Salvar Encomenda a partir do MRP
  const [encomendaModalOpen, setEncomendaModalOpen] = useState(false);
  const [encCliente, setEncCliente] = useState('');
  const [encWhatsapp, setEncWhatsapp] = useState('');
  const [encDataEntrega, setEncDataEntrega] = useState(
    addDaysISO(formatDateISO(new Date()), 4)
  );
  const [encSinal, setEncSinal] = useState(0);
  const [encFormaSinal, setEncFormaSinal] =
    useState<FormaPagamentoVenda>('Pix');
  const [encStatus, setEncStatus] = useState<StatusEncomenda>('Confirmada');
  const [encObs, setEncObs] = useState('');

  // Modal Entregar Encomenda (selecionar forma de pagamento do saldo)
  const [entregaModalEnc, setEntregaModalEnc] = useState<Encomenda | null>(
    null
  );
  const [formaPagSaldo, setFormaPagSaldo] =
    useState<FormaPagamentoVenda>('Pix');

  const setMetaProduto = (produtoId: string, qty: number) => {
    const clean = Math.max(0, Math.floor(Number.isFinite(qty) ? qty : 0));
    setMetas((prev) => ({ ...prev, [produtoId]: clean }));
  };

  // Cálculo MRP com explosão recursiva de sub-receitas
  const mrpCalculo = useMemo(() => {
    const linhasProdutos = db.produtos
      .map((prod) => {
        const meta = metas[prod.id] || 0;
        const estoqueAbatido = considerarEstoquePronto
          ? Math.min(meta, prod.estoque_pronto)
          : 0;
        const unidadesAProduzir = Math.max(0, meta - estoqueAbatido);
        const fatorExato =
          prod.rendimento_padrao > 0
            ? unidadesAProduzir / prod.rendimento_padrao
            : 0;
        const fatorArredondado =
          unidadesAProduzir > 0 ? Math.ceil(fatorExato) : 0;
        const fatorEfetivo = arredondarFornadas ? fatorArredondado : fatorExato;
        const unidadesEfetivasProduzidas = arredondarFornadas
          ? fatorArredondado * prod.rendimento_padrao
          : unidadesAProduzir;

        const metricas = produtoMetricasMap.get(prod.id);
        const faturamentoPrevisto = meta * prod.preco_venda;
        const custoTotalEncomenda = meta * (metricas?.custo_unitario_cmv || 0);

        return {
          produto: prod,
          meta,
          estoqueAbatido,
          unidadesAProduzir,
          fatorExato,
          fatorArredondado,
          fatorEfetivo,
          unidadesEfetivasProduzidas,
          faturamentoPrevisto,
          custoTotalEncomenda,
        };
      })
      .filter((l) => l.meta > 0);

    // Explosão consolidada de insumos (incluindo explosão das sub-receitas)
    const necessidadeMap = new Map<string, number>();
    // Copia saldos prontos das sub-receitas para abater antes de explodir insumos crus
    const saldoSubDisponivel = new Map<string, number>(
      db.sub_receitas.map((s) => [s.id, Math.max(0, s.estoque_pronto)])
    );

    for (const linha of linhasProdutos) {
      if (linha.fatorEfetivo <= 0) continue;
      const itensFicha = db.ficha_tecnica.filter(
        (f) => f.produto_id === linha.produto.id
      );
      for (const ft of itensFicha) {
        const qtd = ft.quantidade_usada * linha.fatorEfetivo;
        if (ft.tipo_item === 'insumo' && ft.insumo_id) {
          necessidadeMap.set(
            ft.insumo_id,
            (necessidadeMap.get(ft.insumo_id) || 0) + qtd
          );
        } else if (ft.tipo_item === 'sub_receita' && ft.sub_receita_id) {
          const sub = subReceitasMap.get(ft.sub_receita_id);
          if (sub && sub.rendimento_padrao > 0) {
            const disp = saldoSubDisponivel.get(sub.id) || 0;
            const abatidoSub = Math.min(disp, qtd);
            saldoSubDisponivel.set(sub.id, disp - abatidoSub);
            const restanteSub = Math.max(0, qtd - abatidoSub);
            const fatorSub = restanteSub / sub.rendimento_padrao;
            const subItens = db.sub_receita_itens.filter(
              (si) => si.sub_receita_id === sub.id
            );
            for (const si of subItens) {
              const qtdIns = si.quantidade_usada * fatorSub;
              necessidadeMap.set(
                si.insumo_id,
                (necessidadeMap.get(si.insumo_id) || 0) + qtdIns
              );
            }
          }
        }
      }
    }

    const linhasInsumos = Array.from(necessidadeMap.entries())
      .map(([insumoId, necessario]) => {
        const insumo = insumosMap.get(insumoId);
        if (!insumo) return null;
        const emEstoque = Math.max(0, insumo.estoque_atual);
        const faltaComprar = Math.max(0, necessario - emEstoque);
        const custoEstimadoCompra = faltaComprar * insumo.custo_medio_unitario;
        return {
          insumo,
          necessario,
          emEstoque: insumo.estoque_atual,
          faltaComprar,
          custoEstimadoCompra,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort(
        (a, b) =>
          b.faltaComprar - a.faltaComprar ||
          a.insumo.nome.localeCompare(b.insumo.nome)
      );

    const faturamentoPrevisto = linhasProdutos.reduce(
      (acc, l) => acc + l.faturamentoPrevisto,
      0
    );
    const custoTotalProducao = linhasProdutos.reduce(
      (acc, l) => acc + l.custoTotalEncomenda,
      0
    );
    const desembolsoMercado = linhasInsumos.reduce(
      (acc, l) => acc + l.custoEstimadoCompra,
      0
    );
    const lucroProjetado = faturamentoPrevisto - custoTotalProducao;

    return {
      linhasProdutos,
      linhasInsumos,
      faturamentoPrevisto,
      custoTotalProducao,
      desembolsoMercado,
      lucroProjetado,
    };
  }, [
    db.produtos,
    db.ficha_tecnica,
    db.sub_receitas,
    db.sub_receita_itens,
    insumosMap,
    subReceitasMap,
    produtoMetricasMap,
    metas,
    considerarEstoquePronto,
    arredondarFornadas,
  ]);

  const insumosExibidos = useMemo(() => {
    return somenteFaltantes
      ? mrpCalculo.linhasInsumos.filter((i) => i.faltaComprar > 0)
      : mrpCalculo.linhasInsumos;
  }, [mrpCalculo.linhasInsumos, somenteFaltantes]);

  const copyTextSafe = async (text: string, msg: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      onToast(msg);
    } catch {
      onToast('Não foi possível copiar automaticamente.', 'error');
    }
  };

  const handleCopiarListaCompras = () => {
    const faltantes = mrpCalculo.linhasInsumos.filter(
      (i) => i.faltaComprar > 0
    );
    if (faltantes.length === 0) {
      onToast('Nenhum insumo faltando comprar para esta meta!', 'info');
      return;
    }
    const resumoMetas = mrpCalculo.linhasProdutos
      .map((l) => `• ${l.meta}x ${l.produto.nome}`)
      .join('\n');
    const listaItens = faltantes
      .map(
        (item) =>
          `▫ ${item.insumo.nome}: *${formatQty(
            item.faltaComprar,
            item.insumo.unidade
          )}* (est. ${formatBRL(item.custoEstimadoCompra)})`
      )
      .join('\n');

    const texto = `🍯 *Lista de Compras — Lua de Mel*\n\n📦 *Encomenda Planejada:*\n${resumoMetas}\n\n🛒 *Itens para Comprar:*\n${listaItens}\n\n💰 *Desembolso Estimado:* ${formatBRL(
      mrpCalculo.desembolsoMercado
    )}`;
    copyTextSafe(texto, 'Lista de compras copiada para o WhatsApp!');
  };

  const handleCopiarOrcamentoSimulacao = () => {
    if (mrpCalculo.linhasProdutos.length === 0) return;
    const linhas = mrpCalculo.linhasProdutos
      .map(
        (l) =>
          `• ${l.meta}x ${l.produto.nome} (${formatBRL(
            l.produto.preco_venda
          )}/un) = *${formatBRL(l.faturamentoPrevisto)}*`
      )
      .join('\n');
    const sinalSugerido = mrpCalculo.faturamentoPrevisto * 0.5;
    const texto = `*Orçamento — Lua de Mel*\n\n *Itens Selecionados:*\n${linhas}\n\n *Valor Total:* ${formatBRL(
      mrpCalculo.faturamentoPrevisto
    )}\n\n  *Chave Pix:* ${db.config.chave_pix}\n ${
      db.config.nome_beneficiario_pix
    }\n\n Obrigado Pela Preferência! 🐝`;
    copyTextSafe(
      texto,
      'Orçamento com chave Pix copiado para enviar ao cliente!'
    );
  };

  const handleCopiarReciboEncomenda = (enc: Encomenda) => {
    const linhas = enc.itens
      .map((item) => {
        const prod = produtosMap.get(item.produto_id);
        return `• ${item.quantidade}x ${prod?.nome || 'Item'} = *${formatBRL(
          item.quantidade * item.preco_unitario
        )}*`;
      })
      .join('\n');
    const saldo = Math.max(0, enc.valor_total - enc.valor_sinal);
    const texto = `🍯 *Comprovante de Encomenda ${
      enc.codigo
    } — Lua de Mel*\n\n👤 *Cliente:* ${
      enc.cliente
    }\n📅 *Entrega:* ${formatDateBR(enc.data_entrega)} (${
      enc.status
    })\n\n📦 *Itens:*\n${linhas}\n\n💰 *Total:* ${formatBRL(
      enc.valor_total
    )}\n✅ *Sinal Pago:* ${formatBRL(
      enc.valor_sinal
    )}\n⏳ *Saldo na Entrega:* ${formatBRL(saldo)}\n\n🔑 *Chave Pix:* ${
      db.config.chave_pix
    }`;
    copyTextSafe(texto, `Recibo da ${enc.codigo} copiado!`);
  };

  const openModalSalvarEncomenda = () => {
    if (mrpCalculo.linhasProdutos.length === 0) return;
    setEncCliente('');
    setEncWhatsapp('');
    setEncDataEntrega(addDaysISO(formatDateISO(new Date()), 4));
    setEncSinal(Number((mrpCalculo.faturamentoPrevisto * 0.5).toFixed(2)));
    setEncFormaSinal('Pix');
    setEncStatus('Confirmada');
    setEncObs('');
    setEncomendaModalOpen(true);
  };

  const handleSalvarEncomendaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!encCliente.trim() || mrpCalculo.linhasProdutos.length === 0) return;

    onCreateEncomenda({
      cliente: encCliente.trim(),
      whatsapp: encWhatsapp.trim(),
      data_pedido: formatDateISO(new Date()),
      data_entrega: encDataEntrega,
      itens: mrpCalculo.linhasProdutos.map((l) => ({
        produto_id: l.produto.id,
        quantidade: l.meta,
        preco_unitario: l.produto.preco_venda,
      })),
      valor_total: Number(mrpCalculo.faturamentoPrevisto.toFixed(2)),
      valor_sinal: encSinal,
      forma_pagamento_sinal: encFormaSinal,
      status: encStatus,
      observacoes: encObs.trim(),
    });
    setEncomendaModalOpen(false);
    setSubTab('agenda');
  };

  const handleConverterEmOrdens = () => {
    const aProduzir = mrpCalculo.linhasProdutos.filter(
      (l) => l.unidadesAProduzir > 0
    );
    if (aProduzir.length === 0) {
      onToast(
        'Todos os itens da meta já estão cobertos pela pronta entrega!',
        'info'
      );
      return;
    }
    const ordens = aProduzir.map((l) => ({
      produto_id: l.produto.id,
      quantidade_meta: l.meta,
      multiplicador_sugerido: Number(l.fatorEfetivo.toFixed(2)),
      unidades_previstas: Math.round(l.unidadesEfetivasProduzidas),
      observacao: `Gerada pelo MRP (Meta: ${l.meta} un | Pronta entrega abatida: ${l.estoqueAbatido} un)`,
    }));
    onConverterOrdens(ordens);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#291D18] tracking-tight">
            Planejador MRP & Encomendas
          </h2>
          <p className="text-sm text-stone-500">
            Simule compras, gere orçamentos com Pix e acompanhe encomendas
            agendadas com sinal.
          </p>
        </div>

        {/* Sub-abas */}
        <div className="inline-flex bg-white border border-stone-200 rounded-xl p-1 shadow-xs self-start">
          <button
            type="button"
            onClick={() => setSubTab('mrp')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
              subTab === 'mrp'
                ? 'bg-[#291D18] text-amber-50'
                : 'text-stone-600 hover:text-[#291D18]'
            }`}
          >
            Simulador MRP
          </button>
          <button
            type="button"
            onClick={() => setSubTab('agenda')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors inline-flex items-center gap-1.5 ${
              subTab === 'agenda'
                ? 'bg-[#291D18] text-amber-50'
                : 'text-stone-600 hover:text-[#291D18]'
            }`}
          >
            <span>Agenda de Encomendas</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-600 text-white">
              {db.encomendas.length}
            </span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          SUB-ABA 1: SIMULADOR MRP
      ==================================================================== */}
      {subTab === 'mrp' && (
        <>
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <h3 className="font-bold text-[#291D18] flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                1. Monte os itens da encomenda ou meta de produção
              </h3>

              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={considerarEstoquePronto}
                    onClick={() => setConsiderarEstoquePronto((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      considerarEstoquePronto ? 'bg-amber-600' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        considerarEstoquePronto
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-stone-700">
                    Abater pronta entrega
                  </span>
                </label>

                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={arredondarFornadas}
                    onClick={() => setArredondarFornadas((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      arredondarFornadas ? 'bg-[#291D18]' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        arredondarFornadas ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-stone-700">
                    Arredondar fornadas inteiras
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setMetas({})}
                  className="text-xs font-semibold text-stone-500 hover:text-red-600"
                >
                  Zerar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {db.produtos.map((prod) => {
                const meta = metas[prod.id] || 0;
                const abatido = considerarEstoquePronto
                  ? Math.min(meta, prod.estoque_pronto)
                  : 0;
                const aProduzir = Math.max(0, meta - abatido);
                const fatorExato =
                  prod.rendimento_padrao > 0
                    ? aProduzir / prod.rendimento_padrao
                    : 0;
                const fatorInteiro = aProduzir > 0 ? Math.ceil(fatorExato) : 0;

                return (
                  <div
                    key={prod.id}
                    className={`rounded-xl border p-4 transition-all ${
                      meta > 0
                        ? 'border-amber-400 bg-amber-50/30 shadow-xs'
                        : 'border-stone-200 bg-stone-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#291D18]">
                          {prod.nome}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Rend.: {prod.rendimento_padrao} un • Pronto:{' '}
                          <strong>{prod.estoque_pronto} un</strong> •{' '}
                          {formatBRL(prod.preco_venda)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setMetaProduto(prod.id, meta - 5)}
                          className="w-8 h-8 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={meta}
                          onChange={(e) =>
                            setMetaProduto(
                              prod.id,
                              parseInt(e.target.value || '0', 10)
                            )
                          }
                          className="w-16 h-8 text-center font-bold text-sm rounded-lg border border-stone-300 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setMetaProduto(prod.id, meta + 5)}
                          className="w-8 h-8 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {meta > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200/70 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-stone-500 block">
                            A produzir
                          </span>
                          <strong className="text-[#291D18] text-sm">
                            {aProduzir} un
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block">
                            Receitas exatas
                          </span>
                          <strong className="text-sm text-amber-800">
                            {numberFormatter(2).format(fatorExato)}x
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block">
                            Fornadas inteiras
                          </span>
                          <strong className="text-sm text-[#291D18]">
                            {fatorInteiro}x
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Barra de Ações Comerciais da Simulação */}
            {mrpCalculo.linhasProdutos.length > 0 && (
              <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-stone-600">
                  Deseja transformar esta simulação em um pedido agendado com
                  sinal de reserva?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopiarOrcamentoSimulacao}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-stone-300 text-[#291D18] hover:bg-stone-50"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-600" />
                    Orçamento WhatsApp (c/ Pix)
                  </button>
                  <button
                    type="button"
                    onClick={openModalSalvarEncomenda}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Agendar Encomenda (c/ Sinal)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4 Cards Resumo Financeiro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Faturamento Previsto
              </p>
              <p className="text-2xl font-bold text-[#291D18] mt-1.5">
                {formatBRL(mrpCalculo.faturamentoPrevisto)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Custo Total (CMV)
              </p>
              <p className="text-2xl font-bold text-stone-800 mt-1.5">
                {formatBRL(mrpCalculo.custoTotalProducao)}
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Desembolso no Mercado
              </p>
              <p className="text-2xl font-bold text-amber-700 mt-1.5">
                {formatBRL(mrpCalculo.desembolsoMercado)}
              </p>
            </div>

            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Lucro Projetado (s/ CMV)
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-1.5">
                {formatBRL(mrpCalculo.lucroProjetado)}
              </p>
            </div>
          </div>

          {/* Tabela Explosão Consolidada (com explosão recursiva de sub-receitas) */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#291D18]">
                  2. Explosão Consolidada de Insumos (inclui Sub-receitas)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Bases prontas em estoque são abatidas automaticamente antes de
                  calcular insumos crus.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-2 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={somenteFaltantes}
                    onChange={(e) => setSomenteFaltantes(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  Apenas faltantes
                </label>

                <button
                  type="button"
                  onClick={handleCopiarListaCompras}
                  disabled={mrpCalculo.linhasInsumos.every(
                    (i) => i.faltaComprar === 0
                  )}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Compras (WhatsApp)
                </button>

                <button
                  type="button"
                  onClick={handleConverterEmOrdens}
                  disabled={mrpCalculo.linhasProdutos.every(
                    (l) => l.unidadesAProduzir === 0
                  )}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#291D18] text-amber-50 hover:bg-stone-800 disabled:opacity-40"
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  Enviar p/ Fila de Produção
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                    <th className="py-3 px-4">Insumo</th>
                    <th className="py-3 px-4 text-right">Necessário</th>
                    <th className="py-3 px-4 text-right">Em Estoque</th>
                    <th className="py-3 px-4 text-right">Falta Comprar</th>
                    <th className="py-3 px-4 text-right">Custo Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {insumosExibidos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-10 text-center text-stone-400"
                      >
                        Nenhum insumo faltando comprar para esta meta!
                      </td>
                    </tr>
                  ) : (
                    insumosExibidos.map((row) => {
                      const falta = row.faltaComprar > 0;
                      return (
                        <tr
                          key={row.insumo.id}
                          className={
                            falta ? 'bg-red-50/40' : 'hover:bg-stone-50/70'
                          }
                        >
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#291D18]">
                              {row.insumo.nome}
                            </p>
                            <p className="text-xs text-stone-500">
                              {row.insumo.categoria}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-stone-700">
                            {formatQty(row.necessario, row.insumo.unidade)}
                          </td>
                          <td className="py-3 px-4 text-right text-stone-600">
                            {formatQty(row.emEstoque, row.insumo.unidade)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {falta ? (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                {formatQty(
                                  row.faltaComprar,
                                  row.insumo.unidade
                                )}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-700">
                                OK
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#291D18]">
                            {falta ? formatBRL(row.custoEstimadoCompra) : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ====================================================================
          SUB-ABA 2: AGENDA DE ENCOMENDAS (COM SINAL 50% E ENTREGA)
      ==================================================================== */}
      {subTab === 'agenda' && (
        <div className="space-y-4">
          {db.encomendas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center space-y-3">
              <Calendar className="w-10 h-10 text-amber-600 mx-auto" />
              <h3 className="font-bold text-[#291D18]">
                Nenhuma encomenda agendada
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Monte os itens no Simulador MRP e clique em "Agendar Encomenda
                (c/ Sinal)" para registrar o pedido do cliente e lançar o sinal
                no caixa.
              </p>
              <button
                type="button"
                onClick={() => setSubTab('mrp')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white"
              >
                Voltar ao Simulador MRP
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {db.encomendas.map((enc) => {
                const saldoRestante = Math.max(
                  0,
                  enc.valor_total - enc.valor_sinal
                );
                const diasEntrega = daysUntilISO(enc.data_entrega);
                return (
                  <div
                    key={enc.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#291D18] text-amber-100">
                              {enc.codigo}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                enc.status === 'Entregue'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : enc.status === 'Pronta'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {enc.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-base text-[#291D18] mt-1.5">
                            {enc.cliente}
                          </h4>
                          {enc.whatsapp && (
                            <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {enc.whatsapp}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-stone-500 block">
                            Entrega
                          </span>
                          <strong className="text-xs font-bold text-[#291D18]">
                            {formatDateBR(enc.data_entrega)}
                          </strong>
                          {enc.status !== 'Entregue' && (
                            <span
                              className={`block text-[11px] font-semibold ${
                                diasEntrega <= 1
                                  ? 'text-red-600'
                                  : 'text-amber-700'
                              }`}
                            >
                              {diasEntrega < 0
                                ? 'Atrasada'
                                : diasEntrega === 0
                                ? 'Hoje!'
                                : `Em ${diasEntrega} dia(s)`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Itens da encomenda */}
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 space-y-1">
                        {enc.itens.map((it, idx) => {
                          const p = produtosMap.get(it.produto_id);
                          return (
                            <div
                              key={idx}
                              className="flex justify-between text-xs"
                            >
                              <span className="font-medium text-stone-700">
                                {it.quantidade}x {p?.nome || 'Produto'}
                              </span>
                              <span className="font-semibold text-[#291D18]">
                                {formatBRL(it.quantidade * it.preco_unitario)}
                              </span>
                            </div>
                          );
                        })}
                        {enc.observacoes && (
                          <p className="text-[11px] text-stone-500 pt-1.5 border-t border-stone-200">
                            Obs: {enc.observacoes}
                          </p>
                        )}
                      </div>

                      {/* Valores */}
                      <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-stone-500 block">
                            Valor Total
                          </span>
                          <strong className="text-sm text-[#291D18]">
                            {formatBRL(enc.valor_total)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block">
                            Sinal Pago
                          </span>
                          <strong className="text-sm text-emerald-700">
                            {formatBRL(enc.valor_sinal)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-500 block">
                            Saldo Entrega
                          </span>
                          <strong className="text-sm text-amber-700">
                            {enc.status === 'Entregue'
                              ? 'Quitado'
                              : formatBRL(saldoRestante)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Ações da Encomenda */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopiarReciboEncomenda(enc)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-stone-100 text-[#291D18] hover:bg-stone-200"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-600" />
                        Recibo WhatsApp
                      </button>

                      <div className="flex items-center gap-1.5">
                        {enc.status !== 'Entregue' && (
                          <>
                            <select
                              value={enc.status}
                              onChange={(e) => {
                                const st = e.target.value as StatusEncomenda;
                                if (st === 'Entregue') {
                                  setEntregaModalEnc(enc);
                                  setFormaPagSaldo('Pix');
                                } else {
                                  onUpdateEncomendaStatus(enc, st);
                                }
                              }}
                              className="px-2.5 py-2 rounded-xl border border-stone-300 text-xs font-semibold bg-white"
                            >
                              <option value="Orçamento">Orçamento</option>
                              <option value="Confirmada">Confirmada</option>
                              <option value="Em Produção">Em Produção</option>
                              <option value="Pronta">Pronta</option>
                              <option value="Entregue">
                                Concluir & Entregar
                              </option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setEntregaModalEnc(enc);
                                setFormaPagSaldo('Pix');
                              }}
                              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Entregar
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteEncomenda(enc)}
                          className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50"
                          aria-label="Excluir encomenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Agendar Encomenda com Sinal */}
      <ModalWrapper
        open={encomendaModalOpen}
        onClose={() => setEncomendaModalOpen(false)}
        title="Agendar Encomenda (c/ Sinal)"
        subtitle="Salva o pedido do cliente e lança automaticamente o sinal recebido no fluxo de caixa."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSalvarEncomendaSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nome do Cliente
              </label>
              <input
                type="text"
                required
                value={encCliente}
                onChange={(e) => setEncCliente(e.target.value)}
                placeholder="Ex: Ana Paula Silva"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                value={encWhatsapp}
                onChange={(e) => setEncWhatsapp(e.target.value)}
                placeholder="(66) 99999-0000"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Data de Entrega
              </label>
              <input
                type="date"
                required
                value={encDataEntrega}
                onChange={(e) => setEncDataEntrega(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Status Inicial
              </label>
              <select
                value={encStatus}
                onChange={(e) =>
                  setEncStatus(e.target.value as StatusEncomenda)
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
              >
                <option value="Confirmada">Confirmada (Sinal Pago)</option>
                <option value="Orçamento">Orçamento (Aguardando Sinal)</option>
                <option value="Em Produção">Em Produção</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Sinal Recebido (R$) — Total:{' '}
                {formatBRL(mrpCalculo.faturamentoPrevisto)}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max={mrpCalculo.faturamentoPrevisto}
                value={encSinal}
                onChange={(e) => setEncSinal(parseFloat(e.target.value || '0'))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Forma Pagto. do Sinal
              </label>
              <select
                value={encFormaSinal}
                onChange={(e) =>
                  setEncFormaSinal(e.target.value as FormaPagamentoVenda)
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
              >
                {(
                  Object.keys(
                    db.config.taxas_pagamento
                  ) as FormaPagamentoVenda[]
                ).map((fp) => (
                  <option key={fp} value={fp}>
                    {fp} ({db.config.taxas_pagamento[fp]}%)
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Observações / Personalização
              </label>
              <input
                type="text"
                value={encObs}
                onChange={(e) => setEncObs(e.target.value)}
                placeholder="Ex: Laço marsala, cartão personalizado..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setEncomendaModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
            >
              Salvar Encomenda
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* Modal Concluir Entrega da Encomenda */}
      <ModalWrapper
        open={Boolean(entregaModalEnc)}
        onClose={() => setEntregaModalEnc(null)}
        title={`Concluir Entrega — ${entregaModalEnc?.codigo || ''}`}
        subtitle="Baixa o estoque pronto dos produtos e registra o recebimento do saldo restante."
        maxWidth="max-w-md"
      >
        {entregaModalEnc && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
              <p>
                Cliente: <strong>{entregaModalEnc.cliente}</strong>
              </p>
              <p>
                Saldo restante a receber:{' '}
                <strong className="text-emerald-700 text-sm">
                  {formatBRL(
                    Math.max(
                      0,
                      entregaModalEnc.valor_total - entregaModalEnc.valor_sinal
                    )
                  )}
                </strong>
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Forma de Pagamento do Saldo Restante
              </label>
              <select
                value={formaPagSaldo}
                onChange={(e) =>
                  setFormaPagSaldo(e.target.value as FormaPagamentoVenda)
                }
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
              >
                {(
                  Object.keys(
                    db.config.taxas_pagamento
                  ) as FormaPagamentoVenda[]
                ).map((fp) => (
                  <option key={fp} value={fp}>
                    {fp} (Taxa: {db.config.taxas_pagamento[fp]}%)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEntregaModalEnc(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateEncomendaStatus(
                    entregaModalEnc,
                    'Entregue',
                    formaPagSaldo
                  );
                  setEntregaModalEnc(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Confirmar Entrega & Baixar Estoque
              </button>
            </div>
          </div>
        )}
      </ModalWrapper>
    </div>
  );
}

// ============================================================================
// TELA 3: PRODUÇÃO (FORNADAS + SUB-RECEITAS / BASES INTERMEDIÁRIAS + VALIDADE)
// ============================================================================

function ProducaoView({
  db,
  insumosMap,
  subReceitasMap,
  subMetricasMap,
  produtosMap,
  produtoMetricasMap,
  preload,
  onClearPreload,
  onRegisterProducao,
  onEstornarProducao,
  onDeleteOrdem,
  onSaveSubReceita,
  onDeleteSubReceita,
  onOpenPerda,
}: {
  db: ERPDatabase;
  insumosMap: Map<string, Insumo>;
  subReceitasMap: Map<string, SubReceita>;
  subMetricasMap: Map<string, SubReceitaMetricas>;
  produtosMap: Map<string, Produto>;
  produtoMetricasMap: Map<string, ProdutoMetricas>;
  preload: {
    tipo_producao?: 'produto' | 'sub_receita';
    produto_id?: string;
    sub_receita_id?: string;
    multiplicador: number;
    ordem_id?: string;
    observacoes?: string;
  } | null;
  onClearPreload: () => void;
  onRegisterProducao: (
    data: {
      data: string;
      data_validade: string;
      tipo_producao: 'produto' | 'sub_receita';
      produto_id?: string;
      sub_receita_id?: string;
      multiplicador_receita: number;
      unidades_reais_produzidas: number;
      observacoes: string;
      usar_saldo_sub_receita?: boolean;
    },
    ordemIdConcluida?: string
  ) => void;
  onEstornarProducao: (prod: Producao) => void;
  onDeleteOrdem: (id: string) => void;
  onSaveSubReceita: (
    sub: Omit<SubReceita, 'id'>,
    itens: { insumo_id: string; quantidade_usada: number }[],
    editId?: string
  ) => void;
  onDeleteSubReceita: (sub: SubReceita) => void;
  onOpenPerda: () => void;
}) {
  const [subTab, setSubTab] = useState<'fornadas' | 'bases'>('fornadas');
  const [modalOpen, setModalOpen] = useState(false);
  const [busca, setBusca] = useState('');

  // Form Fornada
  const [tipoProducao, setTipoProducao] = useState<'produto' | 'sub_receita'>(
    'produto'
  );
  const [produtoId, setProdutoId] = useState(db.produtos[0]?.id || '');
  const [subReceitaId, setSubReceitaId] = useState(
    db.sub_receitas[0]?.id || ''
  );
  const [multiplicador, setMultiplicador] = useState<number>(1);
  const [unidadesReais, setUnidadesReais] = useState<number>(
    db.produtos[0]?.rendimento_padrao || 1
  );
  const [dataProd, setDataProd] = useState(formatDateISO(new Date()));
  const [dataValidade, setDataValidade] = useState(
    addDaysISO(formatDateISO(new Date()), db.produtos[0]?.validade_dias || 7)
  );
  const [usarSaldoSubReceita, setUsarSaldoSubReceita] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [ordemEmExecucaoId, setOrdemEmExecucaoId] = useState<
    string | undefined
  >(undefined);

  // Modal Sub-receita
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editSubId, setEditSubId] = useState<string | undefined>(undefined);
  const [subNome, setSubNome] = useState('');
  const [subUnidade, setSubUnidade] = useState<'g' | 'ml'>('g');
  const [subRendimento, setSubRendimento] = useState(1000);
  const [subEstoquePronto, setSubEstoquePronto] = useState(0);
  const [subObs, setSubObs] = useState('');
  const [subItensForm, setSubItensForm] = useState<
    { insumo_id: string; quantidade_usada: number }[]
  >([]);

  const openModalFornada = (opts?: {
    tipo_producao?: 'produto' | 'sub_receita';
    produto_id?: string;
    sub_receita_id?: string;
    multiplicador?: number;
    ordem_id?: string;
    observacoes?: string;
  }) => {
    const tipo = opts?.tipo_producao || 'produto';
    const hoje = formatDateISO(new Date());
    const mult = opts?.multiplicador ?? 1;
    setTipoProducao(tipo);
    setDataProd(hoje);
    setMultiplicador(mult);
    setObservacoes(opts?.observacoes || '');
    setOrdemEmExecucaoId(opts?.ordem_id);
    setUsarSaldoSubReceita(true);

    if (tipo === 'sub_receita') {
      const sid = opts?.sub_receita_id || db.sub_receitas[0]?.id || '';
      const sub = subReceitasMap.get(sid);
      setSubReceitaId(sid);
      setUnidadesReais(Math.round((sub?.rendimento_padrao || 1000) * mult));
      setDataValidade(addDaysISO(hoje, 7));
    } else {
      const pid = opts?.produto_id || db.produtos[0]?.id || '';
      const prod = produtosMap.get(pid);
      setProdutoId(pid);
      setUnidadesReais(Math.round((prod?.rendimento_padrao || 1) * mult));
      setDataValidade(addDaysISO(hoje, prod?.validade_dias || 7));
    }
    setModalOpen(true);
  };

  useEffect(() => {
    if (preload) {
      openModalFornada(preload);
      onClearPreload();
    }
  }, [preload]);

  const handleMultiplicadorChange = (newMult: number) => {
    const clean = Math.max(0.1, Number.isFinite(newMult) ? newMult : 1);
    setMultiplicador(clean);
    if (tipoProducao === 'produto') {
      const prod = produtosMap.get(produtoId);
      if (prod) setUnidadesReais(Math.round(prod.rendimento_padrao * clean));
    } else {
      const sub = subReceitasMap.get(subReceitaId);
      if (sub) setUnidadesReais(Math.round(sub.rendimento_padrao * clean));
    }
  };

  // Explosão prévia (considera insumos diretos e sub-receitas)
  const explosaoPrevia = useMemo(() => {
    const consumoIns = new Map<string, number>();
    const consumoSub = new Map<string, number>();

    if (tipoProducao === 'sub_receita') {
      const itens = db.sub_receita_itens.filter(
        (i) => i.sub_receita_id === subReceitaId
      );
      for (const si of itens) {
        consumoIns.set(
          si.insumo_id,
          (consumoIns.get(si.insumo_id) || 0) +
            si.quantidade_usada * multiplicador
        );
      }
    } else {
      const fichas = db.ficha_tecnica.filter((f) => f.produto_id === produtoId);
      for (const f of fichas) {
        const qtd = f.quantidade_usada * multiplicador;
        if (f.tipo_item === 'insumo' && f.insumo_id) {
          consumoIns.set(f.insumo_id, (consumoIns.get(f.insumo_id) || 0) + qtd);
        } else if (f.tipo_item === 'sub_receita' && f.sub_receita_id) {
          const sub = subReceitasMap.get(f.sub_receita_id);
          if (sub) {
            const abatido = usarSaldoSubReceita
              ? Math.min(Math.max(0, sub.estoque_pronto), qtd)
              : 0;
            if (abatido > 0) {
              consumoSub.set(sub.id, (consumoSub.get(sub.id) || 0) + abatido);
            }
            const rest = Math.max(0, qtd - abatido);
            const fator =
              sub.rendimento_padrao > 0 ? rest / sub.rendimento_padrao : 0;
            const subItens = db.sub_receita_itens.filter(
              (si) => si.sub_receita_id === sub.id
            );
            for (const si of subItens) {
              consumoIns.set(
                si.insumo_id,
                (consumoIns.get(si.insumo_id) || 0) +
                  si.quantidade_usada * fator
              );
            }
          }
        }
      }
    }

    const linhasInsumos = Array.from(consumoIns.entries())
      .map(([insId, necessario]) => {
        const ins = insumosMap.get(insId);
        if (!ins) return null;
        const saldoProjetado = ins.estoque_atual - necessario;
        return {
          insumo: ins,
          necessario,
          saldoProjetado,
          negativo: saldoProjetado < 0,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const linhasSub = Array.from(consumoSub.entries())
      .map(([sid, usado]) => {
        const sub = subReceitasMap.get(sid);
        return sub ? { sub, usado } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return { linhasInsumos, linhasSub };
  }, [
    tipoProducao,
    produtoId,
    subReceitaId,
    multiplicador,
    usarSaldoSubReceita,
    db.ficha_tecnica,
    db.sub_receita_itens,
    insumosMap,
    subReceitasMap,
  ]);

  const temSaldoNegativo = explosaoPrevia.linhasInsumos.some((e) => e.negativo);

  const handleSubmitFornada = (e: React.FormEvent) => {
    e.preventDefault();
    onRegisterProducao(
      {
        data: dataProd,
        data_validade: dataValidade,
        tipo_producao: tipoProducao,
        produto_id: tipoProducao === 'produto' ? produtoId : undefined,
        sub_receita_id:
          tipoProducao === 'sub_receita' ? subReceitaId : undefined,
        multiplicador_receita: multiplicador,
        unidades_reais_produzidas: unidadesReais,
        observacoes: observacoes.trim(),
        usar_saldo_sub_receita: usarSaldoSubReceita,
      },
      ordemEmExecucaoId
    );
    setModalOpen(false);
  };

  // Sub-receita modal helpers
  const openModalSubReceita = (sub?: SubReceita) => {
    if (sub) {
      setEditSubId(sub.id);
      setSubNome(sub.nome);
      setSubUnidade(sub.unidade);
      setSubRendimento(sub.rendimento_padrao);
      setSubEstoquePronto(sub.estoque_pronto);
      setSubObs(sub.observacoes || '');
      setSubItensForm(
        db.sub_receita_itens
          .filter((i) => i.sub_receita_id === sub.id)
          .map((i) => ({
            insumo_id: i.insumo_id,
            quantidade_usada: i.quantidade_usada,
          }))
      );
    } else {
      setEditSubId(undefined);
      setSubNome('');
      setSubUnidade('g');
      setSubRendimento(1000);
      setSubEstoquePronto(0);
      setSubObs('');
      setSubItensForm(
        db.insumos[0]
          ? [{ insumo_id: db.insumos[0].id, quantidade_usada: 500 }]
          : []
      );
    }
    setSubModalOpen(true);
  };

  const handleSaveSubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subNome.trim() || subRendimento <= 0) return;
    onSaveSubReceita(
      {
        nome: subNome.trim(),
        unidade: subUnidade,
        rendimento_padrao: subRendimento,
        estoque_pronto: subEstoquePronto,
        observacoes: subObs.trim(),
      },
      subItensForm,
      editSubId
    );
    setSubModalOpen(false);
  };

  const producoesFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return db.producoes.filter((p) => {
      if (!q) return true;
      const nomeItem =
        p.tipo_producao === 'sub_receita'
          ? subReceitasMap.get(p.sub_receita_id || '')?.nome.toLowerCase() || ''
          : produtosMap.get(p.produto_id || '')?.nome.toLowerCase() || '';
      return (
        p.lote_codigo.toLowerCase().includes(q) ||
        nomeItem.includes(q) ||
        p.observacoes.toLowerCase().includes(q)
      );
    });
  }, [db.producoes, busca, produtosMap, subReceitasMap]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#291D18] tracking-tight">
            Produção & Sub-receitas (Bases)
          </h2>
          <p className="text-sm text-stone-500">
            Controle lotes finais com validade FEFO e produza recheios/massas
            base reutilizáveis.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenPerda}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
          >
            <BadgeAlert className="w-4 h-4 text-amber-600" />
            Perda / Degustação
          </button>
          <button
            type="button"
            onClick={() => openModalFornada()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Fornada
          </button>
        </div>
      </div>

      {/* Sub-abas */}
      <div className="inline-flex bg-white border border-stone-200 rounded-xl p-1 shadow-xs">
        <button
          type="button"
          onClick={() => setSubTab('fornadas')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            subTab === 'fornadas'
              ? 'bg-[#291D18] text-amber-50'
              : 'text-stone-600 hover:text-[#291D18]'
          }`}
        >
          Lotes Produzidos ({db.producoes.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('bases')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors inline-flex items-center gap-1.5 ${
            subTab === 'bases'
              ? 'bg-[#291D18] text-amber-50'
              : 'text-stone-600 hover:text-[#291D18]'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-500" />
          Sub-receitas / Bases ({db.sub_receitas.length})
        </button>
      </div>

      {/* SUB-ABA 1: LOTES PRODUZIDOS */}
      {subTab === 'fornadas' && (
        <>
          {db.ordens_planejadas.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-[#291D18] flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-700" />
                Fila de Ordens Planejadas (MRP) — {
                  db.ordens_planejadas.length
                }{' '}
                pendente(s)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {db.ordens_planejadas.map((ordem) => {
                  const prod = produtosMap.get(ordem.produto_id);
                  return (
                    <div
                      key={ordem.id}
                      className="bg-white rounded-xl border border-amber-200 p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-[#291D18]">
                            {prod?.nome || 'Produto'}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            {ordem.multiplicador_sugerido}x receita
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">
                          Previsto:{' '}
                          <strong>{ordem.unidades_previstas} un</strong>
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {ordem.observacao}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openModalFornada({
                              tipo_producao: 'produto',
                              produto_id: ordem.produto_id,
                              multiplicador: ordem.multiplicador_sugerido,
                              ordem_id: ordem.id,
                              observacoes: ordem.observacao,
                            })
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-[#291D18] text-amber-50 hover:bg-stone-800"
                        >
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          Iniciar Fornada
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteOrdem(ordem.id)}
                          className="p-2 rounded-lg text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-[#291D18]">
                Histórico de Lotes & Validade FEFO
              </h3>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar lote ou produto..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                    <th className="py-3 px-4">Lote / Produção</th>
                    <th className="py-3 px-4">Item Produzido</th>
                    <th className="py-3 px-4 text-center">Validade</th>
                    <th className="py-3 px-4 text-right">Rendimento Real</th>
                    <th className="py-3 px-4 text-right">Custo Lote</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {producoesFiltradas.map((p) => {
                    const isSub = p.tipo_producao === 'sub_receita';
                    const sub =
                      isSub && p.sub_receita_id
                        ? subReceitasMap.get(p.sub_receita_id)
                        : null;
                    const prod =
                      !isSub && p.produto_id
                        ? produtosMap.get(p.produto_id)
                        : null;
                    const diasVal = p.data_validade
                      ? daysUntilISO(p.data_validade)
                      : 99;

                    return (
                      <tr key={p.id} className="hover:bg-stone-50/70">
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#291D18] text-amber-100">
                            {p.lote_codigo}
                          </span>
                          <p className="text-xs text-stone-500 mt-1">
                            {formatDateBR(p.data)}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {isSub && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                BASE
                              </span>
                            )}
                            <p className="font-semibold text-[#291D18]">
                              {isSub ? sub?.nome : prod?.nome || 'Item'}
                            </p>
                          </div>
                          {p.observacoes && (
                            <p className="text-xs text-stone-500 mt-0.5 max-w-xs truncate">
                              {p.observacoes}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              diasVal <= 2
                                ? 'bg-red-100 text-red-700'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {formatDateBR(p.data_validade)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#291D18]">
                          {isSub
                            ? formatQty(
                                p.unidades_reais_produzidas,
                                sub?.unidade || 'g'
                              )
                            : `${p.unidades_reais_produzidas} un`}
                          <span className="block text-[11px] font-normal text-stone-500">
                            ({p.multiplicador_receita}x receita)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-stone-700">
                          {formatBRL(p.custo_estimado_lote || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onEstornarProducao(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Estornar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* SUB-ABA 2: SUB-RECEITAS / BASES INTERMEDIÁRIAS */}
      {subTab === 'bases' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="font-bold text-[#291D18]">
                Recheios, Ganaches e Massas Base (Sub-receitas)
              </h3>
              <p className="text-xs text-stone-500">
                Cadastre bases intermediárias para reutilizar em vários produtos
                sem repetir ingredientes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openModalSubReceita()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#291D18] text-amber-50 hover:bg-stone-800 self-start"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Nova Sub-receita
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.sub_receitas.map((sub) => {
              const m = subMetricasMap.get(sub.id);
              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-[#291D18]">
                          {sub.nome}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Rendimento padrão:{' '}
                          <strong>
                            {formatQty(sub.rendimento_padrao, sub.unidade)}
                          </strong>{' '}
                          • {m?.itens_count || 0} insumos
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Pronto: {formatQty(sub.estoque_pronto, sub.unidade)}
                      </span>
                    </div>

                    {sub.observacoes && (
                      <p className="text-xs text-stone-500 mt-2">
                        {sub.observacoes}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-stone-100 text-xs">
                      <div>
                        <span className="text-stone-500 block">
                          Custo da Receita Base
                        </span>
                        <strong className="text-sm text-[#291D18]">
                          {formatBRL(m?.custo_receita || 0)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-stone-500 block">
                          Custo por kg / L
                        </span>
                        <strong className="text-sm text-amber-700">
                          {formatUnitCostReadable(
                            m?.custo_unitario || 0,
                            sub.unidade
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() =>
                        openModalFornada({
                          tipo_producao: 'sub_receita',
                          sub_receita_id: sub.id,
                          multiplicador: 1,
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      Preparar Base
                    </button>
                    <button
                      type="button"
                      onClick={() => openModalSubReceita(sub)}
                      className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSubReceita(sub)}
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Registrar Fornada / Preparo de Base */}
      <ModalWrapper
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Registrar Produção (${getNextLoteCode(db.producoes)})`}
        subtitle="Baixa automática de insumos e sub-receitas vinculadas."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitFornada} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTipoProducao('produto');
                const p = produtosMap.get(produtoId);
                if (p) {
                  setUnidadesReais(
                    Math.round(p.rendimento_padrao * multiplicador)
                  );
                  setDataValidade(addDaysISO(dataProd, p.validade_dias || 7));
                }
              }}
              className={`py-2.5 rounded-xl text-xs font-bold border ${
                tipoProducao === 'produto'
                  ? 'bg-[#291D18] text-amber-50 border-[#291D18]'
                  : 'bg-stone-50 text-stone-600 border-stone-200'
              }`}
            >
              Produto Final (Fornada)
            </button>
            <button
              type="button"
              onClick={() => {
                setTipoProducao('sub_receita');
                const s = subReceitasMap.get(subReceitaId);
                if (s) {
                  setUnidadesReais(
                    Math.round(s.rendimento_padrao * multiplicador)
                  );
                  setDataValidade(addDaysISO(dataProd, 7));
                }
              }}
              className={`py-2.5 rounded-xl text-xs font-bold border ${
                tipoProducao === 'sub_receita'
                  ? 'bg-[#291D18] text-amber-50 border-[#291D18]'
                  : 'bg-stone-50 text-stone-600 border-stone-200'
              }`}
            >
              Sub-receita / Base (Recheio/Massa)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              {tipoProducao === 'produto' ? (
                <>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Produto Final
                  </label>
                  <select
                    value={produtoId}
                    onChange={(e) => {
                      setProdutoId(e.target.value);
                      const p = produtosMap.get(e.target.value);
                      if (p) {
                        setUnidadesReais(
                          Math.round(p.rendimento_padrao * multiplicador)
                        );
                        setDataValidade(
                          addDaysISO(dataProd, p.validade_dias || 7)
                        );
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    {db.produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} (Rend.: {p.rendimento_padrao} un | Val.:{' '}
                        {p.validade_dias}d)
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Sub-receita / Base
                  </label>
                  <select
                    value={subReceitaId}
                    onChange={(e) => {
                      setSubReceitaId(e.target.value);
                      const s = subReceitasMap.get(e.target.value);
                      if (s)
                        setUnidadesReais(
                          Math.round(s.rendimento_padrao * multiplicador)
                        );
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    {db.sub_receitas.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} (Rend.:{' '}
                        {formatQty(s.rendimento_padrao, s.unidade)})
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Multiplicador
              </label>
              <div className="flex gap-1.5 mb-1.5">
                {[0.5, 1, 2, 3].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleMultiplicadorChange(v)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold border ${
                      multiplicador === v
                        ? 'bg-[#291D18] text-amber-50 border-[#291D18]'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {v}x
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={multiplicador}
                onChange={(e) =>
                  handleMultiplicadorChange(parseFloat(e.target.value || '1'))
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Rendimento Real (
                {tipoProducao === 'produto'
                  ? 'un'
                  : subReceitasMap.get(subReceitaId)?.unidade || 'g'}
                )
              </label>
              <input
                type="number"
                min="1"
                required
                value={unidadesReais}
                onChange={(e) =>
                  setUnidadesReais(parseInt(e.target.value || '0', 10))
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold mt-6"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Data Produção
              </label>
              <input
                type="date"
                required
                value={dataProd}
                onChange={(e) => setDataProd(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Data de Validade (FEFO)
              </label>
              <input
                type="date"
                required
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Observações
              </label>
              <input
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Fornada da manhã..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>
          </div>

          {tipoProducao === 'produto' && (
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={usarSaldoSubReceita}
                onChange={(e) => setUsarSaldoSubReceita(e.target.checked)}
                className="rounded text-amber-600"
              />
              Abater primeiro o saldo pronto de Sub-receitas (recheios/bases)
              antes de explodir insumos crus
            </label>
          )}

          {explosaoPrevia.linhasSub.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <strong>Bases prontas utilizadas:</strong>{' '}
              {explosaoPrevia.linhasSub
                .map(
                  (s) => `${s.sub.nome} (-${formatQty(s.usado, s.sub.unidade)})`
                )
                .join(' • ')}
            </div>
          )}

          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <div className="bg-stone-50 px-3.5 py-2 border-b border-stone-200 text-xs font-bold text-[#291D18]">
              Prévia de Baixa de Insumos Crus
            </div>
            <div className="max-h-44 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/60 text-stone-500 border-b border-stone-100">
                  <tr>
                    <th className="py-2 px-3">Insumo</th>
                    <th className="py-2 px-3 text-right">Consumo</th>
                    <th className="py-2 px-3 text-right">Saldo Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {explosaoPrevia.linhasInsumos.map((row) => (
                    <tr
                      key={row.insumo.id}
                      className={row.negativo ? 'bg-red-50/70' : ''}
                    >
                      <td className="py-2 px-3 font-medium text-[#291D18]">
                        {row.insumo.nome}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-amber-800">
                        -{formatQty(row.necessario, row.insumo.unidade)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          row.negativo ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatQty(row.saldoProjetado, row.insumo.unidade)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white ${
                temSaldoNegativo
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              Confirmar Produção
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* Modal Criar/Editar Sub-receita */}
      <ModalWrapper
        open={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        title={
          editSubId ? 'Editar Sub-receita (Base)' : 'Nova Sub-receita (Base)'
        }
        subtitle="Monte a composição do recheio, cobertura ou massa base."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveSubSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nome da Base
              </label>
              <input
                type="text"
                required
                value={subNome}
                onChange={(e) => setSubNome(e.target.value)}
                placeholder="Ex: Brigadeiro Branco Cremoso (Base)"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Unidade
              </label>
              <select
                value={subUnidade}
                onChange={(e) => setSubUnidade(e.target.value as 'g' | 'ml')}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
              >
                <option value="g">Gramas (g)</option>
                <option value="ml">Mililitros (ml)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Rendimento ({subUnidade})
              </label>
              <input
                type="number"
                min="1"
                required
                value={subRendimento}
                onChange={(e) =>
                  setSubRendimento(parseFloat(e.target.value || '1000'))
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Saldo Pronto ({subUnidade})
              </label>
              <input
                type="number"
                min="0"
                value={subEstoquePronto}
                onChange={(e) =>
                  setSubEstoquePronto(parseFloat(e.target.value || '0'))
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#291D18]">
                Ingredientes da Sub-receita
              </h4>
              <button
                type="button"
                onClick={() => {
                  if (db.insumos[0]) {
                    setSubItensForm((prev) => [
                      ...prev,
                      { insumo_id: db.insumos[0].id, quantidade_usada: 100 },
                    ]);
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200"
              >
                + Adicionar Insumo
              </button>
            </div>

            {subItensForm.map((item, idx) => {
              const ins = insumosMap.get(item.insumo_id);
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-7">
                    <select
                      value={item.insumo_id}
                      onChange={(e) =>
                        setSubItensForm((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, insumo_id: e.target.value } : r
                          )
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    >
                      {db.insumos.map((iOpt) => (
                        <option key={iOpt.id} value={iOpt.id}>
                          {iOpt.nome} ({iOpt.unidade})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4 flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantidade_usada}
                      onChange={(e) =>
                        setSubItensForm((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  quantidade_usada: parseFloat(
                                    e.target.value || '0'
                                  ),
                                }
                              : r
                          )
                        )
                      }
                      className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-right"
                    />
                    <span className="text-xs text-stone-500">
                      {ins?.unidade}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setSubItensForm((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="p-1 text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSubModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
            >
              Salvar Sub-receita
            </button>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
}

// ============================================================================
// TELA 4: VENDAS, TAXAS DE PAGAMENTO, ACERTO CONSIGNADO E FLUXO DE CAIXA
// ============================================================================

const CANAIS_SUGERIDOS = [
  'Instagram/WhatsApp',
  'UFMT / Campus',
  'Cafeteria Central (Revendedor)',
  'Empório Sabor (Revendedor)',
  'Feira Artesanal / Evento',
  'iFood / Delivery',
];

function VendasCaixaView({
  db,
  produtosMap,
  produtoMetricasMap,
  preloadProdutoId,
  onClearPreload,
  onRegister,
  onMarcarPago,
  onAcertoConsignacao,
  onDelete,
}: {
  db: ERPDatabase;
  produtosMap: Map<string, Produto>;
  produtoMetricasMap: Map<string, ProdutoMetricas>;
  preloadProdutoId: string | null;
  onClearPreload: () => void;
  onRegister: (novo: Omit<VendaFluxo, 'id'>) => void;
  onMarcarPago: (id: string) => void;
  onAcertoConsignacao: (
    venda: VendaFluxo,
    acerto: {
      qtd_vendida: number;
      qtd_devolvida: number;
      qtd_avaria: number;
      forma_pagamento: FormaPagamentoVenda;
    }
  ) => void;
  onDelete: (item: VendaFluxo) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | TipoMovimentoCaixa>(
    'Todos'
  );
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | StatusPagamento>(
    'Todos'
  );

  // Form states
  const [tipo, setTipo] = useState<TipoMovimentoCaixa>('Venda Direta');
  const [data, setData] = useState(formatDateISO(new Date()));
  const [produtoId, setProdutoId] = useState(db.produtos[0]?.id || '');
  const [quantidade, setQuantidade] = useState(1);
  const [canal, setCanal] = useState('Instagram/WhatsApp');
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamentoVenda>('Pix');
  const [statusPag, setStatusPag] = useState<StatusPagamento>('Pago');
  const [valorTotal, setValorTotal] = useState(
    db.produtos[0]?.preco_venda || 0
  );
  const [valorComissao, setValorComissao] = useState(0);
  const [descricao, setDescricao] = useState('');

  // Modal Acerto Consignado
  const [acertoVenda, setAcertoVenda] = useState<VendaFluxo | null>(null);
  const [acertoVendida, setAcertoVendida] = useState(0);
  const [acertoDevolvida, setAcertoDevolvida] = useState(0);
  const [acertoAvaria, setAcertoAvaria] = useState(0);
  const [acertoFormaPag, setAcertoFormaPag] =
    useState<FormaPagamentoVenda>('Pix');

  const openAcertoModal = (venda: VendaFluxo) => {
    setAcertoVenda(venda);
    setAcertoVendida(venda.quantidade);
    setAcertoDevolvida(0);
    setAcertoAvaria(0);
    setAcertoFormaPag(venda.forma_pagamento || 'Pix');
  };

  const recalcularValoresAuto = (
    nextTipo: TipoMovimentoCaixa,
    nextProdId: string,
    nextQtd: number
  ) => {
    if (nextTipo === 'Despesa Operacional') {
      setValorComissao(0);
      return;
    }
    const prod = produtosMap.get(nextProdId);
    if (!prod) return;
    const total = Number((prod.preco_venda * nextQtd).toFixed(2));
    setValorTotal(total);
    if (nextTipo === 'Venda Revendedor') {
      setValorComissao(
        Number(((total * prod.comissao_revendedor_pct) / 100).toFixed(2))
      );
    } else {
      setValorComissao(0);
    }
  };

  const openModalNovo = (preProdId?: string) => {
    const pid = preProdId || db.produtos[0]?.id || '';
    setTipo('Venda Direta');
    setData(formatDateISO(new Date()));
    setProdutoId(pid);
    setQuantidade(1);
    setCanal('Instagram/WhatsApp');
    setFormaPagamento('Pix');
    setStatusPag('Pago');
    setDescricao('');
    recalcularValoresAuto('Venda Direta', pid, 1);
    setModalOpen(true);
  };

  useEffect(() => {
    if (preloadProdutoId) {
      openModalNovo(preloadProdutoId);
      onClearPreload();
    }
  }, [preloadProdutoId]);

  const taxaPrevistaRs = useMemo(() => {
    if (tipo === 'Despesa Operacional') return 0;
    const pct = db.config.taxas_pagamento[formaPagamento] || 0;
    return Number(((valorTotal * pct) / 100).toFixed(2));
  }, [tipo, formaPagamento, valorTotal, db.config.taxas_pagamento]);

  const lucroPrevio = useMemo(() => {
    if (tipo === 'Despesa Operacional') return -valorTotal;
    const custoUnit =
      produtoMetricasMap.get(produtoId)?.custo_unitario_cmv || 0;
    return valorTotal - valorComissao - taxaPrevistaRs - custoUnit * quantidade;
  }, [
    tipo,
    valorTotal,
    valorComissao,
    taxaPrevistaRs,
    produtoId,
    quantidade,
    produtoMetricasMap,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valorTotal <= 0) return;
    onRegister({
      data,
      tipo,
      produto_id: tipo === 'Despesa Operacional' ? undefined : produtoId,
      quantidade: tipo === 'Despesa Operacional' ? 1 : quantidade,
      canal_ou_revendedor: canal.trim() || 'Geral',
      forma_pagamento:
        tipo === 'Despesa Operacional' ? undefined : formaPagamento,
      status_pagamento: statusPag,
      valor_total: valorTotal,
      valor_comissao: tipo === 'Venda Revendedor' ? valorComissao : 0,
      taxa_pagamento_rs: taxaPrevistaRs,
      lucro_liquido: Number(lucroPrevio.toFixed(2)),
      descricao: descricao.trim() || undefined,
    });
    setModalOpen(false);
  };

  const resumoRevendedores = useMemo(() => {
    const map = new Map<
      string,
      {
        revendedor: string;
        totalVendido: number;
        totalComissao: number;
        pendenteReceber: number;
        vendasCount: number;
      }
    >();

    for (const v of db.vendas_fluxo) {
      if (v.tipo !== 'Venda Revendedor') continue;
      const cur = map.get(v.canal_ou_revendedor) || {
        revendedor: v.canal_ou_revendedor,
        totalVendido: 0,
        totalComissao: 0,
        pendenteReceber: 0,
        vendasCount: 0,
      };
      cur.totalVendido += v.valor_total;
      cur.totalComissao += v.valor_comissao;
      if (v.status_pagamento === 'Pendente/Consignado') {
        cur.pendenteReceber += v.valor_total;
      }
      cur.vendasCount += 1;
      map.set(v.canal_ou_revendedor, cur);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.totalVendido - a.totalVendido
    );
  }, [db.vendas_fluxo]);

  const extratoFiltrado = useMemo(() => {
    return db.vendas_fluxo
      .filter((v) => (filtroTipo === 'Todos' ? true : v.tipo === filtroTipo))
      .filter((v) =>
        filtroStatus === 'Todos' ? true : v.status_pagamento === filtroStatus
      )
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [db.vendas_fluxo, filtroTipo, filtroStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#291D18] tracking-tight">
            Vendas & Caixa
          </h2>
          <p className="text-sm text-stone-500">
            Vendas com desconto automático de taxas de pagamento, acerto de
            consignação e despesas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModalNovo()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Venda / Despesa
        </button>
      </div>

      {/* Resumo Revendedores */}
      {resumoRevendedores.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-[#291D18]">
              Resumo de Comissões por Revendedor
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resumoRevendedores.map((rev) => (
              <div
                key={rev.revendedor}
                className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#291D18] truncate">
                    {rev.revendedor}
                  </span>
                  <span className="text-xs text-stone-500">
                    {rev.vendasCount} venda(s)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200 text-xs">
                  <div>
                    <span className="text-stone-500 block">Vendido</span>
                    <strong className="text-[#291D18]">
                      {formatBRL(rev.totalVendido)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Comissão</span>
                    <strong className="text-amber-700">
                      {formatBRL(rev.totalComissao)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Consignado</span>
                    <strong
                      className={
                        rev.pendenteReceber > 0
                          ? 'text-orange-600'
                          : 'text-emerald-700'
                      }
                    >
                      {formatBRL(rev.pendenteReceber)}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extrato */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <h3 className="font-bold text-[#291D18]">Extrato Financeiro</h3>
          <div className="flex flex-wrap gap-2">
            <select
              value={filtroTipo}
              onChange={(e) =>
                setFiltroTipo(e.target.value as 'Todos' | TipoMovimentoCaixa)
              }
              className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold bg-stone-50"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="Venda Direta">Venda Direta</option>
              <option value="Venda Revendedor">Venda Revendedor</option>
              <option value="Sinal Encomenda">Sinal Encomenda</option>
              <option value="Despesa Operacional">Despesa Operacional</option>
              <option value="Perda / Avaria">Perda / Avaria</option>
            </select>

            <div className="inline-flex bg-stone-100 rounded-xl p-1">
              {(['Todos', 'Pago', 'Pendente/Consignado'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFiltroStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    filtroStatus === st
                      ? 'bg-white text-[#291D18] shadow-xs'
                      : 'text-stone-600 hover:text-[#291D18]'
                  }`}
                >
                  {st === 'Pendente/Consignado' ? 'Pendente' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                <th className="py-3 px-4">Data / Tipo</th>
                <th className="py-3 px-4">Item / Canal</th>
                <th className="py-3 px-4 text-right">Valor Bruto</th>
                <th className="py-3 px-4 text-right">Taxas / Comis.</th>
                <th className="py-3 px-4 text-right">Lucro Líq.</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {extratoFiltrado.map((v) => {
                const prod = v.produto_id
                  ? produtosMap.get(v.produto_id)
                  : null;
                const isSaida =
                  v.tipo === 'Despesa Operacional' ||
                  v.tipo === 'Perda / Avaria';
                const totalDeducoes =
                  (v.valor_comissao || 0) + (v.taxa_pagamento_rs || 0);

                return (
                  <tr key={v.id} className="hover:bg-stone-50/70">
                    <td className="py-3.5 px-4">
                      <p className="text-xs font-semibold text-stone-500">
                        {formatDateBR(v.data)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          isSaida
                            ? 'bg-red-100 text-red-700'
                            : v.tipo === 'Venda Revendedor'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-200 text-[#291D18]'
                        }`}
                      >
                        {v.tipo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#291D18]">
                        {isSaida || !prod
                          ? v.canal_ou_revendedor
                          : `${v.quantidade}x ${prod.nome}`}
                      </p>
                      <p className="text-xs text-stone-500">
                        {v.descricao
                          ? v.descricao
                          : `${v.canal_ou_revendedor}${
                              v.forma_pagamento ? ` • ${v.forma_pagamento}` : ''
                            }`}
                      </p>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold ${
                        isSaida ? 'text-stone-400' : 'text-[#291D18]'
                      }`}
                    >
                      {isSaida ? '—' : formatBRL(v.valor_total)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-stone-600">
                      {totalDeducoes > 0 ? (
                        <div>
                          <span className="font-semibold text-red-600">
                            -{formatBRL(totalDeducoes)}
                          </span>
                          <span className="block text-[10px] text-stone-400">
                            {v.valor_comissao > 0
                              ? `Comis: ${formatBRL(v.valor_comissao)} `
                              : ''}
                            {v.taxa_pagamento_rs > 0
                              ? `Taxa: ${formatBRL(v.taxa_pagamento_rs)}`
                              : ''}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold ${
                        v.lucro_liquido >= 0
                          ? 'text-emerald-700'
                          : 'text-red-600'
                      }`}
                    >
                      {formatBRL(v.lucro_liquido)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {v.status_pagamento === 'Pago' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <Check className="w-3 h-3" />
                          Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          <Clock className="w-3 h-3" />
                          Consignado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex flex-wrap justify-end items-center gap-1.5">
                        {v.status_pagamento === 'Pendente/Consignado' && (
                          <>
                            {v.tipo === 'Venda Revendedor' && (
                              <button
                                type="button"
                                onClick={() => openAcertoModal(v)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#291D18] text-amber-100 hover:bg-stone-800"
                              >
                                Fazer Acerto
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onMarcarPago(v.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Quitar 100%
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(v)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Venda / Despesa */}
      <ModalWrapper
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Lançamento no Caixa"
        subtitle="Desconto automático de taxas de pagamento, comissões e CMV."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                'Venda Direta',
                'Venda Revendedor',
                'Despesa Operacional',
              ] as const
            ).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTipo(t);
                  if (t === 'Venda Revendedor') {
                    setCanal('Cafeteria Central (Revendedor)');
                    setStatusPag('Pendente/Consignado');
                  } else if (t === 'Venda Direta') {
                    setCanal('Instagram/WhatsApp');
                    setStatusPag('Pago');
                  } else {
                    setCanal('Energia / Gás / Fixo');
                    setStatusPag('Pago');
                    setValorTotal(0);
                  }
                  recalcularValoresAuto(t, produtoId, quantidade);
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border ${
                  tipo === t
                    ? 'bg-[#291D18] text-amber-50 border-[#291D18]'
                    : 'bg-stone-50 text-stone-600 border-stone-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Status
              </label>
              <select
                value={statusPag}
                onChange={(e) =>
                  setStatusPag(e.target.value as StatusPagamento)
                }
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
              >
                <option value="Pago">Pago</option>
                <option value="Pendente/Consignado">Pendente/Consignado</option>
              </select>
            </div>

            {tipo !== 'Despesa Operacional' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Produto
                  </label>
                  <select
                    value={produtoId}
                    onChange={(e) => {
                      setProdutoId(e.target.value);
                      recalcularValoresAuto(tipo, e.target.value, quantidade);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    {db.produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — {formatBRL(p.preco_venda)} (Pronto:{' '}
                        {p.estoque_pronto} un)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Quantidade (un)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantidade}
                    onChange={(e) => {
                      const q = Math.max(
                        1,
                        parseInt(e.target.value || '1', 10)
                      );
                      setQuantidade(q);
                      recalcularValoresAuto(tipo, produtoId, q);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Forma Pagto / Taxa
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) =>
                      setFormaPagamento(e.target.value as FormaPagamentoVenda)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    {(
                      Object.keys(
                        db.config.taxas_pagamento
                      ) as FormaPagamentoVenda[]
                    ).map((fp) => (
                      <option key={fp} value={fp}>
                        {fp} ({db.config.taxas_pagamento[fp]}%)
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div
              className={tipo === 'Despesa Operacional' ? 'sm:col-span-2' : ''}
            >
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {tipo === 'Despesa Operacional'
                  ? 'Descrição da Despesa'
                  : 'Canal ou Revendedor'}
              </label>
              <input
                type="text"
                list="canais-sugeridos"
                required
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
              <datalist id="canais-sugeridos">
                {CANAIS_SUGERIDOS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={valorTotal}
                onChange={(e) => {
                  const val = parseFloat(e.target.value || '0');
                  setValorTotal(val);
                  if (tipo === 'Venda Revendedor') {
                    const pct =
                      produtosMap.get(produtoId)?.comissao_revendedor_pct || 0;
                    setValorComissao(Number(((val * pct) / 100).toFixed(2)));
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>

            {tipo === 'Venda Revendedor' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Comissão Revendedor (R$)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={valorComissao}
                  onChange={(e) =>
                    setValorComissao(parseFloat(e.target.value || '0'))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
                />
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-600">
                Lucro Líquido Real
              </p>
              {tipo !== 'Despesa Operacional' && (
                <p className="text-[11px] text-stone-500">
                  Taxa maquininha/canal: -{formatBRL(taxaPrevistaRs)} • CMV: -
                  {formatBRL(
                    (produtoMetricasMap.get(produtoId)?.custo_unitario_cmv ||
                      0) * quantidade
                  )}
                </p>
              )}
            </div>
            <p
              className={`text-xl font-bold ${
                lucroPrevio >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {formatBRL(lucroPrevio)}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* Modal Acerto Parcial de Consignação */}
      <ModalWrapper
        open={Boolean(acertoVenda)}
        onClose={() => setAcertoVenda(null)}
        title="Fazer Acerto de Consignação"
        subtitle={
          acertoVenda
            ? `${acertoVenda.canal_ou_revendedor} • Remessa original: ${acertoVenda.quantidade} un`
            : ''
        }
        maxWidth="max-w-lg"
      >
        {acertoVenda && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                acertoVendida + acertoDevolvida + acertoAvaria !==
                acertoVenda.quantidade
              ) {
                return;
              }
              onAcertoConsignacao(acertoVenda, {
                qtd_vendida: acertoVendida,
                qtd_devolvida: acertoDevolvida,
                qtd_avaria: acertoAvaria,
                forma_pagamento: acertoFormaPag,
              });
              setAcertoVenda(null);
            }}
            className="space-y-4"
          >
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
              Distribua as <strong>{acertoVenda.quantidade} unidades</strong>{' '}
              enviadas em consignação entre vendidas, devolvidas intactas e
              avariadas.
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  Vendidas (un)
                </label>
                <input
                  type="number"
                  min={0}
                  max={acertoVenda.quantidade}
                  value={acertoVendida}
                  onChange={(e) => {
                    const v = Math.min(
                      acertoVenda.quantidade,
                      Math.max(0, parseInt(e.target.value || '0', 10))
                    );
                    setAcertoVendida(v);
                    setAcertoDevolvida(
                      Math.max(0, acertoVenda.quantidade - v - acertoAvaria)
                    );
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-sm font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-800 mb-1">
                  Devolvidas (un)
                </label>
                <input
                  type="number"
                  min={0}
                  max={acertoVenda.quantidade}
                  value={acertoDevolvida}
                  onChange={(e) => {
                    const d = Math.min(
                      acertoVenda.quantidade,
                      Math.max(0, parseInt(e.target.value || '0', 10))
                    );
                    setAcertoDevolvida(d);
                    setAcertoAvaria(
                      Math.max(0, acertoVenda.quantidade - acertoVendida - d)
                    );
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-blue-300 text-sm font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-red-800 mb-1">
                  Avarias (un)
                </label>
                <input
                  type="number"
                  min={0}
                  max={acertoVenda.quantidade}
                  value={acertoAvaria}
                  onChange={(e) => {
                    const a = Math.min(
                      acertoVenda.quantidade,
                      Math.max(0, parseInt(e.target.value || '0', 10))
                    );
                    setAcertoAvaria(a);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-red-300 text-sm font-bold text-center"
                />
              </div>
            </div>

            {acertoVendida + acertoDevolvida + acertoAvaria !==
              acertoVenda.quantidade && (
              <p className="text-xs font-bold text-red-600">
                A soma ({acertoVendida + acertoDevolvida + acertoAvaria} un)
                deve ser igual ao total consignado ({acertoVenda.quantidade}{' '}
                un).
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Forma de Recebimento do Acerto
              </label>
              <select
                value={acertoFormaPag}
                onChange={(e) =>
                  setAcertoFormaPag(e.target.value as FormaPagamentoVenda)
                }
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
              >
                {(
                  Object.keys(
                    db.config.taxas_pagamento
                  ) as FormaPagamentoVenda[]
                ).map((fp) => (
                  <option key={fp} value={fp}>
                    {fp} ({db.config.taxas_pagamento[fp]}%)
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const precoUnit =
                acertoVenda.quantidade > 0
                  ? acertoVenda.valor_total / acertoVenda.quantidade
                  : 0;
              const pctComis =
                acertoVenda.valor_total > 0
                  ? (acertoVenda.valor_comissao / acertoVenda.valor_total) * 100
                  : 0;
              const bruto = acertoVendida * precoUnit;
              const comis = (bruto * pctComis) / 100;
              const repasseLiquido = bruto - comis;

              return (
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Venda efetivada ({acertoVendida} un):</span>
                    <strong>{formatBRL(bruto)}</strong>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>Comissão revendedor ({pctComis.toFixed(0)}%):</span>
                    <strong>-{formatBRL(comis)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700 text-sm pt-1 border-t border-stone-200">
                    <span className="font-bold">
                      Valor líquido a receber do revendedor:
                    </span>
                    <strong>{formatBRL(repasseLiquido)}</strong>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAcertoVenda(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  acertoVendida + acertoDevolvida + acertoAvaria !==
                  acertoVenda.quantidade
                }
                className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                Confirmar Acerto
              </button>
            </div>
          </form>
        )}
      </ModalWrapper>
    </div>
  );
}

// ============================================================================
// TELA 5: PRODUTOS & FICHAS TÉCNICAS (BOM COM SUB-RECEITAS + RATEIO INDIRETO)
// ============================================================================

function ProdutosBOMView({
  db,
  insumosMap,
  subReceitasMap,
  subMetricasMap,
  produtoMetricasMap,
  onSaveProdutoComFicha,
  onDeleteProduto,
}: {
  db: ERPDatabase;
  insumosMap: Map<string, Insumo>;
  subReceitasMap: Map<string, SubReceita>;
  subMetricasMap: Map<string, SubReceitaMetricas>;
  produtoMetricasMap: Map<string, ProdutoMetricas>;
  onSaveProdutoComFicha: (
    produto: Omit<Produto, 'id'>,
    itensFicha: {
      tipo_item: 'insumo' | 'sub_receita';
      insumo_id?: string;
      sub_receita_id?: string;
      quantidade_usada: number;
    }[],
    editId?: string
  ) => void;
  onDeleteProduto: (produto: Produto) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  const [nome, setNome] = useState('');
  const [precoVenda, setPrecoVenda] = useState(12);
  const [rendimentoPadrao, setRendimentoPadrao] = useState(12);
  const [comissaoPct, setComissaoPct] = useState(15);
  const [estoquePronto, setEstoquePronto] = useState(0);
  const [validadeDias, setValidadeDias] = useState(7);
  const [custoIndiretoReceita, setCustoIndiretoReceita] = useState(10);

  const [bomItens, setBomItens] = useState<
    {
      tipo_item: 'insumo' | 'sub_receita';
      insumo_id?: string;
      sub_receita_id?: string;
      quantidade_usada: number;
    }[]
  >([]);

  const openNovoProduto = () => {
    setEditId(undefined);
    setNome('');
    setPrecoVenda(15);
    setRendimentoPadrao(12);
    setComissaoPct(15);
    setEstoquePronto(0);
    setValidadeDias(7);
    setCustoIndiretoReceita(10);
    setBomItens(
      db.insumos[0]
        ? [
            {
              tipo_item: 'insumo',
              insumo_id: db.insumos[0].id,
              quantidade_usada: 100,
            },
          ]
        : []
    );
    setModalOpen(true);
  };

  const openEditarProduto = (prod: Produto) => {
    setEditId(prod.id);
    setNome(prod.nome);
    setPrecoVenda(prod.preco_venda);
    setRendimentoPadrao(prod.rendimento_padrao);
    setComissaoPct(prod.comissao_revendedor_pct);
    setEstoquePronto(prod.estoque_pronto);
    setValidadeDias(prod.validade_dias || 7);
    setCustoIndiretoReceita(prod.custo_indireto_receita || 0);
    const itens = db.ficha_tecnica
      .filter((f) => f.produto_id === prod.id)
      .map((f) => ({
        tipo_item: f.tipo_item || 'insumo',
        insumo_id: f.insumo_id,
        sub_receita_id: f.sub_receita_id,
        quantidade_usada: f.quantidade_usada,
      }));
    setBomItens(itens);
    setModalOpen(true);
  };

  const simulacao = useMemo(() => {
    const tempProd: Produto = {
      id: 'sim',
      nome,
      preco_venda: precoVenda,
      rendimento_padrao: rendimentoPadrao,
      comissao_revendedor_pct: comissaoPct,
      estoque_pronto: estoquePronto,
      validade_dias: validadeDias,
      custo_indireto_receita: custoIndiretoReceita,
    };
    const tempFichas: FichaTecnicaItem[] = bomItens.map((b, i) => ({
      id: `sim-${i}`,
      produto_id: 'sim',
      ...b,
    }));
    const m = calcularMetricasProduto(
      tempProd,
      tempFichas,
      insumosMap,
      subReceitasMap,
      subMetricasMap,
      db.config.percentual_rateio_indireto
    );
    const comissaoUnit = precoVenda * (comissaoPct / 100);
    const lucroRevendedor = precoVenda - comissaoUnit - m.custo_unitario_total;
    return { ...m, lucroRevendedor };
  }, [
    nome,
    precoVenda,
    rendimentoPadrao,
    comissaoPct,
    estoquePronto,
    validadeDias,
    custoIndiretoReceita,
    bomItens,
    insumosMap,
    subReceitasMap,
    subMetricasMap,
    db.config.percentual_rateio_indireto,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || rendimentoPadrao <= 0) return;
    onSaveProdutoComFicha(
      {
        nome: nome.trim(),
        preco_venda: precoVenda,
        rendimento_padrao: rendimentoPadrao,
        comissao_revendedor_pct: comissaoPct,
        estoque_pronto: estoquePronto,
        validade_dias: validadeDias,
        custo_indireto_receita: custoIndiretoReceita,
      },
      bomItens,
      editId
    );
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#291D18] tracking-tight">
            Produtos & Fichas Técnicas (BOM)
          </h2>
          <p className="text-sm text-stone-500">
            Vincule insumos e sub-receitas base com rateio de custos indiretos (
            {db.config.percentual_rateio_indireto}% + fixo/receita).
          </p>
        </div>
        <button
          type="button"
          onClick={openNovoProduto}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {db.produtos.map((prod) => {
          const m = produtoMetricasMap.get(prod.id);
          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-[#291D18] leading-snug">
                      {prod.nome}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Rend.: <strong>{prod.rendimento_padrao} un</strong> •
                      Validade: <strong>{prod.validade_dias} dias</strong> •{' '}
                      {m?.itens_count || 0} itens
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    {prod.estoque_pronto} un prontas
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-100">
                  <div>
                    <span className="text-[11px] text-stone-500 block">
                      Preço Venda
                    </span>
                    <strong className="text-base text-[#291D18]">
                      {formatBRL(prod.preco_venda)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">
                      CMV Unitário
                    </span>
                    <strong className="text-base text-stone-700">
                      {formatBRL(m?.custo_unitario_cmv || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">
                      Custo Total Unit.
                    </span>
                    <strong className="text-base text-amber-800">
                      {formatBRL(m?.custo_unitario_total || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">
                      Lucro Líq. Unit.
                    </span>
                    <strong className="text-base text-emerald-700">
                      {formatBRL(m?.lucro_liquido_unit_rs || 0)} (
                      {(m?.lucro_liquido_unit_pct || 0).toFixed(0)}%)
                    </strong>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500 bg-stone-50 rounded-xl px-3 py-2">
                  <span>
                    Margem Contribuição (CMV):{' '}
                    <strong className="text-emerald-700">
                      {(m?.margem_contribuicao_pct || 0).toFixed(1)}%
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Rateio Indireto/Receita:{' '}
                    <strong className="text-stone-700">
                      {formatBRL(m?.custo_indireto_total_receita || 0)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => openEditarProduto(prod)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#291D18] text-amber-50 hover:bg-stone-800"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  Editar / Ficha Técnica (BOM)
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteProduto(prod)}
                  className="p-2.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Produto + BOM (Insumos + Sub-receitas) */}
      <ModalWrapper
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editId
            ? 'Editar Produto & Ficha Técnica'
            : 'Novo Produto & Ficha Técnica'
        }
        subtitle="Combine insumos crus e sub-receitas base com rateio de custos indiretos."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="col-span-2 sm:col-span-3 lg:col-span-6">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nome do Produto
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Preço Venda
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={precoVenda}
                onChange={(e) =>
                  setPrecoVenda(parseFloat(e.target.value || '0'))
                }
                className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Rend. (un)
              </label>
              <input
                type="number"
                min="1"
                required
                value={rendimentoPadrao}
                onChange={(e) =>
                  setRendimentoPadrao(
                    Math.max(1, parseInt(e.target.value || '1', 10))
                  )
                }
                className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Validade (d)
              </label>
              <input
                type="number"
                min="1"
                required
                value={validadeDias}
                onChange={(e) =>
                  setValidadeDias(
                    Math.max(1, parseInt(e.target.value || '7', 10))
                  )
                }
                className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Rateio Fixo R$
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={custoIndiretoReceita}
                onChange={(e) =>
                  setCustoIndiretoReceita(parseFloat(e.target.value || '0'))
                }
                className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Comis. (%)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                value={comissaoPct}
                onChange={(e) =>
                  setComissaoPct(parseFloat(e.target.value || '0'))
                }
                className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Pronto (un)
              </label>
              <input
                type="number"
                min="0"
                value={estoquePronto}
                onChange={(e) =>
                  setEstoquePronto(
                    Math.max(0, parseInt(e.target.value || '0', 10))
                  )
                }
                className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Simulador Completo */}
          <div className="bg-[#291D18] text-stone-100 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[11px] text-amber-300/80 block">
                CMV Unitário
              </span>
              <strong className="text-base text-white">
                {formatBRL(simulacao.custo_unitario_cmv)}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-amber-300/80 block">
                Custo Total (c/ Rateio)
              </span>
              <strong className="text-base text-amber-300">
                {formatBRL(simulacao.custo_unitario_total)}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-amber-300/80 block">
                Lucro Líq. Direto
              </span>
              <strong className="text-base text-emerald-400">
                {formatBRL(simulacao.lucro_liquido_unit_rs)} (
                {simulacao.lucro_liquido_unit_pct.toFixed(0)}%)
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-amber-300/80 block">
                Lucro Via Revendedor
              </span>
              <strong className="text-base text-amber-200">
                {formatBRL(simulacao.lucroRevendedor)}
              </strong>
            </div>
          </div>

          {/* Itens BOM */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-[#291D18]">
                Composição da Receita (Insumos & Sub-receitas)
              </h4>
              <div className="flex gap-2">
                {db.sub_receitas.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setBomItens((prev) => [
                        ...prev,
                        {
                          tipo_item: 'sub_receita',
                          sub_receita_id: db.sub_receitas[0].id,
                          quantidade_usada: 300,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#291D18] text-amber-100 hover:bg-stone-800"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />+
                    Sub-receita
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (db.insumos[0]) {
                      setBomItens((prev) => [
                        ...prev,
                        {
                          tipo_item: 'insumo',
                          insumo_id: db.insumos[0].id,
                          quantidade_usada: 100,
                        },
                      ]);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                >
                  <Plus className="w-3.5 h-3.5" />+ Insumo
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {bomItens.map((item, idx) => {
                const isSub = item.tipo_item === 'sub_receita';
                const ins =
                  !isSub && item.insumo_id
                    ? insumosMap.get(item.insumo_id)
                    : null;
                const sub =
                  isSub && item.sub_receita_id
                    ? subReceitasMap.get(item.sub_receita_id)
                    : null;
                const subM =
                  isSub && item.sub_receita_id
                    ? subMetricasMap.get(item.sub_receita_id)
                    : null;
                const subtotal = isSub
                  ? item.quantidade_usada * (subM?.custo_unitario || 0)
                  : item.quantidade_usada * (ins?.custo_medio_unitario || 0);

                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border ${
                      isSub
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="col-span-6">
                      {isSub ? (
                        <select
                          value={item.sub_receita_id}
                          onChange={(e) =>
                            setBomItens((prev) =>
                              prev.map((row, i) =>
                                i === idx
                                  ? { ...row, sub_receita_id: e.target.value }
                                  : row
                              )
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 text-xs font-bold bg-white text-[#291D18]"
                        >
                          {db.sub_receitas.map((sOpt) => (
                            <option key={sOpt.id} value={sOpt.id}>
                              [BASE] {sOpt.nome} ({sOpt.unidade})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={item.insumo_id}
                          onChange={(e) =>
                            setBomItens((prev) =>
                              prev.map((row, i) =>
                                i === idx
                                  ? { ...row, insumo_id: e.target.value }
                                  : row
                              )
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-medium bg-white"
                        >
                          {db.insumos.map((insOpt) => (
                            <option key={insOpt.id} value={insOpt.id}>
                              {insOpt.nome} ({insOpt.unidade})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={item.quantidade_usada}
                        onChange={(e) =>
                          setBomItens((prev) =>
                            prev.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    quantidade_usada: parseFloat(
                                      e.target.value || '0'
                                    ),
                                  }
                                : row
                            )
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-right bg-white"
                      />
                      <span className="text-[11px] font-semibold text-stone-500 w-5">
                        {isSub ? sub?.unidade : ins?.unidade}
                      </span>
                    </div>

                    <div className="col-span-2 text-right text-xs font-semibold text-stone-700">
                      {formatBRL(subtotal)}
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setBomItens((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
            >
              Salvar Produto & Receita
            </button>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
}

// ============================================================================
// TELA 6: ESTOQUE & COMPRAS (COM CONVERSOR DE VOLUMES / PACOTES)
// ============================================================================

function EstoqueComprasView({
  db,
  insumosMap,
  preloadCompraInsumoId,
  onClearPreload,
  onSaveInsumo,
  onDeleteInsumo,
  onRegisterCompra,
  onDeleteCompra,
  onOpenPerda,
}: {
  db: ERPDatabase;
  insumosMap: Map<string, Insumo>;
  preloadCompraInsumoId: string | null;
  onClearPreload: () => void;
  onSaveInsumo: (insumo: Omit<Insumo, 'id'>, editId?: string) => void;
  onDeleteInsumo: (insumo: Insumo) => void;
  onRegisterCompra: (compra: Omit<Compra, 'id'>) => void;
  onDeleteCompra: (compra: Compra) => void;
  onOpenPerda: () => void;
}) {
  const [subTab, setSubTab] = useState<'estoque' | 'compras'>('estoque');
  const [buscaEstoque, setBuscaEstoque] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<
    'Todos' | CategoriaInsumo
  >('Todos');
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | StatusInsumo>(
    'Todos'
  );
  const [buscaCompras, setBuscaCompras] = useState('');

  // Modal Insumo
  const [insumoModalOpen, setInsumoModalOpen] = useState(false);
  const [editInsumoId, setEditInsumoId] = useState<string | undefined>(
    undefined
  );
  const [insNome, setInsNome] = useState('');
  const [insCategoria, setInsCategoria] =
    useState<CategoriaInsumo>('Ingredientes');
  const [insUnidade, setInsUnidade] = useState<UnidadeInsumo>('g');
  const [insAtual, setInsAtual] = useState(0);
  const [insMinimo, setInsMinimo] = useState(500);
  const [insCustoBase, setInsCustoBase] = useState(0.05);

  // Modal Compra com Conversor de Volumes × Conteúdo
  const [compraModalOpen, setCompraModalOpen] = useState(false);
  const [cmpData, setCmpData] = useState(formatDateISO(new Date()));
  const [cmpFornecedor, setCmpFornecedor] = useState('');
  const [cmpInsumoId, setCmpInsumoId] = useState(db.insumos[0]?.id || '');
  const [usarConversorVolume, setUsarConversorVolume] = useState(true);
  const [cmpVolumesQtd, setCmpVolumesQtd] = useState(2);
  const [cmpConteudoVol, setCmpConteudoVol] = useState(1000);
  const [cmpQtdManual, setCmpQtdManual] = useState(1000);
  const [cmpValorTotal, setCmpValorTotal] = useState(50);
  const [cmpFormaPag, setCmpFormaPag] = useState<FormaPagamentoCompra>('Pix');

  const cmpQtdFinal = usarConversorVolume
    ? Math.max(0, cmpVolumesQtd * cmpConteudoVol)
    : cmpQtdManual;

  const openModalCompra = (preInsumoId?: string) => {
    const id = preInsumoId || db.insumos[0]?.id || '';
    const ins = insumosMap.get(id);
    setCmpData(formatDateISO(new Date()));
    setCmpFornecedor('');
    setCmpInsumoId(id);
    setUsarConversorVolume(true);
    const volQtd = 2;
    const contVol = ins?.unidade === 'un' ? 50 : 1000;
    setCmpVolumesQtd(volQtd);
    setCmpConteudoVol(contVol);
    setCmpQtdManual(volQtd * contVol);
    setCmpValorTotal(
      Number(
        ((ins?.custo_medio_unitario || 0.05) * volQtd * contVol).toFixed(2)
      )
    );
    setCmpFormaPag('Pix');
    setCompraModalOpen(true);
  };

  useEffect(() => {
    if (preloadCompraInsumoId) {
      openModalCompra(preloadCompraInsumoId);
      onClearPreload();
    }
  }, [preloadCompraInsumoId]);

  const openModalInsumo = (insumo?: Insumo) => {
    if (insumo) {
      setEditInsumoId(insumo.id);
      setInsNome(insumo.nome);
      setInsCategoria(insumo.categoria);
      setInsUnidade(insumo.unidade);
      setInsAtual(insumo.estoque_atual);
      setInsMinimo(insumo.estoque_minimo);
      setInsCustoBase(insumo.custo_medio_unitario);
    } else {
      setEditInsumoId(undefined);
      setInsNome('');
      setInsCategoria('Ingredientes');
      setInsUnidade('g');
      setInsAtual(0);
      setInsMinimo(500);
      setInsCustoBase(0.03);
    }
    setInsumoModalOpen(true);
  };

  const handleSaveInsumoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insNome.trim()) return;
    onSaveInsumo(
      {
        nome: insNome.trim(),
        categoria: insCategoria,
        unidade: insUnidade,
        estoque_atual: insAtual,
        estoque_minimo: insMinimo,
        custo_medio_unitario: insCustoBase,
      },
      editInsumoId
    );
    setInsumoModalOpen(false);
  };

  const handleSaveCompraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmpInsumoId || cmpQtdFinal <= 0 || cmpValorTotal <= 0) return;
    onRegisterCompra({
      data: cmpData,
      fornecedor: cmpFornecedor.trim() || 'Fornecedor Avulso',
      insumo_id: cmpInsumoId,
      quantidade_comprada: cmpQtdFinal,
      volumes_qtd: usarConversorVolume ? cmpVolumesQtd : undefined,
      conteudo_por_volume: usarConversorVolume ? cmpConteudoVol : undefined,
      valor_total_pago: cmpValorTotal,
      forma_pagamento: cmpFormaPag,
    });
    setCompraModalOpen(false);
  };

  const insumosFiltrados = useMemo(() => {
    const q = buscaEstoque.trim().toLowerCase();
    return db.insumos.filter((i) => {
      if (filtroCategoria !== 'Todos' && i.categoria !== filtroCategoria)
        return false;
      if (filtroStatus !== 'Todos' && getInsumoStatus(i) !== filtroStatus)
        return false;
      if (q && !i.nome.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [db.insumos, buscaEstoque, filtroCategoria, filtroStatus]);

  const comprasFiltradas = useMemo(() => {
    const q = buscaCompras.trim().toLowerCase();
    return db.compras
      .filter((c) => {
        if (!q) return true;
        const nomeIns = insumosMap.get(c.insumo_id)?.nome.toLowerCase() || '';
        return c.fornecedor.toLowerCase().includes(q) || nomeIns.includes(q);
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [db.compras, buscaCompras, insumosMap]);

  const insumoCompraAtual = insumosMap.get(cmpInsumoId);
  const precoUnitCompraPreview =
    cmpQtdFinal > 0 ? cmpValorTotal / cmpQtdFinal : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#291D18] tracking-tight">
            Estoque & Compras
          </h2>
          <p className="text-sm text-stone-500">
            Entrada por volume/pacote, controle de estoque mínimo e histórico de
            fornecedores.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenPerda}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
          >
            <BadgeAlert className="w-4 h-4 text-amber-600" />
            Baixa Perda
          </button>
          <button
            type="button"
            onClick={() => openModalInsumo()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-stone-300 text-[#291D18] hover:bg-stone-50"
          >
            <Plus className="w-4 h-4" />
            Novo Insumo
          </button>
          <button
            type="button"
            onClick={() => openModalCompra()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Registrar Compra
          </button>
        </div>
      </div>

      {/* Sub-abas */}
      <div className="inline-flex bg-white border border-stone-200 rounded-xl p-1 shadow-xs">
        <button
          type="button"
          onClick={() => setSubTab('estoque')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            subTab === 'estoque'
              ? 'bg-[#291D18] text-amber-50'
              : 'text-stone-600 hover:text-[#291D18]'
          }`}
        >
          Posição de Estoque ({db.insumos.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('compras')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            subTab === 'compras'
              ? 'bg-[#291D18] text-amber-50'
              : 'text-stone-600 hover:text-[#291D18]'
          }`}
        >
          Histórico de Compras ({db.compras.length})
        </button>
      </div>

      {subTab === 'estoque' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col lg:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaEstoque}
                onChange={(e) => setBuscaEstoque(e.target.value)}
                placeholder="Pesquisar insumo..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={filtroCategoria}
                onChange={(e) =>
                  setFiltroCategoria(
                    e.target.value as 'Todos' | CategoriaInsumo
                  )
                }
                className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold bg-stone-50"
              >
                <option value="Todos">Todas Categorias</option>
                <option value="Ingredientes">Ingredientes</option>
                <option value="Embalagens">Embalagens</option>
                <option value="Etiquetas">Etiquetas</option>
              </select>

              <div className="inline-flex bg-stone-100 rounded-xl p-1">
                {(['Todos', 'REPOR', 'ATENCAO', 'OK'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFiltroStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      filtroStatus === st
                        ? 'bg-white text-[#291D18] shadow-xs'
                        : 'text-stone-600 hover:text-[#291D18]'
                    }`}
                  >
                    {st === 'ATENCAO' ? 'ATENÇÃO' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                  <th className="py-3 px-4">Insumo</th>
                  <th className="py-3 px-4 text-right">Estoque Atual</th>
                  <th className="py-3 px-4 text-right">Mínimo</th>
                  <th className="py-3 px-4 text-right">Custo Médio</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {insumosFiltrados.map((ins) => {
                  const status = getInsumoStatus(ins);
                  const valorEstoque =
                    Math.max(0, ins.estoque_atual) * ins.custo_medio_unitario;
                  return (
                    <tr key={ins.id} className="hover:bg-stone-50/70">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#291D18]">
                          {ins.nome}
                        </p>
                        <p className="text-xs text-stone-500">
                          {ins.categoria}
                        </p>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          ins.estoque_atual < 0
                            ? 'text-red-600'
                            : 'text-[#291D18]'
                        }`}
                      >
                        {formatQty(ins.estoque_atual, ins.unidade)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-stone-500">
                        {formatQty(ins.estoque_minimo, ins.unidade)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-stone-700 font-medium">
                        {formatUnitCostReadable(
                          ins.custo_medio_unitario,
                          ins.unidade
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-stone-700">
                        {formatBRL(valorEstoque)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openModalCompra(ins.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                          >
                            + Comprar
                          </button>
                          <button
                            type="button"
                            onClick={() => openModalInsumo(ins)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-[#291D18] hover:bg-stone-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteInsumo(ins)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'compras' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-[#291D18]">
              Entradas de Estoque por Fornecedor
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaCompras}
                onChange={(e) => setBuscaCompras(e.target.value)}
                placeholder="Buscar fornecedor, insumo..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                  <th className="py-3 px-4">Data / Fornecedor</th>
                  <th className="py-3 px-4">Insumo</th>
                  <th className="py-3 px-4 text-right">Entrada Total</th>
                  <th className="py-3 px-4 text-right">Custo Unit.</th>
                  <th className="py-3 px-4 text-right">Total Pago</th>
                  <th className="py-3 px-4 text-center">Pagamento</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {comprasFiltradas.map((c) => {
                  const ins = insumosMap.get(c.insumo_id);
                  const unitPago =
                    c.quantidade_comprada > 0
                      ? c.valor_total_pago / c.quantidade_comprada
                      : 0;
                  return (
                    <tr key={c.id} className="hover:bg-stone-50/70">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#291D18]">
                          {c.fornecedor}
                        </p>
                        <p className="text-xs text-stone-500">
                          {formatDateBR(c.data)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-stone-700">
                          {ins?.nome || 'Insumo removido'}
                        </p>
                        {c.volumes_qtd && c.conteudo_por_volume && ins && (
                          <p className="text-[11px] text-stone-400">
                            {c.volumes_qtd} vol. ×{' '}
                            {formatQty(c.conteudo_por_volume, ins.unidade)}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                        +
                        {ins
                          ? formatQty(c.quantidade_comprada, ins.unidade)
                          : c.quantidade_comprada}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-stone-600">
                        {ins
                          ? formatUnitCostReadable(unitPago, ins.unidade)
                          : formatBRL(unitPago)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#291D18]">
                        {formatBRL(c.valor_total_pago)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                          {c.forma_pagamento}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteCompra(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Estornar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Insumo */}
      <ModalWrapper
        open={insumoModalOpen}
        onClose={() => setInsumoModalOpen(false)}
        title={editInsumoId ? 'Editar Insumo' : 'Novo Insumo'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveInsumoSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nome do Insumo
            </label>
            <input
              type="text"
              required
              value={insNome}
              onChange={(e) => setInsNome(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Categoria
              </label>
              <select
                value={insCategoria}
                onChange={(e) =>
                  setInsCategoria(e.target.value as CategoriaInsumo)
                }
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
              >
                <option value="Ingredientes">Ingredientes</option>
                <option value="Embalagens">Embalagens</option>
                <option value="Etiquetas">Etiquetas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Unidade Base
              </label>
              <select
                value={insUnidade}
                onChange={(e) => setInsUnidade(e.target.value as UnidadeInsumo)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
              >
                <option value="g">Gramas (g)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="un">Unidades (un)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Estoque Atual ({insUnidade})
              </label>
              <input
                type="number"
                step="any"
                required
                value={insAtual}
                onChange={(e) => setInsAtual(parseFloat(e.target.value || '0'))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Estoque Mínimo ({insUnidade})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={insMinimo}
                onChange={(e) =>
                  setInsMinimo(parseFloat(e.target.value || '0'))
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Custo Médio Unitário (R$ por 1 {insUnidade})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={insCustoBase}
              onChange={(e) =>
                setInsCustoBase(parseFloat(e.target.value || '0'))
              }
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
            />
            <p className="text-xs text-amber-700 mt-1 font-medium">
              Equivalente a: {formatUnitCostReadable(insCustoBase, insUnidade)}
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInsumoModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
            >
              Salvar Insumo
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* Modal Registrar Compra com Conversor Inteligente de Volumes */}
      <ModalWrapper
        open={compraModalOpen}
        onClose={() => setCompraModalOpen(false)}
        title="Registrar Compra de Insumo"
        subtitle="Use o conversor de pacotes/barras (ex: 3 barras × 1.010g) ou informe o total direto."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveCompraSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Insumo
            </label>
            <select
              value={cmpInsumoId}
              onChange={(e) => setCmpInsumoId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
            >
              {db.insumos.map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.nome} ({ins.unidade}) — Atual:{' '}
                  {formatQty(ins.estoque_atual, ins.unidade)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={cmpData}
                onChange={(e) => setCmpData(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Forma Pagamento
              </label>
              <select
                value={cmpFormaPag}
                onChange={(e) =>
                  setCmpFormaPag(e.target.value as FormaPagamentoCompra)
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
              >
                <option value="Pix">Pix</option>
                <option value="Cartão Crédito">Cartão Crédito</option>
                <option value="Débito">Débito</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Fornecedor
            </label>
            <input
              type="text"
              required
              value={cmpFornecedor}
              onChange={(e) => setCmpFornecedor(e.target.value)}
              placeholder="Ex: Atacadão Confeiteiro..."
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm"
            />
          </div>

          {/* Toggle Conversor de Volumes */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#291D18] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-700" />
                Conversor por Embalagens / Volumes
              </span>
              <button
                type="button"
                onClick={() => setUsarConversorVolume((v) => !v)}
                className="text-xs font-bold text-amber-800 underline"
              >
                {usarConversorVolume
                  ? 'Digitar total direto'
                  : 'Usar volumes × conteúdo'}
              </button>
            </div>

            {usarConversorVolume ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Qtd. Volumes / Pacotes
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={cmpVolumesQtd}
                    onChange={(e) =>
                      setCmpVolumesQtd(parseFloat(e.target.value || '0'))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Conteúdo por Volume ({insumoCompraAtual?.unidade || 'g'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={cmpConteudoVol}
                    onChange={(e) =>
                      setCmpConteudoVol(parseFloat(e.target.value || '0'))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-bold bg-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Quantidade Total Comprada ({insumoCompraAtual?.unidade || 'g'}
                  )
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={cmpQtdManual}
                  onChange={(e) =>
                    setCmpQtdManual(parseFloat(e.target.value || '0'))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-bold bg-white"
                />
              </div>
            )}

            {insumoCompraAtual && (
              <p className="text-xs font-semibold text-[#291D18]">
                Entrada calculada no estoque:{' '}
                <strong className="text-emerald-700">
                  +{formatQty(cmpQtdFinal, insumoCompraAtual.unidade)}
                </strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Valor Total Pago na Nota (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={cmpValorTotal}
              onChange={(e) =>
                setCmpValorTotal(parseFloat(e.target.value || '0'))
              }
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
            />
            {insumoCompraAtual && (
              <p className="text-xs text-amber-700 font-semibold mt-1">
                Custo unitário desta compra:{' '}
                {formatUnitCostReadable(
                  precoUnitCompraPreview,
                  insumoCompraAtual.unidade
                )}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCompraModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
            >
              Confirmar Compra
            </button>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
}

// ============================================================================
// MODAL GLOBAL: BAIXA POR PERDA / DEGUSTAÇÃO / AVARIA
// ============================================================================

function PerdaAvariaModal({
  open,
  onClose,
  produtos,
  insumos,
  produtoMetricasMap,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  produtos: Produto[];
  insumos: Insumo[];
  produtoMetricasMap: Map<string, ProdutoMetricas>;
  onConfirm: (payload: {
    alvo_tipo: 'produto' | 'insumo';
    alvo_id: string;
    quantidade: number;
    motivo: MotivoPerda;
    observacao: string;
  }) => void;
}) {
  const [alvoTipo, setAlvoTipo] = useState<'produto' | 'insumo'>('produto');
  const [alvoId, setAlvoId] = useState(produtos[0]?.id || '');
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState<MotivoPerda>('Degustação / Amostra');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (open) {
      setAlvoTipo('produto');
      setAlvoId(produtos[0]?.id || '');
      setQuantidade(1);
      setMotivo('Degustação / Amostra');
      setObservacao('');
    }
  }, [open, produtos]);

  const custoEstimado = useMemo(() => {
    if (alvoTipo === 'produto') {
      return (
        (produtoMetricasMap.get(alvoId)?.custo_unitario_cmv || 0) * quantidade
      );
    }
    const ins = insumos.find((i) => i.id === alvoId);
    return (ins?.custo_medio_unitario || 0) * quantidade;
  }, [alvoTipo, alvoId, quantidade, produtoMetricasMap, insumos]);

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Baixa por Perda, Quebra ou Degustação"
      subtitle="Abate o estoque e lança o custo da perda no resultado sem inflar o faturamento."
      maxWidth="max-w-lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!alvoId || quantidade <= 0) return;
          onConfirm({
            alvo_tipo: alvoTipo,
            alvo_id: alvoId,
            quantidade,
            motivo,
            observacao: observacao.trim(),
          });
          onClose();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setAlvoTipo('produto');
              setAlvoId(produtos[0]?.id || '');
              setQuantidade(1);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold border ${
              alvoTipo === 'produto'
                ? 'bg-[#291D18] text-amber-50 border-[#291D18]'
                : 'bg-stone-50 text-stone-600 border-stone-200'
            }`}
          >
            Produto Pronto (Vitrine)
          </button>
          <button
            type="button"
            onClick={() => {
              setAlvoTipo('insumo');
              setAlvoId(insumos[0]?.id || '');
              setQuantidade(100);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold border ${
              alvoTipo === 'insumo'
                ? 'bg-[#291D18] text-amber-50 border-[#291D18]'
                : 'bg-stone-50 text-stone-600 border-stone-200'
            }`}
          >
            Insumo / Matéria-Prima
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            {alvoTipo === 'produto' ? 'Produto' : 'Insumo'}
          </label>
          {alvoTipo === 'produto' ? (
            <select
              value={alvoId}
              onChange={(e) => setAlvoId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
            >
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Pronto: {p.estoque_pronto} un)
                </option>
              ))}
            </select>
          ) : (
            <select
              value={alvoId}
              onChange={(e) => setAlvoId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
            >
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome} (Atual: {formatQty(i.estoque_atual, i.unidade)})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Quantidade (
              {alvoTipo === 'produto'
                ? 'un'
                : insumos.find((i) => i.id === alvoId)?.unidade || 'g'}
              )
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              required
              value={quantidade}
              onChange={(e) => setQuantidade(parseFloat(e.target.value || '0'))}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Motivo
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as MotivoPerda)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
            >
              <option value="Degustação / Amostra">Degustação / Amostra</option>
              <option value="Quebra / Forno">Quebra / Forno</option>
              <option value="Vencimento">Vencimento</option>
              <option value="Avaria Transporte">Avaria Transporte</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Observação
          </label>
          <input
            type="text"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Amostra enviada para cafeteria parceira..."
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-red-900">
            Custo da baixa abatido do lucro:
          </span>
          <strong className="text-base text-red-700">
            -{formatBRL(custoEstimado)}
          </strong>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-sm font-bold bg-[#291D18] text-amber-50 hover:bg-stone-800"
          >
            Confirmar Baixa
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ============================================================================
// MODAL GLOBAL: CONFIGURAÇÕES FINANCEIRAS, PIX, BACKUP JSON & SUPABASE CLOUD
// ============================================================================

const SUPABASE_SCHEMA_SQL = `-- Execute no SQL Editor do seu projeto Supabase:
create table if not exists public.lua_de_mel_erp_snapshots (
  workspace_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.lua_de_mel_erp_snapshots enable row level security;

create policy "Acesso ERP Lua de Mel"
  on public.lua_de_mel_erp_snapshots
  for all
  using (true)
  with check (true);`;

function SettingsCloudModal({
  open,
  onClose,
  db,
  onUpdateConfig,
  onReplaceDb,
  onExport,
  onImport,
  onReset,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  db: ERPDatabase;
  onUpdateConfig: (partial: Partial<AppConfig>) => void;
  onReplaceDb: (newDb: ERPDatabase) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onToast: (msg: string, type?: ToastMessage['type']) => void;
}) {
  const [tab, setTab] = useState<'financeiro' | 'supabase' | 'backup'>(
    'financeiro'
  );
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePushSupabase = async () => {
    setSyncing(true);
    const res = await ERPRepository.pushToSupabase(db);
    setSyncing(false);
    if (res.ok) {
      onUpdateConfig({
        supabase: {
          ...db.config.supabase,
          last_sync_at: new Date().toISOString(),
        },
      });
      onToast(res.message, 'success');
    } else {
      onToast(res.message, 'error');
    }
  };

  const handlePullSupabase = async () => {
    setSyncing(true);
    const res = await ERPRepository.pullFromSupabase(db.config.supabase);
    setSyncing(false);
    if (res.ok && res.data) {
      onReplaceDb({
        ...res.data,
        config: {
          ...res.data.config,
          supabase: {
            ...db.config.supabase,
            last_sync_at: new Date().toISOString(),
          },
        },
      });
      onToast(res.message, 'success');
    } else {
      onToast(res.message, 'error');
    }
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Configurações, Taxas & Sincronização Nuvem"
      subtitle="Taxas de pagamento, chave Pix, custeio e conector híbrido Supabase."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Sub-abas */}
        <div className="inline-flex bg-stone-100 rounded-xl p-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTab('financeiro')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              tab === 'financeiro'
                ? 'bg-white text-[#291D18] shadow-xs'
                : 'text-stone-600'
            }`}
          >
            Taxas, Pix & Custeio
          </button>
          <button
            type="button"
            onClick={() => setTab('supabase')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 ${
              tab === 'supabase'
                ? 'bg-white text-[#291D18] shadow-xs'
                : 'text-stone-600'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            Nuvem (Supabase)
          </button>
          <button
            type="button"
            onClick={() => setTab('backup')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              tab === 'backup'
                ? 'bg-white text-[#291D18] shadow-xs'
                : 'text-stone-600'
            }`}
          >
            Backup JSON
          </button>
        </div>

        {/* ABA 1: TAXAS, PIX E CUSTEIO */}
        {tab === 'financeiro' && (
          <div className="space-y-5">
            {/* Chave Pix para orçamentos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Chave Pix (para Orçamentos WhatsApp)
                </label>
                <input
                  type="text"
                  value={db.config.chave_pix}
                  onChange={(e) =>
                    onUpdateConfig({ chave_pix: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Favorecido Pix
                </label>
                <input
                  type="text"
                  value={db.config.nome_beneficiario_pix}
                  onChange={(e) =>
                    onUpdateConfig({ nome_beneficiario_pix: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                />
              </div>
            </div>

            {/* Rateio Indireto + Método Custeio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-200">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Rateio Custos Indiretos (% sobre CMV)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={db.config.percentual_rateio_indireto}
                  onChange={(e) =>
                    onUpdateConfig({
                      percentual_rateio_indireto: parseFloat(
                        e.target.value || '0'
                      ),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                />
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Cobre gás, energia, água e desgaste de utensílios nas fichas
                  técnicas.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Custeio de Compras
                </label>
                <select
                  value={db.config.metodo_custeio}
                  onChange={(e) =>
                    onUpdateConfig({
                      metodo_custeio: e.target.value as MetodoCusteio,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white font-semibold"
                >
                  <option value="media_ponderada">
                    Média Ponderada (Recomendado)
                  </option>
                  <option value="ultimo_preco">Último Preço Pago</option>
                </select>
              </div>
            </div>

            {/* Taxas por Forma de Pagamento */}
            <div className="pt-3 border-t border-stone-200 space-y-2.5">
              <h4 className="text-xs font-bold text-[#291D18] flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-amber-600" />
                Taxas de Maquininha / Canais (%)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(
                  Object.keys(
                    db.config.taxas_pagamento
                  ) as FormaPagamentoVenda[]
                ).map((fp) => (
                  <div
                    key={fp}
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                  >
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      {fp}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={db.config.taxas_pagamento[fp]}
                        onChange={(e) =>
                          onUpdateConfig({
                            taxas_pagamento: {
                              ...db.config.taxas_pagamento,
                              [fp]: parseFloat(e.target.value || '0'),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border border-stone-300 text-xs font-bold bg-white"
                      />
                      <span className="text-xs text-stone-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: SINCRONIZAÇÃO SUPABASE */}
        {tab === 'supabase' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
              Conecte seu projeto <strong>Supabase</strong> para sincronizar os
              dados entre o celular na cozinha e o computador sem perder a
              velocidade offline do <code>localStorage</code>.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  SUPABASE_URL
                </label>
                <input
                  type="url"
                  placeholder="https://seu-projeto.supabase.co"
                  value={db.config.supabase.url}
                  onChange={(e) =>
                    onUpdateConfig({
                      supabase: { ...db.config.supabase, url: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  SUPABASE_ANON_KEY
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={db.config.supabase.anon_key}
                  onChange={(e) =>
                    onUpdateConfig({
                      supabase: {
                        ...db.config.supabase,
                        anon_key: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tabela
                </label>
                <input
                  type="text"
                  value={db.config.supabase.table_name}
                  onChange={(e) =>
                    onUpdateConfig({
                      supabase: {
                        ...db.config.supabase,
                        table_name: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Workspace ID
                </label>
                <input
                  type="text"
                  value={db.config.supabase.workspace_id}
                  onChange={(e) =>
                    onUpdateConfig({
                      supabase: {
                        ...db.config.supabase,
                        workspace_id: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={syncing}
                onClick={handlePushSupabase}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#291D18] text-amber-50 hover:bg-stone-800 disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                {syncing ? 'Sincronizando...' : 'Enviar p/ Nuvem (Push)'}
              </button>

              <button
                type="button"
                disabled={syncing}
                onClick={handlePullSupabase}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                {syncing ? 'Buscando...' : 'Baixar da Nuvem (Pull)'}
              </button>
            </div>

            {db.config.supabase.last_sync_at && (
              <p className="text-[11px] text-stone-500">
                Última sincronização nuvem:{' '}
                <strong>
                  {new Date(db.config.supabase.last_sync_at).toLocaleString(
                    'pt-BR'
                  )}
                </strong>
              </p>
            )}

            <div className="space-y-1.5 pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  Schema SQL para criar a tabela no Supabase
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(SUPABASE_SCHEMA_SQL);
                    onToast('SQL copiado para a área de transferência!');
                  }}
                  className="text-xs font-bold text-amber-700 hover:underline"
                >
                  Copiar SQL
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-stone-900 text-amber-100 text-[11px] overflow-x-auto font-mono">
                {SUPABASE_SCHEMA_SQL}
              </pre>
            </div>
          </div>
        )}

        {/* ABA 3: BACKUP JSON */}
        {tab === 'backup' && (
          <div className="space-y-4">
            <p className="text-xs text-stone-500">
              Última gravação local:{' '}
              <strong>{new Date(db.updated_at).toLocaleString('pt-BR')}</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onExport}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-[#291D18] text-amber-50 hover:bg-stone-800"
              >
                <Download className="w-4 h-4 text-amber-400" />
                Exportar Backup JSON
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
              >
                <Upload className="w-4 h-4" />
                Importar Backup JSON
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImport(file);
                  e.target.value = '';
                }}
              />
            </div>

            <div className="pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar Dados Iniciais de Demonstração (Seed)
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}
