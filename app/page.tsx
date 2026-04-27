'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, ShoppingBag, X, Send, Trash2, Settings, Camera, Loader2, Menu } from 'lucide-react'
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
    const { error } = await supabase.from('produtos').insert([novoProd])
    if (!error) {
      alert("Salvo!"); setIsAdmin(false); carregarProdutos()
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="bg-black text-[#D4AF37] sticky top-0 z-[100] px-6 py-5 flex justify-between items-center shadow-xl">
        <button onClick={() => setShowMenu(true)}><Menu size={30} /></button>
        <h1 className="text-2xl tracking-[0.3em] italic">MABELLEN</h1>
        <button onClick={() => setShowCarrinho(true)} className="relative">
          <ShoppingBag size={28} />
          {carrinho.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{carrinho.length}</span>}
        </button>
      </header>

      {showMenu && (
        <div className="fixed inset-0 bg-black/95 z-[200] p-10 flex flex-col gap-10 text-[#D4AF37]">
          <button onClick={() => setShowMenu(false)} className="self-end"><X size={40}/></button>
          <div className="flex flex-col gap-8 mt-10">
            <a href="https://www.instagram.com/mabellen_20" target="_blank" className="text-2xl tracking-widest">INSTAGRAM</a>
            <a href="https://wa.me/554499651205" target="_blank" className="text-2xl tracking-widest">WHATSAPP</a>
            <button onClick={() => { setIsAdmin(true); setShowMenu(false) }} className="text-xl text-gray-500 text-left">PAINEL ADMIN</button>
          </div>
        </div>
      )}

      {/* Grid de produtos e filtros */}
      <div className="flex justify-center gap-10 py-8 text-[10px] font-bold tracking-[0.2em]">
          <button onClick={() => setAbaGeral('FEMININO')} className={abaGeral === 'FEMININO' ? 'border-b border-black' : 'opacity-30'}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={abaGeral === 'MASCULINO' ? 'border-b border-black' : 'opacity-30'}>MASCULINO</button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
        {produtos.filter(p => p.genero === abaGeral).map((prod) => (
          <div key={prod.id} className="flex flex-col">
            <img src={prod.fotos?.[0]} className="w-full aspect-[3/4] object-cover rounded-[2rem] mb-4" />
            <h3 className="font-bold text-xs mb-1 uppercase">{prod.nome}</h3>
            <p className="text-xl font-black mb-4">R$ {prod.preco}</p>
            <div className="flex gap-2 mb-6">
              {prod.tamanhos_disponiveis?.split(',').map((tam: string) => (
                <button key={tam} onClick={() => setTamanhoSelecionado({ ...tamanhoSelecionado, [prod.id]: tam.trim() })} className={`w-12 h-12 rounded-xl border-2 font-bold ${tamanhoSelecionado[prod.id] === tam.trim() ? 'bg-black text-white' : 'bg-white text-gray-300'}`}>{tam.trim()}</button>
              ))}
            </div>
            <button onClick={() => adicionarAoCarrinho(prod)} className="w-full bg-black text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Adicionar à Sacola</button>
          </div>
        ))}
      </div>

      {/* Modais de Admin, Carrinho e Recorte */}
      {isAdmin && (
        <div className="fixed inset-0 bg-white z-[300] p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex justify-between items-center"><b>NOVO PRODUTO</b><button onClick={() => setIsAdmin(false)}><X/></button></div>
            <input type="file" onChange={aoSelecionarArquivo} className="w-full p-4 bg-gray-100 rounded-xl" />
            <div className="flex gap-2">{novoProd.fotos.map((f, i) => <img key={i} src={f} className="w-16 h-20 object-cover rounded-lg" />)}</div>
            <input type="text" placeholder="Nome" className="w-full p-4 bg-gray-100 rounded-xl" value={novoProd.nome} onChange={e=>setNovoProd({...novoProd, nome: e.target.value})} />
            <input type="text" placeholder="Preço" className="w-full p-4 bg-gray-100 rounded-xl" value={novoProd.preco} onChange={e=>setNovoProd({...novoProd, preco: e.target.value})} />
            <input type="text" placeholder="Tamanhos (P, M, G)" className="w-full p-4 bg-gray-100 rounded-xl" value={novoProd.tamanhos_disponiveis} onChange={e=>setNovoProd({...novoProd, tamanhos_disponiveis: e.target.value})} />
            <select className="w-full p-4 bg-gray-100 rounded-xl" value={novoProd.genero} onChange={e=>setNovoProd({...novoProd, genero: e.target.value})}>
                <option value="FEMININO">FEMININO</option>
                <option value="MASCULINO">MASCULINO</option>
            </select>
            <button onClick={salvarProdutoCompleto} className="w-full bg-black text-[#D4AF37] p-5 rounded-xl font-bold">SALVAR NO SITE</button>
          </div>
        </div>
      )}

      {showCarrinho && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8"><b>SACOLA</b><button onClick={() => setShowCarrinho(false)}><X/></button></div>
            <div className="flex-1 overflow-y-auto">
              {carrinho.map(item => (
                <div key={item.idUnico} className="flex gap-4 mb-4 border-b pb-4">
                  <img src={item.fotos?.[0]} className="w-20 h-24 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="font-bold text-xs uppercase">{item.nome}</p>
                    <p className="text-[10px] text-gray-400">Tam: {item.tamanhoEscolhido}</p>
                    <p className="font-black">R$ {item.preco}</p>
                  </div>
                  <button onClick={() => setCarrinho(carrinho.filter(c => c.idUnico !== item.idUnico))}><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
            <button onClick={finalizarPedido} className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 mt-4"><Send size={20}/> FINALIZAR NO WHATSAPP</button>
          </div>
        </div>
      )}

      {imagemParaRecortar && (
        <div className="fixed inset-0 bg-black z-[400] flex flex-col p-4">
          <div className="flex justify-between text-white p-4">
            <button onClick={() => setImagemParaRecortar(null)}>Cancelar</button>
            <button onClick={finalizarRecorteESalvar} className="bg-[#D4AF37] text-black px-6 py-2 rounded-full font-bold">{subindo ? 'Subindo...' : 'Recortar'}</button>
          </div>
          <div className="flex-1"><Cropper src={imagemParaRecortar} style={{height: '100%', width: '100%'}} aspectRatio={3/4} guides={true} ref={cropperRef} /></div>
        </div>
      )}
    </div>
  )
}