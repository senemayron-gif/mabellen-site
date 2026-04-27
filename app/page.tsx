'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShoppingBag, Settings, Sparkles } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase.from('produtos').select('*')
      if (data) setProdutos(data)
    }
    carregar()
  }, [])

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <header className="bg-black text-white pt-24 pb-32 text-center border-b-[12px] border-[#D4AF37]">
        <Sparkles className="text-[#D4AF37] mx-auto mb-6 animate-pulse" size={48} />
        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-none">MABELLEN</h1>
        <p className="text-[#D4AF37] tracking-[1em] text-2xl font-light mt-4">STORE</p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 p-10">
        {produtos.map((prod) => (
          <div key={prod.id} className="text-center">
            <div className="aspect-[3/4] overflow-hidden rounded-[3rem] bg-gray-50 mb-6 shadow-xl">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover" alt={prod.nome} />
            </div>
            <h3 className="text-gray-400 text-xs tracking-widest font-bold uppercase">{prod.nome}</h3>
            <p className="text-4xl font-black italic tracking-tighter">R$ {prod.preco}</p>
          </div>
        ))}
      </div>
    </div>
  )
}