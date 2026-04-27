'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Settings, Save, Trash2, Camera, X, Loader2, Crop, ShoppingBag, Send } from 'lucide-react'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [abaGeral, setAbaGeral] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  const [editando, setEditando] = useState<any>(null)
  const [subindo, setSubindo] = useState(false)
  const [imagemParaRecortar, setImagemParaRecortar] = useState<string | null>(null)
  const [showCarrinho, setShowCarrinho] = useState(false)
  const cropperRef = useRef<any>(null)

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  // --- Lógica do Carrinho ---
  const adicionarAoCarrinho = (prod: any) => {
    setCarrinho([...carrinho, { ...prod, idCarrinho: Date.now() }])
    alert("Adicionado à sacola!")
  }

  const finalizarPedidoWhats = () => {
    let mensagem = `*Novo Pedido - Mabellen*%0A%0A`
    carrinho.forEach(item => {
      mensagem += `• ${item.nome} (${item.tamanho}) - R$ ${item.preco}%0A`
    })
    const total = carrinho.reduce((acc, item) => acc + parseFloat(item.preco.replace(',', '.')), 0)
    mensagem += `%0A*Total: R$ ${total.toFixed(2)}*`
    window.open(`https://wa.me/554499651205?text=${mensagem}`)
  }

  // --- Funções de Imagem ---
  const aoSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader()
      reader.onload = () => setImagemParaRecortar(reader.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const finalizarRecorteESalvar = async () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper) return
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
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Header Fixo */}
      <header className="py-6 text-center bg-black text-[#D4AF37] sticky top-0 z-50 shadow-xl">
        <h1 className="text-3xl tracking-[0.3em] font-light italic">MABELLEN</h1>
        <div className="flex justify-center gap-8 mt-4 text-xs font-bold tracking-widest">
          <button onClick={() => setAbaGeral('FEMININO')} className={`pb-1 border-b-2 ${abaGeral === 'FEMININO' ? 'border-[#D4AF37]' : 'border-transparent opacity-50'}`}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={`pb-1 border-b-2 ${abaGeral === 'MASCULINO' ? 'border-[#D4AF37]' : 'border-transparent opacity-50'}`}>MASCULINO</button>
        </div>
        <button onClick={() => setIsAdmin(!isAdmin)} className="absolute left-4 top-8 opacity-20"><Settings size={18}/></button>
        <button onClick={() => setShowCarrinho(true)} className="absolute right-4 top-8 text-[#D4AF37] relative">
          <ShoppingBag size={24}/>
          {carrinho.length > 0 && <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{carrinho.length}</span>}
        </button>
      </header>

      {/* Grid de Produtos Corrigido por Gênero */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {produtos.filter(p => p.genero === abaGeral).map((prod) => (
          <div key={prod.id} className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
            <div className="aspect-[3/4] relative">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover" />
              {isAdmin && (
                <button onClick={async () => { if(confirm('Excluir?')){ await supabase.from('produtos').delete().eq('id', prod.id); carregarProdutos(); } }} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full"><Trash2 size={16}/></button>
              )}
            </div>
            <div className="p-3 text-center flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] text-gray-400 uppercase tracking-tighter">{prod.nome}</h3>
                <p className="text-[10px] font-bold text-gray-600">Tam: {prod.tamanho} | Qtd: {prod.estoque}</p>
                <p className="font-bold text-lg text-black mt-1">R$ {prod.preco}</p>
              </div>
              <button onClick={() => adicionarAoCarrinho(prod)} className="mt-3 w-full bg-black text-white py-2 rounded-xl text-[10px] font-bold tracking-widest flex items-center justify-center gap-2">
                <ShoppingBag size={14}/> ADICIONAR
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Carrinho */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-white z-[100] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold italic">Minha Sacola</h2>
            <button onClick={() => setShowCarrinho(false)}><X size={28}/></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {carrinho.map((item) => (
              <div key={item.idCarrinho} className="flex gap-4 bg-gray-50 p-3 rounded-2xl">
                <img src={item.fotos?.[0]} className="w-16 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="font-bold text-sm uppercase">{item.nome}</p>
                  <p className="text-xs text-gray-500">Tamanho: {item.tamanho}</p>
                  <p className="font-bold text-[#D4AF37]">R$ {item.preco}</p>
                </div>
                <button onClick={() => setCarrinho(carrinho.filter(c => c.idCarrinho !== item.idCarrinho))}><Trash2 size={18} className="text-red-400"/></button>
              </div>
            ))}
            {carrinho.length === 0 && <p className="text-center text-gray-400 mt-20">Sua sacola está vazia.</p>}
          </div>
          {carrinho.length > 0 && (
            <button onClick={finalizarPedidoWhats} className="bg-[#25D366] text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl">
              <Send size={20}/> ENVIAR PEDIDO PARA O WHATSAPP
            </button>
          )}
        </div>
      )}

      {/* Modal Cadastro Admin */}
      {editando && (
        <div className="fixed inset-0 bg-white z-[80] p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-xl font-bold">Cadastrar Produto</h2>
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setEditando({...editando, genero: 'FEMININO'})} className={`py-2 rounded-lg text-xs font-bold ${editando.genero === 'FEMININO' ? 'bg-black text-white' : ''}`}>FEMININO</button>
              <button onClick={() => setEditando({...editando, genero: 'MASCULINO'})} className={`py-2 rounded-lg text-xs font-bold ${editando.genero === 'MASCULINO' ? 'bg-black text-white' : ''}`}>MASCULINO</button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center relative bg-gray-50">
              <input type="file" onChange={aoSelecionarArquivo} className="absolute inset-0 opacity-0" />
              <Camera className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-xs">Foto com Recorte</p>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {editando.fotos?.map((f:any, i:any) => <img key={i} src={f} className="w-16 h-20 object-cover rounded-lg" />)}
            </div>
            <input type="text" placeholder="Nome" className="w-full p-4 bg-gray-100 rounded-xl" value={editando.nome} onChange={e=>setEditando({...editando, nome: e.target.value})} />
            <div className="flex gap-2">
              <input type="text" placeholder="Tamanho (ex: P, M, G)" className="w-1/2 p-4 bg-gray-100 rounded-xl" value={editando.tamanho} onChange={e=>setEditando({...editando, tamanho: e.target.value})} />
              <input type="number" placeholder="Qtd Estoque" className="w-1/2 p-4 bg-gray-100 rounded-xl" value={editando.estoque} onChange={e=>setEditando({...editando, estoque: e.target.value})} />
            </div>
            <input type="text" placeholder="Preço" className="w-full p-4 bg-gray-100 rounded-xl" value={editando.preco} onChange={e=>setEditando({...editando, preco: e.target.value})} />
            <button onClick={async () => { await supabase.from('produtos').insert([editando]); setEditando(null); carregarProdutos(); }} className="w-full bg-black text-[#D4AF37] p-5 rounded-xl font-bold">SALVAR PRODUTO</button>
          </div>
        </div>
      )}

      {/* Editor de Recorte */}
      {imagemParaRecortar && (
        <div className="fixed inset-0 bg-black z-[110] flex flex-col">
          <div className="flex justify-between p-4 text-white items-center">
            <button onClick={() => setImagemParaRecortar(null)}>Cancelar</button>
            <button onClick={finalizarRecorteESalvar} className="bg-[#D4AF37] text-black px-6 py-2 rounded-full font-bold">
              {subindo ? 'Salvando...' : 'Aplicar'}
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Cropper src={imagemParaRecortar} style={{height: '100%', width: '100%'}} aspectRatio={3/4} guides={true} ref={cropperRef} viewMode={1} dragMode="move" />
          </div>
        </div>
      )}

      {isAdmin && <button onClick={() => setEditando({ nome: '', preco: '', fotos: [], genero: abaGeral, tamanho: '', estoque: 0 })} className="fixed bottom-10 right-6 bg-black text-[#D4AF37] p-4 rounded-full shadow-2xl z-[60]"><Plus size={32}/></button>}
    </div>
  )
}