'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShoppingBag, X, Send, Trash2, Settings, Camera, Menu, MessageCircle, Crop, UploadCloud } from 'lucide-react'
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
  const [imagemParaCrop, setImagemParaCrop] = useState<string | null>(null)
  const cropperRef = useRef<any>(null)

  // SENHA ATUALIZADA CONFORME SOLICITADO
  const SENHA_ADMIN = "2004" 

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  const logarAdmin = () => {
    const senha = prompt("Acesso restrito. Digite a senha:")
    if (senha === SENHA_ADMIN) { setIsAdmin(true); setShowMenu(false) } 
    else { alert("Senha incorreta!") }
  }

  const aoSelecionarArquivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = () => setImagemParaCrop(reader.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const recortarEAdicionar = async () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper) return
    const canvas = cropper.getCroppedCanvas({ width: 1000, height: 1333 })
    canvas.toBlob(async (blob: any) => {
      const nomeArq = `prop-${Date.now()}.jpg`
      const { data } = await supabase.storage.from('fotos-produtos').upload(nomeArq, blob)
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('fotos-produtos').getPublicUrl(data.path)
        setNovoProd(prev => ({ ...prev, fotos: [...prev.fotos, publicUrl] }))
        setImagemParaCrop(null)
      }
    }, 'image/jpeg')
  }

  const finalizarPedido = () => {
    let msg = `*🛍️ NOVO PEDIDO - MABELLEN STORE*%0A%0A`
    carrinho.forEach(item => { msg += `• *${item.nome}* | Tam: *${item.tamanhoEscolhido}* | R$ ${item.preco}%0A` })
    const total = carrinho.reduce((acc, i) => acc + parseFloat(i.preco.replace(',', '.')), 0)
    msg += `%0A💰 *Total: R$ ${total.toFixed(2).replace('.', ',')}*`
    window.open(`https://wa.me/554499651205?text=${msg}`)
  }

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-black">
      <header className="bg-black text-[#D4AF37] sticky top-0 z-[100] px-6 py-5 flex justify-between items-center shadow-2xl">
        <button onClick={() => setShowMenu(true)}><Menu size={30} /></button>
        <h1 className="text-2xl tracking-[0.3em] italic font-serif uppercase">Mabellen</h1>
        <button onClick={() => setShowCarrinho(true)} className="relative">
          <ShoppingBag size={28} />
          {carrinho.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{carrinho.length}</span>}
        </button>
      </header>

      {/* MENU E FILTROS */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/95 z-[200] p-10 flex flex-col text-[#D4AF37]">
          <button onClick={() => setShowMenu(false)} className="self-end"><X size={40}/></button>
          <div className="flex flex-col items-center justify-center h-full gap-20">
            <a href="https://wa.me/554499651205?text=Olá! Gostaria de ver o catálogo." className="flex flex-col items-center gap-4">
                <MessageCircle size={80}/>
                <span className="text-[10px] tracking-[0.3em] font-bold uppercase">WhatsApp</span>
            </a>
            <button onClick={logarAdmin} className="opacity-20"><Settings size={35}/></button>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-12 py-10 text-[11px] font-bold tracking-[0.3em]">
          <button onClick={() => setAbaGeral('FEMININO')} className={abaGeral === 'FEMININO' ? 'border-b-2 border-black' : 'opacity-30'}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={abaGeral === 'MASCULINO' ? 'border-b-2 border-black' : 'opacity-30'}>MASCULINO</button>
      </div>

      {/* LISTAGEM */}
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
                const tam = tamanhoSelecionado[prod.id];
                if (!tam) { alert("Selecione o tamanho!"); return; }
                setCarrinho([...carrinho, { ...prod, tamanhoEscolhido: tam, idUnico: Date.now() }])
            }} className="w-full bg-black text-white py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em]">Adicionar à Sacola</button>
          </div>
        ))}
      </div>

      {/* MODAL ADMIN ELEGANTE */}
      {isAdmin && (
        <div className="fixed inset-0 bg-white z-[300] p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between mb-10"><h2 className="font-black tracking-tighter text-2xl uppercase">Novo Produto</h2><button onClick={() => setIsAdmin(false)}><X/></button></div>
            <div className="grid grid-cols-1 gap-6">
                <div className="border-4 border-dashed border-gray-100 rounded-[2rem] p-10 text-center relative">
                    <input type="file" onChange={aoSelecionarArquivos} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <UploadCloud className="mx-auto mb-4 text-gray-300" size={50}/>
                    <p className="text-xs font-bold uppercase tracking-widest">Toque para adicionar fotos</p>
                </div>
                <div className="flex gap-4 overflow-x-auto py-4">
                    {novoProd.fotos.map((f, i) => <img key={i} src={f} className="w-20 h-28 object-cover rounded-xl shadow-md" alt="" />)}
                </div>
                <input type="text" placeholder="Nome do Produto" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" value={novoProd.nome} onChange={e=>setNovoProd({...novoProd, nome: e.target.value})} />
                <input type="text" placeholder="Preço" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" value={novoProd.preco} onChange={e=>setNovoProd({...novoProd, preco: e.target.value})} />
                <input type="text" placeholder="Tamanhos (P, M, G)" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" value={novoProd.tamanhos_disponiveis} onChange={e=>setNovoProd({...novoProd, tamanhos_disponiveis: e.target.value})} />
                <select className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold" value={novoProd.genero} onChange={e=>setNovoProd({...novoProd, genero: e.target.value as any})}>
                    <option value="FEMININO">Feminino</option>
                    <option value="MASCULINO">Masculino</option>
                </select>
                <button onClick={async () => {
                    await supabase.from('produtos').insert([novoProd])
                    alert("Sucesso!"); setIsAdmin(false); carregarProdutos()
                }} className="w-full bg-black text-[#D4AF37] py-6 rounded-3xl font-black uppercase tracking-[0.3em]">Publicar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CROP */}
      {imagemParaCrop && (
        <div className="fixed inset-0 bg-black z-[400] p-4 flex flex-col items-center justify-center">
            <div className="bg-white p-6 rounded-[2rem] w-full max-w-md">
                <Cropper src={imagemParaCrop} style={{height: 400, width: '100%'}} initialAspectRatio={3/4} aspectRatio={3/4} guides={true} ref={cropperRef} viewMode={1} />
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button onClick={() => setImagemParaCrop(null)} className="bg-gray-100 py-4 rounded-xl font-bold uppercase text-[10px]">Cancelar</button>
                    <button onClick={recortarEAdicionar} className="bg-black text-white py-4 rounded-xl font-bold uppercase text-[10px]">Recortar</button>
                </div>
            </div>
        </div>
      )}

      {/* SACOLA */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-10 flex flex-col">
            <div className="flex justify-between items-center mb-10"><b className="uppercase tracking-widest">Sua Sacola</b><button onClick={() => setShowCarrinho(false)}><X/></button></div>
            <div className="flex-1 overflow-y-auto space-y-6">
              {carrinho.map(item => (
                <div key={item.idUnico} className="flex gap-4 items-center border-b pb-4">
                  <img src={item.fotos?.[0]} className="w-16 h-20 object-cover rounded-lg" alt="" />
                  <div className="flex-1">
                    <p className="font-bold text-xs uppercase">{item.nome}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">TAM: {item.tamanhoEscolhido}</p>
                    <p className="font-black text-sm">R$ {item.preco}</p>
                  </div>
                  <button onClick={() => setCarrinho(carrinho.filter(c => c.idUnico !== item.idUnico))}><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
            {carrinho.length > 0 && (
              <div className="pt-8 border-t space-y-4">
                <button onClick={finalizarPedido} className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] flex justify-center gap-2 items-center"><Send size={18}/> Enviar Pedido</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}