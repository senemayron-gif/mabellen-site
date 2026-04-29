'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuração do Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TAMANHOS_OPCOES = ['P', 'M', 'G', 'GG', '48', '50', '52', 'UN'];
const WHATSAPP_NUM = '5544998550741'; 

const CATEGORIAS_MAP: Record<string, string[]> = {
  FEMININO: ['calcinha', 'conjunto fitness', 'conjunto lingerie', 'legs calça', 'lingerie', 'pijama', 'sutiã'].sort(),
  MASCULINO: ['camiseta', 'cueca', 'pijama', 'shorts'].sort(),
  INFANTIL_MENINAS: ['calcinha', 'conjuntos', 'pijama'].sort(),
  INFANTIL_MENOS: ['conjuntos', 'cueca', 'pijama'].sort()
};

function ImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  
  if (!images || images.length === 0) return <img src="https://via.placeholder.com/600" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Sem imagem" />;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#fff' }}>
      <img 
        src={images[current]} 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain', 
          backgroundColor: '#fff' 
        }} 
        alt="Produto" 
      />
      {images.length > 1 && (
        <>
          <button onClick={() => setCurrent(current > 0 ? current - 1 : images.length - 1)} style={{ position: 'absolute', left: '5px', top: '50%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', transform: 'translateY(-50%)' }}>‹</button>
          <button onClick={() => setCurrent(current < images.length - 1 ? current + 1 : 0)} style={{ position: 'absolute', right: '5px', top: '50%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', transform: 'translateY(-50%)' }}>›</button>
          <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', fontSize: '11px', color: '#000', opacity: 0.5 }}>
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

export default function MabellenFinal() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); 
  const [genderFilter, setGenderFilter] = useState('FEMININO');
  const [subFilter, setSubFilter] = useState('TODOS');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null); 

  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<Record<string, string>>({});
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});

  const [productForm, setProductForm] = useState<any>({
    nome: '', preco: '', genero: 'FEMININO', categoria: 'calcinha', fotos: [], estoque: {}, cores: '', ativo: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase.from('produtos').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  }

  const resetForm = () => {
    setEditingId(null);
    setProductForm({ nome: '', preco: '', genero: 'FEMININO', categoria: 'calcinha', fotos: [], estoque: {}, cores: '', ativo: true });
    setShowForm(false);
  };

  const addToCart = (prod: any) => {
    const size = selectedSize[prod.id];
    const color = selectedColor[prod.id];
    const qty = selectedQty[prod.id] || 1;
    if (!size) return alert("Por favor, selecione um tamanho!");
    if (prod.cores && prod.cores.trim() !== '' && !color) return alert("Por favor, selecione uma cor!");
    setAddingId(prod.id);
    const itemCarrinho = { idCarrinho: Date.now(), ...prod, tamanhoEscolhido: size, corEscolhida: color || 'N/A', quantidadeEscolhida: qty };
    setCart([...cart, itemCarrinho]);
    setTimeout(() => { setAddingId(null); }, 600);
  };

  const removeFromCart = (idCarrinho: number) => {
    setCart(cart.filter(item => item.idCarrinho !== idCarrinho));
  };

  const totalCart = cart.reduce((acc, item) => acc + (item.preco * item.quantidadeEscolhida), 0);

  const finalizarPedido = () => {
    let msg = `*NOVO PEDIDO - MABELLEN*\n\n`;
    cart.forEach(item => { msg += `• ${item.quantidadeEscolhida}x ${item.nome} (${item.tamanhoEscolhido} - ${item.corEscolhida}) - R$ ${(item.preco * item.quantidadeEscolhida).toFixed(2)}\n`; });
    msg += `\n*TOTAL: R$ ${totalCart.toFixed(2)}*`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`);
  };

  async function handleFileUpload(e: any) {
    setUploading(true);
    const files = Array.from(e.target.files);
    const newPhotoUrls = [...(productForm.fotos || [])];
    for (const file of files) {
      const f = file as File;
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await supabase.storage.from('mabellen-images').upload(fileName, f);
      const { data: { publicUrl } } = supabase.storage.from('mabellen-images').getPublicUrl(fileName);
      newPhotoUrls.push(publicUrl);
    }
    setProductForm({ ...productForm, fotos: newPhotoUrls });
    setUploading(false);
  }

  async function handleSave() {
    const { id, created_at, ...dadosBase } = productForm;
    const payload = { ...dadosBase, preco: Number(productForm.preco) };
    if (editingId) await supabase.from('produtos').update(payload).eq('id', editingId);
    else await supabase.from('produtos').insert([payload]);
    alert("Salvo!");
    setShowForm(false);
    resetForm();
    fetchProducts();
  }

  async function handleDelete() {
    if (!confirm("Excluir permanentemente?")) return;
    await supabase.from('produtos').delete().eq('id', editingId);
    setShowForm(false);
    resetForm();
    fetchProducts();
  }

  const filtered = products.filter(p => (adminOpen || p.ativo) && p.genero === genderFilter && (subFilter === 'TODOS' || p.categoria === subFilter));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Montserrat:wght@200;400;700&display=swap');
        :root { --gold: #c9a96e; --bg: #fdfdfd; --text: #1a1a1a; }
        body { margin: 0; font-family: 'Montserrat', sans-serif; background: var(--bg); color: var(--text); }
        header { background: #fff; padding: 15px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 500; }
        .logo { font-family: 'Cinzel', serif; letter-spacing: 8px; font-weight: 700; text-transform: uppercase; margin: 0; font-size: 1.4rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; padding: 20px 5%; }
        .card { background: #fff; border-radius: 4px; border: 1px solid #f0f0f0; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .img-container { width: 100%; height: 400px; background: #fafafa; position: relative; }
        .drawer { position: fixed; right: -100%; top: 0; width: 100%; max-width: 450px; height: 100%; background: #fff; z-index: 9999; transition: 0.4s; padding: 30px; box-sizing: border-box; overflow-y: auto; box-shadow: -5px 0 20px rgba(0,0,0,0.1); }
        .drawer.open { right: 0; }
        .primary-btn { width: 100%; padding: 18px; background: #1a1a1a; color: #fff; border: none; font-weight: 700; cursor: pointer; border-radius: 4px; margin-top: 20px; text-transform: uppercase; }
        .opt-btn { border: 1px solid #ddd; background: #fff; padding: 4px 8px; font-size: 0.65rem; cursor: pointer; min-width: 30px; }
        .opt-btn.active { background: #000; color: #fff; }
        .btn-buy { width: 100%; background: #000; color: #fff; border: none; padding: 12px; font-weight: 700; cursor: pointer; margin-top: 10px; }
      `}</style>

      <header>
        <div style={{cursor:'pointer', padding: '10px'}} onClick={() => prompt('Acesso:') === '2004' ? setAdminOpen(true) : null}>⚙️</div>
        <h1 className="logo">MABE<span>LLEN</span></h1>
        <div onClick={() => setCartOpen(true)} style={{position:'relative', cursor:'pointer'}}>👜 {cart.length > 0 && <span style={{position:'absolute', top:'-5px', right:'-5px', background:'var(--gold)', color:'#fff', borderRadius:'50%', padding:'2px 6px', fontSize:'10px'}}>{cart.length}</span>}</div>
      </header>

      <nav style={{display:'flex', justifyContent:'center', gap:'20px', padding:'15px'}}>
        {Object.keys(CATEGORIAS_MAP).map(g => (
          <button key={g} style={{background:'none', border:'none', cursor:'pointer', fontWeight: genderFilter === g ? 'bold' : 'normal'}} onClick={() => setGenderFilter(g)}>{g}</button>
        ))}
      </nav>

      <main className="grid">
        {filtered.map(prod => (
          <div key={prod.id} className="card">
            {adminOpen && (
              <button 
                onClick={() => { setEditingId(prod.id); setProductForm(prod); setShowForm(true); }} 
                style={{position:'absolute', zIndex: 10000, margin:'10px', background:'#000', color:'#fff', border:'2px solid #fff', padding:'10px', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}
              >
                EDITAR / EXCLUIR
              </button>
            )}
            <div className="img-container"><ImageCarousel images={prod.fotos} /></div>
            <div style={{padding:'15px', textAlign:'center'}}>
              <p>{prod.nome}</p>
              <p>R$ {Number(prod.preco).toFixed(2)}</p>
              <button className="btn-buy" onClick={() => addToCart(prod)}>{addingId === prod.id ? '✓ ADICIONADO' : 'Adicionar à Bag'}</button>
            </div>
          </div>
        ))}
      </main>

      {/* CARRINHO */}
      <div className={`drawer ${cartOpen ? 'open' : ''}`}>
        <button onClick={() => setCartOpen(false)}>FECHAR</button>
        {cart.map(item => <div key={item.idCarrinho}>{item.nome} - R$ {item.preco}</div>)}
        {cart.length > 0 && <button className="primary-btn" onClick={finalizarPedido}>FINALIZAR</button>}
      </div>

      {/* ADMIN DRAWER */}
      <div className={`drawer ${adminOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <h2>ADMIN</h2>
          <button onClick={() => { setAdminOpen(false); resetForm(); }}>✕</button>
        </div>

        {!showForm ? (
          <div style={{marginTop: '30px'}}>
            <button className="primary-btn" onClick={() => { resetForm(); setShowForm(true); }}>+ NOVO PRODUTO</button>
            <button className="primary-btn" style={{background: '#000'}} onClick={() => setAdminOpen(false)}>
              VER / EDITAR PRODUTOS NO SITE
            </button>
          </div>
        ) : (
          <div style={{marginTop:'20px'}}>
            <input style={{width:'100%', marginBottom:'10px', padding:'10px'}} value={productForm.nome} onChange={e => setProductForm({...productForm, nome: e.target.value})} placeholder="Nome" />
            <input style={{width:'100%', marginBottom:'10px', padding:'10px'}} type="number" value={productForm.preco} onChange={e => setProductForm({...productForm, preco: e.target.value})} placeholder="Preço" />
            <button className="primary-btn" onClick={handleSave}>SALVAR</button>
            {editingId && <button className="primary-btn" style={{background:'red'}} onClick={handleDelete}>EXCLUIR</button>}
            <button onClick={() => setShowForm(false)} style={{width:'100%', marginTop:'10px'}}>VOLTAR</button>
          </div>
        )}
      </div>
    </>
  );
}