import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabaseClient'
import { removeMenuItemPhoto, uploadMenuItemPhoto } from '../../lib/imagePipeline'
import type { MenuItem } from '../../lib/types'

interface ItemPhotoModalProps {
  businessId: string
  item: MenuItem
  onClose: () => void
  onUpdated: (item: MenuItem) => void
}

export default function ItemPhotoModal({ businessId, item, onClose, onUpdated }: ItemPhotoModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const image_url = await uploadMenuItemPhoto(businessId, item.id, file)
      const { data, error: updateError } = await supabase
        .from('menu_items')
        .update({ image_url })
        .eq('id', item.id)
        .select()
        .single()
      if (updateError) throw updateError
      if (data) onUpdated(data as MenuItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    if (!supabase || !item.image_url) return
    setLoading(true)
    setError(null)
    try {
      const oldUrl = item.image_url
      const { data, error: updateError } = await supabase
        .from('menu_items')
        .update({ image_url: null })
        .eq('id', item.id)
        .select()
        .single()
      if (updateError) throw updateError
      await removeMenuItemPhoto(oldUrl)
      if (data) onUpdated(data as MenuItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover foto')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Foto do produto"
    >
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">📷 Foto do produto</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-white/40 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>

        <div className="w-full aspect-square rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center overflow-hidden mb-4">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl opacity-40">📷</span>
          )}
        </div>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full rounded-xl bg-brand text-white py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Enviando...' : item.image_url ? 'Alterar Foto' : 'Adicionar Foto'}
          </button>
          {item.image_url && (
            <button
              onClick={handleRemove}
              disabled={loading}
              className="w-full rounded-xl border border-white/15 text-white/70 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              Remover Foto
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
