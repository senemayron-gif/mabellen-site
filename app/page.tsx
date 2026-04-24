'use client';

import { useEffect, useState, useRef, createRef } from 'react';
import dynamic from 'next/dynamic';

const Cropper = dynamic(() => import('react-cropper').then(m => m.default), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-zinc-100 animate-pulse flex items-center justify-center text-zinc-400 font-light tracking-widest text-[10px]">PREPARANDO ATELIER...</div>
});

export default function MabellenOfficial() {
  const [products, setProducts] = useState([
    { id: 1, name: 'CONJUNTO NOIR SEDUCTION', gender: 'FEMININO', subcat: 'CONJUNTO', price: '189,90', image: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?q=80&w=800', isNew: true }
  ]);

  const [adminMode, setAdminMode] = useState(false);
  const [activeGender, setActiveGender] = useState('FEMININO');
  const [activeSubcat, setActiveSubcat] = useState('TODOS');
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  
  const cropperRef = createRef<any>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const WHATSAPP_LINK = "554499651205";

  const catsFeminino = ['TODOS', 'CALCINHA', 'SUTIÃ', 'CONJUNTO', 'PIJAMAS', 'CAMISETAS', 'CALÇAS LEG', 'MEIAS'];
  const catsMasculino = ['TODOS', 'CUECAS', 'PIJAMAS', 'CAMISETAS', 'CALÇAS', 'MEIAS'];

  useEffect(() => {
    const saved = localStorage.getItem('mabellen_official_data');
    if (saved) setProducts(JSON.parse(saved));
  }, []);

  const ligarAdmin = () => {
    const senha = prompt("Acesso Administrativo:");
    if (senha === "2004") setAdminMode(!adminMode);
  };

  const saveAll = () => {
    localStorage.setItem('mabellen_official_data', JSON.stringify(products));
    alert('Site Publicado! ✨');
  };

  const addProduct = () => {
    const newId = Date.now();
    const newItem = {
      id: newId,
      name: 'NOME DO PRODUTO',
      gender: activeGender,
      subcat: activeSubcat === 'TODOS' ? (activeGender === 'FEMININO' ? 'CONJUNTO' : 'CUECAS') : activeSubcat,
      price: '0,00',
      image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=800',
      isNew: true
    };
    setProducts([newItem, ...products]);
  };

  const finalizeCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper && activeId) {
      const result = cropper.getCroppedCanvas({ width: 1200, height: 1500 }).toDataURL('image/jpeg', 0.9);
      setProducts(products.map(p => p.id === activeId ? { ...p, image: result } : p));
      setCroppingImage(null);
      setActiveId(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchGender = p.gender === activeGender;
    const matchSub = activeSubcat === 'TODOS' || p.subcat === activeSubcat;
    return matchGender && matchSub;
  });

  // Componente de Logo Padronizado para reuso no Topo e Rodapé
  const LogoMabellen = ({ size = "text-xl md:text-3xl" }) => (
    <div className="flex flex-col items-center">
      <h1 className={`${size} font-serif tracking-[0.4em] uppercase text-white leading-none`}>
        Mabe<span className="text-[#C9A96E]">llen</span>
      </h1>
      <p className="text-[7px] md:text-[9px] tracking-[0.3em] uppercase text-[#C9A96E] mt-1 font-medium">
        MODA INTIMA FEMININA E MASCULINA
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#111] antialiased">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css" />
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setCroppingImage(reader.result as string);
          reader.readAsDataURL(file);
        }
        e.target.value = '';
      }} />

      {/* EDITOR DE FOTOS */}
      {croppingImage && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b">
              <span className="text-sm font-bold uppercase tracking-tighter">Enquadrar Peça</span>
              <button onClick={finalizeCrop} className="bg-[#C9A96E] text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase">Confirmar</button>
            </div>
            <Cropper ref={cropperRef} src={croppingImage} style={{ height: 400, width: "100%" }} aspectRatio={4/5} viewMode={1} guides={true} />
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-[#111] py-6 md:py-8 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <LogoMabellen />

        <div className="flex gap-2 md:gap-4 items-center">
          <button onClick={ligarAdmin} className="w-8 h-8 flex items-center justify-center text-white/20 text-[10px] hover:text-white transition-colors">{adminMode ? '✕' : '⚙'}</button>
          {adminMode && (
            <div className="flex gap-2">
               <button onClick={addProduct} className="bg-white text-black text-[9px] md:text-[10px] font-bold px-4 py-2 rounded-full uppercase italic">+ NOVO</button>
               <button onClick={saveAll} className="bg-[#C9A96E] text-white text-[9px] md:text-[10px] font-bold px-4 py-2 rounded-full uppercase shadow-lg">SALVAR</button>
            </div>
          )}
        </div>
      </header>

      {/* NAV FILTROS */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-zinc-100 sticky top-[70px] md:top-[100px] z-40">
        <div className="flex justify-center gap-8 md:gap-16 py-4 border-b border-zinc-50">
          {['FEMININO', 'MASCULINO'].map(g => (
            <button key={g} onClick={() => { setActiveGender(g); setActiveSubcat('TODOS'); }} className={`text-[10px] md:text-[12px] font-bold tracking-[0.3em] uppercase transition-all ${activeGender === g ? 'text-[#C9A96E] border-b border-[#C9A96E]' : 'text-zinc-300'}`}>{g}</button>
          ))}
        </div>
        <div className="flex justify-start md:justify-center gap-3 py-3 overflow-x-auto px-6 no-scrollbar">
          {(activeGender === 'FEMININO' ? catsFeminino : catsMasculino).map(s => (
            <button key={s} onClick={() => setActiveSubcat(s)} className={`text-[8px] md:text-[9px] px-4 py-2 rounded-full whitespace-nowrap uppercase tracking-widest transition-all ${activeSubcat === s ? 'bg-[#111] text-white' : 'bg-zinc-100 text-zinc-500'}`}>{s}</button>
          ))}
        </div>
      </nav>

      {/* VITRINE */}
      <main className="p-6 md:p-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 md:gap-y-20 max-w-7xl mx-auto">
        {filteredProducts.map(p => (
          <div key={p.id} className="group flex flex-col relative animate-fadeIn">
            {adminMode && (
              <button onClick={() => {if(confirm("Excluir item?")) setProducts(products.filter(i => i.id !== p.id))}} className="absolute -top-2 -right-2 z-20 bg-red-600 text-white w-7 h-7 rounded-full shadow-xl font-bold text-xs">✕</button>
            )}
            
            <div 
              onClick={() => adminMode && (setActiveId(p.id), fileInputRef.current?.click())}
              className={`w-full aspect-[4/5] relative overflow-hidden bg-zinc-100 rounded-[2.5rem] shadow-sm ${adminMode ? 'cursor-pointer hover:ring-2 ring-[#C9A96E]' : ''}`}
            >
              {p.isNew && <div className="absolute top-4 left-4 z-10 bg-white/90 px-3 py-1 rounded-full shadow-sm"><span className="text-[7px] font-bold uppercase tracking-widest">New Collection</span></div>}
              <img src={p.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Mabellen" />
              {adminMode && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><span className="bg-white text-[8px] font-bold px-4 py-2 rounded-full uppercase shadow-xl">Alterar Foto</span></div>}
            </div>
            
            <div className="mt-6 text-center space-y-2">
              <input className={`text-[9px] tracking-[0.2em] font-bold text-[#C9A96E] bg-transparent text-center outline-none w-full ${adminMode ? 'border-b border-zinc-200' : 'pointer-events-none'}`} value={p.subcat} onChange={(e) => setProducts(products.map(i => i.id === p.id ? {...i, subcat: e.target.value.toUpperCase()} : i))} />
              <input className={`font-serif text-xl md:text-2xl italic bg-transparent text-center outline-none w-full text-zinc-800 ${adminMode ? 'border-b border-zinc-200' : 'pointer-events-none'}`} value={p.name} onChange={(e) => setProducts(products.map(i => i.id === p.id ? {...i, name: e.target.value} : i))} />
              <div className="flex justify-center items-center gap-1 font-bold">
                <span className="text-[9px] text-zinc-400">R$</span>
                <input className={`bg-transparent text-center outline-none w-20 text-lg ${adminMode ? 'border-b border-zinc-200' : 'pointer-events-none'}`} value={p.price} onChange={(e) => setProducts(products.map(i => i.id === p.id ? {...i, price: e.target.value} : i))} />
              </div>
              
              {!adminMode && (
                <button 
                  onClick={() => window.open(`https://wa.me/${WHATSAPP_LINK}?text=Olá! Gostaria de encomendar o produto: ${p.name}`)}
                  className="mt-4 bg-[#111] text-white text-[9px] font-bold px-10 py-4 rounded-2xl uppercase tracking-widest hover:bg-[#C9A96E] transition-all shadow-md active:scale-95"
                >
                  Encomendar
                </button>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* FOOTER PADRONIZADO COM O TOPO */}
      <footer className="bg-[#111] py-20 text-center mt-20">
        <LogoMabellen size="text-xl md:text-2xl" />
        <p className="text-[7px] tracking-[0.4em] text-zinc-600 uppercase italic mt-6">Peças Exclusivas • Maringá - PR</p>
      </footer>

      {!adminMode && (
        <button 
          onClick={() => window.open(`https://wa.me/${WHATSAPP_LINK}`)}
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-90"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.499-5.688-1.447l-6.305 1.65zm6.357-3.64l.351.208c1.512.896 3.255 1.369 5.053 1.37h.005c5.448 0 9.881-4.433 9.884-9.884.002-2.641-1.029-5.124-2.898-7.001-1.875-1.877-4.363-2.91-7.01-2.91-5.449 0-9.883 4.433-9.886 9.884-.001 1.93.56 3.814 1.621 5.412l.23.348-.992 3.619 3.714-.974z"/></svg>
        </button>
      )}
    </div>
  );
}