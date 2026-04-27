'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShoppingBag, X, Settings, UploadCloud, Sparkles } from 'lucide-react'

// Suas chaves do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [aba, setAba] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
      if (data) setProdutos(data)
    }
    carregar()
  }, [])

  return (
    <div className="min-h-screen bg-white text-black">
      {/* HEADER LUXO MABELLEN */}
      <div className="bg-black text-white py-24 px-6 text-center border-b-8 border-yellow-600">
        <Sparkles className="text-yellow-500 mx-auto mb-4" size={32} />
        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter">MABELLEN</h1>
        <p className="text-yellow-500 tracking-[0.5em] text-xl font-light">STORE</p>
      </div>

      {/* FILTROS */}
      <div className="flex justify-center gap-12 py-12 border-b">
        {['FEMININO', 'MASCULINO'].map(g => (
          <button key={g} onClick={() => setAba(g as any)} className={`font-black tracking-widest ${aba === g ? 'opacity-100 border-b-2 border-black' : 'opacity-20'}`}>
            {g}
          </button>
        ))}
      </div>

      {/* VITRINE */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 p-10">
        {produtos.filter(p => p.genero === aba).map((prod) => (
          <div key={prod.id} className="group cursor-pointer">
            <div className="aspect-[3/4] overflow-hidden rounded-[2rem] bg-gray-100 mb-4 shadow-lg group-hover:scale-[1.02] transition-all">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover" alt={prod.nome} />
            </div>
            <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase">{prod.nome}</h3>
            <p className="text-3xl font-black">R$ {prod.preco}</p>
          </div>
        ))}
      </div>

      {/* BOTÃO ADMIN - SENHA 2004 */}
      <button onClick={() => { if(prompt("Senha:") === "2004") setIsAdmin(true) }} className="fixed bottom-10 right-10 bg-black text-white p-5 rounded-full">
        <Settings size={24} />
      </button>

      {isAdmin && (
        <div className="fixed inset-0 bg-white z-[999] p-10 overflow-y-auto">
           <div className="max-w-xl mx-auto">
             <div className="flex justify-between mb-10">
               <h2 className="text-4xl font-black">NOVO PRODUTO</h2>
               <button onClick={() => setIsAdmin(false)}><X size={40}/></button>
             </div>
             <p className="bg-yellow-100 p-4 rounded-xl text-sm mb-6 font-bold">⚠️ Suba a foto diretamente. O recorte automático foi removido para estabilidade.</p>
             <label className="flex flex-col items-center p-20 border-4 border-dashed border-gray-100 rounded-[3rem] cursor-pointer hover:bg-gray-50">
                <UploadCloud size={50} className="text-gray-300 mb-4" />
                <span className="font-bold text-gray-400">CLIQUE PARA SELECIONAR FOTO</span>
                <input type="file" className="hidden" />
             </label>
           </div>
        </div>
      )}
    </div>
  )
}