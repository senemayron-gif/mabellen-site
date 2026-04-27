'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ShoppingBag, X, Send, Trash2, Settings, MessageCircle, UploadCloud, Edit3, Save } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<{ [key: string]: string }>({})
  const [showCarrinho, setShowCarrinho] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [abaGeral, setAbaGeral] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODOS')
  
  // Estado para Edição/Criação
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [novoProd, setNovoProd] = useState({ 
    nome: '', preco: '', fotos: [] as string[], genero: 'FEMININO', 
    categoria: 'CALCINHA', tamanhos_disponiveis: 'P, M, G' 
  })

  const SENHA_ADMIN = "2004" 

  const categoriasFemininas = ['CALCINHA', 'SUTIÃ', 'CALÇA LEGG', 'SHORT LEGG', 'CONJUNTOS', 'LINGERIE', 'MEIAS', 'PIJAMA']
  const categoriasMasculinas = ['CUECA', 'SHORTS', 'BLUSA', 'CAMISETA', 'MEIA', 'CONJUNTO']

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

  const excluirProduto = async (id: string) => {
    if (confirm("Tem certeza que deseja apagar este produto permanentemente?")) {
      const { error } = await supabase.from('produtos').delete().eq('id', id)
      if (!error) {
        alert("Produto removido!");
        carregarProdutos();
      }
    }
  }

  const prepararEdicao = (prod: any) => {
    setEditandoId(prod.id);
    setNovoProd({
      nome: prod.nome,
      preco: prod.preco,
      fotos: prod.fotos || [],
      genero: prod.genero,
      categoria: prod.categoria,
      tamanhos_disponiveis: prod.tamanhos_disponiveis
    });
    setIsAdmin(true);
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
    <div className="min-h-screen bg-white pb-12 font-sans text-black">
      {/* HEADER */}
      <header className="bg-black text-[#FFD700] sticky top-0 z-[100] px-6 py-6 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] border-b border-[#D4AF37]/30">
        <button onClick={logarAdmin} className={`transition-all ${isAdmin ? 'text-[#FFD700] scale-125' : 'opacity-50'}`}><Settings size={24} /></button>
        <div className="text-center">
            <h1 className="text-3xl tracking-[0.4em] font-black italic font-serif text-[#FFD700] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">MABELLEN</h1>
            <p className="text-[8px] tracking-[0.5em] text-white font-bold opacity-80 mt-1">PREMIUM QUALITY</p>
        </div>
        <button onClick={() => setShowCarrinho(true)} className="relative">
          <ShoppingBag size={30} />
          {carrinho.length > 0 && <span className="absolute -top-1 -right-1 bg-[#FFD700] text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-black">{carrinho.length}</span>}
        </button>
      </header>

      {/* SELEÇÃO GÊNERO / CATEGORIA ... (Igual ao anterior) */}
      <div className="flex justify-center gap-12 py-10">
          <button onClick={() => {setAbaGeral('FEMININO'); setCategoriaFiltro('TODOS')}} className={`text-xs font-black tracking-[0.3em] pb-2 transition-all ${abaGeral === 'FEMININO' ? 'border-b-4 border-black text-black scale-110' : 'opacity-20'}`}>FEMININO</button>
          <button onClick={() => {setAbaGeral('MASCULINO'); setCategoriaFiltro('TODOS')}} className={`text-xs font-black tracking-[0.3em] pb-2 transition-all ${abaGeral === 'MASCULINO' ? 'border-b-4 border-black text-black scale-110' : 'opacity-20'}`}>MASCULINO</button>
      </div>

      <div className="flex gap-3 overflow-x-auto px-6 pb-8 no-scrollbar">
          <button onClick={() => setCategoriaFiltro('TODOS')} className={`px-6 py-2.5 rounded-full text-[10px] font-black border-2 transition-all ${categoriaFiltro === 'TODOS' ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>TODOS</button>
          {(abaGeral === 'FEMININO' ? categoriasFemininas : categoriasMasculinas).map(cat => (
              <button key={cat} onClick={() => setCategoriaFiltro(cat)} className={`px-6 py-2.5 rounded-full text-[10px] font-black border-2 whitespace-nowrap transition-all ${categoriaFiltro === cat ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>{cat}</button>
          ))}
      </div>

      {/* GRID DE PRODUTOS COM OPÇÕES DE ADMIN */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 p-6">
        {produtos.filter(p => p.genero === abaGeral && (categoriaFiltro === 'TODOS' || p.categoria === categoriaFiltro)).map((prod) => (
          <div key={prod.id} className="flex flex-col group relative">
            
            {/* BOTÕES DE GESTÃO (APARECEM QUANDO LOGADO) */}
            {isAdmin && (
              <div className="absolute top-4 left-4 z-50 flex gap-2">
                 <button onClick={() => prepararEdicao(prod)} className="bg-white/90 backdrop-blur p-3 rounded-full text-blue-600 shadow-xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={18}/></button>
                 <button onClick={() => excluirProduto(prod.id)} className="bg-white/90 backdrop-blur p-3 rounded-full text-red-600 shadow-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
              </div>
            )}

            <div className="relative overflow-hidden rounded-[3rem] mb-6 shadow-xl bg-gray-100 border border-gray-100">
              <img src={prod.fotos?.[0]} className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-[#FFD700] px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest border border-[#FFD700]/30 shadow-xl">
                {prod.categoria}
              </div>
            </div>
            <h3 className="font-black text-xs tracking-[0.2em] mb-2 uppercase text-black border-l-4 border-black pl-3">{prod.nome}</h3>
            <p className="text-3xl font-black mb-6 text-black tracking-tighter">R$ {prod.preco}</p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {prod.tamanhos_disponiveis?.split(',').map((tam: string) => (
                <button key={tam} onClick={() => setTamanhoSelecionado({ ...tamanhoSelecionado, [prod.id]: tam.trim() })} className={`w-12 h-12 rounded-2xl border-2 text-[11px] font-black transition-all shadow-sm ${tamanhoSelecionado[prod.id] === tam.trim() ? 'bg-black border-black text-white scale-110 shadow-lg' : 'bg-white border-gray-200 text-gray-400'}`}>{tam.trim()}</button>
              ))}
            </div>
            <button onClick={() => {
                if(!tamanhoSelecionado[prod.id]) { alert("Selecione o tamanho!"); return; }
                setCarrinho([...carrinho, { ...prod, tamanhoEscolhido: tamanhoSelecionado[prod.id], idUnico: Date.now() }])
            }} className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] active:scale-95 transition-all shadow-2xl">Adicionar à Sacola</button>
          </div>
        ))}
      </div>

      {/* FOOTER & WHATSAPP ... (Igual ao anterior) */}
      <footer className="mt-20 border-t-2 border-gray-100 pt-16 pb-12 px-6 text-center">
          <div className="max-w-xl mx-auto space-y-6">
              <h2 className="text-3xl font-black tracking-[0.5em] text-black italic">MABELLEN STORE</h2>
              <div className="flex justify-center gap-6 text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase">
                  <span>Feminina</span> <span className="text-black">•</span> <span>Masculina</span>
              </div>
              <div className="bg-black text-[#FFD700] py-4 px-8 rounded-full inline-block mt-4 shadow-xl">
                  <p className="text-[11px] font-black tracking-[0.2em] uppercase italic">Desde 2026 servindo pessoas com excelência</p>
              </div>
          </div>
      </footer>

      <a href="https://wa.me/554499651205?text=Olá!" target="_blank" className="fixed bottom-8 right-8 bg-[#25D366] text-white p-5 rounded-full shadow-2xl z-[90]"><MessageCircle size={35} /></a>

      {/* MODAL ADMIN (CADASTRO E EDIÇÃO) */}
      {isAdmin && (
        <div className="fixed inset-0 bg-white z-[300] p-6 overflow-y-auto">
          <div className="max-w-xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center border-b pb-4 font-black text-sm tracking-widest uppercase">
                {editandoId ? '✏️ Editar Peça' : '✨ Nova Peça'}
                <button onClick={() => {setIsAdmin(false); setEditandoId(null); setNovoProd({ nome: '', preco: '', fotos: [], genero: abaGeral, categoria: abaGeral === 'FEMININO' ? 'CALCINHA' : 'CUECA', tamanhos_disponiveis: 'P, M, G' })}}><X/></button>
            </div>
            
            <div className="border-4 border-dashed border-gray-100 rounded-[3rem] p-12 text-center relative hover:border-black transition-colors">
                <input type="file" onChange={aoSubirFoto} className="absolute inset-0 opacity-0 cursor-pointer" />
                <UploadCloud className="mx-auto mb-4 text-gray-300" size={50}/>
                <p className="text-xs font-black uppercase text-gray-400">Adicionar nova foto</p>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {novoProd.fotos.map((f, i) => (
                    <div key={i} className="relative group">
                        <img src={f} className="aspect-[3/4] rounded-2xl object-cover shadow-lg border" alt="" />
                        <button onClick={() => setNovoProd({...novoProd, fotos: novoProd.fotos.filter((_, idx) => idx !== i)})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={12}/></button>
                    </div>
                ))}
            </div>

            <input type="text" placeholder="Nome do Produto" className="w-full p-6 bg-gray-50 rounded-3xl outline-none border-2 border-transparent focus:border-black" value={novoProd.nome} onChange={e=>setNovoProd({...novoProd, nome: e.target.value})} />
            <input type="text" placeholder="Valor (Ex: 89,90)" className="w-full p-6 bg-gray-50 rounded-3xl outline-none border-2 border-transparent focus:border-black" value={novoProd.preco} onChange={e=>setNovoProd({...novoProd, preco: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
                <select className="p-6 bg-gray-50 rounded-3xl font-black outline-none border-2 border-transparent focus:border-black" value={novoProd.genero} onChange={e=>setNovoProd({...novoProd, genero: e.target.value as any, categoria: e.target.value === 'FEMININO' ? 'CALCINHA' : 'CUECA'})}>
                    <option value="FEMININO">Feminino</option>
                    <option value="MASCULINO">Masculino</option>
                </select>
                <select className="p-6 bg-gray-50 rounded-3xl font-black outline-none border-2 border-transparent focus:border-black" value={novoProd.categoria} onChange={e=>setNovoProd({...novoProd, categoria: e.target.value})}>
                    {(novoProd.genero === 'FEMININO' ? categoriasFemininas : categoriasMasculinas).map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <input type="text" placeholder="Tamanhos (P, M, G)" className="w-full p-6 bg-gray-50 rounded-3xl outline-none border-2 border-transparent focus:border-black" value={novoProd.tamanhos_disponiveis} onChange={e=>setNovoProd({...novoProd, tamanhos_disponiveis: e.target.value})} />
            
            <button onClick={async () => {
                if (editandoId) {
                    await supabase.from('produtos').update(novoProd).eq('id', editandoId);
                    alert("Atualizado com sucesso!");
                } else {
                    await supabase.from('produtos').insert([novoProd]);
                    alert("Publicado com sucesso!");
                }
                setIsAdmin(false); setEditandoId(null); carregarProdutos();
                setNovoProd({ nome: '', preco: '', fotos: [], genero: 'FEMININO', categoria: 'CALCINHA', tamanhos_disponiveis: 'P, M, G' });
            }} className="w-full bg-black text-[#FFD700] py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] shadow-2xl flex justify-center gap-3">
                {editandoId ? <><Save size={20}/> Salvar Alterações</> : 'Publicar Produto'}
            </button>
          </div>
        </div>
      )}

      {/* SACOLA ... (Igual ao anterior) */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex justify-end backdrop-blur-sm">
          <div className="w-full max-w-md bg-white h-full p-10 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-center mb-10 font-black uppercase tracking-widest text-sm border-b-2 pb-6">Sua Seleção<button onClick={() => setShowCarrinho(false)}><X size={30}/></button></div>
            <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar">
              {carrinho.map(item => (
                <div key={item.idUnico} className="flex gap-5 items-center border-b border-gray-50 pb-6">
                  <img src={item.fotos?.[0]} className="w-20 h-24 object-cover rounded-2xl shadow-md" alt="" />
                  <div className="flex-1">
                    <p className="font-black text-xs uppercase tracking-wider">{item.nome}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{item.categoria} • TAM: {item.tamanhoEscolhido}</p>
                    <p className="font-black text-lg mt-1">R$ {item.preco}</p>
                  </div>
                  <button onClick={() => setCarrinho(carrinho.filter(c => c.idUnico !== item.idUnico))} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={22}/></button>
                </div>
              ))}
            </div>
            {carrinho.length > 0 && (
              <div className="pt-8 space-y-4">
                <button onClick={() => {
                    let msg = `*🛍️ PEDIDO MABELLEN STORE*%0A%0A`
                    carrinho.forEach(i => msg += `• *${i.nome}* (${i.categoria}) | Tam: *${i.tamanhoEscolhido}* | R$ ${i.preco}%0A`)
                    window.open(`https://wa.me/554499651205?text=${msg}`)
                }} className="w-full bg-[#25D366] text-white py-7 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] flex justify-center gap-3 items-center shadow-xl"><Send size={20}/> Finalizar no WhatsApp</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}