'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TAMANHOS_OPCOES = ['P', 'M', 'G', 'GG', '48', '50', '52', 'UN'];
const WHATSAPP_NUM = '5544998550741'; 

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

const CATEGORIAS_MAP: Record<string, string[]> = {
  FEMININO: ['calcinha', 'conjunto fitness', 'conjunto lingerie', 'legs calça', 'lingerie', 'pijama', 'sutiã'].sort(),
  MASCULINO: ['camiseta', 'cueca', 'pijama', 'shorts'].sort(),
  INFANTIL_MENINAS: ['calcinha', 'conjuntos', 'pijama'].sort(),
  INFANTIL_MENOS: ['conjuntos', 'cueca', 'pijama'].sort()
};

function ImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  if (!images || images.length === 0) return <img src="https://via.placeholder.com/600" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Sem imagem" />;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img src={images[current]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Produto" />
      {images.length > 1 && (
        <>
          <button onClick={() => setCurrent(current > 0 ? current - 1 : images.length - 1)} style={{ position: 'absolute', left: '5px', top: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', transform: 'translateY(-50%)' }}>‹</button>
          <button onClick={() => setCurrent(current < images.length - 1 ? current + 1 : 0)} style={{ position: 'absolute', right: '5px', top: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', transform: 'translateY(-50%)' }}>›</button>
        </>
      )}
    </div>
  );
}

export default function MabellenFinal() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); 
  const [genderFilter, setGenderFilter] = useState('FEMININO');
  const [subFilter, setSubFilter] = useState('TODOS');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<Record<string, string>>({});
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});

  const [productForm, setProductForm] = useState<any>({
    nome: '', preco: '', genero: 'FEMININO', categoria: 'calcinha', fotos: [], estoque: {}, cores: '', ativo: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setSubFilter('TODOS');
  }, [genderFilter]);

  async function fetchProducts() {
    const { data, error } = await supabase.from('produtos').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  }

  const addToCart = (prod: any) => {
    const size = selectedSize[prod.id];
    const color = selectedColor[prod.id];
    const qty = selectedQty[prod.id] || 1;

    if (!size) return alert("Selecione um tamanho!");

    setCart([...cart, { idCarrinho: Date.now(), ...prod, tamanhoEscolhido: size, corEscolhida: color || 'N/A', quantidadeEscolhida: qty }]);
    setCartOpen(true);
  };

  const filtered = products.filter(p => p.genero === genderFilter && (subFilter === 'TODOS' || p.categoria === subFilter));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Montserrat:wght@200;400;700&display=swap');
        :root { --gold: #c9a96e; --bg: #fdfdfd; --text: #1a1a1a; }
        body { margin: 0; font-family: 'Montserrat', sans-serif; background: var(--bg); color: var(--text); }
        header { background: #fff; padding: 15px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 500; }
        .logo { font-family: 'Cinzel', serif; letter-spacing: 8px; font-weight: 700; text-transform: uppercase; font-size: 1.4rem; }
        .logo span { color: var(--gold); }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; padding: 20px 5%; }
        .card { background: #fff; border-radius: 4px; border: 1px solid #f0f0f0; overflow: hidden; display: flex; flex-direction: column; }
        .img-container { width: 100%; height: 400px; position: relative; }
        .btn-buy { width: 100%; background: #000; color: #fff; border: none; padding: 12px; font-weight: 700; cursor: pointer; text-transform: uppercase; margin-top: 10px; }
        .drawer { position: fixed; right: -100%; top: 0; width: 100%; max-width: 450px; height: 100%; background: #fff; z-index: 9999; transition: 0.4s; padding: 30px; overflow-y: auto; box-shadow: -5px 0 20px rgba(0,0,0,0.1); }
        .drawer.open { right: 0; }
      `}</style>

      <header>
        <div style={{cursor:'pointer'}} onClick={() => prompt('Acesso:') === '2004' ? setAdminOpen(true) : null}>⚙️</div>
        <h1 className="logo">MABE<span>LLEN</span></h1>
        <div onClick={() => setCartOpen(true)} style={{cursor:'pointer'}}>🛍️ ({cart.length})</div>
      </header>

      <nav style={{display:'flex', justifyContent:'center', gap:'20px', padding:'15px'}}>
        {Object.keys(CATEGORIAS_MAP).map(g => (
          <button key={g} style={{background:'none', border:'none', cursor:'pointer', fontWeight: genderFilter === g ? 'bold' : 'normal', fontSize:'0.7rem'}} onClick={() => setGenderFilter(g)}>
            {g.replace('_', ' ')}
          </button>
        ))}
      </nav>

      <main className="grid">
        {filtered.map(prod => (
          <div key={prod.id} className="card">
            <div className="img-container">
              <ImageCarousel images={prod.fotos} />
            </div>
            <div style={{padding: '15px', textAlign: 'center'}}>
              <p style={{fontSize: '0.75rem', textTransform: 'uppercase', margin: '0 0 5px'}}>{prod.nome}</p>
              <p style={{fontWeight: 'bold', color: 'var(--gold)'}}>{formatarMoeda(prod.preco)}</p>
              <button className="btn-buy" onClick={() => addToCart(prod)}>Adicionar à Bag</button>
            </div>
          </div>
        ))}
      </main>

      {/* Drawer Carrinho Simples */}
      <div className={`drawer ${cartOpen ? 'open' : ''}`}>
        <h2 style={{fontFamily: 'Cinzel'}}>MINHA BAG</h2>
        {cart.map((item, i) => (
          <div key={i} style={{marginBottom:'10px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
            {item.nome} - {formatarMoeda(item.preco)}
          </div>
        ))}
        <button className="btn-buy" onClick={() => setCartOpen(false)}>Fechar</button>
      </div>
    </>
  );
}