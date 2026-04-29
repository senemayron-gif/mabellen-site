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
  INFANTIL_MENINOS: ['conjuntos', 'cueca', 'pijama'].sort()
};

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

  const resetForm = () => {
    setEditingId(null);
    setProductForm({ nome: '', preco: '', genero: 'FEMININO', categoria: 'calcinha', fotos: [], estoque: {}, cores: '', ativo: true });
  };

  const addToCart = (prod: any) => {
    const size = selectedSize[prod.id];
    const color = selectedColor[prod.id];
    const qty = selectedQty[prod.id] || 1;

    if (!size) return alert("Selecione um tamanho!");

    const itemCarrinho = { 
      idCarrinho: Date.now(), 
      ...prod, 
      tamanhoEscolhido: size,
      corEscolhida: color || 'N/A',
      quantidadeEscolhida: qty 
    };

    setCart([...cart, itemCarrinho]);
    setCartOpen(true);
  };

  const totalCart = cart.reduce((acc, item) => acc + (item.preco * item.quantidadeEscolhida), 0);

  async function handleFileUpload(e: any) {
    try {
      setUploading(true);
      const files = Array.from(e.target.files);
      const newPhotoUrls = [...(productForm.fotos || [])];

      for (const file of files) {
        const f = file as File;
        const fileName = `${Date.now()}-${f.name}`;
        await supabase.storage.from('mabellen-images').upload(fileName, f);
        const { data: { publicUrl } } = supabase.storage.from('mabellen-images').getPublicUrl(fileName);
        newPhotoUrls.push(publicUrl);
      }
      setProductForm({ ...productForm, fotos: newPhotoUrls });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    const { id, created_at, ...dadosBase } = productForm;
    const payload = { ...dadosBase, preco: Number(productForm.preco) };

    if (editingId) {
      await supabase.from('produtos').update(payload).eq('id', editingId);
    } else {
      await supabase.from('produtos').insert([payload]);
    }
    setAdminOpen(false);
    resetForm();
    fetchProducts();
  }

  const filtered = products.filter(p => p.genero === genderFilter && (subFilter === 'TODOS' || p.categoria === subFilter));

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <style>{`
        header { background: #fff; padding: 15px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 500; }
        .logo { letter-spacing: 5px; font-weight: bold; text-transform: uppercase; font-size: 1.2rem; }
        .logo span { color: #c9a96e; }
        .nav-main { display: flex; justify-content: center; gap: 15px; padding: 15px; overflow-x: auto; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; padding: 20px; }
        .card { border: 1px solid #eee; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
        .img-box { width: 100%; height: 350px; background: #f9f9f9; }
        .img-box img { width: 100%; height: 100%; object-fit: cover; }
        .btn-buy { width: 100%; background: #000; color: #fff; border: none; padding: 12px; cursor: pointer; font-weight: bold; margin-top: 10px; }
        .opt-btn { border: 1px solid #ddd; background: #fff; padding: 5px 10px; margin: 2px; cursor: pointer; }
        .opt-btn.active { background: #000; color: #fff; }
        .drawer { position: fixed; right: -100%; top: 0; width: 100%; max-width: 400px; height: 100%; background: #fff; z-index: 1000; transition: 0.3s; padding: 20px; box-shadow: -2px 0 10px rgba(0,0,0,0.1); overflow-y: auto; }
        .drawer.open { right: 0; }
      `}</style>

      <header>
        <div onClick={() => { const p = prompt('Senha:'); if(p === '2004') setAdminOpen(true); }}>⚙️</div>
        <div className="logo">MABE<span>LLEN</span></div>
        <div onClick={() => setCartOpen(true)} style={{cursor:'pointer'}}>🛍️ ({cart.length})</div>
      </header>

      <nav className="nav-main">
        {Object.keys(CATEGORIAS_MAP).map(g => (
          <button key={g} onClick={() => setGenderFilter(g)} style={{background: 'none', border: 'none', color: genderFilter === g ? '#000' : '#ccc', fontWeight: 'bold', cursor:'pointer', fontSize:'0.7rem'}}>
            {g.replace('_', ' ')}
          </button>
        ))}
      </nav>

      <div className="grid">
        {filtered.map(prod => (
          <div key={prod.id} className="card">
            <div className="img-box">
              <img src={prod.fotos?.[0] || 'https://via.placeholder.com/400'} alt={prod.nome} />
            </div>
            <div style={{padding: '15px'}}>
              <h3 style={{fontSize: '0.9rem', margin: '0 0 5px'}}>{prod.nome}</h3>
              <p style={{fontWeight: 'bold', color: '#c9a96e'}}>{formatarMoeda(prod.preco)}</p>
              
              <div style={{marginTop:'10px'}}>
                {TAMANHOS_OPCOES.filter(t => (prod.estoque?.[t] || 0) > 0).map(t => (
                  <button key={t} className={`opt-btn ${selectedSize[prod.id] === t ? 'active' : ''}`} onClick={() => setSelectedSize({...selectedSize, [prod.id]: t})}>{t}</button>
                ))}
              </div>

              <button className="btn-buy" onClick={() => addToCart(prod)}>ADICIONAR À BAG</button>
            </div>
          </div>
        ))}
      </div>

      {/* Carrinho */}
      <div className={`drawer ${cartOpen ? 'open' : ''}`}>
        <h2>MINHA BAG</h2>
        {cart.map((item, idx) => (
          <div key={idx} style={{display:'flex', gap:'10px', marginBottom:'15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
            <img src={item.fotos?.[0]} style={{width:'50px', height:'70px', objectFit:'cover'}} alt="" />
            <div>
              <p style={{fontSize:'0.8rem', margin:0}}>{item.nome}</p>
              <p style={{fontSize:'0.7rem', color:'#666'}}>{item.tamanhoEscolhido} - {formatarMoeda(item.preco)}</p>
            </div>
          </div>
        ))}
        <h3 style={{marginTop:'20px'}}>TOTAL: {formatarMoeda(totalCart)}</h3>
        <button className="btn-buy" onClick={() => {
          let msg = `*Pedido Mabellen*\n`;
          cart.forEach(i => msg += `- ${i.nome} (${i.tamanhoEscolhido})\n`);
          window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`);
        }}>FINALIZAR NO WHATSAPP</button>
        <button onClick={() => setCartOpen(false)} style={{width:'100%', marginTop:'10px', background:'none', border:'1px solid #eee', padding:'10px'}}>FECHAR</button>
      </div>

      {/* Admin */}
      <div className={`drawer ${adminOpen ? 'open' : ''}`}>
        <h2>ADMINISTRAÇÃO</h2>
        <input style={{width:'100%', padding:'10px', marginBottom:'10px'}} placeholder="Nome" value={productForm.nome} onChange={e => setProductForm({...productForm, nome: e.target.value})} />
        <input style={{width:'100%', padding:'10px', marginBottom:'10px'}} type="number" placeholder="Preço" value={productForm.preco} onChange={e => setProductForm({...productForm, preco: e.target.value})} />
        <input type="file" multiple onChange={handleFileUpload} />
        <button className="btn-buy" onClick={handleSave}>{uploading ? 'SUBINDO...' : 'SALVAR PRODUTO'}</button>
        <button onClick={() => setAdminOpen(false)} style={{width:'100%', marginTop:'10px', background:'none', border:'1px solid #eee', padding:'10px'}}>SAIR</button>
      </div>
    </div>
  );
}