'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ Suas credenciais do Supabase
const SUPABASE_URL = 'https://hhzqgrnuedzabacarjoi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bAaKr5Q5NR576NQSlTOD7w_eA0Beql8';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WHATSAPP_NUM = '554497162755'; // Maringá/PR

export default function DocesDaRosaSite() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); 
  const [genderFilter, setGenderFilter] = useState('DIARIO'); 
  const [subFilter, setSubFilter] = useState('bolo no pote');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [dataEncomenda, setDataEncomenda] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});

  const categoriasMap: Record<string, string[]> = {
    DIARIO: ['bolo no pote', 'copo da felicidade', 'docinhos individuais'],
    ENCOMENDAS: ['bolos festivos', 'cento de docinhos', 'tortas inteiras', 'kits presente']
  };

  const [productForm, setProductForm] = useState<any>({
    nome: '', preco: '', genero: 'DIARIO', categoria: 'bolo no pote', fotos: [], descricao: '', ativo: true
  });

  const fetchData = async () => {
    const { data, error } = await supabase.from('produtos_doces').select('*');
    if (!error && data) {
      const listaLimpa = data.filter((item: any) => 
        item.id !== 'config_banner_principal' && 
        item.genero !== 'CONFIG' && 
        item.nome
      );
      setProducts(listaLimpa);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos_doces' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setProductForm({ nome: '', preco: '', genero: 'DIARIO', categoria: 'bolo no pote', fotos: [], descricao: '', ativo: true });
  };

  const changeQty = (prodId: string, delta: number) => {
    const current = selectedQty[prodId] || 1;
    const next = current + delta;
    if (next < 1) return;
    setSelectedQty({ ...selectedQty, [prodId]: next });
  };

  const nextImage = (prodId: string, totalFotos: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = currentImageIndex[prodId] || 0;
    const next = (current + 1) % totalFotos;
    setCurrentImageIndex({ ...currentImageIndex, [prodId]: next });
  };

  const prevImage = (prodId: string, totalFotos: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = currentImageIndex[prodId] || 0;
    const prev = (current - 1 + totalFotos) % totalFotos;
    setCurrentImageIndex({ ...currentImageIndex, [prodId]: prev });
  };

  const addToCart = (prod: any) => {
    try {
      const qty = selectedQty[prod.id] || 1;
      const fotoPrincipal = prod.fotos?.[currentImageIndex[prod.id] || 0] || prod.fotos?.[0] || '';

      const itemExistenteIndex = cart.findIndex(item => item.id === prod.id);

      if (itemExistenteIndex !== -1) {
        const novoCarrinho = [...cart];
        novoCarrinho[itemExistenteIndex].quantidadeEscolhida += qty;
        setCart(novoCarrinho);
      } else {
        const itemCarrinho = { 
          idCarrinho: Date.now() + Math.random(), 
          id: prod.id,
          nome: prod.nome,
          preco: Number(prod.preco) || 0,
          genero: prod.genero,
          fotoEscolhida: fotoPrincipal,
          quantidadeEscolhida: qty,
          selecionado: true
        };
        setCart([...cart, itemCarrinho]);
      }

      setSelectedQty({ ...selectedQty, [prod.id]: 1 });
      setCartOpen(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar à sacola.");
    }
  };

  const removeFromCart = (idCarrinho: number) => {
    setCart(cart.filter(item => item.idCarrinho !== idCarrinho));
  };

  const totalCart = cart.reduce((acc, item) => 
    item.selecionado ? acc + (item.preco * item.quantidadeEscolhida) : acc
  , 0);

  const finalizarPedido = () => {
    const itensSelecionados = cart.filter(item => item.selecionado);
    if (itensSelecionados.length === 0) return alert("Selecione ao menos um doce na sua sacola!");

    const temEncomenda = genderFilter === 'ENCOMENDAS' || itensSelecionados.some(i => i.genero === 'ENCOMENDAS');
    if (temEncomenda && !dataEncomenda) {
      return alert("Por favor, informe a Data e Hora desejada para a sua encomenda!");
    }

    let msg = `*NOVO PEDIDO - DOCES DA ROSA* 🌸\n\n`;
    itensSelecionados.forEach(item => {
      msg += `• ${item.quantidadeEscolhida}x ${item.nome} - R$ ${(item.preco * item.quantidadeEscolhida).toFixed(2)}\n`;
    });

    if (temEncomenda && dataEncomenda) {
      const dataFormatada = new Date(dataEncomenda).toLocaleString('pt-BR');
      msg += `\n📅 *Data/Hora para Encomenda:* ${dataFormatada}\n`;
    }

    msg += `\n*TOTAL DO PEDIDO: R$ ${totalCart.toFixed(2)}*\n\n_Gostaria de combinar a entrega/retirada em Maringá!_`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`);
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProductForm((prev: any) => ({
            ...prev,
            fotos: [...(prev.fotos || []), dataUrl]
          }));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  async function handleSave() {
    if (!productForm.nome.trim()) return alert("Digite o nome do doce!");

    const dadosSalvar = {
      id: editingId ? editingId : Date.now().toString(),
      nome: productForm.nome.trim(),
      preco: Number(productForm.preco) || 0,
      genero: productForm.genero,
      categoria: productForm.categoria,
      fotos: productForm.fotos || [],
      descricao: productForm.descricao || '',
      ativo: true
    };

    const { error } = await supabase.from('produtos_doces').upsert(dadosSalvar);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      alert("Doce salvo com sucesso!");
      setFormOpen(false);
      resetForm();
      fetchData();
    }
  }

  async function handleDelete(id?: string) {
    const targetId = id || editingId;
    if (!targetId) return;
    if (!confirm("Deseja realmente excluir este doce?")) return;

    const { error } = await supabase.from('produtos_doces').delete().eq('id', targetId);

    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      setFormOpen(false);
      resetForm();
      fetchData();
    }
  }

  const filtered = products.filter(p => 
    p.genero === genderFilter && (subFilter === '' || p.categoria === subFilter)
  );

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#fff5f8', minHeight: '100vh', color: '#4a202c', paddingBottom: '60px' }}>
      <header style={{ background: 'rgba(255,255,255,0.95)', padding: '15px 6%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ffd1dc', position: 'sticky', top: 0, zIndex: 500 }}>
        <button onClick={() => { if(prompt('Senha:') === '2004') setAdminOpen(!adminOpen); }} style={{ background: '#4a202c', color: '#ffd700', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem' }}>🧁</button>
        <div onClick={() => setCartOpen(true)} style={{ background: '#ff4da6', color: '#fff', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
          👜 Sacola ({cart.reduce((a, b) => a + b.quantidadeEscolhida, 0)})
        </div>
      </header>

      <div style={{ textAlign: 'center', padding: '40px 20px', background: 'linear-gradient(135deg, #fff0f5 0%, #ffe0e9 100%)', borderBottom: '2px solid #ffd1dc' }}>
        <span style={{ background: '#ff1493', color: '#fff', padding: '4px 12px', fontSize: '0.7rem', borderRadius: '15px', fontWeight: 'bold' }}>MARINGÁ / PR</span>
        <h1 style={{ fontFamily: 'Great Vibes, cursive', fontSize: '4rem', color: '#ff1493', margin: '10px 0 0 0' }}>Doces da Rosa</h1>
        <p style={{ fontSize: '0.9rem', color: '#4a202c', fontWeight: 500 }}>Doces irresistíveis feitos com muito carinho!</p>
      </div>

      {adminOpen && <button onClick={() => { resetForm(); setFormOpen(true); }} style={{ position: 'fixed', bottom: '20px', left: '20px', background: '#ff1493', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', border: 'none', fontSize: '24px', cursor: 'pointer', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>+</button>}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '15px', background: '#fff' }}>
        {Object.keys(categoriasMap).map(g => (
          <button key={g} onClick={() => { setGenderFilter(g); setSubFilter(categoriasMap[g][0]); }} style={{ background: 'none', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', color: genderFilter === g ? '#ff1493' : '#9c6c7c', borderBottom: genderFilter === g ? '3px solid #ff1493' : 'none', paddingBottom: '5px' }}>
            {g === 'DIARIO' ? '🧁 Disponíveis Hoje' : '📅 Encomendas'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px', flexWrap: 'wrap' }}>
        {categoriasMap[genderFilter]?.map(cat => (
          <button key={cat} onClick={() => setSubFilter(cat)} style={{ background: subFilter === cat ? '#ff4da6' : '#fff', color: subFilter === cat ? '#fff' : '#4a202c', border: '1.5px solid #ffd1dc', padding: '6px 14px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '15px', cursor: 'pointer' }}>
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px', padding: '30px 6%', maxWidth: '1200px', margin: '0 auto' }}>
        {filtered.map(prod => {
          const fotos = prod.fotos?.length > 0 ? prod.fotos : ['https://via.placeholder.com/300'];
          const idx = currentImageIndex[prod.id] || 0;
          const qty = selectedQty[prod.id] || 1;

          return (
            <div key={prod.id} style={{ background: '#fff', borderRadius: '15px', border: '1.5px solid #ffe4e1', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              {adminOpen && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, display: 'flex', gap: '5px' }}>
                  <button onClick={() => { setEditingId(prod.id); setProductForm(prod); setFormOpen(true); }} style={{ background: '#000', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '0.6rem', borderRadius: '4px', cursor: 'pointer' }}>EDITAR</button>
                  <button onClick={() => handleDelete(prod.id)} style={{ background: 'red', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '0.6rem', borderRadius: '4px', cursor: 'pointer' }}>EXCLUIR</button>
                </div>
              )}

              <div style={{ width: '100%', height: '240px', position: 'relative', background: '#fff9fa', cursor: 'pointer' }} onClick={() => setModalImage(fotos[idx])}>
                <img src={fotos[idx]} alt={prod.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {fotos.length > 1 && (
                  <>
                    <button onClick={(e) => prevImage(prod.id, fotos.length, e)} style={{ position: 'absolute', left: '8px', top: '50%'-'15px', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}>‹</button>
                    <button onClick={(e) => nextImage(prod.id, fotos.length, e)} style={{ position: 'absolute', right: '8px', top: '50%'-'15px', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}>›</button>
                  </>
                )}
              </div>

              <div style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 5px 0', color: '#4a202c' }}>{prod.nome}</h3>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff1493', margin: '0 0 10px 0' }}>R$ {Number(prod.preco).toFixed(2)}</p>
                  {prod.descricao && <p style={{ fontSize: '0.7rem', color: '#666', background: '#fff9fa', padding: '8px', borderRadius: '8px', border: '1px solid #ffd1dc' }}>{prod.descricao}</p>}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', margin: '12px 0' }}>
                    <button onClick={() => changeQty(prod.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ff4da6', background: '#fff', color: '#ff1493', fontWeight: 'bold', cursor: 'pointer' }}>-</button>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{qty}</span>
                    <button onClick={() => changeQty(prod.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ff4da6', background: '#fff', color: '#ff1493', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                  </div>
                  <button onClick={() => addToCart(prod)} style={{ width: '100%', background: '#ff1493', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>ADICIONAR À SACOLA</button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* MODAL ZOOM */}
      {modalImage && (
        <div onClick={() => setModalImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <img src={modalImage} alt="Zoom" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '10px' }} />
        </div>
      )}

      {/* DRAWER SACOLA */}
      <div style={{ position: 'fixed', right: cartOpen ? 0 : '-100%', top: 0, width: '100%', maxWidth: '380px', height: '100%', background: '#fff', zIndex: 3000, transition: 'right 0.3s ease', padding: '20px', boxSizing: 'border-box', overflowY: 'auto', boxShadow: '-5px 0 25px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ffd1dc', paddingBottom: '10px' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#ff1493', margin: 0 }}>Sua Sacola 👜</h2>
          <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        {cart.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '40px', color: '#888', fontSize: '0.8rem' }}>Sua sacola está vazia.</p>
        ) : (
          <>
            <div style={{ marginTop: '15px' }}>
              {cart.map(item => (
                <div key={item.idCarrinho} style={{ display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid #ffe4e1', padding: '10px 0' }}>
                  <img src={item.fotoEscolhida} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', margin: 0 }}>{item.nome}</p>
                    <p style={{ fontSize: '0.65rem', color: '#666', margin: '2px 0' }}>Qtd: {item.quantidadeEscolhida}x</p>
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ff1493', margin: 0 }}>R$ {(item.preco * item.quantidadeEscolhida).toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.idCarrinho)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '0.6rem' }}>Excluir</button>
                </div>
              ))}
            </div>

            {(genderFilter === 'ENCOMENDAS' || cart.some(i => i.genero === 'ENCOMENDAS')) && (
              <div style={{ marginTop: '15px', background: '#fff0f5', padding: '10px', borderRadius: '8px', border: '1px solid #ffd1dc' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff1493', display: 'block', marginBottom: '5px' }}>📅 Data e Hora da Encomenda:</label>
                <input type="datetime-local" value={dataEncomenda} onChange={e => setDataEncomenda(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ffd1dc', borderRadius: '6px', fontSize: '0.7rem' }} />
              </div>
            )}

            <div style={{ marginTop: '20px', borderTop: '2px solid #ffd1dc', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>
                <span>TOTAL:</span>
                <span style={{ color: '#ff1493' }}>R$ {totalCart.toFixed(2)}</span>
              </div>
              <button onClick={finalizarPedido} style={{ width: '100%', background: '#ff1493', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>ENVIAR PEDIDO NO WHATSAPP</button>
            </div>
          </>
        )}
      </div>

      {/* DRAWER ADMIN */}
      <div style={{ position: 'fixed', right: formOpen ? 0 : '-100%', top: 0, width: '100%', maxWidth: '380px', height: '100%', background: '#fff', zIndex: 3000, transition: 'right 0.3s ease', padding: '20px', boxSizing: 'border-box', overflowY: 'auto', boxShadow: '-5px 0 25px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ffd1dc', paddingBottom: '10px' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#ff1493', margin: 0 }}>{editingId ? 'Editar Doce' : 'Novo Doce'}</h2>
          <button onClick={() => { setFormOpen(false); resetForm(); }} style={{ background: '#fff0f5', color: '#ff1493', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 'bold' }}>FECHAR</button>
        </div>

        <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff1493' }}>Nome do Doce</label>
          <input type="text" value={productForm.nome} onChange={e => setProductForm({...productForm, nome: e.target.value})} style={{ padding: '8px', border: '1px solid #ffd1dc', borderRadius: '6px', fontSize: '0.75rem' }} />

          <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff1493' }}>Preço (R$)</label>
          <input type="number" step="0.01" value={productForm.preco} onChange={e => setProductForm({...productForm, preco: e.target.value})} style={{ padding: '8px', border: '1px solid #ffd1dc', borderRadius: '6px', fontSize: '0.75rem' }} />

          <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff1493' }}>Grupo</label>
          <select value={productForm.genero} onChange={e => setProductForm({...productForm, genero: e.target.value, categoria: categoriasMap[e.target.value][0]})} style={{ padding: '8px', border: '1px solid #ffd1dc', borderRadius: '6px', fontSize: '0.75rem' }}>
            <option value="DIARIO">Disponíveis Hoje</option>
            <option value="ENCOMENDAS">Encomendas</option>
          </select>

          <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff1493' }}>Categoria</label>
          <select value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})} style={{ padding: '8px', border: '1px solid #ffd1dc', borderRadius: '6px', fontSize: '0.75rem' }}>
            {categoriasMap[productForm.genero]?.map(cat => (
              <option key={cat} value={cat}>{cat.toUpperCase()}</option>
            ))}
          </select>

          <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff1493' }}>Descrição</label>
          <textarea rows={3} value={productForm.descricao} onChange={e => setProductForm({...productForm, descricao: e.target.value})} style={{ padding: '8px', border: '1px solid #ffd1dc', borderRadius: '6px', fontSize: '0.75rem' }} />

          <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff1493' }}>Fotos (Redimensionamento Automático)</label>
          <input type="file" accept="image/*" multiple onChange={handleLocalImageUpload} />

          {productForm.fotos?.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {productForm.fotos.map((f: string, i: number) => (
                <img key={i} src={f} alt="" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ffd1dc' }} />
              ))}
            </div>
          )}

          <button onClick={handleSave} style={{ width: '100%', background: '#ff1493', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', marginTop: '10px' }}>SALVAR DOCE</button>
        </div>
      </div>
    </div>
  );
}