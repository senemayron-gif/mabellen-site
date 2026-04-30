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
  
  if (!images || images.length === 0) {
    return (
      <img 
        src="https://via.placeholder.com/600" 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        alt="Sem imagem" 
      />
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img 
        src={images[current]} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        alt="Produto" 
      />
      {images.length > 1 && (
        <>
          <button 
            onClick={() => setCurrent(current > 0 ? current - 1 : images.length - 1)} 
            style={{ position: 'absolute', left: '5px', top: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', transform: 'translateY(-50%)' }}
          >
            ‹
          </button>
          <button 
            onClick={() => setCurrent(current < images.length - 1 ? current + 1 : 0)} 
            style={{ position: 'absolute', right: '5px', top: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', transform: 'translateY(-50%)' }}
          >
            ›
          </button>
          <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', fontSize: '12px', color: '#fff', fontWeight: 'bold', textShadow: '1px 1px 4px #000' }}>
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
  const [formOpen, setFormOpen] = useState(false);
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

  async function fetchProducts() {
    const { data, error } = await supabase.from('produtos').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    if (error) console.error("Erro ao buscar produtos:", error);
  }

  const resetForm = () => {
    setEditingId(null);
    setProductForm({ nome: '', preco: '', genero: 'FEMININO', categoria: 'calcinha', fotos: [], estoque: {}, cores: '', ativo: true });
  };

  const addToCart = (prod: any) => {
    const size = selectedSize[prod.id];
    const color = selectedColor[prod.id] || 'N/A';
    const qty = selectedQty[prod.id] || 1;

    if (!size) return alert("Por favor, selecione um tamanho!");
    if (prod.cores && prod.cores.trim() !== '' && color === 'N/A') return alert("Por favor, selecione uma cor!");

    const itemExistenteIndex = cart.findIndex(item => 
      item.id === prod.id && 
      item.tamanhoEscolhido === size && 
      item.corEscolhida === color
    );

    if (itemExistenteIndex !== -1) {
      const novoCarrinho = [...cart];
      novoCarrinho[itemExistenteIndex].quantidadeEscolhida += qty;
      setCart(novoCarrinho);
    } else {
      const itemCarrinho = { 
        idCarrinho: Date.now(), 
        ...prod, 
        tamanhoEscolhido: size,
        corEscolhida: color,
        quantidadeEscolhida: qty 
      };
      setCart([...cart, itemCarrinho]);
    }

    setSelectedSize({ ...selectedSize, [prod.id]: '' });
    setSelectedColor({ ...selectedColor, [prod.id]: '' });
    setSelectedQty({ ...selectedQty, [prod.id]: 1 });
    setCartOpen(true);
  };

  const removeFromCart = (idCarrinho: number) => {
    setCart(cart.filter(item => item.idCarrinho !== idCarrinho));
  };

  const totalCart = cart.reduce((acc, item) => acc + (item.preco * item.quantidadeEscolhida), 0);

  const finalizarPedido = () => {
    let msg = `*NOVO PEDIDO - MABELLEN*\n\n`;
    cart.forEach(item => {
      msg += `• ${item.quantidadeEscolhida}x ${item.nome} (${item.tamanhoEscolhido} - ${item.corEscolhida}) - R$ ${(item.preco * item.quantidadeEscolhida).toFixed(2)}\n`;
    });
    msg += `\n*TOTAL: R$ ${totalCart.toFixed(2)}*`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`);
  };

  async function handleFileUpload(e: any) {
    try {
      setUploading(true);
      const files = Array.from(e.target.files);
      const newPhotoUrls = [...(productForm.fotos || [])];

      for (const file of files) {
        const f = file as File;
        const fileExt = f.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('mabellen-images').upload(fileName, f);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('mabellen-images').getPublicUrl(fileName);
        newPhotoUrls.push(publicUrl);
      }
      setProductForm({ ...productForm, fotos: newPhotoUrls });
    } catch (error: any) {
      alert("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    try {
      const { id, created_at, ...dadosBase } = productForm;
      const payload = {
        ...dadosBase,
        preco: Number(productForm.preco),
        cores: productForm.cores || '', 
        ativo: productForm.ativo ?? true 
      };

      let res;
      if (editingId) {
        res = await supabase.from('produtos').update(payload).eq('id', editingId);
      } else {
        res = await supabase.from('produtos').insert([payload]);
      }

      if (res.error) throw res.error;

      alert("Produto salvo com sucesso!");
      setFormOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    }
  }

  async function handleDelete(id?: string) {
    const targetId = id || editingId;
    if (!targetId) return;
    if (!confirm("Tem certeza que deseja excluir este produto permanentemente?")) return;

    try {
      const { error } = await supabase.from('produtos').delete().eq('id', targetId);
      if (error) throw error;

      alert("Produto excluído!");
      setFormOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      alert("Erro ao excluir: " + error.message);
    }
  }

  const filtered = products.filter(p => 
    (adminOpen || p.ativo) && p.genero === genderFilter && (subFilter === 'TODOS' || p.categoria === subFilter)
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Montserrat:wght@200;400;700&display=swap');
        :root { --gold: #c9a96e; --bg: #fdfdfd; --text: #1a1a1a; }
        body { margin: 0; font-family: 'Montserrat', sans-serif; background: var(--bg); color: var(--text); }
        header { background: #fff; padding: 15px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 500; }
        .logo { font-family: 'Cinzel', serif; letter-spacing: 8px; font-weight: 700; text-transform: uppercase; margin: 0; font-size: 1.4rem; }
        .logo span { color: var(--gold); }
        
        .bag-container { position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 45px; height: 45px; transition: 0.3s; }
        .bag-container:hover { transform: scale(1.1); }
        .bag-badge { position: absolute; top: 5px; right: 2px; background: var(--gold); color: white; font-size: 10px; font-weight: bold; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

        .nav-main { display: flex; justify-content: center; gap: 20px; padding: 15px; background: #fff; border-bottom: 1px solid #f9f9f9; }
        .sub-nav { display: flex; justify-content: center; gap: 10px; padding: 10px; flex-wrap: wrap; }
        .sub-btn { background: #fff; border: 1px solid #eee; padding: 6px 12px; font-size: 0.6rem; border-radius: 20px; cursor: pointer; color: #666; }
        .sub-btn.active { background: var(--text); color: #fff; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; padding: 20px 5%; }
        .card { background: #fff; border-radius: 4px; border: 1px solid #f0f0f0; position: relative; overflow: hidden; display: flex; flex-direction: column; transition: 0.3s; }
        .img-container { width: 100%; height: 400px; background: #fafafa; position: relative; }
        
        .selector-label { font-size: 0.6rem; color: #999; margin-bottom: 5px; text-transform: uppercase; display: block; font-weight: bold; }
        .options-container { display: flex; justify-content: center; gap: 5px; margin-bottom: 10px; flex-wrap: wrap; }
        .opt-btn { border: 1px solid #ddd; background: #fff; padding: 4px 8px; font-size: 0.65rem; cursor: pointer; min-width: 30px; border-radius: 2px; }
        .opt-btn.active { background: #000; color: #fff; border-color: #000; }
        
        .qty-input { width: 50px; padding: 5px; text-align: center; border: 1px solid #eee; font-size: 0.8rem; margin-left: 5px; }
        .btn-buy { width: 100%; background: #000; color: #fff; border: none; padding: 12px; font-size: 0.7rem; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px; }
        .btn-esgotado { width: 100%; background: #ccc; color: #666; border: none; padding: 12px; font-size: 0.7rem; font-weight: 700; cursor: not-allowed; text-transform: uppercase; margin-top: 10px; }
        .btn-whatsapp { width: 100%; background: #25D366; color: #fff; border: none; padding: 10px; font-size: 0.65rem; font-weight: 700; cursor: pointer; text-transform: uppercase; margin-top: 5px; display: flex; align-items: center; justify-content: center; gap: 5px; text-decoration: none; }

        .drawer { position: fixed; right: -100%; top: 0; width: 100%; max-width: 450px; height: 100%; background: #fff; z-index: 9999; transition: 0.4s; padding: 30px; box-sizing: border-box; overflow-y: auto; box-shadow: -5px 0 20px rgba(0,0,0,0.1); }
        .drawer.open { right: 0; }
        .admin-form label { display: block; font-size: 0.65rem; font-weight: 700; margin: 15px 0 5px; color: #999; text-transform: uppercase; }
        .admin-form input, .admin-form select, .admin-form textarea { width: 100%; padding: 10px; border: 1px solid #eee; border-radius: 4px; box-sizing: border-box; font-family: inherit; }
        .stock-row { display: flex; align-items: center; justify-content: space-between; padding: 8px; border-bottom: 1px solid #f9f9f9; }
        .btn-add-new { position: fixed; bottom: 30px; right: 30px; background: var(--gold); color: #fff; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; border: none; cursor: pointer; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .primary-btn { width: 100%; padding: 18px; background: #1a1a1a; color: #fff; border: none; font-weight: 700; cursor: pointer; border-radius: 4px; margin-top: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .danger-btn { width: 100%; padding: 12px; background: #fff; color: #ff4d4d; border: 1px solid #ff4d4d; font-weight: 700; cursor: pointer; border-radius: 4px; margin-top: 10px; text-transform: uppercase; font-size: 0.7rem; }

        .cart-item { display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #eee; align-items: center; }
        .cart-item img { width: 60px; height: 80px; object-fit: cover; border-radius: 4px; }
      `}</style>

      <header>
        <div style={{cursor:'pointer', padding: '10px'}} onClick={() => prompt('Acesso:') === '2004' ? setAdminOpen(!adminOpen) : null}>⚙️</div>
        <h1 className="logo">MABE<span>LLEN</span></h1>
        
        <div className="bag-container" onClick={() => setCartOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          {cart.length > 0 && <span className="bag-badge">{cart.reduce((a, b) => a + b.quantidadeEscolhida, 0)}</span>}
        </div>
      </header>

      {adminOpen && <button className="btn-add-new" onClick={() => { resetForm(); setFormOpen(true); }}>+</button>}

      <nav className="nav-main">
        {Object.keys(CATEGORIAS_MAP).map(g => (
          <button 
            key={g} 
            style={{background:'none', border:'none', cursor:'pointer', fontWeight: genderFilter === g ? 'bold' : 'normal', color: genderFilter === g ? '#000' : '#ccc', textTransform: 'uppercase', fontSize: '0.7rem'}} 
            onClick={() => { setGenderFilter(g); setSubFilter('TODOS'); }}
          >
            {g.replace('_', ' ')}
          </button>
        ))}
      </nav>

      <div className="sub-nav">
        <button className={`sub-btn ${subFilter === 'TODOS' ? 'active' : ''}`} onClick={() => setSubFilter('TODOS')}>TODOS</button>
        {CATEGORIAS_MAP[genderFilter].map(cat => (
          <button key={cat} className={`sub-btn ${subFilter === cat ? 'active' : ''}`} onClick={() => setSubFilter(cat)}>{cat.toUpperCase()}</button>
        ))}
      </div>

      <main className="grid">
        {filtered.map(prod => {
          const totalEstoque = Object.values(prod.estoque || {}).reduce((a: any, b: any) => a + b, 0);
          const esgotado = totalEstoque === 0;

          return (
            <div key={prod.id} className="card" style={{ opacity: esgotado ? 0.7 : 1 }}>
              {adminOpen && (
                <>
                  <button onClick={() => { setEditingId(prod.id); setProductForm(prod); setFormOpen(true); }} style={{position:'absolute', zIndex:10, top:'10px', left:'10px', background:'#000', color:'#fff', border:'none', padding:'6px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'0.7rem', fontWeight:'bold'}}>EDITAR</button>
                  <button onClick={() => handleDelete(prod.id)} style={{position:'absolute', zIndex:10, top:'10px', right:'10px', background:'rgba(255,0,0,0.8)', color:'#fff', border:'none', padding:'6px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'0.7rem', fontWeight:'bold'}}>APAGAR</button>
                </>
              )}
              <div className="img-container">
                <ImageCarousel images={prod.fotos} />
                {esgotado && (
                  <div style={{position:'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.9)', padding: '10px 20px', fontWeight: 'bold', border: '1px solid #000', letterSpacing: '2px', fontSize: '0.8rem'}}>ESGOTADO</div>
                )}
              </div>
              <div style={{padding: '15px', textAlign: 'center'}}>
                <p style={{fontSize: '0.75rem', textTransform: 'uppercase', margin: '0 0 5px', color: '#666'}}>{prod.nome}</p>
                <p style={{fontWeight: 'bold', color: 'var(--gold)', margin: '0 0 10px'}}>R$ {Number(prod.preco).toFixed(2)}</p>

                {!esgotado && (
                  <>
                    <span className="selector-label">Tamanho</span>
                    <div className="options-container">
                      {TAMANHOS_OPCOES.filter(t => (prod.estoque?.[t] || 0) > 0).map(t => (
                          <button 
                            key={t}
                            className={`opt-btn ${selectedSize[prod.id] === t ? 'active' : ''}`}
                            onClick={() => setSelectedSize({...selectedSize, [prod.id]: t})}
                          >
                            {t}
                          </button>
                      ))}
                    </div>

                    {prod.cores && prod.cores.trim() !== '' && (
                      <>
                        <span className="selector-label">Cor</span>
                        <div className="options-container">
                          {prod.cores.split(',').map((c: string) => (
                            <button 
                              key={c}
                              className={`opt-btn ${selectedColor[prod.id] === c.trim() ? 'active' : ''}`}
                              onClick={() => setSelectedColor({...selectedColor, [prod.id]: c.trim()})}
                            >
                              {c.trim()}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {selectedSize[prod.id] && (
                      <div style={{fontSize:'0.65rem', marginBottom:'10px'}}>
                        Qtd: 
                        <input 
                          type="number" 
                          className="qty-input"
                          min="1" 
                          max={prod.estoque[selectedSize[prod.id]]} 
                          value={selectedQty[prod.id] || 1}
                          onChange={(e) => setSelectedQty({...selectedQty, [prod.id]: parseInt(e.target.value)})}
                        />
                      </div>
                    )}
                  </>
                )}

                {esgotado ? (
                  <button className="btn-esgotado">Esgotado</button>
                ) : (
                  <button className="btn-buy" onClick={() => addToCart(prod)}>Adicionar à Bag</button>
                )}
                
                <button className="btn-whatsapp" onClick={() => window.open(`https://wa.me/${WHATSAPP_NUM}?text=Olá! Gostaria de saber mais sobre o produto: ${prod.nome}`)}>
                  <span>💬</span> Perguntar no Whats
                </button>
              </div>
            </div>
          );
        })}
      </main>

      {/* CARRINHO */}
      <div className={`drawer ${cartOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <h2 style={{fontFamily: 'Cinzel', fontSize: '1.2rem', margin:0}}>MINHA BAG</h2>
          <button onClick={() => setCartOpen(false)} style={{background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer'}}>✕</button>
        </div>

        {cart.length === 0 ? (
          <p style={{textAlign:'center', marginTop:'50px', color:'#999', fontSize:'0.8rem'}}>Sua bag está vazia.</p>
        ) : (
          <>
            <div style={{marginTop:'20px'}}>
              {cart.map((item) => (
                <div key={item.idCarrinho} className="cart-item">
                  <img src={item.fotos?.[0]} alt="" />
                  <div style={{flex:1}}>
                    <p style={{fontSize:'0.7rem', fontWeight:'bold', margin:0, textTransform:'uppercase'}}>{item.nome}</p>
                    <p style={{fontSize:'0.65rem', color:'#666', margin:'3px 0'}}>
                      Tam: {item.tamanhoEscolhido} | Cor: {item.corEscolhida} | Qtd: {item.quantidadeEscolhida}
                    </p>
                    <p style={{fontSize:'0.75rem', fontWeight:'bold', color:'var(--gold)', margin:0}}>R$ {(item.preco * item.quantidadeEscolhida).toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.idCarrinho)} style={{background:'none', border:'none', color:'red', cursor:'pointer', fontSize:'0.7rem'}}>REMOVER</button>
                </div>
              ))}
            </div>

            <div style={{marginTop:'30px', borderTop:'2px solid #1a1a1a', paddingTop:'20px'}}>
              <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'1rem'}}>
                <span>TOTAL:</span>
                <span>R$ {totalCart.toFixed(2)}</span>
              </div>
              <button className="primary-btn" onClick={finalizarPedido}>FINALIZAR PEDIDO VIA WHATSAPP</button>
              <button onClick={() => setCartOpen(false)} style={{width:'100%', padding:'15px', background:'none', border:'none', color:'#999', cursor:'pointer', fontSize:'0.7rem'}}>CONTINUAR COMPRANDO</button>
            </div>
          </>
        )}
      </div>

      {/* ADMIN FORMULÁRIO */}
      <div className={`drawer ${formOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px'}}>
          <h2 style={{fontFamily: 'Cinzel', fontSize: '1.2rem', margin:0}}>{editingId ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}</h2>
          <button onClick={() => { setFormOpen(false); resetForm(); }} style={{background:'#f0f0f0', border:'none', padding:'5px 15px', borderRadius:'20px', cursor:'pointer', fontSize:'0.7rem', fontWeight:'bold'}}>FECHAR</button>
        </div>

        <div className="admin-form">
          <label>Nome do Produto</label>
          <input value={productForm.nome} onChange={e => setProductForm({...productForm, nome: e.target.value})} placeholder="Ex: Conjunto Renda Luxo" />
          
          <label>Preço (R$)</label>
          <input type="number" value={productForm.preco} onChange={e => setProductForm({...productForm, preco: e.target.value})} placeholder="0.00" />

          <label>Cores (Separadas por vírgula)</label>
          <input value={productForm.cores} onChange={e => setProductForm({...productForm, cores: e.target.value})} placeholder="Ex: Preto, Branco, Vermelho" />

          <label>Imagens ({productForm.fotos?.length || 0})</label>
          <div style={{padding:'20px', border:'2px dashed #ddd', textAlign:'center', cursor:'pointer', borderRadius: '8px'}} onClick={() => !uploading && document.getElementById('file-input')?.click()}>
            {uploading ? "SUBINDO FOTOS..." : "📸 CLIQUE PARA ADICIONAR FOTOS"}
            <input id="file-input" type="file" multiple accept="image/*" hidden onChange={handleFileUpload} />
          </div>
          
          <div style={{display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap'}}>
            {productForm.fotos?.map((url: string, i: number) => (
              <div key={i} style={{position:'relative', width: '60px', height: '60px'}}>
                <img src={url} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'4px'}} alt="" />
                <button 
                  onClick={() => setProductForm({...productForm, fotos: productForm.fotos.filter((_:any,idx:any) => idx !== i)})} 
                  style={{position:'absolute', top:'-5px', right:'-5px', background:'red', color:'#fff', border:'none', borderRadius:'50%', width:'20px', height:'20px', cursor:'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}
                >X</button>
              </div>
            ))}
          </div>

          <label>Gênero</label>
          <select value={productForm.genero} onChange={e => setProductForm({...productForm, genero: e.target.value, categoria: CATEGORIAS_MAP[e.target.value][0]})}>
            {Object.keys(CATEGORIAS_MAP).map(g => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
          </select>

          <label>Categoria</label>
          <select value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})}>
            {CATEGORIAS_MAP[productForm.genero].map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
          </select>

          <label>Estoque por Tamanho</label>
          <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'8px', border: '1px solid #eee'}}>
            {TAMANHOS_OPCOES.map(t => (
              <div key={t} className="stock-row">
                <span style={{fontSize:'0.7rem', fontWeight:'bold'}}>{t}</span>
                <input type="number" style={{width:'70px', padding:'5px'}} 
                  value={productForm.estoque?.[t] || 0} 
                  onChange={e => setProductForm({...productForm, estoque: {...productForm.estoque, [t]: parseInt(e.target.value) || 0}})} 
                />
              </div>
            ))}
          </div>

          <button className="primary-btn" onClick={handleSave}>
            {editingId ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR NO SITE'}
          </button>

          {editingId && (
            <button className="danger-btn" onClick={() => handleDelete()}>
              EXCLUIR PRODUTO DO SITE
            </button>
          )}
          
          <button onClick={() => { setFormOpen(false); resetForm(); }} style={{width:'100%', padding: '15px', background: 'none', border: 'none', color: '#999', marginTop: '10px', cursor:'pointer', fontSize: '0.8rem', fontWeight: 'bold'}}>CANCELAR</button>
        </div>
      </div>

      <a href={`https://wa.me/${WHATSAPP_NUM}`} target="_blank" rel="noopener noreferrer" style={{position:'fixed', bottom:'30px', left:'30px', background:'#25D366', color:'#fff', width:'50px', height:'50px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', textDecoration:'none', boxShadow:'0 4px 10px rgba(0,0,0,0.2)', zIndex:1000}}>
        💬
      </a>
    </>
  );
}