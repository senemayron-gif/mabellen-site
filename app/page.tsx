'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ Insira aqui as suas credenciais do Supabase
const SUPABASE_URL = 'SUA_URL_DO_SUPABASE';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_DO_SUPABASE';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WHATSAPP_NUM = '554497162755'; // Maringá/PR[cite: 1]

export default function DocesDaRosaSite() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); 
  const [genderFilter, setGenderFilter] = useState('DIARIO'); 
  const [subFilter, setSubFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [dataEncomenda, setDataEncomenda] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  const [modalImage, setModalImage] = useState<string | null>(null);

  const [categoriasMap, setCategoriasMap] = useState<Record<string, string[]>>({
    DIARIO: ['bolo no pote', 'copo da felicidade', 'docinhos individuais'],
    ENCOMENDAS: ['bolos festivos', 'cento de docinhos', 'tortas inteiras', 'kits presente']
  });

  const [novaCatNome, setNovaCatNome] = useState('');
  const [novaCatGrupo, setNovaCatGrupo] = useState('DIARIO');
  const [backgroundImage, setBackgroundImage] = useState<string>('https://images.unsplash.com/photo-1511018556340-d16986a1c194?q=80&w=1200');

  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});

  const [productForm, setProductForm] = useState<any>({
    nome: '', preco: '', genero: 'DIARIO', categoria: '', fotos: [], descricao: '', ativo: true
  });

  // Função para buscar produtos do Supabase
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('produtos_doces').select('*');
    if (error) {
      console.error('Erro ao buscar produtos:', error);
    } else if (data && data.length > 0) {
      setProducts(data);
    } else {
      // Se estiver vazio, cadastra um produto padrão na nuvem
      const padrao = [
        {
          id: '1',
          nome: 'Bolo pote',
          preco: 13.50,
          genero: 'DIARIO',
          categoria: 'bolo no pote',
          fotos: ['https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=600'],
          descricao: 'Brigadeiro de maracujá + brigadeiro tradicional + creme de Ninho + ganache de chocolate para finalizar.',
          ativo: true
        }
      ];
      await supabase.from('produtos_doces').insert(padrao);
      setProducts(padrao);
    }
  };

  useEffect(() => {
    const savedCats = localStorage.getItem('doces_categorias_v4');
    let catsAtuais = categoriasMap;
    if (savedCats) {
      catsAtuais = JSON.parse(savedCats);
      setCategoriasMap(catsAtuais);
    }

    if (!subFilter && catsAtuais[genderFilter]?.[0]) {
      setSubFilter(catsAtuais[genderFilter][0]);
    }

    const savedBg = localStorage.getItem('doces_banner_fundo');
    if (savedBg) {
      setBackgroundImage(savedBg);
    }

    // Busca inicial do Supabase
    fetchProducts();

    // Inscreve-se para atualizar em tempo real se outro celular alterar algo
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produtos_doces' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    const savedCart = localStorage.getItem('docesdarosa_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('docesdarosa_cart', JSON.stringify(cart));
  }, [cart]);

  const handleCriarCategoria = () => {
    if (!novaCatNome.trim()) return alert("Digite o nome da categoria!");
    const nomeLimpo = novaCatNome.trim().toLowerCase();
    const grupo = novaCatGrupo;

    if (categoriasMap[grupo].includes(nomeLimpo)) {
      return alert("Essa categoria já existe neste grupo!");
    }

    const novasCategorias = {
      ...categoriasMap,
      [grupo]: [...categoriasMap[grupo], nomeLimpo].sort()
    };

    setCategoriasMap(novasCategorias);
    localStorage.setItem('doces_categorias_v4', JSON.stringify(novasCategorias));
    setNovaCatNome('');
    alert(`Categoria "${nomeLimpo.toUpperCase()}" criada com sucesso!`);
  };

  const handleExcluirCategoria = (grupo: string, catExcluir: string) => {
    if (!confirm(`Deseja realmente excluir a categoria "${catExcluir.toUpperCase()}"?`)) return;

    const novasCategorias = {
      ...categoriasMap,
      [grupo]: categoriasMap[grupo].filter(c => c !== catExcluir)
    };

    setCategoriasMap(novasCategorias);
    localStorage.setItem('doces_categorias_v4', JSON.stringify(novasCategorias));
  };

  const resetForm = () => {
    setEditingId(null);
    const primeiraCatDoGrupo = categoriasMap[productForm.genero]?.[0] || '';
    setProductForm({ nome: '', preco: '', genero: 'DIARIO', categoria: primeiraCatDoGrupo, fotos: [], descricao: '', ativo: true });
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
    const qty = selectedQty[prod.id] || 1;
    const fotoPrincipal = prod.fotos?.[currentImageIndex[prod.id] || 0] || prod.fotos?.[0] || '';

    const itemExistenteIndex = cart.findIndex(item => item.id === prod.id);

    if (itemExistenteIndex !== -1) {
      const novoCarrinho = [...cart];
      novoCarrinho[itemExistenteIndex].quantidadeEscolhida += qty;
      setCart(novoCarrinho);
    } else {
      const itemCarrinho = { 
        idCarrinho: Date.now(), 
        ...prod, 
        fotoEscolhida: fotoPrincipal,
        quantidadeEscolhida: qty,
        selecionado: true
      };
      setCart([...cart, itemCarrinho]);
    }

    setSelectedQty({ ...selectedQty, [prod.id]: 1 });
    setCartOpen(true);
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
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProductForm((prev: any) => ({
            ...prev,
            fotos: [...(prev.fotos || []), reader.result]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveSinglePhoto = (indexToRemove: number) => {
    setProductForm((prev: any) => ({
      ...prev,
      fotos: prev.fotos.filter((_: any, index: number) => index !== indexToRemove)
    }));
  };

  const handleBannerBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setBackgroundImage(reader.result);
        localStorage.setItem('doces_banner_fundo', reader.result);
        alert("Imagem de fundo do banner alterada com sucesso!");
      }
    };
    reader.readAsDataURL(file);
  };

  async function handleSave() {
    const categoriaDefinida = productForm.categoria || categoriasMap[productForm.genero]?.[0] || '';
    
    const dadosSalvar = {
      id: editingId ? editingId : Date.now().toString(),
      nome: productForm.nome,
      preco: Number(productForm.preco),
      genero: productForm.genero,
      categoria: categoriaDefinida,
      fotos: productForm.fotos,
      descricao: productForm.descricao,
      ativo: true
    };

    const { error } = await supabase.from('produtos_doces').upsert(dadosSalvar);

    if (error) {
      alert("Erro ao salvar no banco de dados: " + error.message);
    } else {
      alert("Doce salvo com sucesso!");
      setFormOpen(false);
      resetForm();
      fetchProducts();
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
      fetchProducts();
    }
  }

  const filtered = products.filter(p => 
    p.genero === genderFilter && (subFilter === '' || p.categoria === subFilter)
  );

  const cssStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Great+Vibes&display=swap');
    
    :root { 
      --pink-glow: #ff1493;
      --pink-sweet: #ff4da6;
      --pink-light: #fff0f5;
      --gold-shiny: #ffd700;
      --bg-gradient: linear-gradient(135deg, #fff0f5 0%, #ffe4e1 50%, #ffd1dc 100%);
      --text-brown: #5c2c3b;
    }
    
    body { 
      margin: 0; 
      font-family: 'Montserrat', sans-serif; 
      background: var(--bg-gradient);
      background-attachment: fixed;
      color: var(--text-brown); 
      overflow-x: hidden;
    }
    
    .candy-rain {
      position: fixed;
      top: -50px;
      user-select: none;
      pointer-events: none;
      z-index: 2;
      animation: fallDown 10s linear infinite;
    }

    @keyframes fallDown {
      0% { transform: translateY(0) rotate(0deg) scale(0.8); opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { transform: translateY(105vh) rotate(360deg) scale(1.2); opacity: 0; }
    }

    header { 
      background: rgba(255, 255, 255, 0.95); 
      backdrop-filter: blur(10px);
      padding: 15px 5%; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      border-bottom: 2px solid var(--pink-sweet); 
      position: sticky; 
      top: 0; 
      z-index: 500; 
      box-shadow: 0 4px 20px rgba(255, 20, 147, 0.1);
    }

    .painel-btn {
      cursor: pointer; 
      width: 45px;
      height: 45px;
      font-size: 1.3rem; 
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--text-brown);
      border: 2px solid var(--gold-shiny);
      border-radius: 50%;
      transition: all 0.3s ease;
      box-shadow: 0 4px 10px rgba(92, 44, 59, 0.2);
    }
    .painel-btn:hover {
      background: var(--pink-glow);
      transform: scale(1.1) rotate(10deg);
    }
    
    .bag-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      gap: 4px;
    }

    .bag-container { 
      position: relative; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      width: 45px; 
      height: 45px; 
      background: var(--pink-sweet);
      border-radius: 50%;
      font-size: 1.2rem;
      transition: all 0.3s ease;
      border: 2px solid #fff;
      box-shadow: 0 4px 10px rgba(255, 20, 147, 0.2);
    }
    .bag-wrapper:hover .bag-container {
      transform: scale(1.1);
      background: var(--pink-glow);
    }

    .bag-text {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--pink-sweet);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .bag-badge { 
      position: absolute; 
      top: -4px; 
      right: -4px; 
      background: var(--gold-shiny); 
      color: var(--text-brown); 
      font-size: 10px; 
      font-weight: 900; 
      width: 20px; 
      height: 20px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border: 1.5px solid #fff;
    }

    .hero-section { 
      position: relative; 
      width: 100%; 
      height: 45vh; 
      min-height: 320px; 
      background-size: cover; 
      background-position: center; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
    }
    .hero-overlay { 
      position: absolute; 
      inset: 0; 
      background: linear-gradient(135deg, rgba(255, 240, 245, 0.85) 0%, rgba(255, 77, 166, 0.5) 100%); 
    }
    .hero-content { 
      position: relative; 
      z-index: 10; 
      max-width: 700px; 
      padding: 20px; 
      text-align: center; 
    }
    
    .hero-title-main { 
      font-family: 'Great Vibes', cursive; 
      font-size: 5.5rem; 
      color: var(--pink-glow); 
      margin: 0;
      line-height: 1;
      text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.8);
    }
    .hero-title-sub { 
      font-family: 'Playfair Display', serif; 
      font-size: 2.2rem; 
      font-weight: 700; 
      letter-spacing: 2px;
      color: var(--text-brown); 
      text-transform: uppercase;
      margin-top: -5px;
      margin-bottom: 12px;
    }
    .hero-subtitle { 
      font-size: 1rem; 
      font-weight: 500;
      color: var(--text-brown);
      margin-bottom: 0; 
      background: rgba(255, 255, 255, 0.9);
      padding: 8px 18px;
      border-radius: 20px;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(255, 20, 147, 0.08);
    }
    .hero-badge {
      display: inline-block;
      background: var(--pink-glow);
      color: #fff;
      padding: 5px 16px;
      font-size: 0.7rem;
      border-radius: 15px;
      margin-bottom: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .nav-main { 
      display: flex; 
      justify-content: center; 
      gap: 25px; 
      padding: 18px 15px; 
      background: rgba(255, 255, 255, 0.9); 
      backdrop-filter: blur(5px);
      border-bottom: 2px solid var(--pink-light); 
    }
    .nav-main button { 
      background: none; 
      border: none; 
      cursor: pointer; 
      letter-spacing: 1px; 
      font-weight: 700; 
      font-family: 'Montserrat', sans-serif; 
      font-size: 0.8rem;
      color: #a37c88;
      text-transform: uppercase;
      transition: 0.3s;
      padding-bottom: 4px;
    }
    .nav-main button.active-gender { 
      color: var(--pink-glow) !important; 
      border-bottom: 3px solid var(--pink-glow); 
    }

    .sub-nav { 
      display: flex; 
      justify-content: center; 
      gap: 8px; 
      padding: 15px; 
      flex-wrap: wrap; 
      background: rgba(255, 240, 245, 0.6); 
    }
    .sub-btn { 
      background: #fff; 
      border: 1.5px solid #ffd1dc; 
      padding: 6px 16px; 
      font-size: 0.7rem; 
      font-weight: 700;
      cursor: pointer; 
      color: var(--text-brown); 
      border-radius: 20px; 
      text-transform: uppercase;
      transition: all 0.2s ease;
    }
    .sub-btn:hover {
      border-color: var(--pink-sweet);
    }
    .sub-btn.active { 
      background: var(--pink-sweet); 
      color: #fff; 
      border-color: var(--pink-sweet); 
      box-shadow: 0 3px 10px rgba(255, 77, 166, 0.3);
    }

    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
      gap: 30px; 
      padding: 35px 5%; 
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .card { 
      background: #fff; 
      border: 1.5px solid #ffe4e1; 
      position: relative; 
      overflow: hidden; 
      display: flex; 
      flex-direction: column; 
      border-radius: 20px; 
      box-shadow: 0 8px 20px rgba(255, 77, 166, 0.08);
      transition: all 0.3s ease;
    }
    .card:hover {
      transform: translateY(-6px);
      border-color: var(--pink-sweet);
      box-shadow: 0 12px 30px rgba(255, 20, 147, 0.18);
    }
    
    .img-container { 
      width: 100%; 
      height: 300px; 
      background: #fff9fa; 
      position: relative; 
      overflow: hidden;
      border-bottom: 1.5px solid var(--pink-light);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: zoom-in;
    }
    
    .img-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .card:hover .img-container img {
      transform: scale(1.05);
    }

    .slider-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.85);
      color: var(--text-brown);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 5;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      transition: 0.2s;
    }
    .slider-btn:hover {
      background: #fff;
      color: var(--pink-glow);
    }
    .slider-btn.prev { left: 10px; }
    .slider-btn.next { right: 10px; }

    .slider-dots {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 5px;
      z-index: 5;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.6);
      border: 1px solid rgba(0,0,0,0.2);
    }
    .dot.active-dot {
      background: var(--pink-glow);
      width: 16px;
      border-radius: 3px;
    }
    
    .product-info { 
      padding: 20px; 
      text-align: center; 
      flex-grow: 1; 
      display: flex; 
      flex-direction: column; 
      justify-content: space-between; 
      background: #fff;
    }
    .product-name { 
      font-family: 'Playfair Display', serif; 
      font-size: 1.3rem; 
      font-weight: 700; 
      color: var(--text-brown); 
      margin: 0 0 4px 0;
    }
    .product-price { 
      font-size: 1.35rem; 
      font-weight: 800; 
      color: var(--pink-glow); 
      margin-bottom: 12px; 
    }

    .desc-box {
      border: 1.5px solid #ffd1dc;
      background: #fff;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 0.72rem;
      color: var(--text-brown);
      line-height: 1.4;
      margin-bottom: 15px;
      text-align: center;
      font-weight: 500;
    }

    .qty-selector-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .qty-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1.5px solid var(--pink-sweet);
      background: #fff;
      color: var(--pink-glow);
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: 0.2s;
    }
    .qty-btn:hover {
      background: var(--pink-light);
    }
    .qty-value {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-brown);
      min-width: 20px;
      text-align: center;
    }
    
    .btn-buy { 
      width: 100%; 
      background: linear-gradient(135deg, var(--pink-glow) 0%, var(--pink-sweet) 100%);
      color: #fff; 
      border: none; 
      padding: 14px; 
      font-size: 0.75rem; 
      font-weight: 800; 
      cursor: pointer; 
      text-transform: uppercase; 
      border-radius: 12px; 
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(255, 20, 147, 0.25);
    }
    .btn-buy:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }

    .drawer { 
      position: fixed; 
      right: -100%; 
      top: 0; 
      width: 100%; 
      max-width: 400px; 
      height: 100%; 
      background: #fff; 
      z-index: 9999; 
      transition: right 0.35s ease; 
      padding: 25px; 
      box-sizing: border-box; 
      overflow-y: auto; 
      border-left: 2px solid var(--pink-sweet);
      box-shadow: -8px 0 30px rgba(255, 20, 147, 0.1); 
    }
    .drawer.open { 
      right: 0; 
    }
    
    .cart-item { 
      display: flex; 
      gap: 12px; 
      padding: 12px 0; 
      border-bottom: 1px solid var(--pink-light); 
      align-items: center; 
    }
    .cart-item img { 
      width: 55px; 
      height: 70px; 
      object-fit: cover; 
      background: #fff;
      border-radius: 6px; 
      border: 1px solid var(--pink-light);
    }

    .primary-btn { 
      width: 100%; 
      background: var(--pink-glow); 
      color: #fff; 
      border: none; 
      padding: 14px; 
      font-size: 0.75rem; 
      font-weight: 800; 
      cursor: pointer; 
      text-transform: uppercase; 
      border-radius: 10px; 
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(255, 20, 147, 0.25);
    }
    
    .admin-form label { 
      display: block; 
      font-size: 0.7rem; 
      font-weight: 700; 
      margin-top: 12px; 
      color: var(--pink-sweet); 
      text-transform: uppercase;
    }
    .admin-form input, .admin-form select, .admin-form textarea { 
      width: 100%; 
      padding: 10px; 
      background: #fff;
      color: var(--text-brown);
      border: 1.5px solid #ffd1dc; 
      box-sizing: border-box; 
      font-size: 0.75rem; 
      border-radius: 6px; 
      margin-top: 4px; 
    }

    .btn-add-new { 
      position: fixed; 
      bottom: 25px; 
      left: 25px; 
      background: var(--pink-glow); 
      color: #fff; 
      width: 50px; 
      height: 50px; 
      border-radius: 50%; 
      border: none; 
      font-size: 24px; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      z-index: 1000; 
      box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3); 
    }

    .whatsapp-float {
      position: fixed;
      bottom: 25px;
      right: 25px;
      background-color: #25d366;
      color: #fff;
      width: 55px;
      height: 55px;
      border-radius: 50%;
      text-align: center;
      font-size: 26px;
      box-shadow: 2px 4px 15px rgba(37, 211, 102, 0.35);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: all 0.3s ease;
    }
    .whatsapp-float:hover {
      background-color: #128c7e;
      transform: scale(1.1);
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />

      <div className="candy-rain" style={{ left: '8%', animationDelay: '0s', animationDuration: '9s', fontSize: '24px' }}>🧁</div>
      <div className="candy-rain" style={{ left: '22%', animationDelay: '3s', animationDuration: '12s', fontSize: '32px' }}>🍓</div>
      <div className="candy-rain" style={{ left: '40%', animationDelay: '1.5s', animationDuration: '8s', fontSize: '20px' }}>🍫</div>
      <div className="candy-rain" style={{ left: '55%', animationDelay: '5s', animationDuration: '14s', fontSize: '28px' }}>🍬</div>
      <div className="candy-rain" style={{ left: '72%', animationDelay: '2s', animationDuration: '10s', fontSize: '24px' }}>🎂</div>
      <div className="candy-rain" style={{ left: '88%', animationDelay: '6s', animationDuration: '11s', fontSize: '35px' }}>🍩</div>

      <header>
        <div 
          className="painel-btn"
          onClick={() => {
            const senha = prompt('Senha de acesso:');
            if (senha === '2004') {
              setAdminOpen(!adminOpen);
            } else if (senha !== null) {
              alert('Senha incorreta!');
            }
          }}
          title="Acessar Painel"
        >
          🧁
        </div>
        
        <div className="bag-wrapper" onClick={() => setCartOpen(true)}>
          <div className="bag-container">
            👜 {cart.length > 0 && <span className="bag-badge">{cart.reduce((a, b) => a + b.quantidadeEscolhida, 0)}</span>}
          </div>
          <span className="bag-text">Seus doces</span>
        </div>
      </header>

      <section 
        className="hero-section"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-badge">🧁 Feitos com Carinho em Maringá</span>
          <h1 className="hero-title-main">Doces</h1>
          <h2 className="hero-title-sub">da Rosa</h2>
          <p className="hero-subtitle">Muitos brigadeiros, copos recheados e fatias deliciosas!</p>
        </div>
      </section>

      {adminOpen && <button className="btn-add-new" onClick={() => { resetForm(); setFormOpen(true); }}>+</button>}

      <nav className="nav-main">
        {Object.keys(categoriasMap).map(g => (
          <button 
            key={g} 
            className={genderFilter === g ? 'active-gender' : ''}
            onClick={() => { 
              setGenderFilter(g); 
              setSubFilter(categoriasMap[g]?.[0] || ''); 
            }}
          >
            {g === 'DIARIO' ? '🧁 Disponíveis Hoje' : '📅 Encomendas Especiais'}
          </button>
        ))}
      </nav>

      <div className="sub-nav">
        {categoriasMap[genderFilter]?.map(cat => (
          <button 
            key={cat} 
            className={`sub-btn ${subFilter === cat ? 'active' : ''}`} 
            onClick={() => setSubFilter(cat)}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <main className="grid">
        {filtered.map(prod => {
          const fotos = prod.fotos?.length > 0 ? prod.fotos : ['https://via.placeholder.com/300'];
          const currentIndex = currentImageIndex[prod.id] || 0;
          const currentQty = selectedQty[prod.id] || 1;

          return (
            <div key={prod.id} className="card">
              {adminOpen && (
                <div style={{position:'absolute', zIndex:10, top:'10px', left:'10px', display:'flex', gap:'5px'}}>
                  <button onClick={() => { setEditingId(prod.id); setProductForm(prod); setFormOpen(true); }} style={{background:'#000', color:'#fff', border:'none', padding:'5px 10px', cursor:'pointer', fontSize:'0.6rem', borderRadius:'4px'}}>EDITAR</button>
                  <button onClick={() => handleDelete(prod.id)} style={{background:'red', color:'#fff', border:'none', padding:'5px 10px', cursor:'pointer', fontSize:'0.6rem', borderRadius:'4px'}}>EXCLUIR</button>
                </div>
              )}

              <div className="img-container" onClick={() => setModalImage(fotos[currentIndex])}>
                <img src={fotos[currentIndex]} alt={prod.nome} />

                {fotos.length > 1 && (
                  <>
                    <button className="slider-btn prev" onClick={(e) => prevImage(prod.id, fotos.length, e)}>‹</button>
                    <button className="slider-btn next" onClick={(e) => nextImage(prod.id, fotos.length, e)}>›</button>

                    <div className="slider-dots">
                      {fotos.map((_: any, idx: number) => (
                        <span key={idx} className={`dot ${currentIndex === idx ? 'active-dot' : ''}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="product-info">
                <div>
                  <p className="product-name">{prod.nome}</p>
                  <p className="product-price">R$ {Number(prod.preco).toFixed(2)}</p>

                  {prod.descricao && (
                    <div className="desc-box">
                      {prod.descricao}
                    </div>
                  )}
                </div>

                <div>
                  <div className="qty-selector-container">
                    <button className="qty-btn" onClick={() => changeQty(prod.id, -1)}>-</button>
                    <span className="qty-value">{currentQty}</span>
                    <button className="qty-btn" onClick={() => changeQty(prod.id, 1)}>+</button>
                  </div>

                  <button className="btn-buy" onClick={() => addToCart(prod)}>ADICIONAR À SACOLA</button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {modalImage && (
        <div 
          onClick={() => setModalImage(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'zoom-out'
          }}
        >
          <div style={{position: 'relative', maxWidth: '90%', maxHeight: '90%'}}>
            <img src={modalImage} alt="Zoom" style={{maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '10px'}} />
            <button 
              onClick={() => setModalImage(null)}
              style={{position: 'absolute', top: '-15px', right: '-15px', background: '#fff', color: '#000', border: 'none', width: '35px', height: '35px', borderRadius: '50%', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'}}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={`drawer ${cartOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid var(--pink-sweet)', paddingBottom:'12px'}}>
          <h2 style={{fontFamily: 'Playfair Display', fontSize: '1.2rem', margin:0, color: 'var(--pink-glow)'}}>SUA SACOLA 👜</h2>
          <button onClick={() => setCartOpen(false)} style={{background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', color: 'var(--pink-sweet)'}}>✕</button>
        </div>

        {cart.length === 0 ? (
          <p style={{textAlign:'center', marginTop:'30px', color:'#a37c88', fontSize:'0.75rem'}}>Sua sacola está vazia.</p>
        ) : (
          <>
            <div style={{marginTop:'12px'}}>
              {cart.map((item) => (
                <div key={item.idCarrinho} className="cart-item">
                  <img src={item.fotoEscolhida || item.fotos?.[0] || ''} alt="" />
                  <div style={{flex:1}}>
                    <p style={{fontSize:'0.75rem', fontWeight:'700', margin:0, color: 'var(--text-brown)'}}>{item.nome}</p>
                    <p style={{fontSize:'0.65rem', color:'#888', margin:'3px 0'}}>
                      Qtd: {item.quantidadeEscolhida}x
                    </p>
                    <p style={{fontSize:'0.8rem', fontWeight:'700', color:'var(--pink-glow)', margin:0}}>R$ {(item.preco * item.quantidadeEscolhida).toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.idCarrinho)} style={{background:'none', border:'none', color:'red', cursor:'pointer', fontSize:'0.65rem', fontWeight: 600}}>Excluir</button>
                </div>
              ))}
            </div>

            {(genderFilter === 'ENCOMENDAS' || cart.some(item => item.genero === 'ENCOMENDAS')) && (
              <div style={{marginTop: '20px', background: 'var(--pink-light)', padding: '12px', borderRadius: '10px', border: '1.5px solid #ffd1dc'}}>
                <label style={{display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--pink-glow)', textTransform: 'uppercase', marginBottom: '6px'}}>
                  📅 Data e Hora da Encomenda (Obrigatório):
                </label>
                <input 
                  type="datetime-local" 
                  value={dataEncomenda}
                  onChange={(e) => setDataEncomenda(e.target.value)}
                  style={{width: '100%', padding: '10px', background: '#fff', color: 'var(--text-brown)', border: '1.5px solid #ffd1dc', fontSize: '0.75rem', borderRadius: '6px'}}
                />
              </div>
            )}

            <div style={{marginTop:'25px', borderTop:'2px solid var(--pink-sweet)', paddingTop:'15px'}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom: '12px', fontWeight: 600}}>
                <span>VALOR TOTAL:</span>
                <span style={{color:'var(--pink-glow)', fontSize: '1.1rem', fontWeight: 800}}>R$ {totalCart.toFixed(2)}</span>
              </div>
              <button className="primary-btn" onClick={finalizarPedido}>ENVIAR PEDIDO PRO WHATSAPP</button>
            </div>
          </>
        )}
      </div>

      <div className={`drawer ${formOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '2px solid var(--pink-sweet)', paddingBottom: '12px'}}>
          <h2 style={{fontFamily: 'Playfair Display', fontSize: '1.1rem', margin:0, color: 'var(--pink-glow)'}}>{editingId ? 'EDITAR DOCE' : 'ADICIONAR DOCE'}</h2>
          <button onClick={() => { setFormOpen(false); resetForm(); }} style={{background: 'var(--pink-light)', color: 'var(--pink-glow)', border:'none', padding:'5px 10px', cursor:'pointer', fontSize:'0.6rem', borderRadius:'4px', fontWeight: 700}}>FECHAR</button>
        </div>

        <div style={{background: 'var(--pink-light)', padding: '12px', borderRadius: '10px', marginTop: '12px', border: '1.5px solid #ffd1dc'}}>
          <h3 style={{fontSize: '0.75rem', margin: '0 0 8px 0', color: 'var(--pink-glow)', fontWeight: 700, textTransform: 'uppercase'}}>📂 Gerenciar Categorias</h3>
          
          <div style={{display: 'flex', gap: '5px', marginTop: '5px'}}>
            <input 
              type="text" 
              placeholder="Nome da categoria" 
              value={novaCatNome} 
              onChange={e => setNovaCatNome(e.target.value)}
              style={{flex: 1, padding: '7px', fontSize: '0.7rem', borderRadius: '5px', border: '1.5px solid #ffd1dc', background: '#fff'}}
            />
            <select 
              value={novaCatGrupo} 
              onChange={e => setNovaCatGrupo(e.target.value)}
              style={{width: '100px', padding: '7px', fontSize: '0.7rem', borderRadius: '5px', border: '1.5px solid #ffd1dc', background: '#fff'}}
            >
              <option value="DIARIO">Hoje</option>
              <option value="ENCOMENDAS">Encomenda</option>
            </select>
            <button 
              onClick={handleCriarCategoria}
              style={{background: 'var(--pink-glow)', color: '#fff', border: 'none', padding: '0 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem'}}
            >
              CRIAR
            </button>
          </div>

          <div style={{marginTop: '10px'}}>
            <p style={{fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-brown)', textTransform: 'uppercase', marginBottom: '5px'}}>Suas Categorias (Toque no ✕ para apagar):</p>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '90px', overflowY: 'auto', background: '#fff', padding: '6px', borderRadius: '5px', border: '1px solid #ffd1dc'}}>
              {categoriasMap[novaCatGrupo]?.map(cat => (
                <span 
                  key={cat} 
                  style={{fontSize: '0.6rem', background: '#ffd1dc', color: 'var(--text-brown)', padding: '2px 6px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700}}
                >
                  {cat.toUpperCase()}
                  <button 
                    onClick={() => handleExcluirCategoria(novaCatGrupo, cat)}
                    style={{background: 'none', border: 'none', color: 'var(--pink-glow)', cursor: 'pointer', fontWeight: 900, fontSize: '0.65rem'}}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-form" style={{marginTop: '12px'}}>
          <label>Nome do Doce</label>
          <input 
            type="text" 
            value={productForm.nome} 
            onChange={e => setProductForm({...productForm, nome: e.target.value})} 
          />

          <label>Preço (R$)</label>
          <input 
            type="number" 
            step="0.01" 
            value={productForm.preco} 
            onChange={e => setProductForm({...productForm, preco: e.target.value})} 
          />

          <label>Grupo Principal</label>
          <select 
            value={productForm.genero} 
            onChange={e => setProductForm({...productForm, genero: e.target.value, categoria: categoriasMap[e.target.value]?.[0] || ''})}
          >
            <option value="DIARIO">Disponíveis Hoje</option>
            <option value="ENCOMENDAS">Encomendas Especiais</option>
          </select>

          <label>Categoria Específica</label>
          <select 
            value={productForm.categoria} 
            onChange={e => setProductForm({...productForm, categoria: e.target.value})}
          >
            {categoriasMap[productForm.genero]?.map(cat => (
              <option key={cat} value={cat}>{cat.toUpperCase()}</option>
            ))}
          </select>

          <label>Descrição / Ingredientes do Doce</label>
          <textarea 
            rows={3}
            placeholder="Ex: Brigadeiro de maracujá + brigadeiro tradicional + creme de Ninho..." 
            value={productForm.descricao} 
            onChange={e => setProductForm({...productForm, descricao: e.target.value})} 
          />

          <label>Fotos do Doce (Adicione quantas quiser)</label>
          <input type="file" accept="image/*" multiple onChange={handleLocalImageUpload} />

          {productForm.fotos?.length > 0 && (
            <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'10px'}}>
              {productForm.fotos.map((f: string, i: number) => (
                <div key={i} style={{position: 'relative', display: 'inline-block'}}>
                  <img src={f} alt="" style={{width:'55px', height:'55px', objectFit:'cover', borderRadius:'6px', border: '1px solid #ffd1dc'}} />
                  <button 
                    type="button"
                    onClick={() => handleRemoveSinglePhoto(i)}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px', background: 'red', color: '#fff',
                      border: 'none', width: '20px', height: '20px', borderRadius: '50%', fontSize: '10px',
                      fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Excluir apenas esta foto"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <label style={{marginTop: '20px'}}>Alterar Fundo do Banner</label>
          <input type="file" accept="image/*" onChange={handleBannerBackgroundUpload} />

          <div style={{display:'flex', gap:'8px', marginTop:'18px'}}>
            <button className="primary-btn" onClick={handleSave}>SALVAR DOCE</button>
            {editingId && (
              <button 
                onClick={() => handleDelete()} 
                style={{background:'red', color:'#fff', border:'none', padding:'10px', borderRadius:'10px', cursor:'pointer', fontWeight:800, fontSize:'0.7rem'}}
              >
                EXCLUIR
              </button>
            )}
          </div>
        </div>
      </div>

      <a 
        href={`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent("Olá! Gostaria de tirar dúvidas sobre os doces da Rosa em Maringá.")}`} 
        className="whatsapp-float" 
        target="_blank" 
        rel="noopener noreferrer"
        title="Fale conosco no WhatsApp"
      >
        💬
      </a>
    </>
  );
}