'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShoppingBag, X, Send, Trash2, Settings, MessageCircle, UploadCloud } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<{ [key: string]: string }>({})
  const [showCarrinho, setShowCarrinho] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [abaGeral, setAbaGeral] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  const [novoProd, setNovoProd] = useState({ nome: '', preco: '', fotos: [] as string[], genero: 'FEMININO', tamanhos_disponiveis: 'P, M, G' })

  const SENHA_ADMIN = "2004" 

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  const logarAdmin = () => {
    const senha = prompt("Acesso restrito:")
    if (senha === SENHA_ADMIN) { setIsAdmin(true) } 
    else if (senha !== null) { alert("Senha incorreta!") }
  }

  const aoSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const nomeArq = `foto-${Date.now()}.jpg`
      const { data } = await supabase.storage.from('fotos-produtos').upload(nomeArq, file)
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('fotos-produtos').getPublicUrl(data.path)
        setNovoProd(prev => ({ ...prev, fotos: [...prev.fotos, publicUrl] }))
      }
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-black">
      <header className="bg-black text-[#D4AF37] sticky top-0 z-[100] px-6 py-5 flex justify-between items-center shadow-2xl">
        <button onClick={logarAdmin} className="opacity-40"><Settings size={24} /></button>
        <h1 className="text-2xl tracking-[0.3em] italic font-serif uppercase text-center flex-1">Mabellen</h1>
        <button onClick={() => setShowCarrinho(true)} className="relative">
          <ShoppingBag size={28} />
          {carrinho.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{carrinho.length}</span>}
        </button>
      </header>

      <div className="flex justify-center gap-12 py-10 text-[11px] font-bold tracking-[0.3em]">
          <button onClick={() => setAbaGeral('FEMININO')} className={abaGeral === 'FEMININO' ? 'border-b-2 border-black' : 'opacity-30'}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={abaGeral === 'MASCULINO' ? 'border-b-2 border-black' : 'opacity-30'}>MASCULINO</button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 p-6">
        {produtos.filter(p => p.genero === abaGeral).map((prod) => (
          <div key={prod.id} className="flex flex-col">
            <div className="relative overflow-hidden rounded-[2.5rem] mb-5 shadow-sm">
              <img src={prod.fotos?.[0]} className="w-full aspect-[3/4] object-cover" alt="" />
            </div>
            <h3 className="font-bold text-[10px] tracking-widest mb-1 uppercase text-gray-500">{prod.nome}</h3>
            <p className="text-2xl font-black mb-5 text-black">R$ {prod.preco}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {prod.tamanhos_disponiveis?.split(',').map((tam: string) => (
                <button key={tam} onClick={() => setTamanhoSelecionado({ ...tamanhoSelecionado, [prod.id]: tam.trim() })} className={`w-11 h-11 rounded-xl border-2 text-xs font-bold ${tamanhoSelecionado[prod.id] === tam.trim() ? 'bg-black text-white' : 'bg-white text-gray-400'}`}>{tam.trim()}</button>
              ))}
            </div>
            <button onClick={() => {
                if(!tamanhoSelecionado[prod.id]) { alert("Escolha o tamanho!"); return; }
                setCarrinho([...carrinho, { ...prod, tamanhoEscolhido: tamanhoSelecionado[prod.id], idUnico: Date.now() }])
            }} className="w-full bg-black text-white py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em]">Adicionar à Sacola</button>
          </div>
        ))}
      </div>

      <a href="https://wa.me/554499651205?text=Olá! Gostaria de saber mais sobre as peças da loja." target="_blank" className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl z-[90] hover:scale-110 transition-transform">
        <MessageCircle size={35} />
      </a>

      {isAdmin && (
        <div className="fixed inset-0 bg-white z-[300] p-6 overflow-y-auto">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex justify-between items-center border-b pb-4 font-bold">CADASTRO<button onClick={() => setIsAdmin(false)}><X/></button></div>
            <div className="border-4 border-dashed border-gray-100 rounded-[2rem] p-10 text-center relative">
                <input type="file" onChange={aoSubirFoto} className="absolute inset-0 opacity-0" />
                <UploadCloud className="mx-auto mb-4 text-gray-300" size={50}/>
                <p className="text-xs font-bold uppercase">Subir Foto Direto</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {novoProd.fotos.map((f, i) => (
                    <img key={i} src={f} className="aspect-[3/4] rounded-lg object-cover" alt="" />
                ))}
            </div>
            <input type="text" placeholder="Nome do Produto" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" value={novoProd.nome} onChange={e=>setNovoProd({...novoProd, nome: e.target.value})} />
            <input type="text" placeholder="Preço (Ex: 99,90)" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" value={novoProd.preco} onChange={e=>setNovoProd({...novoProd, preco: e.target.value})} />
            <input type="text" placeholder="Tamanhos (P, M, G)" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" value={novoProd.tamanhos_disponiveis} onChange={e=>setNovoProd({...novoProd, tamanhos_disponiveis: e.target.value})} />
            <select className="w-full p-5 bg-gray-50 rounded-2xl font-bold" value={novoProd.genero} onChange={e=>setNovoProd({...novoProd, genero: e.target.value as any})}>
                <option value="FEMININO">Feminino</option>
                <option value="MASCULINO">Masculino</option>
            </select>
            <button onClick={async () => {
                await supabase.from('produtos').insert([novoProd]); alert("Produto Salvo!"); setIsAdmin(false); carregarProdutos(); setNovoProd({ nome: '', preco: '', fotos: [], genero: 'FEMININO', tamanhos_disponiveis: 'P, M, G' })
            }} className="w-full bg-black text-[#D4AF37] py-6 rounded-3xl font-black uppercase tracking-[0.3em]">Publicar</button>
          </div>
        </div>
      )}

      {showCarrinho && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-10 flex flex-col">
            <div className="flex justify-between items-center mb-10 border-b pb-6 font-bold uppercase tracking-widest">Sacola<button onClick={() => setShowCarrinho(false)}><X/></button></div>
            <div className="flex-1 overflow-y-auto space-y-6">
              {carrinho.map(item => (
                <div key={item.idUnico} className="flex gap-4 items-center border-b pb-4">
                  <img src={item.fotos?.[0]} className="w-16 h-20 object-cover rounded-lg" alt="" />
                  <div className="flex-1">
                    <p className="font-bold text-xs uppercase">{item.nome}</p>
                    <p className="text-[10px] text-gray-400 font-bold">TAM: {item.tamanhoEscolhido}</p>
                    <p className="font-black">R$ {item.preco}</p>
                  </div>
                  <button onClick={() => setCarrinho(carrinho.filter(c => c.idUnico !== item.idUnico))}><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
            {carrinho.length > 0 && (
              <button onClick={() => {
                  let msg = `*🛍️ NOVO PEDIDO - MABELLEN*%0A%0A`
                  carrinho.forEach(i => msg += `• ${i.nome} | Tam: ${i.tamanhoEscolhido} | R$ ${i.preco}%0A`)
                  window.open(`https://wa.me/554499651205?text=${msg}`)
              }} className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black uppercase text-[10px] flex justify-center gap-2 items-center mt-6"><Send size={18}/> Enviar Pedido</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}