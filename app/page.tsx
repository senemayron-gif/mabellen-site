'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Settings, Trash2, Camera, X, ShoppingBag, Send, Package } from 'lucide-react'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [abaGeral, setAbaGeral] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  const [editando, setEditando] = useState<any>(null)
  const [imagemParaRecortar, setImagemParaRecortar] = useState<string | null>(null)
  const [showCarrinho, setShowCarrinho] = useState(false)
  const cropperRef = useRef<any>(null)

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  const adicionarAoCarrinho = (prod: any) => {
    setCarrinho([...carrinho, { ...prod, idCarrinho: Date.now() }])
    alert("Adicionado à sacola!")
  }

  const finalizarPedidoWhats = () => {
    let mensagem = `*Novo Pedido - Mabellen*%0A%0A`
    carrinho.forEach(item => {
      mensagem += `• ${item.nome} (${item.tamanho || 'Tam. Único'}) - R$ ${item.preco}%0A`
    })
    const total = carrinho.reduce((acc, item) => acc + parseFloat(item.preco.replace(',', '.')), 0)
    mensagem += `%0A*Total: R$ ${total.toFixed(2)}*%0A%0A_Favor separar para entrega._`
    window.open(`https://wa.me/554499651205?text=${mensagem}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header com Carrinho */}
      <header className="py-6 text-center bg-black text-[#D4AF37] sticky top-0 z-50 shadow-xl">
        <h1 className="text-3xl tracking-[0.3em] font-light italic">MABELLEN</h1>
        <div className="flex justify-center gap-8 mt-4 text-[10px] font-bold tracking-widest">
          <button onClick={() => setAbaGeral('FEMININO')} className={`pb-1 border-b-2 ${abaGeral === 'FEMININO' ? 'border-[#D4AF37]' : 'border-transparent opacity-50'}`}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={`pb-1 border-b-2 ${abaGeral === 'MASCULINO' ? 'border-[#D4AF37]' : 'border-transparent opacity-50'}`}>MASCULINO</button>
        </div>
        <button onClick={() => setIsAdmin(!isAdmin)} className="absolute left-4 top-8 opacity-20"><Settings size={20}/></button>
        <button onClick={() => setShowCarrinho(true)} className="absolute right-4 top-8 text-[#D4AF37] relative">
          <ShoppingBag size={26}/>
          {carrinho.length > 0 && <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{carrinho.length}</span>}
        </button>
      </header>

      {/* Grid de Produtos (Filtrado por Gênero) */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {produtos.filter(p => p.genero === abaGeral).map((prod) => (
          <div key={prod.id} className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm flex flex-col border border-gray-100">
            <div className="aspect-[3/4] relative">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover" />
              {isAdmin && (
                <button onClick={async () => { if(confirm('Excluir?')){ await supabase.from('produtos').delete().eq('id', prod.id); carregarProdutos(); } }} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg z-30"><Trash2 size={16}/></button>
              )}
            </div>
            <div className="p-3 text-center flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] text-gray-400 uppercase tracking-widest">{prod.nome}</h3>
                <p className="text-[10px] font-bold text-gray-500">Tam: {prod.tamanho} | Est: {prod.estoque}</p>
                <p className="font-bold text-lg text-black mt-1">R$ {prod.preco}</p>
              </div>
              <button onClick={() => adicionarAoCarrinho(prod)} className="mt-3 w-full bg-black text-white py-3 rounded-xl text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                <Plus size={14}/> ADICIONAR AO CARRINHO
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal da Sacola de Compras */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-white z-[100] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold italic tracking-tight">Minha Sacola</h2>
            <button onClick={() => setShowCarrinho(false)} className="p-2 bg-gray-100 rounded-full"><X size={24}/></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {carrinho.map((item) => (
              <div key={item.idCarrinho} className="flex gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <img src={item.fotos?.[0]} className="w-20 h-24 object-cover rounded-xl" />
                <div className="flex-1">
                  <p className="font-bold text-sm uppercase">{item.nome}</p>
                  <p className="text-xs text-gray-400">Tamanho: {item.tamanho}</p>
                  <p className="font-bold text-[#D4AF37] mt-2">R$ {item.preco}</p>
                </div>
                <button onClick={() => setCarrinho(carrinho.filter(c => c.idCarrinho !== item.idCarrinho))} className="self-center p-2 text-red-500"><Trash2 size={20}/></button>
              </div>
            ))}
            {carrinho.length === 0 && (
              <div className="text-center py-20">
                <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4"/>
                <p className="text-gray-400">Sua sacola está vazia.</p>
              </div>
            )}
          </div>
          {carrinho.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
               <button onClick={finalizarPedidoWhats} className="w-full bg-[#25D366] text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                <Send size={20}/> FINALIZAR PEDIDO VIA WHATSAPP
              </button>
            </div>
          )}
        </div>
      )}

      {/* O restante dos modais de Admin e Recorte permanecem aqui... */}
    </div>
  )
}