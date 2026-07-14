import { useState } from 'react'
import { requestDataDeletion } from '../../lib/lgpd'

export default function Privacidade() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [details, setDetails] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await requestDataDeletion(email, phone, details)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação')
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <section>
        <h2 className="font-semibold mb-2">Sobre seus dados (LGPD)</h2>
        <p className="text-sm text-neutral-600 leading-relaxed">
          O MenuFlex coleta apenas os dados necessários para operar seu negócio: cadastro do
          negócio, cardápio, pedidos e, com seu consentimento explícito, a localização usada
          para sugerir a instalação do app a clientes por perto. Você pode solicitar a
          exclusão dos seus dados a qualquer momento pelo formulário abaixo.
        </p>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Solicitar exclusão de dados</h2>
        {sent ? (
          <p className="text-sm text-green-700">Solicitação enviada. Vamos processar e confirmar por e-mail.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Seu telefone (opcional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Detalhes (opcional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
              rows={3}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium">
              Enviar solicitação
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
