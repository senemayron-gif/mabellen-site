'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, ShoppingBag, X, Send, Trash2, Settings, Camera, Menu, MessageCircle, Crop, UploadCloud } from 'lucide-react'
// Importação das bibliotecas de recorte
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
  
  // Estado para o formulário de novo produto
  const [novoProd, setNovoProd] = useState({ nome: '', preco: '', fotos: [] as string[], genero: 'FEMININO', tamanhos_disponiveis: 'P, M, G' })
  
  // Estados para o processo de Crop
  const [imagemParaCrop, setImagemParaCrop] = useState<string | null>(null)
  const cropperRef = useRef<ReactCropperElement>(null)

  // --- CONFIGURAÇÃO DE SEGURANÇA ---
  const SENHA_ADMIN = "1234" // ALTERE SUA SENHA AQUI

  const carregarProdutos = async () => {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    if (data) setProdutos(data)
  }

  useEffect(() => { carregarProdutos() }, [])

  const logarAdmin = () => {
    const senha = prompt("Senha de acesso:")
    if (senha === SENHA_ADMIN) {
      setIsAdmin(true)
      setShowMenu(false)
    } else {
      alert("Acesso negado!")
    }
  }

  // --- FUNÇÕES DE CARRINHO E PEDIDO ---
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

  // --- FUNÇÕES DE ARQUIVO E CROP ---
  
  // 1. Ao selecionar arquivos, carrega o primeiro para o Cropper
  const aoSelecionarArquivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagemParaCrop(reader.result as string); // Abre o modal de crop
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  // 2. Executa o corte e faz upload para o Supabase
  const recortarEAdicionarFoto = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    // Obtém a imagem recortada como Canvas
    const canvas = cropper.getCroppedCanvas({
        width: 1000, // Define uma largura padrão alta para qualidade
        height: 1333, // Proporção 3:4 (estilo moda)
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    if (!canvas) {
        alert("Erro ao gerar imagem recortada.");
        return;
    }

    // Converte Canvas para Blob (arquivo) para upload
    canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const nomeArquivo = `foto-recortada-${Date.now()}.jpg`;
        const arquivo = new File([blob], nomeArquivo, { type: 'image/jpeg' });

        // Upload para o Supabase Storage
        const { data, error } = await supabase.storage.from('fotos-produtos').upload(nomeArquivo, arquivo);

        if (error) {
            console.error("Erro no upload:", error);
            alert("Erro ao enviar imagem.");
            return;
        }

        if (data) {
            // Obtém URL pública e adiciona à lista do produto
            const { data: { publicUrl } } = supabase.storage.from('fotos-produtos').getPublicUrl(data.path);
            setNovoProd(prev => ({ ...prev, fotos: [...prev.fotos, publicUrl] }));
            setImagemParaCrop(null); // Fecha o modal de crop
        }
    }, 'image/jpeg', 0.9); // Qualidade 90%
  }

  // 3. Salva o produto final no banco de dados
  const salvarProdutoCompleto = async () => {
    if(!novoProd.nome || !novoProd.preco || novoProd.fotos.length === 0) {
        alert("⚠️ Preencha Nome, Preço e adicione pelo menos uma foto recortada.");
        return;
    }
    const { error } = await supabase.from('produtos').insert([novoProd])
    if (!error) {
      alert("🎉 Produto publicado com sucesso!"); 
      setIsAdmin(false); 
      carregarProdutos();
      // Reseta o formulário
      setNovoProd({ nome: '', preco: '', fotos: [], genero: 'FEMININO', tamanhos_disponiveis: 'P, M, G' });
    } else {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar produto no banco de dados.");
    }
  }

  const removerFotoDaLista = (indexParaRemover: number) => {
    setNovoProd(prev => ({
        ...prev,
        fotos: prev.fotos.filter((_, index) => index !== indexParaRemover)
    }));
  }

  // --- RENDERIZAÇÃO DA INTERFACE ---
  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-black">
      {/* HEADER FIXO */}
      <header className="bg-black text-[#D4AF37] sticky top-0 z-[100] px-6 py-5 flex justify-between items-center shadow-2xl">
        <button onClick={() => setShowMenu(true)} className="hover:opacity-70"><Menu size={30} /></button>
        <h1 className="text-2xl tracking-[0.3em] italic font-serif">MABELLEN STORE</h1>
        <button onClick={() => setShowCarrinho(true)} className="relative">
          <ShoppingBag size={28} />
          {carrinho.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-black">{carrinho.length}</span>}
        </button>
      </header>

      {/* MENU LATERAL */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/95 z-[200] p-10 flex flex-col text-[#D4AF37]">
          <button onClick={() => setShowMenu(false)} className="self-end hover:rotate-90 transition-transform duration-300"><X size={40}/></button>
          <div className="flex flex-col items-center justify-center h-full gap-20">
            {/* WhatsApp com escrita */}
            <a href="https://wa.me/554499651205?text=Olá! Tenho interesse em conhecer as novidades da Mabellen Store." target="_blank" className="flex flex-col items-center gap-4 hover:scale-110 transition-transform">
                <MessageCircle size={80}/>
                <span className="text-[10px] tracking-[0.3em] font-bold">FALAR NO WHATSAPP</span>
            </a>
            
            {/* Apenas a engrenagem para o Admin */}
            <button onClick={logarAdmin} className="hover:scale-110 transition-transform opacity-30 mt-10">
                <Settings size={35}/>
            </button>
          </div>
        </div>
      )}

      {/* FILTROS DE CATEGORIA */}
      <div className="flex justify-center gap-12 py-10 text-[11px] font-bold tracking-[0.3em]">
          <button onClick={() => setAbaGeral('FEMININO')} className={`pb-2 ${abaGeral === 'FEMININO' ? 'border-b-2 border-black text-black' : 'opacity-30 text-gray-400'}`}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={`pb-2 ${abaGeral === 'MASCULINO' ? 'border-b-2 border-black text-black' : 'opacity-30 text-gray-400'}`}>MASCULINO</button>
      </div>

      {/* GRID DE PRODUTOS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 p-6">
        {produtos.filter(p => p.genero === abaGeral).map((prod) => (
          <div key={prod.id} className="group flex flex-col">
            <div className="relative overflow-hidden rounded-[2.5rem] mb-5 shadow-sm group-hover:shadow-xl transition-shadow">
              <img src={prod.fotos?.[0]} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500" alt={prod.nome} />
            </div>
            <h3 className="font-bold text-[10px] tracking-widest mb-1 uppercase text-gray-500">{prod.nome}</h3>
            <p className="text-2xl font-black mb-5 text-black">R$ {prod.preco}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {prod.tamanhos_disponiveis?.split(',').map((tam: string) => (
                <button key={tam} onClick={() => setTamanhoSelecionado({ ...tamanhoSelecionado, [prod.id]: tam.trim() })} className={`w-11 h-11 rounded-xl border-2 text-xs font-bold transition-all ${tamanhoSelecionado[prod.id] === tam.trim() ? 'bg-black border-black text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-black'}`}>{tam.trim()}</button>
              ))}
            </div>
            <button onClick={() => adicionarAoCarrinho(prod)} className="w-full bg-black text-white py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-transform">Adicionar à Sacola</button>
          </div>
        ))}
      </div>

      {/* MODAL ADMINISTRATIVO */}
      {isAdmin && (
        <div className="fixed inset-0 bg-gray-50 z-[300] p-6 md:p-10 overflow-y-auto text-black">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
            
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center border-b pb-6 mb-10">
                <div className='flex items-center gap-3'>
                    <div className='p-3 bg-black text-[#D4AF37] rounded-2xl'><Plus/></div>
                    <b className="tracking-widest uppercase text-lg font-serif">Novo Produto</b>
                </div>
                <button onClick={() => setIsAdmin(false)} className='p-3 bg-gray-100 rounded-full hover:bg-gray-200'><X/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                
                {/* Coluna 1: Área de Upload e Pré-visualização */}
                <div className="space-y-6">
                    <label className="block text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3">Fotos do Produto (Enquadramento 3:4)</label>
                    
                    {/* Área de Drop/Click Elegante */}
                    <div className="relative group border-4 border-dashed border-gray-100 hover:border-black rounded-[2rem] transition-colors">
                        <input 
                            type="file" 
                            multiple 
                            onChange={aoSelecionarArquivos} 
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <div className="p-10 flex flex-col items-center justify-center text-center gap-4 text-gray-300 group-hover:text-black transition-colors">
                            <UploadCloud size={50} strokeWidth={1}/>
                            <b className='text-xs tracking-wider uppercase'>Clique ou arraste as fotos aqui</b>
                            <p className='text-xs'>Você poderá ajustar o corte de cada uma.</p>
                        </div>
                    </div>

                    {/* Lista de Fotos Adicionadas (Recortadas) */}
                    {novoProd.fotos.length > 0 && (
                        <div className="pt-6 border-t">
                            <label className="block text-[11px] font-bold text-gray-600 tracking-widest uppercase mb-4">Fotos Recortadas ({novoProd.fotos.length})</label>
                            <div className="grid grid-cols-3 gap-4">
                                {novoProd.fotos.map((fotoUrl, index) => (
                                    <div key={index} className="relative group aspect-[3/4] rounded-2xl overflow-hidden shadow-md">
                                        <img src={fotoUrl} className="w-full h-full object-cover" alt={`Preview ${index}`} />
                                        <button 
                                            onClick={() => removerFotoDaLista(index)}
                                            className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Coluna 2: Formulário Simples */}
                <div className="space-y-6 bg-gray-50 p-8 rounded-[2rem]">
                    <label className="block text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3">Detalhes do Produto</label>
                    
                    <input type="text" placeholder="Nome do Conjunto / Peça" className="w-full p-5 bg-white rounded-2xl outline-none border border-gray-100 focus:border-black transition-colors" value={novoProd.nome} onChange={e=>setNovoProd({...novoProd, nome: e.target.value})} />
                    <input type="text" placeholder="Preço (ex: 149,90)" className="w-full p-5 bg-white rounded-2xl outline-none border border-gray-100 focus:border-black transition-colors" value={novoProd.preco} onChange={e=>setNovoProd({...novoProd, preco: e.target.value})} />
                    <input type="text" placeholder="Tamanhos Disponíveis (ex: P, M, G)" className="w-full p-5 bg-white rounded-2xl outline-none border border-gray-100 focus:border-black transition-colors" value={novoProd.tamanhos_disponiveis} onChange={e=>setNovoProd({...novoProd, tamanhos_disponiveis: e.target.value})} />
                    
                    <div className='relative'>
                        <select className="w-full p-5 bg-white rounded-2xl outline-none border border-gray-100 focus:border-black transition-colors font-bold appearance-none" value={novoProd.genero} onChange={e=>setNovoProd({...novoProd, genero: e.target.value as any})}>
                            <option value="FEMININO">Sessão Feminina</option>
                            <option value="MASCULINO">Sessão Masculina</option>
                        </select>
                        <div className='absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400'><Menu size={20}/></div>
                    </div>

                    <div className="pt-8 border-t mt-10">
                        <button onClick={salvarProdutoCompleto} className="w-full bg-black text-[#D4AF37] py-6 rounded-3xl font-black uppercase tracking-[0.3em] shadow-lg hover:scale-[1.02] active:scale-95 transition-transform">
                        Publicar na Loja
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECORTAR IMAGEM (CROP) */}
      {imagemParaCrop && (
        <div className="fixed inset-0 bg-black/80 z-[400] p-6 md:p-20 flex items-center justify-center animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-xl w-full text-black">
                
                <div className="flex justify-between items-center mb-8 border-b pb-5">
                    <div className='flex items-center gap-3'>
                        <div className='p-3 bg-gray-100 rounded-2xl'><Crop/></div>
                        <b className="tracking-widest uppercase text-sm">Ajustar Enquadramento</b>
                    </div>
                    <button onClick={() => setImagemParaCrop(null)} className='p-2 bg-gray-100 rounded-full hover:bg-gray-200'><X/></button>
                </div>

                {/* Área do Cropper */}
                <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-gray-100 mb-8">
                    <Cropper
                        src={imagemParaCrop}
                        style={{ height: '100%', width: '100%' }}
                        initialAspectRatio={3 / 4} // Define proporção vertical padrão moda
                        aspectRatio={3 / 4} // Trava a proporção
                        guides={true} // Mostra guias de terços
                        ref={cropperRef}
                        viewMode={1} // Garante que o crop fique dentro da imagem
                        dragMode='move' // Permite mover a imagem por trás do crop
                        background={false}
                        responsive={true}
                        autoCropArea={1} // Começa cobrindo a imagem toda
                        checkOrientation={false}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setImagemParaCrop(null)} className="w-full bg-gray-100 text-gray-600 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={recortarEAdicionarFoto} className="w-full bg-black text-white py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                        <Camera size={18}/> Recortar e Adicionar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* CARRINHO / SACOLA */}
      {showCarrinho && (
        <div className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-10 flex flex-col shadow-2xl text-black">
            <div className="flex justify-between items-center mb-10 border-b pb-6"><b className="text-xl tracking-widest uppercase font-serif">Sua Sacola</b><button onClick={() => setShowCarrinho(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X/></button></div>
            <div className="flex-1 overflow-y-auto space-y-6">
              {carrinho.length === 0 && <p className="text-center text-gray-400 mt-20 tracking-widest uppercase text-xs font-bold">A sacola está vazia</p>}
              {carrinho.map(item => (
                <div key={item.idUnico} className="flex gap-6 items-center">
                  <img src={item.fotos?.[0]} className="w-24 h-32 object-cover rounded-[1.5rem] shadow-sm" alt={item.nome} />
                  <div className="flex-1">
                    <p className="font-bold text-xs uppercase tracking-tighter mb-1">{item.nome}</p>
                    <p className="text-[10px] text-gray-400 font-bold mb-3 uppercase">TAM: {item.tamanhoEscolhido}</p>
                    <p className="font-black text-lg text-black">R$ {item.preco}</p>
                  </div>
                  <button onClick={() => setCarrinho(carrinho.filter(c => c.idUnico !== item.idUnico))} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={22}/></button>
                </div>
              ))}
            </div>
            {carrinho.length > 0 && (
              <div className="pt-8 border-t space-y-4">
                <div className="flex justify-between font-black text-xl tracking-tighter"><span>TOTAL</span><span>R$ {carrinho.reduce((acc, i) => acc + parseFloat(i.preco.replace(',', '.')), 0).toFixed(2).replace('.', ',')}</span></div>
                <button onClick={finalizarPedido} className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.2em] shadow-lg hover:opacity-90 active:scale-95 transition-all"><Send size={20}/> Finalizar no WhatsApp</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}