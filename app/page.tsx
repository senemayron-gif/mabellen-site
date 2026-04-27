'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, ShoppingBag, X, Send, Trash2, Settings, Camera, Loader2 } from 'lucide-react'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<{ [key: string]: string }>({})
  const [showCarrinho, setShowCarrinho] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [abaGeral, setAbaGeral] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  
  // Estados para Cadastro
  const [novoProd, setNovoProd] = useState({ nome: '', preco: '', fotos: [] as string[], genero: 'FEMININO', tamanhos_disponiveis: 'P,M,G' })
  const [subindo, setSubindo] = useState(false)
  const [imagemParaRecortar, setImagemParaRecortar] = useState<string | null>(null)
  const cropperRef = useRef<any>(null)

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  // --- Lógica do Carrinho ---
  const adicionarAoCarrinho = (prod: any) => {
    const tam = tamanhoSelecionado[prod.id]
    if (!tam) {
      alert("⚠️ Por favor, escolha um TAMANHO antes de adicionar!")
      return
    }
    setCarrinho([...carrinho, { ...prod, tamanhoEscolhido: tam, idUnico: Date.now() }])
    alert(`✅ ${prod.nome} (Tam: ${tam}) adicionado!`)
  }

  const finalizarPedido = () => {
    let msg = `*🛍️ NOVO PEDIDO - MABELLEN*%0A%0A`
    carrinho.forEach(item => {
      msg += `• *${item.nome}* | Tam: *${item.tamanhoEscolhido}* | R$ ${item.preco}%0A`
    })
    const total = carrinho.reduce((acc, i) => acc + parseFloat(i.preco.replace(',', '.')), 0)
    msg += `%0A💰 *Total: R$ ${total.toFixed(2)}*%0A%0A_Favor separar as peças para entrega!_`
    window.open(`https://wa.me/554499651205?text=${msg}`)
  }

  // --- Lógica de Imagem e Recorte ---
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
        const { data, error } = await supabase.storage.from('fotos-produtos').upload(nomeArquivo, blob)
        
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('fotos-produtos').getPublicUrl(data.path)
          setNovoProd(prev => ({ ...prev, fotos: [...prev.fotos, publicUrl] }))
        }
      }
      setSubindo(false)
      setImagemParaRecortar(null)
    }, 'image/jpeg')
  }

  const salvarProdutoCompleto = async () => {
    if (!novoProd.nome || !novoProd.preco || novoProd.fotos.length === 0) {
      alert("Preencha tudo e coloque ao menos uma foto!")
      return
    }
    const { error } = await supabase.from('produtos').insert([novoProd])
    if (!error) {
      alert("Produto cadastrado com sucesso!")
      setNovoProd({ nome: '', preco: '', fotos: [], genero: abaGeral, tamanhos_disponiveis: 'P,M,G' })
      setIsAdmin(false)
      carregarProdutos()
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header Fixo Estilo Boutique */}
      <header className="py-6 text-center bg-black text-[#D4AF37] sticky top-0 z-50 shadow-lg">
        <h1 className="text-3xl tracking-[0.3em] font-light italic">MABELLEN</h1>
        <div className="flex justify-center gap-8 mt-4 text-[10px] font-bold tracking-[0.2em]">
          <button onClick={() => setAbaGeral('FEMININO')} className={`pb-1 border-b-2 ${abaGeral === 'FEMININO' ? 'border-[#D4AF37]' : 'border-transparent opacity-40'}`}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={`pb-1 border-b-2 ${abaGeral === 'MASCULINO' ? 'border-[#D4AF37]' : 'border-transparent opacity-40'}`}>MASCULINO</button>
        </div>
        <button onClick={() => setIsAdmin(!isAdmin)} className="absolute left-5 top-8 opacity-30 hover:opacity-100 transition-opacity"><Settings size={20} /></button>
        <button onClick={() => setShowCarrinho(true)} className="absolute right-5 top-8 relative">
          <ShoppingBag size={28} />
          {carrinho.length > 0 && <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-black">{carrinho.length}</span>}
        </button>
      </header>

      {/* Grid de Produtos - Filtrado por Gênero */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4 mt-4">
        {produtos.filter(p => p.genero === abaGeral).map((prod) => (
          <div key={prod.id} className="border rounded-[2rem] p-4 shadow-sm bg-gray-50 flex flex-col">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl mb-4">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover" />
              {isAdmin && (
                <button 
                  onClick={async () => { if(confirm('Apagar peça?')){ await supabase.from('produtos').delete().eq('id', prod.id); carregarProdutos(); } }}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full"
                ><Trash2 size={16}/></button>
              )}
            </div>
            <h3 className="font-bold text-gray-800 uppercase text-sm tracking-tight">{prod.nome}</h3>
            <p className="text-xl font-black text-black mb-4">R$ {prod.preco}</p>

            {/* SELEÇÃO DE TAMANHO ESTILO SHOPEE */}
            <p className="text-[9px] font-bold text-gray-400 mb-2 tracking-widest uppercase">Selecione o Tamanho:</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {prod.tamanhos_disponiveis?.split(',').map((tam: string) => (
                <button
                  key={tam}
                  onClick={() => setTamanhoSelecionado({ ...tamanhoSelecionado, [prod.id]: tam.trim() })}
                  className={`min-w-[45px] h-[45px] rounded-xl border-2 text-xs font-black transition-all ${
                    tamanhoSelecionado[prod.id] === tam.trim() 
                    ? 'bg-black text-[#D4AF37] border-black scale-105' 
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {tam.trim()}
                </button>
              ))}
            </div>

            <button 
              onClick={() => adicionarAoCarrinho(prod)}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-95 transition-all"
            >
              <Plus size={18} /> ADICIONAR À SACOLA
            </button>
          </div>
        ))}
      </div>

      {/* Painel Administrativo (Modal) */}
      {isAdmin && (
        <div className="fixed inset-0 bg-black/90 z-[100] p-6 overflow-y-auto">
          <div className="max-w-md mx-auto bg-white rounded-[2.5rem] p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black">NOVO PRODUTO</h2>
              <button onClick={() => setIsAdmin(false)}><X/></button>
            </div>

            <div className="border-4 border-dashed border-gray-100 rounded-3xl p-8 text-center relative bg-gray-50">
              <input type="file" onChange={aoSelecionarArquivo} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Camera className="mx-auto text-gray-300 mb-2" size={40} />
              <p className="text-[10px] font-bold text-gray-400">CLIQUE PARA SUBIR FOTO</p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {novoProd.fotos.map((f, i) => <img key={i} src={f} className="w-16 h-20 object-cover rounded-lg border" />)}
            </div>

            <div className="space-y-3">
              <input type="text" placeholder="Nome do Conjunto" className="w-full p-4 bg-gray-100 rounded-2xl outline-none" value={novoProd.nome} onChange={e=>setNovoProd({...novoProd, nome: e.target.value})} />
              <input type="text" placeholder="Preço (ex: 79,90)" className="w-full p-4 bg-gray-100 rounded-2xl outline-none" value={novoProd.preco} onChange={e=>setNovoProd({...novoProd, preco: e.target.value})} />
              
              <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                <p className="text-[10px] font-bold text-yellow-700 mb-1">TAMANHOS DISPONÍVEIS (Separe por vírgula):</p>
                <input type="text" placeholder="Ex: P, M, G, GG ou 38, 40, 42" className="w-full bg-transparent font-bold outline-none" value={novoProd.tamanhos_disponiveis} onChange={e=>setNovoProd({...novoProd, tamanhos_disponiveis: e.target.value})} />
              </div>

              <select className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold" value={novoProd.genero} onChange={e=>setNovoProd({...novoProd, genero: e.target.value})}>
                <option value="FEMININO">MODA FEMININA</option>
                <option value="MASCULINO">MODA MASCULINA</option>
              </select>
            </div>

            <button onClick={salvarProdutoCompleto} className="w-full bg-black text-[#D4AF37] p-5 rounded-2xl font-black tracking-widest uppercase">SALVAR NO SITE</button>
          </div>
        </div>
      )}

      {/* Carrinho / Sacola Lateral */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white p-6 shadow-2xl flex flex-col rounded-l-[3rem]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic">MINHA SACOLA</h2>
              <button onClick={() => setShowCarrinho(false)} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {carrinho.map((item) => (
                <div key={item.idUnico} className="flex gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                  <img src={item.fotos?.[0]} className="w-20 h-24 object-cover rounded-2xl shadow-sm" />
                  <div className="flex-1">
                    <p className="font-bold uppercase text-xs tracking-tight">{item.nome}</p>
                    <p className="text-[10px] font-black text-[#D4AF37] mt-1">TAMANHO: {item.tamanhoEscolhido}</p>
                    <p className="text-black font-black mt-2">R$ {item.preco}</p>
                  </div>
                  <button onClick={() => setCarrinho(carrinho.filter(c => c.idUnico !== item.idUnico))}><Trash2 size={18} className="text-red-400" /></button>
                </div>
              ))}
              {carrinho.length === 0 && <p className="text-center text-gray-300 mt-20">Sua sacola está vazia...</p>}
            </div>

            {carrinho.length > 0 && (
              <button onClick={finalizarPedido} className="w-full bg-[#25D366] text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all">
                <Send size={20} /> ENVIAR PEDIDO NO WHATSAPP
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor de Recorte Profissional */}
      {imagemParaRecortar && (
        <div className="fixed inset-0 bg-black z-[110] flex flex-col p-4">
          <div className="flex justify-between text-white p-4 items-center">
            <button onClick={() => setImagemParaRecortar(null)} className="font-bold">Cancelar</button>
            <h2 className="text-xs font-bold tracking-[0.2em]">AJUSTAR FOTO (3:4)</h2>
            <button onClick={finalizarRecorteESalvar} className="bg-[#D4AF37] text-black px-6 py-2 rounded-full font-bold flex items-center gap-2">
              {subindo ? <Loader2 className="animate-spin" size={18}/> : 'Pronto'}
            </button>
          </div>
          <div className="flex-1 overflow-hidden rounded-3xl">
            <Cropper src={imagemParaRecortar} style={{height: '100%', width: '100%'}} aspectRatio={3/4} guides={true} ref={cropperRef} viewMode={1} dragMode="move" background={false} />
          </div>
        </div>
      )}
    </div>
  )
}