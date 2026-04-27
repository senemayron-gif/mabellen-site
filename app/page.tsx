'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShoppingBag, X, Trash2, Settings, Sparkles, Plus, Minus } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenStore() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [showCarrinho, setShowCarrinho] = useState(false)
  const [aba, setAba] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')

  // CARREGAR PRODUTOS
  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
      if (data) setProdutos(data)
    }
    carregar()
  }, [])

  // CÁLCULO DO VALOR TOTAL
  const valorTotal = carrinho.reduce((acc, item) => {
    const preco = parseFloat(item.preco.replace(',', '.'))
    return acc + preco
  }, 0)

  const adicionarAoCarrinho = (prod: any) => {
    setCarrinho([...carrinho, prod])
    setShowCarrinho(true)
  }

  const removerDoCarrinho = (index: number) => {
    const novo = carrinho.filter((_, i) => i !== index)
    setCarrinho(novo)
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-20">
      
      {/* CABEÇALHO PREMIUM MABELLEN */}
      <header className="bg-black text-white pt-20 pb-24 text-center border-b-8 border-[#D4AF37]">
        <Sparkles className="text-[#D4AF37] mx-auto mb-4 animate-pulse" size={32} />
        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-none">MABELLEN</h1>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="h-[1px] w-12 bg-[#D4AF37]"></div>
          <span className="text-[#D4AF37] tracking-[0.6em] font-light text-xl">STORE</span>
          <div className="h-[1px] w-12 bg-[#D4AF37]"></div>
        </div>
      </header>

      {/* NAVEGAÇÃO */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b flex justify-between items-center px-8 py-6">
        <div className="flex gap-8">
          <button onClick={() => setAba('FEMININO')} className={`font-black text-xs tracking-widest ${aba === 'FEMININO' ? 'opacity-100 border-b-2 border-black' : 'opacity-20'}`}>FEMININO</button>
          <button onClick={() => setAba('MASCULINO')} className={`font-black text-xs tracking-widest ${aba === 'MASCULINO' ? 'opacity-100 border-b-2 border-black' : 'opacity-20'}`}>MASCULINO</button>
        </div>
        <button onClick={() => setShowCarrinho(true)} className="relative p-2">
          <ShoppingBag size={28} />
          {carrinho.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
              {carrinho.length}
            </span>
          )}
        </button>
      </div>

      {/* VITRINE */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 p-8">
        {produtos.filter(p => p.genero === aba).map((prod) => (
          <div key={prod.id} className="group">
            <div className="aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-gray-100 mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-500">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={prod.nome} />
            </div>
            <div className="px-2">
              <h3 className="text-gray-400 text-[10px] tracking-widest font-bold uppercase mb-1">{prod.nome}</h3>
              <div className="flex justify-between items-end">
                <p className="text-3xl font-black italic tracking-tighter">R$ {prod.preco}</p>
                <button 
                  onClick={() => adicionarAoCarrinho(prod)}
                  className="bg-black text-white p-3 rounded-full hover:bg-[#D4AF37] transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* MODAL CARRINHO COM TOTAL */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-8 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black italic tracking-tighter">SEU CARRINHO</h2>
              <button onClick={() => setShowCarrinho(false)}><X size={32}/></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {carrinho.length === 0 ? (
                <p className="text-center text-gray-400 font-bold mt-20">CARRINHO VAZIO</p>
              ) : (
                carrinho.map((item, i) => (
                  <div key={i} className="flex gap-4 items-center bg-gray-50 p-4 rounded-3xl">
                    <img src={item.fotos?.[0]} className="w-20 h-20 object-cover rounded-2xl" />
                    <div className="flex-1">
                      <p className="font-bold text-xs uppercase">{item.nome}</p>
                      <p className="font-black text-lg">R$ {item.preco}</p>
                    </div>
                    <button onClick={() => removerDoCarrinho(i)} className="text-red-500"><Trash2 size={20}/></button>
                  </div>
                ))
              )}
            </div>

            {/* ÁREA DO TOTAL */}
            <div className="border-t-2 border-black pt-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-400 tracking-widest">TOTAL</span>
                <span className="text-3xl font-black tracking-tighter">
                  R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button className="w-full bg-black text-[#D4AF37] py-6 rounded-2xl font-black tracking-widest hover:scale-[1.02] transition-transform">
                FINALIZAR PEDIDO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}