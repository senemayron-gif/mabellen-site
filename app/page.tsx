'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Settings, Trash2, Camera, X, ShoppingBag, Send } from 'lucide-react'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [abaGeral, setAbaGeral] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  const [editando, setEditando] = useState<any>(null)
  const [imagemParaRecortar, setImagemParaRecortar] = useState<string | null>(null)
  const [showCarrinho, setShowCarrinho] = useState(false)
  const cropperRef = useRef<any>(null)

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  const adicionarAoCarrinho = (prod: any) => {
    setCarrinho([...carrinho, { ...prod, idCarrinho: Date.now() }])
    alert("Adicionado à sacola!")
  }

  const finalizarPedidoWhats = () => {
    let mensagem = `*Novo Pedido - Mabellen*%0A%0A`
    carrinho.forEach(item => {
      mensagem += `• ${item.nome} (${item.tamanho || 'Tam. Único'}) - R$ ${item.preco}%0A`
    })
    const total = carrinho.reduce((acc, item) => acc + parseFloat(item.preco.replace(',', '.')), 0)
    mensagem += `%0A*Total: R$ ${total.toFixed(2)}*`
    window.open(`https://wa.me/554499651205?text=${mensagem}`)
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
    if (!cropper) return
    cropper.getCroppedCanvas({ width: 800, height: 1000 }).toBlob(async (blob: any) => {
      if (blob) {
        const nome = `foto-${Date.now()}.jpg`
        const { data } = await supabase.storage.from('fotos-produtos').upload(nome, blob)
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('fotos-produtos').getPublicUrl(data.path)
          setEditando({ ...editando, fotos: [...(editando.fotos || []), publicUrl] })
        }
      }
      setImagemParaRecortar(null)
    }, 'image/jpeg')
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header com Carrinho */}
      <header className="py-6 text-center bg-black text-[#D4AF37] sticky top-0 z-50">
        <h1 className="text-3xl tracking-[0.3em] font-light">MABELLEN</h1>
        <div className="flex justify-center gap-8 mt-4 text-[10px] font-bold">
          <button onClick={() => setAbaGeral('FEMININO')} className={abaGeral === 'FEMININO' ? 'border-b border-[#D4AF37]' : 'opacity-50'}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={abaGeral === 'MASCULINO' ? 'border-b border-[#D4AF37]' : 'opacity-50'}>MASCULINO</button>
        </div>
        <button onClick={() => setShowCarrinho(true)} className="absolute right-4 top-8 text-[#D4AF37]">
          <ShoppingBag size={24}/>
          {carrinho.length > 0 && <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{carrinho.length}</span>}
        </button>
      </header>

      {/* Listagem de Produtos */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {produtos.filter(p => p.genero === abaGeral).map((prod) => (
          <div key={prod.id} className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="aspect-[3/4] relative">
              <img src={prod.fotos?.[0]} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 text-center">
              <h3 className="text-[10px] text-gray-400 uppercase">{prod.nome}</h3>
              <p className="font-bold text-lg">R$ {prod.preco}</p>
              <button onClick={() => adicionarAoCarrinho(prod)} className="mt-2 w-full bg-black text-white py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2">
                <Plus size={14}/> ADICIONAR AO CARRINHO
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal da Sacola */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-white z-[100] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold italic">Minha Sacola</h2>
            <button onClick={() => setShowCarrinho(false)}><X size={28}/></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {carrinho.map((item) => (
              <div key={item.idCarrinho} className="flex gap-4 bg-gray-50 p-3 rounded-2xl">
                <img src={item.fotos?.[0]} className="w-16 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="font-bold text-sm uppercase">{item.nome}</p>
                  <p className="font-bold text-[#D4AF37]">R$ {item.preco}</p>
                </div>
                <button onClick={() => setCarrinho(carrinho.filter(c => c.idCarrinho !== item.idCarrinho))}><Trash2 size={18} className="text-red-400"/></button>
              </div>
            ))}
          </div>
          {carrinho.length > 0 && (
            <button onClick={finalizarPedidoWhats} className="bg-[#25D366] text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3">
              <Send size={20}/> FINALIZAR NO WHATSAPP
            </button>
          )}
        </div>
      )}

      {/* Admin e Recorte (Resumido) */}
      {isAdmin && (
        <button onClick={() => setEditando({ nome: '', preco: '', fotos: [], genero: abaGeral })} className="fixed bottom-6 right-6 bg-black text-[#D4AF37] p-4 rounded-full shadow-xl"><Plus size={24}/></button>
      )}

      {imagemParaRecortar && (
        <div className="fixed inset-0 bg-black z-[110] flex flex-col">
          <div className="flex justify-between p-4 text-white">
            <button onClick={() => setImagemParaRecortar(null)}>Cancelar</button>
            <button onClick={finalizarRecorteESalvar} className="bg-[#D4AF37] text-black px-6 py-2 rounded-full font-bold">Aplicar</button>
          </div>
          <Cropper src={imagemParaRecortar} style={{height: '80%'}} aspectRatio={3/4} ref={cropperRef} viewMode={1} />
        </div>
      )}
    </div>
  )
}