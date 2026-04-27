'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Settings, Save, Trash2, Camera, X, Upload, Loader2 } from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Produto {
  id?: string
  nome: string
  preco: string
  categoria: string
  fotos: string[]
}

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [senha, setSenha] = useState('')
  const [filtro, setFiltro] = useState('TODOS')
  const [genero, setGenero] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  const [editando, setEditando] = useState<Produto | null>(null)
  const [subindo, setSubindo] = useState(false)

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => {
    carregarProdutos()
    const canal = supabase.channel('estoque').on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => carregarProdutos()).subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [])

  const handleUploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setSubindo(true)
    
    const arquivos = Array.from(e.target.files)
    const novasUrls: string[] = [...(editando?.fotos || [])]

    for (const arquivo of arquivos) {
      const nomeArquivo = `${Date.now()}-${arquivo.name}`
      const { data, error } = await supabase.storage
        .from('fotos-produtos')
        .upload(nomeArquivo, arquivo)

      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('fotos-produtos').getPublicUrl(data.path)
        novasUrls.push(publicUrl)
      }
    }

    setEditando(prev => prev ? { ...prev, fotos: novasUrls } : null)
    setSubindo(false)
  }

  const salvarProduto = async (p: Produto) => {
    if (p.id) {
      await supabase.from('produtos').update(p).eq('id', p.id)
    } else {
      await supabase.from('produtos').insert([p])
    }
    setEditando(null)
    carregarProdutos()
  }

  const categorias = genero === 'FEMININO' 
    ? ['TODOS', 'CALCINHA', 'SUTIÃ', 'CONJUNTO', 'PIJAMAS', 'CAMISETAS', 'CALÇAS LEG', 'MEIAS']
    : ['TODOS', 'CUECAS', 'PIJAMAS', 'MEIAS', 'CAMISETAS']

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-24">
      {/* Header */}
      <header className="py-8 px-4 text-center bg-black text-[#D4AF37] sticky top-0 z-40 border-b border-[#D4AF37]/20">
        <h1 className="text-4xl font-light tracking-[0.3em]">M A B E L L E N</h1>
        <button onClick={() => setShowAdminLogin(true)} className="absolute right-4 top-10 opacity-30"><Settings size={20} /></button>
      </header>

      {/* Gênero */}
      <div className="flex justify-center gap-8 py-6 text-sm tracking-widest border-b border-gray-100">
        <button onClick={() => { setGenero('FEMININO'); setFiltro('TODOS'); }} className={genero === 'FEMININO' ? "text-[#D4AF37] border-b border-[#D4AF37]" : "text-gray-400"}>FEMININO</button>
        <button onClick={() => { setGenero('MASCULINO'); setFiltro('TODOS'); }} className={genero === 'MASCULINO' ? "text-[#D4AF37] border-b border-[#D4AF37]" : "text-gray-400"}>MASCULINO</button>
      </div>

      {/* Categorias */}
      <div className="flex overflow-x-auto gap-2 p-4 no-scrollbar">
        {categorias.map(cat => (
          <button key={cat} onClick={() => setFiltro(cat)} className={`px-4 py-1.5 rounded-full text-[10px] border ${filtro === cat ? 'bg-black text-white' : 'bg-gray-50 text-gray-500'}`}>{cat}</button>
        ))}
      </div>

      {/* Grid de Produtos com Swipe */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {produtos.filter(p => (filtro === 'TODOS' || p.categoria === filtro)).map((prod) => (
          <div key={prod.id} className="relative">
            <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-2 relative">
              <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                {prod.fotos?.map((foto, idx) => (
                  <img key={idx} src={foto} className="w-full h-full object-cover snap-center flex-shrink-0" />
                ))}
              </div>
              {prod.fotos?.length > 1 && <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1"><div className="bg-black/20 px-2 py-0.5 rounded-full text-[8px] text-white">Deslize para ver mais</div></div>}
              {isAdmin && <button onClick={async () => { if(confirm('Excluir?')) await supabase.from('produtos').delete().eq('id', prod.id!); carregarProdutos(); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"><Trash2 size={14}/></button>}
            </div>
            <h3 className="text-[11px] uppercase text-gray-600">{prod.nome}</h3>
            <p className="text-sm font-bold">R$ {prod.preco}</p>
          </div>
        ))}
      </div>

      {/* Modal Admin Cadastro */}
      {editando && (
        <div className="fixed inset-0 bg-white z-[70] p-6 overflow-y-auto text-black">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Adicionar à Galeria</h2>
            <button onClick={() => setEditando(null)}><X size={24}/></button>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center relative bg-gray-50">
              <input type="file" multiple accept="image/*" onChange={handleUploadFotos} className="absolute inset-0 opacity-0 cursor-pointer" />
              {subindo ? <Loader2 className="mx-auto animate-spin text-[#D4AF37]" size={40} /> : <Upload className="mx-auto text-gray-400" size={40} />}
              <p className="mt-2 font-medium text-gray-600">{subindo ? 'Enviando fotos...' : 'Clique para abrir a Galeria'}</p>
              <p className="text-[10px] text-gray-400">Pode selecionar várias fotos de uma vez</p>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {editando.fotos?.map((url, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={url} className="w-20 h-20 object-cover rounded-xl border" />
                  <button onClick={() => setEditando({...editando, fotos: editando.fotos.filter((_, index) => index !== i)})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                </div>
              ))}
            </div>

            <input type="text" placeholder="Nome do Conjunto" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border" value={editando.nome} onChange={(e) => setEditando({...editando, nome: e.target.value})} />
            <input type="text" placeholder="Preço" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border" value={editando.preco} onChange={(e) => setEditando({...editando, preco: e.target.value})} />
            <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none border" value={editando.categoria} onChange={(e) => setEditando({...editando, categoria: e.target.value})}>
              {categorias.filter(c => c !== 'TODOS').map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <button onClick={() => salvarProduto(editando)} className="w-full bg-black text-[#D4AF37] p-5 rounded-2xl font-bold flex items-center justify-center gap-2">
              <Save size={20}/> FINALIZAR CADASTRO
            </button>
          </div>
        </div>
      )}

      {/* Botões Flutuantes */}
      {isAdmin && <button onClick={() => setEditando({ nome: '', preco: '', categoria: categorias[1], fotos: [] })} className="fixed bottom-24 right-6 bg-black text-[#D4AF37] p-4 rounded-full shadow-2xl z-50"><Plus size={28} /></button>}
      <a href="https://wa.me/554499651205" className="fixed bottom-6 left-6 right-6 bg-[#25D366] text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-2xl z-40">PEDIR NO WHATSAPP</a>

      {/* Login Admin */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[80]">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4 text-black">Acesso Restrito</h2>
            <input type="password" placeholder="Senha" className="w-full p-4 border rounded-xl mb-4 text-center text-black" value={senha} onChange={(e) => setSenha(e.target.value)} />
            <button onClick={() => { if(senha==='2004'){setIsAdmin(true);setShowAdminLogin(false);setSenha('');}else{alert('Erro');} }} className="w-full bg-black text-white p-4 rounded-xl font-bold">Entrar</button>
          </div>
        </div>
      )}
    </div>
  )
}