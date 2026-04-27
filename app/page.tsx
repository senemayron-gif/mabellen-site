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
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

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

  const handleExcluir = async (id: string) => {
    if (confirm('Deseja excluir este item?')) {
      await supabase.from('produtos').delete().eq('id', id)
      carregarProdutos()
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="py-6 text-center bg-black text-[#D4AF37] sticky top-0 z-50 border-b border-[#D4AF37]/20">
        <h1 className="text-3xl tracking-[0.2em] font-light">M A B E L L E N</h1>
        <button onClick={() => setIsAdmin(!isAdmin)} className="absolute right-4 top-7 opacity-20"><Settings size={18}/></button>
      </header>

      {/* Grid Proporcional: 2 colunas no celular, 4 no computador */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {produtos.map((prod) => (
          <div key={prod.id} className="group bg-gray-50 rounded-xl p-2 border border-gray-100">
            <div className="aspect-[3/4] overflow-hidden rounded-lg relative">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover" />
              {isAdmin && (
                <button onClick={() => handleExcluir(prod.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg transition-transform active:scale-90">
                  <Trash2 size={16}/>
                </button>
              )}
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-[10px] text-gray-400 uppercase tracking-widest truncate px-2">{prod.nome}</h3>
              <p className="font-bold text-black text-lg">R$ {prod.preco}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Botão de Adicionar centralizado */}
      {isAdmin && (
        <button onClick={() => setEditando({ nome: '', preco: '', fotos: [] })} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-[#D4AF37] p-5 rounded-full shadow-2xl z-[60] active:scale-95 transition-transform">
          <Plus size={32}/>
        </button>
      )}

      {/* Modal de Recorte (Full Screen) */}
      {imagemParaRecortar && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <div className="flex justify-between p-4 text-white items-center bg-black/50 backdrop-blur-md">
            <button onClick={() => setImagemParaRecortar(null)} className="px-4 py-2 text-sm">Cancelar</button>
            <h2 className="font-bold">Ajustar Enquadramento</h2>
            <button onClick={finalizarRecorteESalvar} className="bg-[#D4AF37] text-black px-6 py-2 rounded-full font-bold flex items-center gap-2">
              {subindo ? <Loader2 className="animate-spin" size={18}/> : 'Aplicar'}
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-gray-900">
            <Cropper src={imagemParaRecortar} style={{height: '100%', width: '100%'}} aspectRatio={3/4} guides={true} ref={cropperRef} viewMode={1} dragMode="move" />
          </div>
        </div>
      )}

      {/* Modal de Cadastro */}
      {editando && (
        <div className="fixed inset-0 bg-white z-[80] p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Novo Produto</h2>
              <button onClick={() => setEditando(null)}><X size={24}/></button>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center relative bg-gray-50 active:border-[#D4AF37] transition-colors">
              <input type="file" accept="image/*" onChange={aoSelecionarArquivo} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Camera className="mx-auto text-gray-300 mb-2" size={40} />
              <p className="text-sm font-medium">Abrir Galeria e Recortar</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {editando.fotos?.map((f: string, i: number) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={f} className="w-20 h-28 object-cover rounded-xl border border-gray-200" />
                  <button onClick={() => setEditando({...editando, fotos: editando.fotos.filter((_:any, idx:any)=>idx!==i)})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={10}/></button>
                </div>
              ))}
            </div>
            <input type="text" placeholder="Nome do Conjunto" className="w-full p-4 bg-gray-100 rounded-2xl outline-none" value={editando.nome} onChange={e=>setEditando({...editando, nome: e.target.value})} />
            <input type="text" placeholder="Preço (ex: 89,90)" className="w-full p-4 bg-gray-100 rounded-2xl outline-none" value={editando.preco} onChange={e=>setEditando({...editando, preco: e.target.value})} />
            <button onClick={async () => { await supabase.from('produtos').insert([editando]); setEditando(null); carregarProdutos(); }} className="w-full bg-black text-[#D4AF37] p-5 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform">SALVAR NA VITRINE</button>
          </div>
        </div>
      )}
    </div>
  )
}