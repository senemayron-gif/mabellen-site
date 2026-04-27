'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Settings, Save, Trash2, Camera, X, ChevronRight, ChevronLeft } from 'lucide-react'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Produto {
  id?: string
  nome: string
  preco: string
  categoria: string
  fotos: string[] // Alterado para Array de strings
}

export default function MabellenApp() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [senha, setSenha] = useState('')
  const [filtro, setFiltro] = useState('TODOS')
  const [genero, setGenero] = useState<'FEMININO' | 'MASCULINO'>('FEMININO')
  const [editando, setEditando] = useState<Produto | null>(null)

  const carregarProdutos = async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setProdutos(data)
  }

  useEffect(() => {
    carregarProdutos()
    const canal = supabase
      .channel('alteracoes_estoque')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, 
      () => carregarProdutos())
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [])

  const handleLogin = () => {
    if (senha === '2004') {
      setIsAdmin(true)
      setShowAdminLogin(false)
      setSenha('')
    } else {
      alert('Senha incorreta!')
    }
  }

  const salvarProduto = async (p: Produto) => {
    // Garante que fotos seja um array antes de enviar
    const dadosParaSalvar = { ...p, fotos: Array.isArray(p.fotos) ? p.fotos : [p.fotos] }
    
    if (p.id) {
      await supabase.from('produtos').update(dadosParaSalvar).eq('id', p.id)
    } else {
      await supabase.from('produtos').insert([dadosParaSalvar])
    }
    setEditando(null)
    carregarProdutos()
  }

  const excluirProduto = async (id: string) => {
    if (confirm('Deseja excluir este item?')) {
      await supabase.from('produtos').delete().eq('id', id)
      carregarProdutos()
    }
  }

  const categorias = genero === 'FEMININO' 
    ? ['TODOS', 'CALCINHA', 'SUTIÃ', 'CONJUNTO', 'PIJAMAS', 'CAMISETAS', 'CALÇAS LEG', 'MEIAS']
    : ['TODOS', 'CUECAS', 'PIJAMAS', 'MEIAS', 'CAMISETAS']

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-24">
      {/* Header Luxo */}
      <header className="py-8 px-4 text-center bg-black text-[#D4AF37] border-b border-[#D4AF37]/30 sticky top-0 z-40">
        <h1 className="text-4xl font-light tracking-[0.3em] mb-1">M A B E L L E N</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">Moda Íntima Feminina e Masculina</p>
        
        <button onClick={() => setShowAdminLogin(true)} className="absolute right-4 top-10 opacity-30 hover:opacity-100">
          <Settings size={20} />
        </button>
      </header>

      {/* Seletor de Gênero */}
      <div className="flex justify-center gap-8 py-6 text-sm tracking-widest font-medium border-b border-gray-100">
        <button onClick={() => { setGenero('FEMININO'); setFiltro('TODOS'); }} className={genero === 'FEMININO' ? "text-[#D4AF37] border-b border-[#D4AF37]" : "text-gray-400"}>FEMININO</button>
        <button onClick={() => { setGenero('MASCULINO'); setFiltro('TODOS'); }} className={genero === 'MASCULINO' ? "text-[#D4AF37] border-b border-[#D4AF37]" : "text-gray-400"}>MASCULINO</button>
      </div>

      {/* Filtros */}
      <div className="flex overflow-x-auto gap-2 p-4 no-scrollbar">
        {categorias.map(cat => (
          <button key={cat} onClick={() => setFiltro(cat)} className={`px-4 py-1.5 rounded-full text-[10px] whitespace-nowrap transition-all border ${filtro === cat ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{cat}</button>
        ))}
      </div>

      {/* Grid de Produtos com Carrossel */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {produtos
          .filter(p => (filtro === 'TODOS' || p.categoria === filtro))
          .map((prod) => (
          <div key={prod.id} className="relative group animate-in fade-in duration-500">
            {/* Area do Carrossel */}
            <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-2 relative group">
              <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                {prod.fotos && prod.fotos.length > 0 ? (
                  prod.fotos.map((foto, idx) => (
                    <img key={idx} src={foto} alt={prod.nome} className="w-full h-full object-cover snap-center flex-shrink-0" />
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">Sem foto</div>
                )}
              </div>
              
              {/* Indicador de múltiplas fotos */}
              {prod.fotos?.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {prod.fotos.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50" />
                  ))}
                </div>
              )}

              <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-md text-[8px] font-bold uppercase">New Collection</div>
              
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button onClick={() => excluirProduto(prod.id!)} className="bg-red-500 text-white p-2 rounded-full shadow-lg"><Trash2 size={14}/></button>
                </div>
              )}
            </div>
            <h3 className="text-[11px] font-medium uppercase tracking-tight text-gray-600 px-1">{prod.nome}</h3>
            <p className="text-sm font-semibold px-1 text-black">R$ {prod.preco}</p>
          </div>
        ))}
      </div>

      {/* Botão Admin */}
      {isAdmin && (
        <button onClick={() => setEditando({ nome: '', preco: '', categoria: filtro === 'TODOS' ? categorias[1] : filtro, fotos: [] })} className="fixed bottom-24 right-6 bg-black text-[#D4AF37] p-4 rounded-full shadow-2xl z-50 animate-bounce">
          <Plus size={28} />
        </button>
      )}

      {/* Modal Cadastro/Edição */}
      {editando && (
        <div className="fixed inset-0 bg-white z-[70] p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-black">Adicionar Produto</h2>
            <button onClick={() => setEditando(null)}><X size={24} className="text-black"/></button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-3xl border-2 border-dashed border-gray-200">
               <p className="text-[10px] font-bold mb-2 text-gray-400 uppercase">Links das Fotos (uma por linha ou separadas por vírgula)</p>
               <textarea 
                rows={4}
                placeholder="Cole os links das fotos aqui..."
                className="w-full p-4 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-black outline-none"
                value={editando.fotos?.join(', ')}
                onChange={(e) => {
                  const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url !== '');
                  setEditando({...editando, fotos: urls})
                }}
              />
              <div className="flex gap-2 mt-2 overflow-x-auto py-2">
                {editando.fotos?.map((url, i) => (
                   <img key={i} src={url} className="w-16 h-16 object-cover rounded-lg border border-black/10" />
                ))}
              </div>
            </div>

            <input type="text" placeholder="Nome do Produto" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-black text-black" value={editando.nome} onChange={(e) => setEditando({...editando, nome: e.target.value})} />
            <input type="text" placeholder="Preço (Ex: 89,90)" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-black text-black" value={editando.preco} onChange={(e) => setEditando({...editando, preco: e.target.value})} />
            
            <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-black" value={editando.categoria} onChange={(e) => setEditando({...editando, categoria: e.target.value})}>
              {categorias.filter(c => c !== 'TODOS').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button onClick={() => salvarProduto(editando)} className="w-full bg-black text-[#D4AF37] p-5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform">
              <Save size={20}/> SALVAR NO CATÁLOGO
            </button>
          </div>
        </div>
      )}

      {/* Botão WhatsApp */}
      <a href="https://wa.me/554499651205" className="fixed bottom-6 left-6 right-6 bg-[#25D366] text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-2xl z-40 hover:scale-105 transition-transform">
        ENVIAR PEDIDO VIA WHATSAPP
      </a>

      {/* Modal de Login */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[80] backdrop-blur-md">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4 text-black">Acesso Restrito</h2>
            <input type="password" placeholder="••••" className="w-full p-4 border rounded-xl mb-4 text-center text-2xl tracking-[0.5em] outline-none border-gray-200 text-black" value={senha} onChange={(e) => setSenha(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setShowAdminLogin(false)} className="flex-1 p-4 text-gray-500 font-medium">Cancelar</button>
              <button onClick={handleLogin} className="flex-1 bg-black text-white p-4 rounded-xl font-bold">Entrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}