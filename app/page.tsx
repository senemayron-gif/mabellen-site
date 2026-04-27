'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, ShoppingBag, X, Send, Trash2, Check } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<{ [key: string]: string }>({})
  const [showCarrinho, setShowCarrinho] = useState(false)
  const [abaGeral, setAbaGeral] = useState('FEMININO')

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  const adicionarAoCarrinho = (prod: any) => {
    const tam = tamanhoSelecionado[prod.id]
    if (!tam) {
      alert("Por favor, selecione um tamanho antes de adicionar!")
      return
    }
    setCarrinho([...carrinho, { ...prod, tamanhoEscolhido: tam, idUnico: Date.now() }])
    alert(`Adicionado: ${prod.nome} Tamanho ${tam}`)
  }

  const finalizarPedido = () => {
    let msg = `*Pedido Mabellen*%0A%0A`
    carrinho.forEach(item => {
      msg += `• ${item.nome} - *Tam: ${item.tamanhoEscolhido}* - R$ ${item.preco}%0A`
    })
    const total = carrinho.reduce((acc, i) => acc + parseFloat(i.preco.replace(',', '.')), 0)
    msg += `%0A*Total: R$ ${total.toFixed(2)}*`
    window.open(`https://wa.me/554499651205?text=${msg}`)
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header Fixo */}
      <header className="py-6 text-center bg-black text-[#D4AF37] sticky top-0 z-50">
        <h1 className="text-3xl tracking-widest italic">MABELLEN</h1>
        <button onClick={() => setShowCarrinho(true)} className="absolute right-5 top-8">
          <ShoppingBag size={28} />
          {carrinho.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{carrinho.length}</span>}
        </button>
      </header>

      {/* Grid de Produtos */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
        {produtos.map((prod) => (
          <div key={prod.id} className="border rounded-3xl p-4 shadow-sm bg-gray-50">
            <img src={prod.fotos?.[0]} className="w-full aspect-[3/4] object-cover rounded-2xl mb-4" />
            <h3 className="font-bold text-gray-800 uppercase">{prod.nome}</h3>
            <p className="text-xl font-black text-black mb-4">R$ {prod.preco}</p>

            {/* SELEÇÃO DE TAMANHO ESTILO SHOPEE */}
            <p className="text-[10px] font-bold text-gray-400 mb-2">SELECIONE O TAMANHO:</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {['P', 'M', 'G', 'GG', '38', '40', '42', '44'].map((tam) => (
                <button
                  key={tam}
                  onClick={() => setTamanhoSelecionado({ ...tamanhoSelecionado, [prod.id]: tam })}
                  className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${
                    tamanhoSelecionado[prod.id] === tam 
                    ? 'bg-black text-white border-black scale-110' 
                    : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {tam}
                </button>
              ))}
            </div>

            <button 
              onClick={() => adicionarAoCarrinho(prod)}
              className="w-full bg-black text-[#D4AF37] py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Plus size={18} /> ADICIONAR AO CARRINHO
            </button>
          </div>
        ))}
      </div>

      {/* Carrinho / Sacola */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-white z-[100] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic">MINHA SACOLA</h2>
            <button onClick={() => setShowCarrinho(false)}><X size={30} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {carrinho.map((item) => (
              <div key={item.idUnico} className="flex gap-4 border-b pb-4">
                <img src={item.fotos?.[0]} className="w-20 h-24 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="font-bold uppercase text-sm">{item.nome}</p>
                  <p className="bg-gray-100 inline-block px-2 py-1 rounded text-xs font-bold mt-1">TAMANHO: {item.tamanhoEscolhido}</p>
                  <p className="text-black font-black mt-2">R$ {item.preco}</p>
                </div>
                <button onClick={() => setCarrinho(carrinho.filter(c => c.idUnico !== item.idUnico))}><Trash2 className="text-red-400" /></button>
              </div>
            ))}
          </div>

          <button onClick={finalizarPedido} className="w-full bg-[#25D366] text-white py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl">
             ENVIAR PEDIDO PRONTO NO WHATSAPP
          </button>
        </div>
      )}
    </div>
  )
}