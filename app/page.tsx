'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, ShoppingBag, X, Send, Trash2, Settings, Camera, Menu, Instagram, MessageCircle } from 'lucide-react'

// Configuração do Supabase
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
    let msg = `*🛍️ NOVO PEDIDO - MABELLEN*%0A%0A`
    carrinho.forEach(item => { msg += `• *${item.nome}* | Tam: *${item.tamanhoEscolhido}* | R$ ${item.preco}%0A` })
    const total = carrinho.reduce((acc, i) => acc + parseFloat(i.preco.replace(',', '.')), 0)
    msg += `%0A💰 *Total: R$ ${total.toFixed(2)}*`
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
    <div className="min-h-screen bg-white pb-24 font-sans">
      {/* HEADER ATUALIZADO */}
      <header className="bg-black text-[#D4AF37] sticky top-0 z-[100] px-6 py-5 flex justify-between items-center shadow-2xl">
        <button onClick={() => setShowMenu(true)} className="hover:opacity-70 transition-opacity">
          <Menu size={30} />
        </button>
        <h1 className="text-2xl tracking-[0.3em] italic font-serif">MABELLEN STORE</h1>
        <button onClick={() => setShowCarrinho(true)} className="relative hover:opacity-70 transition-opacity">
          <ShoppingBag size={28} />
          {carrinho.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-black">
              {carrinho.length}
            </span>
          )}
        </button>
      </header>

      {/* MENU LATERAL */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/95 z-[200] p-10 flex flex-col text-[#D4AF37] animate-in fade-in duration-300">
          <button onClick={() => setShowMenu(false)} className="self-end hover:rotate-90 transition-transform duration-300">
            <X size={40}/>
          </button>
          <div className="flex flex-col gap-10 mt-20">
            <a href="https://www.instagram.com/mabellen_20" target="_blank" className="flex items-center gap-6 text-2xl tracking-[0.2em] hover:text-white transition-colors">
              <Instagram size={32}/> INSTAGRAM
            </a>
            <a href="https://wa.me/554499651205" target="_blank" className="flex items-center gap-6 text-2xl tracking-[0.2em] hover:text-white transition-colors">
              <MessageCircle size={32}/> WHATSAPP
            </a>
            <div className="h-px bg-[#D4AF37]/20 w-full my-4"></div>
            <button onClick={() => { setIsAdmin(true); setShowMenu(false) }} className="flex items-center gap-6 text-lg text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest">
              <Settings size={24}/> Painel Admin
            </button>
          </div>
        </div>
      )}

      {/* FILTROS DE GÊNERO */}
      <div className="flex justify-center gap-12 py-10 text-[11px] font-bold tracking-[0.3em]">
          <button onClick={() => setAbaGeral('FEMININO')} className={`pb-2 transition-all ${abaGeral === 'FEMININO' ? 'border-b-2 border-black text-black' : 'opacity-30 text-gray-400'}`}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={`pb-2 transition-all ${abaGeral === 'MASCULINO' ? 'border-b-2 border-black text-black' : 'opacity-30 text-gray-400'}`}>MASCULINO</button>
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 p-6">
        {produtos.filter(p => p.genero === abaGeral).map((prod) => (
          <div key={prod.id} className="group flex flex-col">
            <div className="relative overflow-hidden rounded-[2.5rem] mb-5 shadow-sm group-hover:shadow-xl transition-shadow">
              <img src={prod.fotos?.[0]} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="font-bold text-[10px] tracking-widest mb-1 uppercase text-gray-500">{prod.nome}</h3>
            <p className="text-2xl font-black mb-5 text-black">R$ {prod.preco}</p>
            
            {/* SELETOR DE TAMANHOS */}
            <div className="flex flex-wrap gap-2 mb-6">
              {prod.tamanhos_disponiveis?.split(',').map((tam: string) => (
                <button 
                  key={tam} 
                  onClick={() => setTamanhoSelecionado({ ...tamanhoSelecionado, [prod.id]: tam.trim() })} 
                  className={`w-11 h-11 rounded-xl border-2 text-xs font-bold transition-all ${tamanhoSelecionado[prod.id] === tam.trim() ? 'bg-black border-black text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-black'}`}
                >
                  {tam.trim()}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => adicionarAoCarrinho(prod)} 
              className="w-full bg-black text-white py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-gray-800 transition-colors active:scale-95"
            >
              Adicionar à Sacola
            </button>
          </div>
        ))}
      </div>

      {/* PAINEL ADMINISTRATIVO */}
      {isAdmin && (
        <div className="fixed inset-0 bg-white z-[300] p-8 overflow-y-auto animate-in slide-in-from-bottom duration-500">
          <div className="max-w-md mx-auto space-y-8">
            <div className="flex justify-between items-center border-b pb-4">
              <b className="tracking-widest">CADASTRO DE PRODUTO</b>
              <button onClick={() => setIsAdmin(false)} className="p-2 bg-gray-100 rounded-full"><X/></button>
            </div>
            
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-gray-400 tracking-widest">FOTO DO PRODUTO</p>
              <input type="file" onChange={aoSelecionarArquivo} className="w-full p-6 border-2 border-dashed border-gray-200 rounded-3xl text-sm" />
              <div className="flex gap-3 flex-wrap">
                {novoProd.fotos.map((f, i) => (
                  <img key={i} src={f} className="w-20 h-28 object-cover rounded-2xl shadow-md" />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <input type="text" placeholder="Nome do Conjunto/Peça" className="w-full p-5 bg-gray-50 rounded-2xl focus:ring-2 ring-black outline-none" value={novoProd.nome} onChange={e=>setNovoProd({...novoProd, nome: e.target.value})} />
              <input type="text" placeholder="Preço (Ex: 129,90)" className="w-full p-5 bg-gray-50 rounded-2xl focus:ring-2 ring-black outline-none" value={novoProd.preco} onChange={e=>setNovoProd({...novoProd, preco: e.target.value})} />
              <input type="text" placeholder="Tamanhos (P, M, G, GG)" className="w-full p-5 bg-gray-50 rounded-2xl focus:ring-2 ring-black outline-none" value={novoProd.tamanhos_disponiveis} onChange={e=>setNovoProd({...novoProd, tamanhos_disponiveis: e.target.value})} />
              <select className="w-full p-5 bg-gray-50 rounded-2xl focus:ring-2 ring-black outline-none font-bold" value={novoProd.genero} onChange={e=>setNovoProd({...novoProd, genero: e.target.value as any})}>
                  <option value="FEMININO">SESSÃO FEMININA</option>
                  <option value="MASCULINO">SESSÃO MASCULINA</option>
              </select>
            </div>

            <button onClick={salvarProdutoCompleto} className="w-full bg-black text-[#D4AF37] py-6 rounded-3xl font-black uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-transform">
              Publicar no Site
            </button>
          </div>
        </div>
      )}

      {/* CARRINHO / SACOLA */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white h-full p-10 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-10 border-b pb-6">
              <b className="text-xl tracking-widest uppercase">Sua Sacola</b>
              <button onClick={() => setShowCarrinho(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6">
              {carrinho.length === 0 && <p className="text-center text-gray-400 mt-20 tracking-widest uppercase text-xs">Sacola vazia</p>}
              {carrinho.map(item => (
                <div key={item.idUnico} className="flex gap-6 items-center group">
                  <img src={item.fotos?.[0]} className="w-24 h-32 object-cover rounded-[1.5rem] shadow-sm" />
                  <div className="flex-1">
                    <p className="font-bold text-xs uppercase tracking-tighter mb-1">{item.nome}</p>
                    <p className="text-[10px] text-gray-400 font-bold mb-3">TAMANHO: {item.tamanhoEscolhido}</p>
                    <p className="font-black text-lg text-black">R$ {item.preco}</p>
                  </div>
                  <button onClick={() => setCarrinho(carrinho.filter(c => c.idUnico !== item.idUnico))} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={22}/>
                  </button>
                </div>
              ))}
            </div>
            
            {carrinho.length > 0 && (
              <div className="pt-8 border-t space-y-4">
                <div className="flex justify-between font-black text-xl tracking-tighter">
                  <span>TOTAL</span>
                  <span>R$ {carrinho.reduce((acc, i) => acc + parseFloat(i.preco.replace(',', '.')), 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <button onClick={finalizarPedido} className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-[#1eb956] transition-colors">
                  <Send size={20}/> Finalizar no WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}