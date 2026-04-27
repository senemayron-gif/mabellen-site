'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShoppingBag, Settings, Sparkles, X } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [genero, setGenero] = useState('FEMININO')

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase.from('produtos').select('*')
      if (data) setProdutos(data)
    }
    carregar()
  }, [])

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* CABEÇALHO LUXO */}
      <header className="bg-black text-white pt-24 pb-32 text-center border-b-[12px] border-yellow-600">
        <Sparkles className="text-yellow-500 mx-auto mb-6 animate-pulse" size={48} />
        <h1 className="text-8xl md:text-[12rem] font-black italic tracking-tighter leading-none">MABELLEN</h1>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="h-[2px] w-20 bg-yellow-600"></div>
          <span className="text-yellow-500 tracking-[1em] text-3xl font-light">STORE</span>
          <div className="h-[2px] w-20 bg-yellow-600"></div>
        </div>
      </header>

      {/* SELEÇÃO DE CATEGORIA */}
      <div className="flex justify-center gap-16 py-20">
        {['FEMININO', 'MASCULINO'].map(g => (
          <button key={g} onClick={() => setGenero(g)} className={`text-sm font-black tracking-[0.4em] transition-all ${genero === g ? 'scale-150 text-black' : 'opacity-20'}`}>
            {g}
          </button>
        ))}
      </div>

      {/* VITRINE */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20 p-10">
        {produtos.filter(p => p.genero === genero).map((prod) => (
          <div key={prod.id} className="group cursor-pointer text-center">
            <div className="aspect-[3/4] overflow-hidden rounded-[4rem] bg-gray-50 mb-10 shadow-2xl group-hover:shadow-yellow-500/10 transition-all duration-700">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            </div>
            <h3 className="text-gray-400 text-xs tracking-widest font-bold mb-3">{prod.nome}</h3>
            <p className="text-4xl font-black italic tracking-tighter">R$ {prod.preco}</p>
          </div>
        ))}
      </div>

      {/* BOTÃO DE ACESSO */}
      <div className="fixed bottom-10 right-10">
        <button onClick={() => alert("Painel em manutenção para segurança")} className="bg-black text-white p-6 rounded-full shadow-2xl">
          <Settings size={24} />
        </button>
      </div>
    </div>
  )
}