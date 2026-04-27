'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Settings, Save, Trash2, Camera, X, Loader2, Crop } from 'lucide-react'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [subindo, setSubindo] = useState(false)
  const [imagemParaRecortar, setImagemParaRecortar] = useState<string | null>(null)
  const cropperRef = useRef<any>(null)

  const carregarProdutos = async () => {
    const { data, error } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (error) console.error("Erro ao carregar:", error)
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  // FUNÇÃO DE EXCLUIR CORRIGIDA
  const handleExcluir = async (id: string) => {
    const certeza = window.confirm("Deseja realmente apagar este produto da vitrine?")
    if (!certeza) return

    const { error } = await supabase.from('produtos').delete().eq('id', id)
    
    if (error) {
      alert("Erro ao excluir: " + error.message)
    } else {
      // Atualiza a lista na hora
      setProdutos(produtos.filter(p => p.id !== id))
    }
  }

  const aoSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader()
      reader.onload = () => setImagemParaRecortar(reader.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const finalizarRecorteESalvar = async () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper || !editando) return
    setSubindo(true)
    cropper.getCroppedCanvas({ width: 800, height: 1000 }).toBlob(async (blob: any) => {
      if (blob) {
        const nome = `foto-${Date.now()}.jpg`
        const { data } = await supabase.storage.from('fotos-produtos').upload(nome, blob)
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('fotos-produtos').getPublicUrl(data.path)
          setEditando({ ...editando, fotos: [...(editando.fotos || []), publicUrl] })
        }
      }
      setSubindo(false); setImagemParaRecortar(null)
    }, 'image/jpeg')
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="py-6 text-center bg-black text-[#D4AF37] sticky top-0 z-50 border-b border-[#D4AF37]/20">
        <h1 className="text-3xl tracking-[0.2em] font-light italic">MABELLEN</h1>
        <button onClick={() => setIsAdmin(!isAdmin)} className="absolute right-4 top-7 opacity-30"><Settings size={20}/></button>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {produtos.map((prod) => (
          <div key={prod.id} className="relative bg-gray-50 rounded-xl p-2 border border-gray-100 group">
            <div className="aspect-[3/4] overflow-hidden rounded-lg relative">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover" />
              
              {/* BOTÃO DE EXCLUIR COM CORES FORTES PARA TESTE */}
              {isAdmin && (
                <button 
                  onClick={() => handleExcluir(prod.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-3 rounded-full shadow-2xl z-30 hover:scale-110 active:bg-red-800 transition-all"
                  title="Excluir Produto"
                >
                  <Trash2 size={20}/>
                </button>
              )}
            </div>
            <div className="mt-2 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{prod.nome}</p>
              <p className="font-bold text-black">R$ {prod.preco}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Editor de Recorte */}
      {imagemParaRecortar && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col p-4">
          <div className="flex justify-between text-white mb-4 items-center">
            <button onClick={() => setImagemParaRecortar(null)}>Cancelar</button>
            <button onClick={finalizarRecorteESalvar} className="bg-[#D4AF37] text-black px-6 py-2 rounded-full font-bold">
              {subindo ? 'Processando...' : 'Aplicar'}
            </button>
          </div>
          <div className="flex-1">
            <Cropper src={imagemParaRecortar} style={{ height: '100%', width: '100%' }} aspectRatio={3/4} guides={true} ref={cropperRef} viewMode={1} />
          </div>
        </div>
      )}

      {isAdmin && (
        <button onClick={() => setEditando({ nome: '', preco: '', fotos: [] })} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-[#D4AF37] p-5 rounded-full shadow-2xl z-50 border border-[#D4AF37]/50">
          <Plus size={32}/>
        </button>
      )}

      {/* Modal Cadastro */}
      {editando && (
        <div className="fixed inset-0 bg-white z-[80] p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Novo Item</h2><button onClick={() => setEditando(null)}><X size={24}/></button></div>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center relative bg-gray-50">
              <input type="file" accept="image/*" onChange={aoSelecionarArquivo} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Camera className="mx-auto text-gray-400 mb-2" size={30} />
              <p className="text-xs">Toque para selecionar foto</p>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {editando.fotos?.map((f:any, i:any) => <img key={i} src={f} className="w-16 h-20 object-cover rounded-lg border" />)}
            </div>
            <input type="text" placeholder="Nome" className="w-full p-4 bg-gray-100 rounded-xl" value={editando.nome} onChange={e=>setEditando({...editando, nome: e.target.value})} />
            <input type="text" placeholder="Preço" className="w-full p-4 bg-gray-100 rounded-xl" value={editando.preco} onChange={e=>setEditando({...editando, preco: e.target.value})} />
            <button onClick={async () => { await supabase.from('produtos').insert([editando]); setEditando(null); carregarProdutos(); }} className="w-full bg-black text-[#D4AF37] p-4 rounded-xl font-bold">SALVAR</button>
          </div>
        </div>
      )}
    </div>
  )
}