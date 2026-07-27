import { supabase } from './supabaseClient'

const MAX_DIM_PADRAO = 1200
const MAX_BYTES_PADRAO = 500 * 1024

function suportaWebp(): boolean {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

function carregarImagem(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    img.src = URL.createObjectURL(file)
  })
}

// Redimensiona pro maior lado não passar de maxDim, converte pra WebP quando o
// navegador suporta (fallback JPEG), e reduz qualidade em passos até caber em
// maxBytes — sem depender de nenhuma lib externa de compressão de imagem.
export async function compressImage(
  file: File,
  opts?: { maxDim?: number; maxBytes?: number },
): Promise<Blob> {
  const maxDim = opts?.maxDim ?? MAX_DIM_PADRAO
  const maxBytes = opts?.maxBytes ?? MAX_BYTES_PADRAO

  const img = await carregarImagem(file)
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas não suportado neste navegador.')
  ctx.drawImage(img, 0, 0, width, height)
  URL.revokeObjectURL(img.src)

  const mime = suportaWebp() ? 'image/webp' : 'image/jpeg'
  const toBlob = (quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality))

  let quality = 0.82
  let blob = await toBlob(quality)
  while (blob && blob.size > maxBytes && quality > 0.4) {
    quality -= 0.12
    blob = await toBlob(quality)
  }
  if (!blob) throw new Error('Não foi possível comprimir a imagem.')
  return blob
}

// Sobe a foto (já comprimida) pro mesmo bucket usado pro logo do negócio e
// devolve a URL pública. Isolado aqui pra facilitar trocar/adicionar outra
// fonte de upload no futuro sem mexer nos componentes que chamam esta função.
export async function uploadMenuItemPhoto(businessId: string, itemId: string, file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.')
  const blob = await compressImage(file)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${businessId}/item-${itemId}-${Date.now()}.${ext}`
  // sem upsert: o nome já é único (timestamp), então é sempre um insert puro —
  // evita depender do fluxo de upsert do Storage, que precisa de uma policy de
  // select pra checar se já existe arquivo com aquele nome (ver migration 0019)
  const { error: uploadError } = await supabase.storage.from('menu-images').upload(path, blob, {
    contentType: blob.type,
  })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('menu-images').getPublicUrl(path)
  return data.publicUrl
}

// Extrai o path dentro do bucket a partir da URL pública salva, pra permitir
// apagar o arquivo antigo do Storage quando a foto é removida/trocada.
export function pathFromMenuImagesUrl(url: string): string | null {
  const marker = '/menu-images/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export async function removeMenuItemPhoto(url: string): Promise<void> {
  if (!supabase) return
  const path = pathFromMenuImagesUrl(url)
  if (!path) return
  await supabase.storage.from('menu-images').remove([path])
}
