'use client';

import { useEffect, useState } from 'react';

const TAMANHOS_OPCOES = ['P', 'M', 'G']; 
const WHATSAPP_NUM = '554497162755'; // Maringá/PR

export default function DocesDaRosaSite() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); 
  const [genderFilter, setGenderFilter] = useState('DIARIO'); 
  const [subFilter, setSubFilter] = useState('TODOS');
  const [editingId, setEditingId] = useState<string | null>(null);

  // ESTADO DE CATEGORIAS DINÂMICAS
  const [categoriasMap, setCategoriasMap] = useState<Record<string, string[]>>({
    DIARIO: ['bolo no pote', 'copo da felicidade', 'docinhos individuais'],
    ENCOMENDAS: ['bolos festivos', 'cento de docinhos', 'tortas inteiras', 'kits presente']
  });

  const [novaCatNome, setNovaCatNome] = useState('');
  const [novaCatGrupo, setNovaCatGrupo] = useState('DIARIO');
  const [backgroundImage, setBackgroundImage] = useState<string>('https://images.unsplash.com/photo-1511018556340-d16986a1c194?q=80&w=1200');

  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<Record<string, string>>({}); 
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});

  const [productForm, setProductForm] = useState<any>({
    nome: '', preco: '', genero: 'DIARIO', categoria: '', fotos: [], estoque: {}, cores: '', ativo: true
  });

  useEffect(() => {
    const savedCats = localStorage.getItem('doces_categorias_v3');
    if (savedCats) {
      setCategoriasMap(JSON.parse(savedCats));
    }

    const savedBg = localStorage.getItem('doces_banner_fundo');
    if (savedBg) {
      setBackgroundImage(savedBg);
    }

    const savedProducts = localStorage.getItem('doces_produtos_teste_v2');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      const padrao = [
        {
          id: '1',
          nome: 'Copo da Felicidade - Ninho com Nutella e Morangos',
          preco: 18.00,
          genero: 'DIARIO',
          categoria: 'copo da felicidade',
          fotos: ['https://i.postimg.cc/q79R42Vq/image-329e21.png'],
          cores: 'Tradicional, Chocolate Belga',
          estoque: { P: 15, M: 10 },
          ativo: true
        }
      ];
      setProducts(padrao);
      localStorage.setItem('doces_produtos_teste_v2', JSON.stringify(padrao));
    }

    const savedCart = localStorage.getItem('docesdarosa_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
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
    localStorage.setItem('doces_categorias_v3', JSON.stringify(novasCategorias));
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
    localStorage.setItem('doces_categorias_v3', JSON.stringify(novasCategorias));
  };

  const resetForm = () => {
    setEditingId(null);
    const primeiraCatDoGrupo = categoriasMap[productForm.genero]?.[0] || '';
    setProductForm({ nome: '', preco: '', genero: 'DIARIO', categoria: primeiraCatDoGrupo, fotos: [], estoque: {}, cores: '', ativo: true });
  };

  const addToCart = (prod: any) => {
    const size = selectedSize[prod.id];
    const sabor = selectedColor[prod.id] || 'N/A';
    const qty = selectedQty[prod.id] || 1;

    if (!size) return alert("Por favor, selecione o tamanho do doce!");

    const itemExistenteIndex = cart.findIndex(item => 
      item.id === prod.id && 
      item.tamanhoEscolhido === size && 
      item.corEscolhida === sabor
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
        corEscolhida: sabor, 
        quantidadeEscolhida: qty,
        selecionado: true
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

  const totalCart = cart.reduce((acc, item) => 
    item.selecionado ? acc + (item.preco * item.quantidadeEscolhida) : acc
  , 0);

  const finalizarPedido = () => {
    const itensSelecionados = cart.filter(item => item.selecionado);
    if (itensSelecionados.length === 0) return alert("Selecione ao menos um doce na sua sacola!");

    let msg = `*NOVO PEDIDO - DOCES DA ROSA* 🌸\n\n`;
    itensSelecionados.forEach(item => {
      msg += `• ${item.quantidadeEscolhida}x ${item.nome} (${item.tamanhoEscolhido} - Sabor: ${item.corEscolhida}) - R$ ${(item.preco * item.quantidadeEscolhida).toFixed(2)}\n`;
    });
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

  function handleSave() {
    let novosProdutos = [...products];
    const categoriaDefinida = productForm.categoria || categoriasMap[productForm.genero]?.[0] || '';
    
    const dadosSalvar = {
      ...productForm,
      categoria: categoriaDefinida,
      preco: Number(productForm.preco),
      ativo: true
    };

    if (editingId) {
      novosProdutos = novosProdutos.map(p => p.id === editingId ? { ...dadosSalvar, id: editingId } : p);
    } else {
      dadosSalvar.id = Date.now().toString();
      novosProdutos.push(dadosSalvar);
    }

    setProducts(novosProdutos);
    localStorage.setItem('doces_produtos_teste_v2', JSON.stringify(novosProdutos));
    alert("Doce salvo com sucesso!");
    setFormOpen(false);
    resetForm();
  }

  function handleDelete(id?: string) {
    const targetId = id || editingId;
    if (!targetId) return;
    if (!confirm("Deseja realmente excluir este doce?")) return;

    const novos = products.filter(p => p.id !== targetId);
    setProducts(novos);
    localStorage.setItem('doces_produtos_teste_v2', JSON.stringify(novos));
    setFormOpen(false);
    resetForm();
  }

  const filtered = products.filter(p => 
    p.genero === genderFilter && (subFilter === 'TODOS' || p.categoria === subFilter)
  );

  const cssStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Great+Vibes&display=swap');
    
    :root { 
      --pink-glow: #ff1493;
      --pink-sweet: #ff4da6;
      --pink-light: #fff0f5;
      --gold-dark: #b8860b; 
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
      background: rgba(255, 255, 255, 0.9); 
      backdrop-filter: blur(10px);
      padding: 15px 5%; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      border-bottom: 3px solid var(--pink-sweet); 
      position: sticky; 
      top: 0; 
      z-index: 500; 
      box-shadow: 0 4px 20px rgba(255, 20, 147, 0.15);
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
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 4px 10px rgba(92, 44, 59, 0.3);
    }
    .painel-btn:hover {
      background: var(--pink-glow);
      transform: scale(1.15) rotate(15deg);
      box-shadow: 0 0 15px var(--pink-glow);
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
      width: 48px; 
      height: 48px; 
      background: var(--pink-sweet);
      border-radius: 50%;
      font-size: 1.3rem;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 2px solid #fff;
      box-shadow: 0 4px 10px rgba(255, 20, 147, 0.3);
    }
    .bag-wrapper:hover .bag-container {
      transform: scale(1.15) rotate(-10deg);
      background: var(--pink-glow);
      box-shadow: 0 0 20px var(--pink-glow);
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
      top: -5px; 
      right: -5px; 
      background: var(--gold-shiny); 
      color: var(--text-brown); 
      font-size: 10px; 
      font-weight: 900; 
      width: 22px; 
      height: 22px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
      border: 1.5px solid #fff;
    }

    .hero-section { 
      position: relative; 
      width: 100%; 
      height: 50vh; 
      min-height: 350px; 
      background-size: cover; 
      background-position: center; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
    }
    .hero-overlay { 
      position: absolute; 
      inset: 0; 
      background: linear-gradient(135deg, rgba(255, 240, 245, 0.8) 0%, rgba(255, 77, 166, 0.6) 100%); 
    }
    .hero-content { 
      position: relative; 
      z-index: 10; 
      max-width: 700px; 
      padding: 25px; 
      text-align: center; 
    }
    
    .hero-title-main { 
      font-family: 'Great Vibes', cursive; 
      font-size: 6rem; 
      color: var(--pink-glow); 
      margin: 0;
      line-height: 1;
      text-shadow: 3px 3px 6px rgba(255, 255, 255, 0.9);
    }
    .hero-title-sub { 
      font-family: 'Playfair Display', serif; 
      font-size: 2.5rem; 
      font-weight: 700; 
      letter-spacing: 3px;
      color: var(--text-brown); 
      text-transform: uppercase;
      margin-top: -10px;
      margin-bottom: 15px;
    }
    .hero-subtitle { 
      font-size: 1.1rem; 
      font-weight: 600;
      color: var(--text-brown);
      margin-bottom: 20px; 
      letter-spacing: 0.5px;
      line-height: 1.5;
      background: rgba(255, 255, 255, 0.85);
      padding: 10px 20px;
      border-radius: 30px;
      display: inline-block;
      box-shadow: 0 4px 15px rgba(255, 20, 147, 0.1);
    }
    .hero-badge {
      display: inline-block;
      background: var(--pink-glow);
      color: #fff;
      padding: 6px 20px;
      font-size: 0.75rem;
      border-radius: 20px;
      margin-bottom: 12px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      box-shadow: 0 4px 15px rgba(255, 20, 147, 0.3);
    }

    .nav-main { 
      display: flex; 
      justify-content: center; 
      gap: 30px; 
      padding: 22px 15px; 
      background: rgba(255, 255, 255, 0.9); 
      backdrop-filter: blur(5px);
      border-bottom: 2px solid var(--pink-light); 
    }
    .nav-main button { 
      background: none; 
      border: none; 
      cursor: pointer; 
      letter-spacing: 1.5px; 
      font-weight: 800; 
      font-family: 'Montserrat', sans-serif; 
      font-size: 0.85rem;
      color: #a37c88;
      text-transform: uppercase;
      transition: 0.3s;
      padding-bottom: 6px;
    }
    .nav-main button.active-gender { 
      color: var(--pink-glow) !important; 
      border-bottom: 4px solid var(--pink-glow); 
      text-shadow: 0 0 10px rgba(255, 20, 147, 0.2);
    }

    .sub-nav { 
      display: flex; 
      justify-content: center; 
      gap: 10px; 
      padding: 18px; 
      flex-wrap: wrap; 
      background: rgba(255, 240, 245, 0.7); 
      border-bottom: 1px solid rgba(255, 20, 147, 0.1); 
    }
    .sub-btn { 
      background: #fff; 
      border: 2px solid #ffd1dc; 
      padding: 8px 20px; 
      font-size: 0.75rem; 
      font-weight: 700;
      cursor: pointer; 
      color: var(--text-brown); 
      border-radius: 25px; 
      text-transform: uppercase;
      transition: all 0.3s ease;
      box-shadow: 0 3px 6px rgba(0,0,0,0.04);
    }
    .sub-btn:hover {
      border-color: var(--pink-sweet);
      transform: translateY(-2px);
    }
    .sub-btn.active { 
      background: var(--pink-sweet); 
      color: #fff; 
      border-color: var(--pink-sweet); 
      box-shadow: 0 4px 12px rgba(255, 77, 166, 0.4);
    }

    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); 
      gap: 35px; 
      padding: 40px 5%; 
      position: relative;
      z-index: 5;
    }
    
    .card { 
      background: #fff; 
      border: 2px solid #ffe4e1; 
      position: relative; 
      overflow: hidden; 
      display: flex; 
      flex-direction: column; 
      border-radius: 20px; 
      box-shadow: 0 10px 25px rgba(255, 77, 166, 0.1);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .card:hover {
      transform: translateY(-10px) scale(1.02);
      border-color: var(--pink-sweet);
      box-shadow: 0 15px 35px rgba(255, 20, 147, 0.25);
    }
    
    .img-container { 
      width: 100%; 
      height: 310px; 
      background: #fffefb; 
      position: relative; 
      overflow: hidden;
      border-bottom: 2px solid var(--pink-light);
    }
    
    .img-container img {
      transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .card:hover .img-container img {
      transform: scale(1.08) rotate(1.5deg);
    }
    
    .product-info { 
      padding: 24px; 
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
      margin: 0 0 8px 0;
    }
    .product-price { 
      font-size: 1.4rem; 
      font-weight: 800; 
      color: var(--pink-glow); 
      text-shadow: 0 0 5px rgba(255, 20, 147, 0.1);
      margin-bottom: 18px; 
    }

    .selector-label { 
      font-size: 0.65rem; 
      color: #b08d98; 
      text-transform: uppercase; 
      font-weight: 800; 
      margin-top: 12px; 
      display: block; 
    }
    .options-container { 
      display: flex; 
      justify-content: center; 
      gap: 8px; 
      margin-bottom: 15px; 
      flex-wrap: wrap; 
    }
    .opt-btn { 
      border: 2px solid #ffd1dc; 
      background: #fff; 
      padding: 6px 14px; 
      font-size: 0.75rem; 
      font-weight: 700;
      color: var(--text-brown);
      cursor: pointer; 
      border-radius: 8px; 
      transition: all 0.2s ease;
    }
    .opt-btn:hover {
      border-color: var(--pink-sweet);
    }
    .opt-btn.active { 
      background: var(--pink-sweet); 
      color: #fff; 
      border-color: var(--pink-sweet); 
      box-shadow: 0 4px 10px rgba(255, 77, 166, 0.3);
    }
    
    .btn-buy { 
      width: 100%; 
      background: linear-gradient(135deg, var(--pink-glow) 0%, var(--pink-sweet) 100%);
      color: #fff; 
      border: none; 
      padding: 16px; 
      font-size: 0.8rem; 
      font-weight: 800; 
      cursor: pointer; 
      text-transform: uppercase; 
      border-radius: 12px; 
      letter-spacing: 1px;
      transition: all 0.3s ease;
      box-shadow: 0 6px 18px rgba(255, 20, 147, 0.3);
    }
    .btn-buy:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(255, 20, 147, 0.5);
    }

    .drawer { 
      position: fixed; 
      right: -100%; 
      top: 0; 
      width: 100%; 
      max-width: 420px; 
      height: 100%; 
      background: #fff; 
      z-index: 9999; 
      transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
      padding: 30px; 
      box-sizing: border-box; 
      overflow-y: auto; 
      border-left: 3px solid var(--pink-sweet);
      box-shadow: -10px 0 40px rgba(255, 20, 147, 0.1); 
    }
    .drawer.open { 
      right: 0; 
    }
    
    .cart-item { 
      display: flex; 
      gap: 15px; 
      padding: 15px 0; 
      border-bottom: 1px solid var(--pink-light); 
      align-items: center; 
    }
    .cart-item img { 
      width: 60px; 
      height: 80px; 
      object-fit: cover; 
      background: #fff;
      border-radius: 8px; 
      border: 1px solid var(--pink-light);
    }

    .primary-btn { 
      width: 100%; 
      background: var(--pink-glow); 
      color: #fff; 
      border: none; 
      padding: 16px; 
      font-size: 0.8rem; 
      font-weight: 800; 
      cursor: pointer; 
      text-transform: uppercase; 
      border-radius: 12px; 
      letter-spacing: 1px;
      box-shadow: 0 6px 18px rgba(255, 20, 147, 0.3);
    }
    .primary-btn:hover {
      box-shadow: 0 10px 25px rgba(255, 20, 147, 0.5);
    }
    
    .admin-form label { 
      display: block; 
      font-size: 0.7rem; 
      font-weight: 700; 
      margin-top: 14px; 
      color: var(--pink-sweet); 
      text-transform: uppercase;
    }
    .admin-form input, .admin-form select { 
      width: 100%; 
      padding: 12px; 
      background: #fff;
      color: var(--text-brown);
      border: 1.5px solid #ffd1dc; 
      box-sizing: border-box; 
      font-size: 0.8rem; 
      border-radius: 8px; 
      margin-top: 5px; 
    }

    .btn-add-new { 
      position: fixed; 
      bottom: 30px; 
      left: 30px; 
      background: var(--pink-glow); 
      color: #fff; 
      width: 56px; 
      height: 56px; 
      border-radius: 50%; 
      border: none; 
      font-size: 26px; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      z-index: 1000; 
      box-shadow: 0 4px 15px rgba(255, 20, 147, 0.4); 
    }

    .whatsapp-float {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background-color: #25d366;
      color: #fff;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      text-align: center;
      font-size: 30px;
      box-shadow: 2px 4px 20px rgba(37, 211, 102, 0.4);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: all 0.3s ease;
    }
    .whatsapp-float:hover {
      background-color: #128c7e;
      transform: scale(1.15) rotate(10deg);
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
          onClick={() => prompt('Senha administrativa (Apenas digite 2004 para testar):') === '2004' ? setAdminOpen(!adminOpen) : null}
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
            onClick={() => { setGenderFilter(g); setSubFilter('TODOS'); }}
          >
            {g === 'DIARIO' ? '🧁 Disponíveis Hoje' : '📅 Encomendas Especiais'}
          </button>
        ))}
      </nav>

      <div className="sub-nav">
        <button className={`sub-btn ${subFilter === 'TODOS' ? 'active' : ''}`} onClick={() => setSubFilter('TODOS')}>TODOS</button>
        {categoriasMap[genderFilter]?.map(cat => (
          <button key={cat} className={`sub-btn ${subFilter === cat ? 'active' : ''}`} onClick={() => setSubFilter(cat)}>{cat.toUpperCase()}</button>
        ))}
      </div>

      <main className="grid">
        {filtered.map(prod => (
          <div key={prod.id} className="card">
            {adminOpen && (
              <div style={{position:'absolute', zIndex:10, top:'12px', left:'12px', display:'flex', gap:'5px'}}>
                <button onClick={() => { setEditingId(prod.id); setProductForm(prod); setFormOpen(true); }} style={{background:'#000', color:'#fff', border:'none', padding:'6px 12px', cursor:'pointer', fontSize:'0.65rem', borderRadius:'4px'}}>EDITAR</button>
                <button onClick={() => handleDelete(prod.id)} style={{background:'red', color:'#fff', border:'none', padding:'6px 12px', cursor:'pointer', fontSize:'0.65rem', borderRadius:'4px'}}>EXCLUIR</button>
              </div>
            )}
            <div className="img-container">
              <img src={prod.fotos?.[0] || 'https://via.placeholder.com/300'} alt={prod.nome} style={{width:'100%', height:'100%', objectFit:'cover'}} />
            </div>
            <div className="product-info">
              <div>
                <p className="product-name">{prod.nome}</p>
                <p className="product-price">R$ {Number(prod.preco).toFixed(2)}</p>

                <span className="selector-label">Escolha o Tamanho</span>
                <div className="options-container">
                  {TAMANHOS_OPCOES.map(t => (
                    <button 
                      key={t}
                      className={`opt-btn ${selectedSize[prod.id] === t ? 'active' : ''}`}
                      onClick={() => setSelectedSize({...selectedSize, [prod.id]: t})}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {prod.cores && (
                  <>
                    <span className="selector-label">Escolha o Sabor</span>
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
              </div>

              <button className="btn-buy" onClick={() => addToCart(prod)}>ADICIONAR À SACOLA</button>
            </div>
          </div>
        ))}
      </main>

      <div className={`drawer ${cartOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid var(--pink-sweet)', paddingBottom:'15px'}}>
          <h2 style={{fontFamily: 'Playfair Display', fontSize: '1.3rem', margin:0, color: 'var(--pink-glow)'}}>SUA SACOLA 👜</h2>
          <button onClick={() => setCartOpen(false)} style={{background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer', color: 'var(--pink-sweet)'}}>✕</button>
        </div>

        {cart.length === 0 ? (
          <p style={{textAlign:'center', marginTop:'30px', color:'#a37c88', fontSize:'0.8rem'}}>Sua sacola está vazia.</p>
        ) : (
          <>
            <div style={{marginTop:'15px'}}>
              {cart.map((item) => (
                <div key={item.idCarrinho} className="cart-item">
                  <img src={item.fotos?.[0] || ''} alt="" />
                  <div style={{flex:1}}>
                    <p style={{fontSize:'0.8rem', fontWeight:'700', margin:0, color: 'var(--text-brown)'}}>{item.nome}</p>
                    <p style={{fontSize:'0.7rem', color:'#888', margin:'4px 0'}}>
                      Tamanho: {item.tamanhoEscolhido} | Sabor: {item.corEscolhida}
                    </p>
                    <p style={{fontSize:'0.85rem', fontWeight:'700', color:'var(--pink-glow)', margin:0}}>R$ {Number(item.preco).toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.idCarrinho)} style={{background:'none', border:'none', color:'red', cursor:'pointer', fontSize:'0.7rem', fontWeight: 600}}>Excluir</button>
                </div>
              ))}
            </div>

            <div style={{marginTop:'30px', borderTop:'2px solid var(--pink-sweet)', paddingTop:'20px'}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom: '15px', fontWeight: 600}}>
                <span>VALOR TOTAL:</span>
                <span style={{color:'var(--pink-glow)', fontSize: '1.2rem', fontWeight: 800}}>R$ {totalCart.toFixed(2)}</span>
              </div>
              <button className="primary-btn" onClick={finalizarPedido}>ENVIAR PEDIDO PRO WHATSAPP</button>
            </div>
          </>
        )}
      </div>

      <div className={`drawer ${formOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '2px solid var(--pink-sweet)', paddingBottom: '15px'}}>
          <h2 style={{fontFamily: 'Playfair Display', fontSize: '1.1rem', margin:0, color: 'var(--pink-glow)'}}>{editingId ? 'EDITAR DOCE' : 'ADICIONAR DOCE'}</h2>
          <button onClick={() => { setFormOpen(false); resetForm(); }} style={{background: 'var(--pink-light)', color: 'var(--pink-glow)', border:'none', padding:'6px 12px', cursor:'pointer', fontSize:'0.65rem', borderRadius:'4px', fontWeight: 700}}>FECHAR</button>
        </div>

        <div style={{background: 'var(--pink-light)', padding: '15px', borderRadius: '12px', marginTop: '15px', border: '1.5px solid #ffd1dc'}}>
          <h3 style={{fontSize: '0.8rem', margin: '0 0 10px 0', color: 'var(--pink-glow)', fontWeight: 700, textTransform: 'uppercase'}}>📂 Gerenciar Categorias</h3>
          
          <div style={{display: 'flex', gap: '5px', marginTop: '5px'}}>
            <input 
              type="text" 
              placeholder="Nome da categoria" 
              value={novaCatNome} 
              onChange={e => setNovaCatNome(e.target.value)}
              style={{flex: 1, padding: '8px', fontSize: '0.75rem', borderRadius: '6px', border: '1.5px solid #ffd1dc', background: '#fff'}}
            />
            <select 
              value={novaCatGrupo} 
              onChange={e => setNovaCatGrupo(e.target.value)}
              style={{width: '110px', padding: '8px', fontSize: '0.75rem', borderRadius: '6px', border: '1.5px solid #ffd1dc', background: '#fff'}}
            >
              <option value="DIARIO">Hoje</option>
              <option value="ENCOMENDAS">Encomenda</option>
            </select>
            <button 
              onClick={handleCriarCategoria}
              style={{background: 'var(--pink-glow)', color: '#fff', border: 'none', padding: '0 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem'}}
            >
              CRIAR
            </button>
          </div>

          <div style={{marginTop: '12px'}}>
            <p style={{fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-brown)', textTransform: 'uppercase', marginBottom: '6px'}}>Suas Categorias (Toque no ✕ para apagar):</p>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '100px', overflowY: 'auto', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #ffd1dc'}}>
              {categoriasMap[novaCatGrupo]?.map(cat => (
                <span 
                  key={cat} 
                  style={{fontSize: '0.65rem', background: '#ffd1dc', color: 'var(--text-brown)', padding: '3px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700}}
                >
                  {cat.toUpperCase()}
                  <button 
                    onClick={() => handleExcluirCategoria(novaCatGrupo, cat)}
                    style={{background: 'none', border: 'none', color: 'var(--pink-glow)', cursor: 'pointer', fontWeight: 900, fontSize: '0.7rem'}}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-form" style={{marginTop: '15px'}}>
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

          <label>Sabores (separados por vírgula)</label>
          <input 
            type="text" 
            placeholder="Ex: Ninho, Brigadeiro, Nutella" 
            value={productForm.cores} 
            onChange={e => setProductForm({...productForm, cores: e.target.value})} 
          />

          <label>Foto do Doce (Upload Local)</label>
          <input type="file" accept="image/*" multiple onChange={handleLocalImageUpload} />

          {productForm.fotos?.length > 0 && (
            <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'10px'}}>
              {productForm.fotos.map((f: string, i: number) => (
                <img key={i} src={f} alt="" style={{width:'50px', height:'50px', objectFit:'cover', borderRadius:'6px'}} />
              ))}
            </div>
          )}

          <label>Alterar Fundo do Banner</label>
          <input type="file" accept="image/*" onChange={handleBannerBackgroundUpload} />

          <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
            <button className="primary-btn" onClick={handleSave}>SALVAR DOCE</button>
            {editingId && (
              <button 
                onClick={() => handleDelete()} 
                style={{background:'red', color:'#fff', border:'none', padding:'12px', borderRadius:'12px', cursor:'pointer', fontWeight:800, fontSize:'0.75rem'}}
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