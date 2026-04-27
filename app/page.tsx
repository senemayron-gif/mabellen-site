'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, ShoppingBag, X, Send, Trash2, Settings, Camera, Loader2, Menu, Instagram, MessageCircle } from 'lucide-react'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

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
  const [subindo, setSubindo] = useState(false)
  const [imagemParaRecortar, setImagemParaRecortar] = useState<string | null>(null)
  const cropperRef = useRef<any>(null)

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  const adicionarAoCarrinho = (prod: any) => {
    const tam = tamanhoSelecionado[prod.id]
    if (!tam) { alert("⚠️ Escolha o TAMANHO!"); return }
    setCarrinho([...carrinho, { ...prod, tamanhoEscolhido: tam, idUnico: Date.now() }])
    alert("Adicionado à sacola!")
  }

  const finalizarPedido = () => {
    let msg = `*🛍️ NOVO PEDIDO - MABELLEN*%0A%0A`
    carrinho.forEach(item => { msg += `• *${item.nome}* | Tam: *${item.tamanhoEscolhido}* | R$ ${item.preco}%0A` })
    const total = carrinho.reduce((acc, i) => acc + parseFloat(i.preco.replace(',', '.')), 0)
    msg += `%0A💰 *Total: R$ ${total.toFixed(2)}*`
    window.open(`https://wa.me/554499651205?text=${msg}`)
  }

  const aoSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader()
      reader.onload = () => setImagemParaRecortar(reader.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const finalizarRecorteESalvar = async () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper || subindo) return
    setSubindo(true)
    cropper.getCroppedCanvas({ width: 800, height: 1067 }).toBlob(async (blob: any) => {
      if (blob) {
        const nomeArquivo = `foto-${Date.now()}.jpg`
        const { data } = await supabase.storage.from('fotos-produtos').upload(nomeArquivo, blob)
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('fotos-produtos').getPublicUrl(data.path)
          setNovoProd(prev => ({ ...prev, fotos: [...prev.fotos, publicUrl] }))
        }
      }
      setSubindo(false); setImagemParaRecortar(null)
    }, 'image/jpeg')
  }

  const salvarProdutoCompleto = async () => {
    if (!novoProd.nome || !novoProd.preco || novoProd.fotos.length === 0) {
      alert("Preencha todos os campos!"); return
    }
    const { error } = await supabase.from('produtos').insert([novoProd])
    if (!error) {
      alert("Produto salvo!"); setNovoProd({ nome: '', preco: '', fotos: [], genero: abaGeral, tamanhos_disponiveis: 'P, M, G' })
      setIsAdmin(false); carregarProdutos()
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24 font-sans">
      {/* HEADER PRINCIPAL */}
      <header className="bg-black text-[#D4AF37] sticky top-0 z-[100] shadow-2xl px-6 py-5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => setShowMenu(true)} className="p-1">
            <Menu size={32} />
          </button>

          <h1 className="text-2xl tracking-[0.3em] font-light italic">MABELLEN</h1>

          <button onClick={() => setShowCarrinho(true)} className="p-1 relative">
            <ShoppingBag size={28} />
            {carrinho.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border border-black">{carrinho.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* MENU LATERAL (OS 3 PAUZINHOS) */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/95 z-[200] p-10 flex flex-col gap-10">
          <button onClick={() => setShowMenu(false)} className="self-end text-white"><X size={40}/></button>
          
          <div className="flex flex-col gap-8 mt-10">
            <a href="https://www.instagram.com/mabellen_20?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" className="flex items-center gap-5 text-2xl text-[#D4AF37] font-light tracking-widest uppercase">
              <Instagram size={35}/> Instagram
            </a>
            <a href="https://wa.me/554499651205" target="_blank" className="flex items-center gap-5 text-2xl text-[#D4AF37] font-light tracking-widest uppercase">
              <MessageCircle size={35}/> WhatsApp
            </a>
            
            <div className="h-[1px] bg-gray-800 my-4"></div>

            <button onClick={() => { setIsAdmin(true); setShowMenu(false) }} className="flex items-center gap-5 text-xl text-gray-500 font-light tracking-widest uppercase hover:text-white transition-colors">
              <Settings size={28}/> Painel Admin
            </button>
          </div>
        </div>
      )}

      {/* FILTROS DE CATEGORIA */}
      <div className="flex justify-center gap-12 py-8 text-[11px] font-bold tracking-[0.3em] uppercase">
          <button onClick={() => setAbaGeral('FEMININO')} className={`pb-2 border-b-2 transition-all ${abaGeral === 'FEMININO' ? 'border-black text-black' : 'border-transparent text-gray-300'}`}>Feminino</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={`pb-2 border-b-2 transition-all ${abaGeral === 'MASCULINO' ? 'border-black text-black' : 'border-transparent text-gray-300'}`}>Masculino</button>
      </div>

      {/* GRID DE PRODUTOS */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 p-4">
        {produtos.filter(p => p.genero === abaGeral).map((prod) => (
          <div key={prod.id} className="group flex flex-col">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-gray-100 mb-4 shadow-sm">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {isAdmin && (
                <button onClick={async () => { if(confirm('Apagar?')){ await supabase.from('produtos').delete().eq('id', prod.id); carregarProdutos(); } }} className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg"><Trash2 size={18}/></button>
              )}
            </div>
            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-tight mb-1">{prod.nome}</h3>
            <p className="text-lg font-black text-black mb-4">R$ {prod.preco}</p>
            
            <p className="text-[9px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Tamanhos:</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {prod.tamanhos_disponiveis?.split(',').map((tam: string) => (
                <button key={tam} onClick={() => setTamanhoSelecionado({ ...tamanhoSelecionado, [prod.id]: tam.trim() })} className={`min-w-[48px] h-[48px] rounded-xl border-2 text-[11px] font-black transition-all ${tamanhoSelecionado[prod.id] === tam.trim() ? 'bg-black text-white border-black scale-105 shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>{tam.trim()}</button>
              ))}
            </div>
            
            <button onClick={() => adicionarAoCarrinho(prod)} className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors uppercase text-[10px] tracking-widest shadow-lg active:scale-95">
              <Plus size={16} /> Adicionar à Sacola
            </button>
          </div>
        ))}
      </div>

      {/* PAINEL ADMIN (MODAL) */}
      {isAdmin && (
        <div className="fixed inset-0 bg-black/95 z-[300] p-6 overflow-y-auto backdrop-blur-md">
          <div className="max-w-md mx-auto bg-white rounded-[3rem] p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center"><h2 className="font-black text-xl tracking-tight">CADASTRO</h2><button onClick={() => setIsAdmin(false)} className="bg-gray-100 p-2 rounded-full"><X/></button></div>
            <div className="border-4 border-dashed border-gray-100 rounded-[2rem] p-10 text-center relative bg-gray-50 hover:bg-gray-100 transition-colors">
              <input type="file" onChange={aoSelecionarArquivo} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Camera className="mx-auto text-gray-300 mb-3" size={40} /><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carregar Foto</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {novoProd.fotos.map((f, i) => <img key={i} src={f} className="w-16 h-20 object-cover rounded-xl border-2 border-gray-100" />)}
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nome do Conjunto" className="w-full p-5 bg-gray-100 rounded-2xl outline-none focus:ring-2 ring-black" value={novoProd.nome} onChange={e=>setNovoProd({...novoProd, nome: e.target.value})} />
              <input type="text" placeholder="Preço (ex: 89,90)" className="w-full p-5 bg-gray-100 rounded-2xl outline-none focus:ring-2 ring-black" value={novoProd.preco} onChange={e=>setNovoProd({...novoProd, preco: e.target.value})} />
              <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-100">
                <p className="text-[10px] font-bold text-yellow-700 mb-2 uppercase">Tamanhos (ex: P, M, G ou 38, 40):</p>
                <input type="text" className="w-full bg-transparent font-bold outline-none text-black" value={novoProd.tamanhos_disponiveis} onChange={e=>setNovoProd({...novoProd, tamanhos_disponiveis: e.target.value})} />
              </div>
              <select className="w-full p-5 bg-gray-100 rounded-2xl font-bold appearance-none outline-none" value={novoProd.genero} onChange={e=>setNovoProd({...novoProd, genero: e.target.value})}>
                <option value="FEMININO">MODA FEMININA</option>
                <option value="MASCULINO">MODA MASCULINA</option>
              </select>
            </div>
            <button onClick={salvarProdutoCompleto} className="w-full bg-black text-[#D4AF37] p-6 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">SALVAR PRODUTO NO SITE</button>
          </div>
        </div>
      )}

      {/* SACOLA LATERAL */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-black/40 z-[300] backdrop-blur-sm">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white p-8 shadow-2xl flex flex-col rounded-l-[3.5rem]">
            <div className="flex justify-between items-center mb-10"><h2 className="text-2xl font-black italic tracking-tighter">MINHA SACOLA</h2><button onClick={() => setShowCarrinho(false)} className="p-3 bg-gray-100 rounded-full"><X/></button></div>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {carrinho.map((item) => (
                <div key={item.idUnico} className="flex gap-5 bg-gray-50 p-5 rounded-[2rem] border border-gray-100">
                  <img src={item.fotos?.[0]} className="w-24 h-32 object-cover rounded-2xl shadow-sm" />
                  <div className="flex-1">
                    <p className="font-bold uppercase text-[11px] leading-tight mb-1">{item.nome}</p>
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase bg-white inline-block px-2 py-1 rounded-md border border-gray-100">Tam: {item.tamanhoEscolhido}</p>
                    <p className="text-black font-black mt-3 text-lg">R$ {item.preco}</p>
                  </div>
                  <button onClick={() => setCarrinho(carrinho.filter(c => c.idUnico !== item.idUnico))} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors self-start"><Trash2 size={20}/></button>
                </div>
              ))}
              {carrinho.length === 0 && (
                <div className="text-center py-20 text-gray-300">
                   <ShoppingBag size={60} className="mx-auto mb-4 opacity-20"/>
                   <p className="font-bold uppercase tracking-widest text-xs">Sua sacola está vazia</p>
                </div>
              )}
            </div>
            {carrinho.length > 0 && (
              <button onClick={finalizarPedido} className="w-full bg-[#25D366] text-white py-6 rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-4 shadow-xl hover:scale-105 active:scale-95 transition-all mt-6">
                <Send size={22} /> ENVIAR NO WHATSAPP
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE RECORTE (FOTO 3:4) */}
      {imagemParaRecortar && (
        <div className="fixed inset-0 bg-black z-[400] flex flex-col p-4">
          <div className="flex justify-between text-white p-6 items-center">
            <button onClick={() => setImagemParaRecortar(null)} className="font-bold tracking-widest text-xs uppercase opacity-70">Cancelar</button>
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase">Ajustar Enquadramento</h3>
            <button onClick={finalizarRecorteESalvar} className="bg-[#D4AF37] text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest">
              {subindo ? <Loader2 className="animate-spin" size={20}/> : 'Concluir'}
            </button>
          </div>
          <div className="flex-1 overflow-hidden rounded-[2.5rem] border border-gray-800">
            <Cropper src={imagemParaRecortar} style={{height: '100%', width: '100%'}} aspectRatio={3/4} guides={true} ref={cropperRef} viewMode={1} background={false} />
          </div>
        </div>
      )}
    </div>
  )
}