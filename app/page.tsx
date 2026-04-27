'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShoppingBag, X, Plus } from 'lucide-react'

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
    <div className="min-h-screen bg-white text-black font-sans">
      <header className="bg-black text-white py-12 text-center border-b-8 border-yellow-600">
        <h1 className="text-6xl font-black italic uppercase tracking-tighter">Mabellen Store</h1>
      </header>

      <main className="max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {produtos.map((prod) => (
          <div key={prod.id} className="border p-4 rounded-[2rem] shadow-lg">
            <img src={prod.fotos?.[0]} className="w-full aspect-[3/4] object-cover rounded-[1.5rem] mb-4" />
            <div className="flex justify-between items-center px-2">
              <span className="font-black text-xl italic">R$ {prod.preco}</span>
              <button 
                onClick={() => { setCarrinho([...carrinho, prod]); setShowCarrinho(true); }}
                className="bg-black text-white p-3 rounded-full hover:bg-yellow-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        ))}
      </main>

      {showCarrinho && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-8 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic">CARRINHO</h2>
              <button onClick={() => setShowCarrinho(false)}><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {carrinho.map((item, i) => (
                <div key={i} className="flex justify-between border-b pb-2">
                  <span className="font-bold text-sm uppercase">{item.nome}</span>
                  <span className="font-black italic">R$ {item.preco}</span>
                </div>
              ))}
            </div>
            <div className="border-t-4 border-black pt-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-400">TOTAL GERAL</span>
                <span className="text-3xl font-black tracking-tighter text-yellow-600">
                  R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button className="w-full bg-black text-yellow-500 py-5 rounded-2xl font-black">
                FINALIZAR PEDIDO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}