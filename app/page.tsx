'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, ShoppingBag, X, Send, Trash2, Settings, Camera, Menu, MessageCircle } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<{ [key: string]: string }>({})
  const [showCarrinho, setShowCarrinho] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [abaGeral, setAbaGeral] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  const [novoProd, setNovoProd] = useState({ nome: '', preco: '', fotos: [] as string[], genero: 'FEMININO', tamanhos_disponiveis: 'P, M, G' })

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  const adicionarAoCarrinho = (prod: any) => {
    const tam = tamanhoSelecionado[prod.id]
    if (!tam) { alert("⚠️ Escolha o TAMANHO!"); return }
    setCarrinho([...carrinho, { ...prod, tamanhoEscolhido: tam, idUnico: Date.now() }])
  }

  const finalizarPedido = () => {
    let msg = `*🛍️ NOVO PEDIDO - MABELLEN STORE*%0A%0A`
    carrinho.forEach(item => { msg += `• *${item.nome}* | Tam: *${item.tamanhoEscolhido}* | R$ ${item.preco}%0A` })
    const total = carrinho.reduce((acc, i) => acc + parseFloat(i.preco.replace(',', '.')), 0)
    msg += `%0A💰 *Total: R$ ${total.toFixed(2).replace('.', ',')}*`
    window.open(`https://wa.me/554499651205?text=${msg}`)
  }

  const aoSelecionarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      const nomeArquivo = `foto-${Date.now()}.jpg`
      const { data } = await supabase.storage.from('fotos-produtos').upload(nomeArquivo, file)
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('fotos-produtos').getPublicUrl(data.path)
        setNovoProd(prev => ({ ...prev, fotos: [...prev.fotos, publicUrl] }))
      }
    }
  }

  const salvarProdutoCompleto = async () => {
    const { error } = await supabase.from('produtos').insert([novoProd])
    if (!error) {
      alert("Salvo!"); setIsAdmin(false); carregarProdutos()
      setNovoProd({ nome: '', preco: '', fotos: [], genero: 'FEMININO', tamanhos_disponiveis: 'P, M, G' })
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-black">
      <header className="bg-black text-[#D4AF37] sticky top-0 z-[100] px-6 py-5 flex justify-between items-center shadow-2xl">
        <button onClick={() => setShowMenu(true)} className="hover:opacity-70"><Menu size={30} /></button>
        <h1 className="text-2xl tracking-[0.3em] italic font-serif">MABELLEN STORE</h1>
        <button onClick={() => setShowCarrinho(true)} className="relative">
          <ShoppingBag size={28} />
          {carrinho.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-black">{carrinho.length}</span>}
        </button>
      </header>

      {showMenu && (
        <div className="fixed inset-0 bg-black/95 z-[200] p-10 flex flex-col text-[#D4AF37]">
          <button onClick={() => setShowMenu(false)} className="self-end"><X size={40}/></button>
          <div className="flex flex-col gap-10 mt-20">
            <a href="https://wa.me/554499651205" target="_blank" className="flex items-center gap-6 text-2xl tracking-[0.2em]"><MessageCircle size={32}/> FALAR NO WHATSAPP</a>
            <div className="h-px bg-[#D4AF37]/20 w-full my-4"></div>
            <button onClick={() => { setIsAdmin(true); setShowMenu(false) }} className="flex items-center gap-6 text-lg text-gray-500 uppercase tracking-widest text-left"><Settings size={24}/> Painel Admin</button>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-12 py-10 text-[11px] font-bold tracking-[0.3em]">
          <button onClick={() => setAbaGeral('FEMININO')} className={`pb-2 ${abaGeral === 'FEMININO' ? 'border-b-2 border-black text-black' : 'opacity-30 text-gray-400'}`}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={`pb-2 ${abaGeral === 'MASCULINO' ? 'border-b-2 border-black text-black' : 'opacity-30 text-gray-400'}`}>MASCULINO</button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 p-6">
        {produtos.filter(p => p.genero === abaGeral).map((prod) => (
          <div key={prod.id} className="flex flex-col">
            <div className="relative overflow-hidden rounded-[2.5rem] mb-5 shadow-sm">
              <img src={prod.fotos?.[0]} className="w-full aspect-[3/4] object-cover" />
            </div>
            <h3 className="font-bold text-[10px] tracking-widest mb-1 uppercase text-gray-500">{prod.nome}</h3>
            <p className="text-2xl font-black mb-5 text-black">R$ {prod.preco}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {prod.tamanhos_disponiveis?.split(',').map((tam: string) => (
                <button key={tam} onClick={() => setTamanhoSelecionado({ ...tamanhoSelecionado, [prod.id]: tam.trim() })} className={`w-11 h-11 rounded-xl border-2 text-xs font-bold ${tamanhoSelecionado[prod.id] === tam.trim() ? 'bg-black border-black text-white' : 'bg-white border-gray-100 text-gray-400'}`}>{tam.trim()}</button>
              ))}
            </div>
            <button onClick={() => adicionarAoCarrinho(prod)} className="w-full bg-black text-white py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em]">Adicionar à Sacola</button>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="fixed inset-0 bg-white z-[300] p-8 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-8">
            <div className="flex justify-between items-center border-b pb-4"><b className="tracking-widest uppercase">Cadastrar</b><button onClick={() => setIsAdmin(false)}><X/></button></div>
            <input type="file" onChange={aoSelecionarArquivo} />
            <input type="text" placeholder="Nome" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" value={novoProd.nome} onChange={e=>setNovoProd({...novoProd, nome: e.target.value})} />
            <input type="text" placeholder="Preço" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" value={novoProd.preco} onChange={e=>setNovoProd({...novoProd, preco: e.target.value})} />
            <input type="text" placeholder="Tamanhos" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" value={novoProd.tamanhos_disponiveis} onChange={e=>setNovoProd({...novoProd, tamanhos_disponiveis: e.target.value})} />
            <select className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold" value={novoProd.genero} onChange={e=>setNovoProd({...novoProd, genero: e.target.value as any})}>
                <option value="FEMININO">FEMININO</option>
                <option value="MASCULINO">MASCULINO</option>
            </select>
            <button onClick={salvarProdutoCompleto} className="w-full bg-black text-[#D4AF37] py-6 rounded-3xl font-black uppercase tracking-[0.3em] shadow-xl">Publicar</button>
          </div>
        </div>
      )}

      {showCarrinho && (
        <div className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-10 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-10 border-b pb-6"><b className="text-xl tracking-widest uppercase">Sacola</b><button onClick={() => setShowCarrinho(false)}><X/></button></div>
            <div className="flex-1 overflow-y-auto space-y-6">
              {carrinho.map(item => (
                <div key={item.idUnico} className="flex gap-6 items-center">
                  <img src={item.fotos?.[0]} className="w-24 h-32 object-cover rounded-[1.5rem]" />
                  <div className="flex-1">
                    <p className="font-bold text-xs uppercase mb-1">{item.nome}</p>
                    <p className="text-[10px] text-gray-400 font-bold mb-3 uppercase">TAM: {item.tamanhoEscolhido}</p>
                    <p className="font-black text-lg text-black">R$ {item.preco}</p>
                  </div>
                  <button onClick={() => setCarrinho(carrinho.filter(c => c.idUnico !== item.idUnico))}><Trash2 size={22}/></button>
                </div>
              ))}
            </div>
            {carrinho.length > 0 && (
              <div className="pt-8 border-t space-y-4">
                <div className="flex justify-between font-black text-xl"><span>TOTAL</span><span>R$ {carrinho.reduce((acc, i) => acc + parseFloat(i.preco.replace(',', '.')), 0).toFixed(2).replace('.', ',')}</span></div>
                <button onClick={finalizarPedido} className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.2em] shadow-lg"><Send size={20}/> WhatsApp</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}