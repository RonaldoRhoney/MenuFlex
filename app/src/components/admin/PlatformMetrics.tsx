import BarChart from './BarChart'
import BarRank from './BarRank'
import type { PlatformSummary } from '../../lib/platformSummary'

function KpiCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 animate-fade-in">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent ? 'bg-brand' : 'bg-white/15'}`} />
      <p className={`text-2xl font-semibold tabular-nums ${accent ? 'text-brand' : ''}`}>{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  )
}

function formatarReais(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

const LABEL_STATUS_PAGAMENTO: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
}

const LABEL_STATUS_PEDIDO: Record<string, string> = {
  recebido: 'Recebido',
  preparo: 'Em preparo',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export default function PlatformMetrics({ data }: { data: PlatformSummary }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <KpiCard label="Usuários" value={data.total_usuarios} accent />
        <KpiCard label="Negócios" value={data.total_negocios} accent />
        <KpiCard label="Acessos total" value={data.total_geral} />
        <KpiCard label="Últimos 7 dias" value={data.total_7d} />
        <KpiCard label="Últimos 30 dias" value={data.total_30d} />
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Acessos · últimos 14 dias</h3>
        <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
          <BarChart data={data.por_dia} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Dispositivos</h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank items={data.dispositivos} />
          </div>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Navegadores</h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank items={data.navegadores} />
          </div>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Países</h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank items={data.paises} />
          </div>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Cidades</h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank items={data.cidades} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">
            Bairros dos negócios cadastrados
          </h3>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank items={data.bairros} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Financeiro</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
          <KpiCard label="MRR estimado" value={formatarReais(data.financeiro.mrr_estimado)} accent />
          <KpiCard label="Receita aprovada (30d)" value={formatarReais(data.financeiro.receita_aprovada_30d)} />
          <KpiCard label="Receita aprovada (total)" value={formatarReais(data.financeiro.receita_aprovada_total)} />
          <KpiCard label="Negócios pagantes" value={data.financeiro.negocios_por_plano.basico + data.financeiro.negocios_por_plano.premium} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-white/40 mb-2">Negócios por plano</p>
            <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
              <BarRank
                items={Object.entries(data.financeiro.negocios_por_plano)
                  .map(([label, total]) => ({ label, total }))
                  .sort((a, b) => b.total - a.total)}
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-2">Pagamentos por status (Mercado Pago)</p>
            <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
              <BarRank
                items={Object.entries(data.financeiro.pagamentos_por_status)
                  .map(([status, total]) => ({ label: LABEL_STATUS_PAGAMENTO[status] ?? status, total }))
                  .sort((a, b) => b.total - a.total)}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">Operação · últimos 30 dias</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
          <KpiCard label="Pedidos hoje" value={data.operacional.pedidos_hoje} accent />
          <KpiCard label="Pedidos (7d)" value={data.operacional.pedidos_7d} />
          <KpiCard label="Pedidos (30d)" value={data.operacional.pedidos_30d} />
          <KpiCard label="Ticket médio (30d)" value={formatarReais(data.operacional.ticket_medio_30d)} />
        </div>
        <div>
          <p className="text-xs text-white/40 mb-2">Pedidos por status</p>
          <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
            <BarRank
              items={Object.entries(data.operacional.pedidos_por_status_30d)
                .map(([status, total]) => ({ label: LABEL_STATUS_PEDIDO[status] ?? status, total }))
                .sort((a, b) => b.total - a.total)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
