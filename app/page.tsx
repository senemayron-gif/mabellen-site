'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  if (!images || images.length === 0) {
    return (
      <img src="https://via.placeholder.com/600" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Sem imagem" />
    );
  }
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img src={images[current]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Produto" />
      {images.length > 1 && (
        <>
          <button onClick={() => setCurrent(current > 0 ? current - 1 : images.length - 1)} style={{ position: 'absolute', left: '5px', top: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', transform: 'translateY(-50%)' }}>‹</button>
          <button onClick={() => setCurrent(current < images.length - 1 ? current + 1 : 0)} style={{ position: 'absolute', right: '5px', top: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', transform: 'translateY(-50%)' }}>›</button>
          <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', fontSize: '12px', color: '#fff', fontWeight: 'bold', textShadow: '1px 1px 4px #000' }}>{current + 1} / {images.length}</div>
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
  const [productForm, setProductForm] = useState<any>({ nome: '', preco: '', genero: 'FEMININO', categoria: 'calcinha', fotos: [], estoque: {}, cores: '', ativo: true });

  useEffect(() => { fetchProducts(); }, []);

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
    if (!size) return alert("Selecione o tamanho!");
    if (prod.cores?.trim() && !color) return alert("Selecione a cor!");
    setCart([...cart, { idCarrinho: Date.now(), ...prod, tamanhoEscolhido: size, corEscolhida: color || 'N/A', quantidadeEscolhida: qty }]);
    setCartOpen(true);
  };

  async function handleFileUpload(e: any) {
    setUploading(true);
    const files = Array.from(e.target.files);
    const newUrls = [...(productForm.fotos || [])];
    for (const file of files) {
      const f = file as File;
      const name = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await supabase.storage.from('mabellen-images').upload(name, f);
      const { data } = supabase.storage.from('mabellen-images').getPublicUrl(name);
      newUrls.push(data.publicUrl);
    }
    setProductForm({ ...productForm, fotos: newUrls });
    setUploading(false);
  }

  async function handleSave() {
    const { id, created_at, ...dados } = productForm;
    const payload = { ...dados, preco: Number(productForm.preco) };
    if (editingId) await supabase.from('produtos').update(payload).eq('id', editingId);
    else await supabase.from('produtos').insert([payload]);
    setAdminOpen(false); resetForm(); fetchProducts();
  }

  const filtered = products.filter(p => (adminOpen || p.ativo) && p.genero === genderFilter && (subFilter === 'TODOS' || p.categoria === subFilter));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Montserrat:wght@200;400;700&display=swap');
        :root { --gold: #c9a96e; --bg: #fdfdfd; --text: #1a1a1a; }
        body { margin: 0; font-family: 'Montserrat', sans-serif; background: var(--bg); overflow-x: hidden; }
        header { background: #fff; padding: 10px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 1000; height: 60px; box-sizing: border-box; }
        .logo { font-family: 'Cinzel', serif; letter-spacing: 4px; font-weight: 700; text-transform: uppercase; font-size: 1.1rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; padding: 15px; }
        @media (min-width: 768px) { .grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; } .logo { font-size: 1.4rem; letter-spacing: 8px; } }
        .card { background: #fff; border: 1px solid #f0f0f0; display: flex; flex-direction: column; }
        .img-container { width: 100%; height: 220px; background: #fafafa; position: relative; }
        @media (min-width: 768px) { .img-container { height: 400px; } }
        .opt-btn { border: 1px solid #ddd; background: #fff; padding: 8px; font-size: 0.7rem; cursor: pointer; min-width: 35px; margin: 2px; }
        .opt-btn.active { background: #000; color: #fff; }
        .drawer { position: fixed; right: -105%; top: 0; width: 100%; max-width: 450px; height: 100%; background: #fff; z-index: 2000; transition: 0.4s; padding: 20px; box-sizing: border-box; overflow-y: auto; display: flex; flex-direction: column; }
        .drawer.open { right: 0; }
        .admin-form input, .admin-form select { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #eee; font-size: 16px; /* Evita zoom no iPhone */ }
        .btn-add-new { position: fixed; bottom: 90px; right: 20px; background: var(--gold); color: #fff; width: 55px; height: 55px; border-radius: 50%; border: none; font-size: 24px; z-index: 1500; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .primary-btn { width: 100%; padding: 15px; background: #1a1a1a; color: #fff; border: none; font-weight: 700; margin-top: 10px; cursor: pointer; }
      `}</style>

      <header>
        <div style={{padding: '10px'}} onClick={() => prompt('Acesso:') === '2004' ? setAdminOpen(true) : null}>⚙️</div>
        <h1 className="logo">MABE<span>LLEN</span></h1>
        <div onClick={() => setCartOpen(true)} style={{position: 'relative'}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          {cart.length > 0 && <span style={{position:'absolute', top:'-5px', right:'-5px', background:'var(--gold)', color:'white', fontSize:'10px', width:'18px', height:'18px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>{cart.length}</span>}
        </div>
      </header>

      {adminOpen && <button className="btn-add-new" onClick={() => { resetForm(); setAdminOpen(true); }}>+</button>}

      <nav style={{display:'flex', overflowX:'auto', gap:'15px', padding:'15px', background:'#fff', borderBottom:'1px solid #eee'}}>
        {Object.keys(CATEGORIAS_MAP).map(g => (
          <button key={g} style={{whiteSpace:'nowrap', border:'none', background:'none', fontWeight: genderFilter === g ? 'bold' : 'normal', fontSize:'0.7rem'}} onClick={() => { setGenderFilter(g); setSubFilter('TODOS'); }}>{g.replace('_', ' ')}</button>
        ))}
      </nav>

      <div style={{display:'flex', overflowX:'auto', gap:'8px', padding:'10px'}}>
        <button style={{padding:'6px 12px', borderRadius:'20px', fontSize:'0.6rem', border:'1px solid #eee', background: subFilter === 'TODOS' ? '#000' : '#fff', color: subFilter === 'TODOS' ? '#fff' : '#000'}} onClick={() => setSubFilter('TODOS')}>TODOS</button>
        {CATEGORIAS_MAP[genderFilter].map(cat => (
          <button key={cat} style={{padding:'6px 12px', borderRadius:'20px', fontSize:'0.6rem', border:'1px solid #eee', background: subFilter === cat ? '#000' : '#fff', color: subFilter === cat ? '#fff' : '#000'}} onClick={() => setSubFilter(cat)}>{cat.toUpperCase()}</button>
        ))}
      </div>

      <main className="grid">
        {filtered.map(prod => (
          <div key={prod.id} className="card">
            <div className="img-container">
              <ImageCarousel images={prod.fotos} />
              {adminOpen && <button onClick={() => { setEditingId(prod.id); setProductForm(prod); setAdminOpen(true); }} style={{position:'absolute', top:5, right:5, background:'#000', color:'#fff', fontSize:'0.6rem', padding:'4px 8px'}}>EDITAR</button>}
            </div>
            <div style={{padding: '10px', textAlign: 'center'}}>
              <p style={{fontSize: '0.7rem', margin: '0 0 5px'}}>{prod.nome}</p>
              <p style={{fontWeight: 'bold', color: 'var(--gold)', fontSize:'0.9rem'}}>R$ {Number(prod.preco).toFixed(2)}</p>
              <div style={{margin: '10px 0'}}>
                {TAMANHOS_OPCOES.filter(t => (prod.estoque?.[t] || 0) > 0).map(t => (
                  <button key={t} className={`opt-btn ${selectedSize[prod.id] === t ? 'active' : ''}`} onClick={() => setSelectedSize({...selectedSize, [prod.id]: t})}>{t}</button>
                ))}
              </div>
              <button className="primary-btn" style={{fontSize:'0.7rem', padding:'10px'}} onClick={() => addToCart(prod)}>Adicionar</button>
            </div>
          </div>
        ))}
      </main>

      {/* ADMIN DRAWER */}
      <div className={`drawer ${adminOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
          <h2 style={{fontSize:'1rem'}}>ADMINISTRAÇÃO</h2>
          <button onClick={() => {setAdminOpen(false); resetForm();}}>✕</button>
        </div>
        <div className="admin-form" style={{flex:1}}>
          <label style={{fontSize:'0.7rem'}}>NOME</label>
          <input value={productForm.nome} onChange={e => setProductForm({...productForm, nome: e.target.value})} />
          
          <label style={{fontSize:'0.7rem'}}>GÊNERO</label>
          <select value={productForm.genero} onChange={e => setProductForm({...productForm, genero: e.target.value, categoria: CATEGORIAS_MAP[e.target.value][0]})}>
            {Object.keys(CATEGORIAS_MAP).map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <label style={{fontSize:'0.7rem'}}>CATEGORIA</label>
          <select value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})}>
            {CATEGORIAS_MAP[productForm.genero].map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label style={{fontSize:'0.7rem'}}>PREÇO</label>
          <input type="number" inputMode="decimal" value={productForm.preco} onChange={e => setProductForm({...productForm, preco: e.target.value})} />
          <label style={{fontSize:'0.7rem'}}>CORES (Sép. por vírgula)</label>
          <input value={productForm.cores} onChange={e => setProductForm({...productForm, cores: e.target.value})} />
          
          <div onClick={() => document.getElementById('file-mobile')?.click()} style={{padding:20, border:'2px dashed #ccc', textAlign:'center', margin:'10px 0'}}>
            {uploading ? "SUBINDO..." : "📸 ADICIONAR FOTOS"}
            <input id="file-mobile" type="file" multiple hidden onChange={handleFileUpload} />
          </div>

          <label style={{fontSize:'0.7rem'}}>ESTOQUE</label>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, background:'#f9f9f9', padding:10}}>
            {TAMANHOS_OPCOES.map(t => (
              <div key={t} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontSize:'0.7rem'}}>{t}:</span>
                <input type="number" inputMode="numeric" style={{width:50, padding:5}} value={productForm.estoque?.[t] || 0} onChange={e => setProductForm({...productForm, estoque: {...productForm.estoque, [t]: parseInt(e.target.value) || 0}})} />
              </div>
            ))}
          </div>
          <button className="primary-btn" onClick={handleSave} style={{background:'var(--gold)', marginTop:20}}>SALVAR PRODUTO</button>
          {editingId && <button onClick={async () => { if(confirm('Excluir?')) { await supabase.from('produtos').delete().eq('id', editingId); fetchProducts(); setAdminOpen(false); } }} style={{width:'100%', color:'red', background:'none', border:'none', marginTop:15, fontSize:'0.7rem'}}>EXCLUIR PERMANENTEMENTE</button>}
        </div>
      </div>

      {/* CARRINHO DRAWER */}
      <div className={`drawer ${cartOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:15}}>
          <h2 style={{fontSize:'1rem'}}>SUA BAG</h2>
          <button onClick={() => setCartOpen(false)}>✕</button>
        </div>
        <div style={{flex:1, marginTop:20}}>
          {cart.map(item => (
            <div key={item.idCarrinho} style={{display:'flex', gap:10, marginBottom:15, borderBottom:'1px solid #f9f9f9', paddingBottom:10}}>
              <img src={item.fotos?.[0]} style={{width:50, height:70, objectFit:'cover'}} />
              <div style={{flex:1}}>
                <p style={{fontSize:'0.7rem', fontWeight:'bold', margin:0}}>{item.nome}</p>
                <p style={{fontSize:'0.6rem', color:'#666'}}>{item.tamanhoEscolhido} | R$ {item.preco}</p>
              </div>
              <button onClick={() => setCart(cart.filter(c => c.idCarrinho !== item.idCarrinho))} style={{border:'none', background:'none', color:'red', fontSize:'0.6rem'}}>Remover</button>
            </div>
          ))}
        </div>
        <div style={{paddingTop:20, borderTop:'2px solid #000'}}>
          <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', marginBottom:15}}>
            <span>TOTAL</span>
            <span>R$ {cart.reduce((acc, i) => acc + (i.preco * (i.quantidadeEscolhida || 1)), 0).toFixed(2)}</span>
          </div>
          <button className="primary-btn" onClick={() => {
             let msg = `*NOVO PEDIDO*\n`;
             cart.forEach(i => msg += `- ${i.nome} (${i.tamanhoEscolhido})\n`);
             window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`);
          }}>FINALIZAR NO WHATSAPP</button>
        </div>
      </div>

      <a href={`https://wa.me/${WHATSAPP_NUM}`} target="_blank" style={{position:'fixed', bottom:'20px', left:'20px', background:'#25D366', color:'#fff', width:50, height:50, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, textDecoration:'none'}}>💬</a>
    </>
  );
}