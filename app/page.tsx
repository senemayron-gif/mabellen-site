'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShoppingBag, X, Trash2, Sparkles, Plus } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenStore() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [showCarrinho, setShowCarrinho] = useState(false)

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase.from('produtos').select('*')
      if (data) setProdutos(data)
    }
    carregar()
  }, [])

  // CÁLCULO DO VALOR TOTAL AUTOMÁTICO
  const valorTotal = carrinho.reduce((acc, item) => {
    const preco = parseFloat(item.preco.toString().replace(',', '.'))
    return acc + preco
  }, 0)

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-20">
      <header className="bg-black text-white pt-20 pb-24 text-center border-b-8 border-yellow-600">
        <Sparkles className="text-yellow-500 mx-auto mb-4 animate-pulse" size={32} />
        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-none uppercase">Mabellen</h1>
        <p className="text-yellow-500 tracking-[0.6em] font-light text-xl mt-2">STORE</p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 p-8">
        {produtos.map((prod) => (
          <div key={prod.id} className="group">
            <div className="aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-gray-100 mb-6 shadow-sm">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover" alt={prod.nome} />
            </div>
            <div className="flex justify-between items-end px-2">
              <div>
                <h3 className="text-gray-400 text-[10px] tracking-widest font-bold uppercase">{prod.nome}</h3>
                <p className="text-3xl font-black italic tracking-tighter">R$ {prod.preco}</p>
              </div>
              <button onClick={() => { setCarrinho([...carrinho, prod]); setShowCarrinho(true); }} className="bg-black text-white p-3 rounded-full">
                <Plus size={20} />
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* CARRINHO COM TOTAL */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-8 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black italic tracking-tighter">SEU CARRINHO</h2>
              <button onClick={() => setShowCarrinho(false)}><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {carrinho.map((item, i) => (
                <div key={i} className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl">
                  <img src={item.fotos?.[0]} className="w-16 h-16 object-cover rounded-xl" />
                  <div className="flex-1 font-bold">{item.nome}</div>
                  <div className="font-black">R$ {item.preco}</div>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-black pt-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-400 tracking-widest text-sm">VALOR TOTAL</span>
                <span className="text-3xl font-black tracking-tighter">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <button className="w-full bg-black text-yellow-500 py-6 rounded-2xl font-black tracking-widest">FINALIZAR PEDIDO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}