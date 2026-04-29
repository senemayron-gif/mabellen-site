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
  if (!images || images.length === 0) return <img src="https://via.placeholder.com/600" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Sem imagem" />;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#fff' }}>
      <img src={images[current]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Produto" />
      {images.length > 1 && (
        <>
          <button onClick={() => setCurrent(current > 0 ? current - 1 : images.length - 1)} style={{ position: 'absolute', left: '5px', top: '50%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', transform: 'translateY(-50%)' }}>‹</button>
          <button onClick={() => setCurrent(current < images.length - 1 ? current + 1 : 0)} style={{ position: 'absolute', right: '5px', top: '50%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', transform: 'translateY(-50%)' }}>›</button>
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
  const [isAdminMode, setIsAdminMode] = useState(false); // NOVO: Controle persistente do modo admin

  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<Record<string, string>>({});
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});

  const [productForm, setProductForm] = useState<any>({
    nome: '', preco: '', genero: 'FEMININO', categoria: 'calcinha', fotos: [], estoque: {}, cores: '', ativo: true
  });

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  }

  const resetForm = () => {
    setEditingId(null);
    setProductForm({ nome: '', preco: '', genero: 'FEMININO', categoria: 'calcinha', fotos: [], estoque: {}, cores: '', ativo: true });
    setShowForm(false);
  };

  async function handleFileUpload(e: any) {
    setUploading(true);
    const files = Array.from(e.target.files);
    const urls = [...(productForm.fotos || [])];
    for (const file of files) {
      const f = file as File;
      const name = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await supabase.storage.from('mabellen-images').upload(name, f);
      const { data } = supabase.storage.from('mabellen-images').getPublicUrl(name);
      urls.push(data.publicUrl);
    }
    setProductForm({ ...productForm, fotos: urls });
    setUploading(false);
  }

  async function handleSave() {
    const { id, created_at, ...payload } = productForm;
    payload.preco = Number(payload.preco);
    if (editingId) await supabase.from('produtos').update(payload).eq('id', editingId);
    else await supabase.from('produtos').insert([payload]);
    alert("Salvo!");
    setAdminOpen(false);
    resetForm();
    fetchProducts();
  }

  async function handleDelete() {
    if (!confirm("Excluir para sempre?")) return;
    await supabase.from('produtos').delete().eq('id', editingId);
    setAdminOpen(false);
    resetForm();
    fetchProducts();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Montserrat:wght@400;700&display=swap');
        body { margin: 0; font-family: 'Montserrat', sans-serif; background: #fdfdfd; }
        header { background: #fff; padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; sticky: top; z-index: 100; }
        .logo { font-family: 'Cinzel', serif; letter-spacing: 5px; font-size: 1.2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 20px; }
        .card { background: #fff; border: 1px solid #eee; position: relative; }
        /* AJUSTE MOBILE: Botão Editar mais visível */
        .btn-edit-admin { position: absolute; top: 10px; left: 10px; z-index: 90; background: #000; color: #fff; border: none; padding: 8px 15px; border-radius: 4px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
        .drawer { position: fixed; right: -100%; top: 0; width: 100%; max-width: 450px; height: 100%; background: #fff; z-index: 2000; transition: 0.3s; padding: 20px; box-sizing: border-box; overflow-y: auto; box-shadow: -5px 0 15px rgba(0,0,0,0.1); }
        .drawer.open { right: 0; }
        .opt-btn { border: 1px solid #ddd; background: #fff; padding: 5px 10px; margin: 2px; cursor: pointer; }
        .opt-btn.active { background: #000; color: #fff; }
        .primary-btn { width: 100%; padding: 15px; background: #000; color: #fff; border: none; font-weight: bold; cursor: pointer; margin-top: 10px; }
      `}</style>

      <header>
        <div onClick={() => { if(prompt('Senha:') === '2004') { setIsAdminMode(true); setAdminOpen(true); }}}>⚙️</div>
        <h1 className="logo">MABELLEN</h1>
        <div onClick={() => setCartOpen(true)}>👜 ({cart.length})</div>
      </header>

      <main className="grid">
        {products.filter(p => p.genero === genderFilter).map(prod => (
          <div key={prod.id} className="card">
            {/* BOTÃO QUE TAVA TAMPADO: Agora garantido por cima */}
            {isAdminMode && (
              <button className="btn-edit-admin" onClick={() => { setEditingId(prod.id); setProductForm(prod); setShowForm(true); setAdminOpen(true); }}>
                EDITAR / EXCLUIR
              </button>
            )}
            <div style={{height: '350px'}}><ImageCarousel images={prod.fotos} /></div>
            <div style={{padding: '10px', textAlign: 'center'}}>
              <p>{prod.nome}</p>
              <p>R$ {Number(prod.preco).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </main>

      {/* PAINEL ADMIN CORRIGIDO */}
      <div className={`drawer ${adminOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
          <h2 style={{margin:0}}>ADMIN</h2>
          <button onClick={() => setAdminOpen(false)}>✕</button>
        </div>

        {!showForm ? (
          <div style={{marginTop:'30px'}}>
            <button className="primary-btn" style={{background: '#c9a96e'}} onClick={() => { resetForm(); setShowForm(true); }}>+ CADASTRAR NOVO PRODUTO</button>
            
            {/* CORREÇÃO AQUI: Fecha o painel para o usuário ver os botões "EDITAR" no site */}
            <button className="primary-btn" onClick={() => setAdminOpen(false)}>
              VER PRODUTOS NO SITE (PARA EDITAR/EXCLUIR)
            </button>

            <button className="primary-btn" style={{background: '#666'}} onClick={() => { setIsAdminMode(false); setAdminOpen(false); }}>SAIR DO MODO ADMIN</button>
          </div>
        ) : (
          <div style={{marginTop:'20px'}}>
            <h3>{editingId ? 'Editando Produto' : 'Novo Produto'}</h3>
            <input style={{width:'100%', padding:'10px', marginBottom:'10px'}} value={productForm.nome} onChange={e => setProductForm({...productForm, nome: e.target.value})} placeholder="Nome" />
            <input style={{width:'100%', padding:'10px', marginBottom:'10px'}} type="number" value={productForm.preco} onChange={e => setProductForm({...productForm, preco: e.target.value})} placeholder="Preço" />
            <input type="file" multiple onChange={handleFileUpload} />
            
            <button className="primary-btn" onClick={handleSave}>SALVAR</button>
            {editingId && <button className="primary-btn" style={{background:'red'}} onClick={handleDelete}>EXCLUIR PRODUTO</button>}
            <button style={{width:'100%', marginTop:'10px', border:'none', background:'none'}} onClick={() => setShowForm(false)}>VOLTAR AO MENU ADMIN</button>
          </div>
        )}
      </div>
    </>
  );
}