'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Settings, Save, Trash2, Camera, X, Upload, Loader2, Crop } from 'lucide-react'
import { Cropper, ReactCropperElement } from 'react-cropper'
import 'cropperjs/dist/cropper.css'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Produto {
  id?: string
  nome: string
  preco: string
  categoria: string
  fotos: string[]
}

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [senha, setSenha] = useState('')
  const [filtro, setFiltro] = useState('TODOS')
  const [genero, setGenero] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  const [editando, setEditando] = useState<Produto | null>(null)
  const [subindo, setSubindo] = useState(false)
  
  // Estados para o Recorte (Crop)
  const [imagemParaRecortar, setImagemParaRecortar] = useState<string | null>(null)
  const cropperRef = useRef<ReactCropperElement>(null)

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  // Função para processar a foto selecionada e abrir o editor de recorte
  const aoSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.onload = () => setImagemParaRecortar(reader.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  // Função que finaliza o recorte e sobe para o Supabase
  const finalizarRecorteESalvar = async () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper || !editando) return
    
    setSubindo(true)
    const canvas = cropper.getCroppedCanvas({ width: 800, height: 1000 }) // Proporção 4/5 luxo
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        const nomeArquivo = `produto-${Date.now()}.jpg`
        const { data, error } = await supabase.storage
          .from('fotos-produtos')
          .upload(nomeArquivo, blob)

        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('fotos-produtos').getPublicUrl(data.path)
          setEditando({ ...editando, fotos: [...(editando.fotos || []), publicUrl] })
        } else {
          alert('Erro ao subir: Verifique as Policies do Storage no Supabase')
        }
      }
      setSubindo(false)
      setImagemParaRecortar(null)
    }, 'image/jpeg')
  }

  const salvarProduto = async (p: Produto) => {
    if (p.id) {
      await supabase.from('produtos').update(p).eq('id', p.id)
    } else {
      await supabase.from('produtos').insert([p])
    }
    setEditando(null)
    carregarProdutos()
  }

  const categorias = genero === 'FEMININO' 
    ? ['TODOS', 'CALCINHA', 'SUTIÃ', 'CONJUNTO', 'PIJAMAS', 'CAMISETAS', 'CALÇAS LEG', 'MEIAS']
    : ['TODOS', 'CUECAS', 'PIJAMAS', 'MEIAS', 'CAMISETAS']

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-24">
      <header className="py-8 px-4 text-center bg-black text-[#D4AF37] border-b border-[#D4AF37]/20 sticky top-0 z-40">
        <h1 className="text-4xl font-light tracking-[0.3em]">M A B E L L E N</h1>
        <button onClick={() => setShowAdminLogin(true)} className="absolute right-4 top-10 opacity-30"><Settings size={20}/></button>
      </header>

      {/* Grid de Produtos com Swipe */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {produtos.filter(p => (filtro === 'TODOS' || p.categoria === filtro)).map((prod) => (
          <div key={prod.id}>
            <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-2 relative flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
              {prod.fotos?.map((f, i) => (
                <img key={i} src={f} className="w-full h-full object-cover snap-center flex-shrink-0" />
              ))}
            </div>
            <h3 className="text-[11px] uppercase text-gray-500">{prod.nome}</h3>
            <p className="text-sm font-bold">R$ {prod.preco}</p>
          </div>
        ))}
      </div>

      {/* Modal de Cadastro */}
      {editando && (
        <div className="fixed inset-0 bg-white z-[70] p-6 overflow-y-auto text-black">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gerenciar Fotos</h2>
            <button onClick={() => setEditando(null)}><X size={24}/></button>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-6 text-center relative bg-gray-50">
              <input type="file" accept="image/*" onChange={aoSelecionarArquivo} className="absolute inset-0 opacity-0" />
              <Camera className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm font-medium">Adicionar e Recortar Foto</p>
            </div>

            <div className="flex gap-2 overflow-x-auto py-2">
              {editando.fotos?.map((url, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={url} className="w-20 h-20 object-cover rounded-xl border" />
                  <button onClick={() => setEditando({...editando, fotos: editando.fotos.filter((_, idx) => idx !== i)})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                </div>
              ))}
            </div>

            <input type="text" placeholder="Nome" className="w-full p-4 bg-gray-50 rounded-2xl border" value={editando.nome} onChange={(e) => setEditando({...editando, nome: e.target.value})} />
            <input type="text" placeholder="Preço" className="w-full p-4 bg-gray-50 rounded-2xl border" value={editando.preco} onChange={(e) => setEditando({...editando, preco: e.target.value})} />
            <button onClick={() => salvarProduto(editando)} className="w-full bg-black text-[#D4AF37] p-5 rounded-2xl font-bold flex items-center justify-center gap-2">
              <Save size={20}/> FINALIZAR PRODUTO
            </button>
          </div>
        </div>
      )}

      {/* Interface de Recorte (Abre quando seleciona uma foto) */}
      {imagemParaRecortar && (
        <div className="fixed inset-0 bg-black z-[80] flex flex-col p-4">
          <div className="flex justify-between text-white mb-4">
            <button onClick={() => setImagemParaRecortar(null)} className="p-2">Cancelar</button>
            <h3 className="font-bold">Ajustar Enquadramento</h3>
            <button onClick={finalizarRecorteESalvar" className="bg-[#D4AF37] text-black px-4 py-1 rounded-lg font-bold">
              {subindo ? 'Salvando...' : 'Aplicar'}
            </button>
          </div>
          <div className="flex-1 overflow-hidden rounded-2xl">
            <Cropper
              src={imagemParaRecortar}
              style={{ height: '100%', width: '100%' }}
              initialAspectRatio={4 / 5}
              aspectRatio={4 / 5}
              guides={true}
              ref={cropperRef}
              viewMode={1}
              dragMode="move"
            />
          </div>
        </div>
      )}

      {isAdmin && <button onClick={() => setEditando({ nome: '', preco: '', categoria: 'TODOS', fotos: [] })} className="fixed bottom-24 right-6 bg-black text-[#D4AF37] p-4 rounded-full z-50"><Plus size={28}/></button>}
    </div>
  )
}