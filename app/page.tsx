'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { messaging, getToken } from '@/firebase';

const SUPABASE_URL = 'https://sbathmpywhfdevycxkaw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WRIwUZc0djyssSI5DyJAhg_xHwey4bl';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WHATSAPP_NUM = '554497162755';
const SENHA_ADMIN = '2004'; // Senha de acesso ao painel

export default function DocesDaRosaSite() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [isAdminAutenticado, setIsAdminAutenticado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  
  const [formOpen, setFormOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); 
  const [genderFilter, setGenderFilter] = useState('DIARIO'); 
  const [subFilter, setSubFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [dataEncomenda, setDataEncomenda] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  const [modalImage, setModalImage] = useState<string | null>(null);

  const [mensagemPush, setMensagemPush] = useState('🧁 Novidade Deliciosa na Doces da Rosa! Confira agora o que preparamos para você.');
  const [mostrarBannerNotificacao, setMostrarBannerNotificacao] = useState(true);

  const [categoriasMap, setCategoriasMap] = useState<Record<string, string[]>>({
    DIARIO: ['bolo no pote', 'copo da felicidade', 'docinhos individuais'],
    ENCOMENDAS: ['bolos festivos', 'cento de docinhos', 'tortas inteiras', 'kits presente']
  });

  const [novaCatNome, setNovaCatNome] = useState('');
  const [novaCatGrupo, setNovaCatGrupo] = useState('DIARIO');
  
  const [backgroundImage, setBackgroundImage] = useState('https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1600&q=80');

  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});

  const [productForm, setProductForm] = useState<any>({
    nome: '', preco: '', genero: 'DIARIO', categoria: 'bolo no pote', fotos: [], descricao: '', ativo: true, enviarNotificacaoPush: false
  });

  const [historicoPedidos, setHistoricoPedidos] = useState<any[]>([]);
  const [abaAdminAtiva, setAbaAdminAtiva] = useState<'produtos' | 'financeiro' | 'agenda'>('produtos');

  const [manualCliente, setManualCliente] = useState('');
  const [manualTelefone, setManualTelefone] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualValor, setManualValor] = useState('');
  const [manualData, setManualData] = useState('');
  const [manualDataEntrega, setManualDataEntrega] = useState('');

  const ativarNotificacoesPush = async () => {
    try {
      if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          await supabase
            .from("fcm_tokens")
            .upsert([{ token: currentToken }], { onConflict: "token" });
          alert("Notificações ativadas com sucesso! 🧁");
        }
      } else {
        alert("Permissão de notificação negada. Você pode ativar depois nas configurações do navegador.");
      }
    } catch (error) {
      console.error("Erro ao configurar notificações:", error);
    }
    setMostrarBannerNotificacao(false);
  };

  const fetchData = async () => {
    const { data: prodData } = await supabase.from('produtos_doces').select('*');
    if (prodData) {
      const listaLimpa = prodData.filter((item: any) => 
        String(item.id) !== '88888888' && 
        String(item.id) !== '99999999' &&
        item.genero !== 'CONFIG' && 
        item.nome
      );
      setProducts(listaLimpa);
    }

    const { data: pedData } = await supabase.from('produtos_doces').select('*').eq('genero', 'PEDIDO_REGISTRADO');
    if (pedData) {
      setHistoricoPedidos(pedData);
    }
  };

  const fetchConfig = async () => {
    const { data: catData } = await supabase.from('produtos_doces').select('*').eq('id', 99999999).maybeSingle();
    if (catData && catData.descricao) {
      try {
        const catsParsed = JSON.parse(catData.descricao);
        setCategoriasMap(catsParsed);
        if (!subFilter || !catsParsed[genderFilter]?.includes(subFilter)) {
          setSubFilter(catsParsed[genderFilter]?.[0] || '');
        }
      } catch (e) {
        console.error("Erro ao ler categorias", e);
      }
    }

    const { data: bannerData } = await supabase.from('produtos_doces').select('*').eq('id', 88888888).maybeSingle();
    if (bannerData && bannerData.descricao) {
      setBackgroundImage(bannerData.descricao);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchData();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos_doces' }, () => {
        fetchData();
        fetchConfig();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [genderFilter]);

  const handleLoginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaInput === SENHA_ADMIN) {
      setIsAdminAutenticado(true);
      setAdminOpen(true);
      setSenhaInput('');
    } else {
      alert("Senha incorreta!");
      setSenhaInput('');
    }
  };

  const handleSalvarBanner = async (novaFotoUrl: string) => {
    setBackgroundImage(novaFotoUrl);
    await supabase.from('produtos_doces').upsert({
      id: 88888888,
      nome: 'CONFIG_BANNER',
      genero: 'CONFIG',
      categoria: 'CONFIG',
      preco: 0,
      ativo: true,
      descricao: novaFotoUrl
    });
    alert("Banner atualizado com sucesso!");
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
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

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        handleSalvarBanner(dataUrl);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleCriarCategoria = async () => {
    if (!novaCatNome.trim()) return alert("Digite o nome da categoria!");
    const nomeLimpo = novaCatNome.trim().toLowerCase();
    const grupo = novaCatGrupo;

    if (categoriasMap[grupo]?.includes(nomeLimpo)) {
      return alert("Essa categoria já existe neste grupo!");
    }

    const novasCategorias = {
      ...categoriasMap,
      [grupo]: [...(categoriasMap[grupo] || []), nomeLimpo].sort()
    };

    setCategoriasMap(novasCategorias);
    setNovaCatNome('');

    await supabase.from('produtos_doces').upsert({
      id: 99999999,
      nome: 'CONFIG_CATS',
      genero: 'CONFIG',
      categoria: 'CONFIG',
      preco: 0,
      ativo: true,
      descricao: JSON.stringify(novasCategorias)
    });
  };

  const handleExcluirCategoria = async (grupo: string, catExcluir: string) => {
    if (!confirm(`Deseja excluir a categoria "${catExcluir.toUpperCase()}"?`)) return;

    const novasCategorias = {
      ...categoriasMap,
      [grupo]: categoriasMap[grupo].filter(c => c !== catExcluir)
    };

    setCategoriasMap(novasCategorias);
    if (subFilter === catExcluir) {
      setSubFilter(novasCategorias[grupo][0] || '');
    }

    const { error } = await supabase.from('produtos_doces').upsert({
      id: 99999999,
      nome: 'CONFIG_CATS',
      genero: 'CONFIG',
      categoria: 'CONFIG',
      preco: 0,
      ativo: true,
      descricao: JSON.stringify(novasCategorias)
    });

    if (error) {
      alert("Erro ao salvar categorias no banco: " + error.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    const primeiraCatDoGrupo = categoriasMap['DIARIO']?.[0] || 'bolo no pote';
    setProductForm({ nome: '', preco: '', genero: 'DIARIO', categoria: primeiraCatDoGrupo, fotos: [], descricao: '', ativo: true, enviarNotificacaoPush: false });
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
  };

  const removeFromCart = (idCarrinho: number) => {
    setCart(cart.filter(item => item.idCarrinho !== idCarrinho));
  };

  const totalCart = cart.reduce((acc, item) => 
    item.selecionado ? acc + (item.preco * item.quantidadeEscolhida) : acc
  , 0);

  const finalizarPedido = async () => {
    const itensSelecionados = cart.filter(item => item.selecionado);
    if (itensSelecionados.length === 0) return alert("Selecione ao menos um doce na sua sacola!");

    const temEncomenda = genderFilter === 'ENCOMENDAS' || itensSelecionados.some(i => i.genero === 'ENCOMENDAS');
    if (temEncomenda && !dataEncomenda) {
      return alert("Por favor, informe a Data e Hora desejada para a sua encomenda!");
    }

    const agora = new Date();
    const pedidoId = Date.now();
    const resumoItens = itensSelecionados.map(i => `${i.quantidadeEscolhida}x ${i.nome}`).join(', ');

    await supabase.from('produtos_doces').upsert({
      id: pedidoId,
      nome: `Pedido Site: ${resumoItens}`,
      preco: totalCart,
      genero: 'PEDIDO_REGISTRADO',
      categoria: 'FINANCEIRO',
      descricao: dataEncomenda ? `Encomenda para: ${dataEncomenda}` : 'Pedido Diário',
      created_at: agora.toISOString(),
      ativo: true
    });

    let msg = `*NOVO PEDIDO - DOCES DA ROSA* 🌸\n\n`;
    itensSelecionados.forEach(item => {
      msg += `• ${item.quantidadeEscolhida}x ${item.nome} - R$ ${(item.preco * item.quantidadeEscolhida).toFixed(2)}\n`;
    });

    if (temEncomenda && dataEncomenda) {
      const dataFormatada = new Date(dataEncomenda).toLocaleString('pt-BR');
      msg += `\n📅 *Data/Hora para Encomenda:* ${dataFormatada}\n`;
    }

    msg += `\n*TOTAL DO PEDIDO: R$ ${totalCart.toFixed(2)}*\n\n_Gostaria de combinar a entrega/retirada em Maringá!_`;
    
    setCart([]);
    setCartOpen(false);
    fetchData();
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`);
  };

  const handleLancarManual = async () => {
    if (!manualCliente.trim()) return alert("Digite o nome da cliente!");
    if (!manualDesc.trim()) return alert("Digite a descrição do pedido/venda!");
    if (!manualValor || Number(manualValor) <= 0) return alert("Digite um valor válido!");

    const pedidoId = Date.now();
    const dataObj = manualData ? new Date(manualData + 'T12:00:00') : new Date();
    
    let infoExtra = `Cliente: ${manualCliente.trim()}`;
    if (manualTelefone.trim()) {
      infoExtra += ` | Tel: ${manualTelefone.trim()}`;
    }
    if (manualDataEntrega) {
      infoExtra += ` | Encomenda para: ${manualDataEntrega}`;
    }

    const { error } = await supabase.from('produtos_doces').upsert({
      id: pedidoId,
      nome: `${manualCliente.trim()} - ${manualDesc.trim()}`,
      preco: Number(manualValor),
      genero: 'PEDIDO_REGISTRADO',
      categoria: 'FINANCEIRO',
      descricao: infoExtra,
      created_at: dataObj.toISOString(),
      ativo: true
    });

    if (!error) {
      alert("Venda/Encomenda manual lançada com sucesso!");
      setManualCliente('');
      setManualTelefone('');
      setManualDesc('');
      setManualValor('');
      setManualData('');
      setManualDataEntrega('');
      fetchData();
    }
  };

  const handleDeletarPedido = async (idPedido: string) => {
    if (!confirm("Deseja realmente apagar este lançamento?")) return;
    await supabase.from('produtos_doces').delete().eq('id', idPedido);
    fetchData();
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
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
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

  const handleRemoveSinglePhoto = (indexToRemove: number) => {
    setProductForm((prev: any) => ({
      ...prev,
      fotos: prev.fotos.filter((_: any, index: number) => index !== indexToRemove)
    }));
  };

  async function handleSave() {
    const categoriaDefinida = productForm.categoria || categoriasMap[productForm.genero]?.[0] || '';
    if (!productForm.nome.trim()) return alert("Digite o nome do doce!");

    // CORREÇÃO AQUI: Força o ID a virar número inteiro para bater com a tabela do Supabase[cite: 4]
    const dadosSalvar = {
      id: editingId ? Number(editingId) : Date.now(),
      nome: productForm.nome.trim(),
      preco: Number(productForm.preco) || 0,
      genero: productForm.genero,
      categoria: categoriaDefinida,
      fotos: productForm.fotos || [],
      descricao: productForm.descricao || '',
      ativo: true
    };

    const { error } = await supabase.from('produtos_doces').upsert(dadosSalvar);
    if (error) {
      alert("Erro ao salvar: " + error.message);
      console.error(error);
      return;
    }

    if (productForm.enviarNotificacaoPush) {
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: { title: "🧁 Novidade da Rosa!", body: mensagemPush }
        });
      } catch (err) {
        console.error(err);
      }
    }

    alert("Doce salvo com sucesso!");
    setFormOpen(false);
    resetForm();
    fetchData();
  }

  async function handleDelete(id?: string | number) {
    const targetId = id || editingId;
    if (!targetId) return;
    if (!confirm("Deseja realmente excluir este doce?")) return;

    await supabase.from('produtos_doces').delete().eq('id', targetId);
    setFormOpen(false);
    resetForm();
    fetchData();
  }

  const faturamentoPorMes = historicoPedidos.reduce((acc: any, ped: any) => {
    const dataRef = ped.created_at ? new Date(ped.created_at) : new Date();
    const mesAno = dataRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
    
    if (!acc[mesAno]) {
      acc[mesAno] = { total: 0, quantidade: 0, pedidos: [] };
    }
    acc[mesAno].total += Number(ped.preco) || 0;
    acc[mesAno].quantidade += 1;
    acc[mesAno].pedidos.push(ped);
    return acc;
  }, {});

  const listaEncomendasAgenda = historicoPedidos
    .filter(p => p.descricao && p.descricao.includes('Encomenda para:'))
    .map(p => {
      const matchData = p.descricao.match(/Encomenda para:\s*([^|]*)/);
      const dataStr = matchData ? matchData[1].trim() : '';
      
      const matchCliente = p.descricao.match(/Cliente:\s*([^|]*)/);
      const clienteStr = matchCliente ? matchCliente[1].trim() : (p.nome.includes(' - ') ? p.nome.split(' - ')[0] : 'Cliente');

      const matchTel = p.descricao.match(/Tel:\s*([^|]*)/);
      const telStr = matchTel ? matchTel[1].trim() : '';

      return {
        ...p,
        clienteStr,
        telStr,
        dataEntregaStr: dataStr,
        dataEntregaObj: dataStr ? new Date(dataStr) : new Date(p.created_at)
      };
    })
    .sort((a, b) => a.dataEntregaObj.getTime() - b.dataEntregaObj.getTime());

  const filtered = products.filter(p => 
    p.genero === genderFilter && (subFilter === '' || p.categoria === subFilter)
  );

  const cssStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700;800&family=Great+Vibes&display=swap');
    
    :root { 
      --pink-glow: #e60073; 
      --pink-sweet: #ff3399; 
      --pink-light: #fff0f5; 
      --gold-shiny: #d4af37; 
      --bg-gradient: linear-gradient(135deg, #fff9fb 0%, #fff0f5 50%, #ffe6f0 100%); 
      --text-brown: #3d1a24; 
      --card-shadow: 0 10px 30px rgba(230, 0, 115, 0.08);
      --card-hover-shadow: 0 16px 40px rgba(230, 0, 115, 0.16);
    }

    body { 
      margin: 0; 
      font-family: 'Montserrat', sans-serif; 
      background: var(--bg-gradient); 
      background-attachment: fixed; 
      color: var(--text-brown); 
      overflow-x: hidden; 
      -webkit-font-smoothing: antialiased;
    }

    header { 
      background: rgba(255, 255, 255, 0.94); 
      backdrop-filter: blur(16px); 
      padding: 14px 6%; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      border-bottom: 2px solid rgba(255, 182, 193, 0.4); 
      position: sticky; 
      top: 0; 
      z-index: 500; 
      box-shadow: 0 4px 25px rgba(230, 0, 115, 0.05); 
    }

    .painel-btn { 
      cursor: pointer; 
      width: 44px; 
      height: 44px; 
      font-size: 1.2rem; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: var(--text-brown); 
      border: 2px solid var(--gold-shiny); 
      border-radius: 50%; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      box-shadow: 0 4px 12px rgba(61, 26, 36, 0.15); 
    }
    .painel-btn:hover { transform: scale(1.08); }

    .bag-wrapper { display: flex; flex-direction: column; align-items: center; cursor: pointer; gap: 3px; }
    .bag-container { 
      position: relative; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      width: 46px; 
      height: 46px; 
      background: linear-gradient(135deg, var(--pink-glow), var(--pink-sweet)); 
      border-radius: 50%; 
      font-size: 1.15rem; 
      border: 2px solid #fff; 
      box-shadow: 0 6px 16px rgba(230, 0, 115, 0.25); 
      transition: transform 0.3s ease;
    }
    .bag-container:hover { transform: scale(1.08); }
    .bag-text { font-size: 0.62rem; font-weight: 700; color: var(--pink-glow); text-transform: uppercase; letter-spacing: 0.5px; }
    .bag-badge { 
      position: absolute; 
      top: -4px; 
      right: -4px; 
      background: var(--gold-shiny); 
      color: #fff; 
      font-size: 10px; 
      font-weight: 900; 
      width: 20px; 
      height: 20px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border: 2px solid #fff; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }

    .hero-section { 
      position: relative; 
      width: 100%; 
      height: 400px; 
      background-size: cover; 
      background-position: center center; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
    }
    .hero-overlay { 
      position: absolute; 
      inset: 0; 
      background: linear-gradient(135deg, rgba(255, 240, 245, 0.88) 0%, rgba(230, 0, 115, 0.4) 100%); 
    }
    .hero-content { position: relative; z-index: 10; max-width: 750px; padding: 20px; text-align: center; }
    .hero-title-main { 
      font-family: 'Great Vibes', cursive; 
      font-size: 5.6rem; 
      color: var(--pink-glow); 
      margin: 0; 
      line-height: 0.9; 
      text-shadow: 2px 4px 12px rgba(255, 255, 255, 0.9); 
    }
    .hero-title-sub { 
      font-family: 'Playfair Display', serif; 
      font-size: 2.3rem; 
      font-weight: 700; 
      letter-spacing: 3px; 
      color: var(--text-brown); 
      text-transform: uppercase; 
      margin-top: 2px; 
      margin-bottom: 12px; 
    }
    .hero-subtitle { 
      font-size: 0.95rem; 
      font-weight: 500; 
      color: var(--text-brown); 
      background: rgba(255, 255, 255, 0.95); 
      padding: 10px 24px; 
      border-radius: 30px; 
      display: inline-block; 
      box-shadow: 0 6px 20px rgba(0,0,0,0.06);
    }
    .hero-badge { 
      display: inline-block; 
      background: var(--pink-glow); 
      color: #fff; 
      padding: 6px 18px; 
      font-size: 0.68rem; 
      border-radius: 20px; 
      margin-bottom: 10px; 
      font-weight: 700; 
      letter-spacing: 2px; 
      text-transform: uppercase; 
      box-shadow: 0 4px 12px rgba(230, 0, 115, 0.2);
    }

    .nav-main { 
      display: flex; 
      justify-content: center; 
      gap: 30px; 
      padding: 18px 15px; 
      background: rgba(255, 255, 255, 0.92); 
      border-bottom: 1.5px solid rgba(255, 182, 193, 0.3); 
    }
    .nav-main button { 
      background: none; 
      border: none; 
      cursor: pointer; 
      font-weight: 700; 
      font-size: 0.82rem; 
      color: #9c6c7c; 
      text-transform: uppercase; 
      letter-spacing: 1px;
      transition: color 0.3s ease;
      padding-bottom: 4px;
    }
    .nav-main button:hover { color: var(--pink-glow); }
    .nav-main button.active-gender { color: var(--pink-glow) !important; border-bottom: 3px solid var(--pink-glow); }

    .sub-nav { 
      display: flex; 
      justify-content: center; 
      gap: 10px; 
      padding: 16px 5%; 
      flex-wrap: wrap; 
      background: rgba(255, 240, 245, 0.5); 
    }
    .sub-btn { 
      background: #fff; 
      border: 1.5px solid rgba(255, 182, 193, 0.5); 
      padding: 8px 18px; 
      font-size: 0.7rem; 
      font-weight: 700; 
      cursor: pointer; 
      color: var(--text-brown); 
      border-radius: 25px; 
      text-transform: uppercase; 
      letter-spacing: 0.5px;
      transition: all 0.25s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
    .sub-btn:hover { border-color: var(--pink-sweet); transform: translateY(-1px); }
    .sub-btn.active { background: linear-gradient(135deg, var(--pink-glow), var(--pink-sweet)); color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(230, 0, 115, 0.25); }

    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
      gap: 35px; 
      padding: 40px 6%; 
      max-width: 1300px; 
      margin: 0 auto; 
    }
    
    .card { 
      background: #fff; 
      border: 1.5px solid rgba(255, 228, 225, 0.8); 
      position: relative; 
      overflow: hidden; 
      display: flex; 
      flex-direction: column; 
      border-radius: 24px; 
      box-shadow: var(--card-shadow); 
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card:hover { 
      transform: translateY(-6px); 
      box-shadow: var(--card-hover-shadow); 
      border-color: rgba(255, 105, 180, 0.4);
    }

    .img-container { 
      width: 100%; 
      height: 290px; 
      background: #fff9fa; 
      position: relative; 
      overflow: hidden; 
      border-bottom: 1.5px solid rgba(255, 240, 245, 0.8); 
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
    .card:hover .img-container img { transform: scale(1.05); }

    .slider-btn { 
      position: absolute; 
      top: 50%; 
      transform: translateY(-50%); 
      background: rgba(255, 255, 255, 0.9); 
      color: var(--text-brown); 
      border: none; 
      width: 36px; 
      height: 36px; 
      border-radius: 50%; 
      font-weight: bold; 
      cursor: pointer; 
      z-index: 5; 
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      transition: background 0.2s;
    }
    .slider-btn:hover { background: #fff; color: var(--pink-glow); }
    .slider-btn.prev { left: 12px; } 
    .slider-btn.next { right: 12px; }

    .slider-dots { 
      position: absolute; 
      bottom: 12px; 
      left: 50%; 
      transform: translateX(-50%); 
      display: flex; 
      gap: 6px; 
      z-index: 5; 
      background: rgba(0,0,0,0.2);
      padding: 4px 8px;
      border-radius: 12px;
      backdrop-filter: blur(4px);
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.7); transition: all 0.3s; }
    .dot.active-dot { background: var(--pink-sweet); width: 18px; border-radius: 4px; }

    .product-info { 
      padding: 22px; 
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
      margin: 0 0 6px 0; 
    }
    .product-price { 
      font-size: 1.35rem; 
      font-weight: 800; 
      color: var(--pink-glow); 
      margin-bottom: 12px; 
    }
    .desc-box { 
      border: 1.5px solid rgba(255, 182, 193, 0.3); 
      background: #fff9fa; 
      padding: 12px 14px; 
      border-radius: 14px; 
      font-size: 0.75rem; 
      color: #6e4653; 
      margin-bottom: 16px; 
      font-weight: 500; 
      line-height: 1.4;
    }

    .qty-selector-container { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 16px; 
      margin-bottom: 14px; 
      background: #fff5f8;
      padding: 6px;
      border-radius: 20px;
      border: 1px solid rgba(255, 182, 193, 0.4);
    }
    .qty-btn { 
      width: 32px; 
      height: 32px; 
      border-radius: 50%; 
      border: 1.5px solid var(--pink-sweet); 
      background: #fff; 
      color: var(--pink-glow); 
      font-weight: 800; 
      cursor: pointer; 
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .qty-btn:hover { background: var(--pink-sweet); color: #fff; }
    .qty-value { font-size: 0.9rem; font-weight: 800; color: var(--text-brown); min-width: 20px; text-align: center; }

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
      letter-spacing: 1px;
      border-radius: 14px; 
      box-shadow: 0 6px 18px rgba(230, 0, 115, 0.25);
      transition: all 0.3s ease;
    }
    .btn-buy:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(230, 0, 115, 0.35); }

    .drawer { 
      position: fixed; 
      right: -100%; 
      top: 0; 
      width: 100%; 
      max-width: 440px; 
      height: 100%; 
      background: #fff; 
      z-index: 9999; 
      transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
      padding: 28px; 
      box-sizing: border-box; 
      overflow-y: auto; 
      border-left: 2px solid rgba(255, 182, 193, 0.5); 
      box-shadow: -10px 0 40px rgba(0,0,0,0.1);
    }
    .drawer.open { right: 0; }

    .cart-item { 
      display: flex; 
      gap: 14px; 
      padding: 14px 0; 
      border-bottom: 1px solid rgba(255, 228, 225, 0.8); 
      align-items: center; 
    }
    .cart-item img { width: 60px; height: 70px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(255, 182, 193, 0.4); }

    .primary-btn { 
      width: 100%; 
      background: linear-gradient(135deg, var(--pink-glow), var(--pink-sweet)); 
      color: #fff; 
      border: none; 
      padding: 15px; 
      font-size: 0.75rem; 
      font-weight: 800; 
      cursor: pointer; 
      text-transform: uppercase; 
      letter-spacing: 1px;
      border-radius: 14px; 
      box-shadow: 0 6px 18px rgba(230, 0, 115, 0.25);
      transition: all 0.3s;
    }
    .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(230, 0, 115, 0.35); }

    .admin-form label { display: block; font-size: 0.7rem; font-weight: 700; margin-top: 14px; color: var(--pink-sweet); text-transform: uppercase; letter-spacing: 0.5px; }
    .admin-form input, .admin-form select, .admin-form textarea { 
      width: 100%; 
      padding: 12px; 
      background: #fff; 
      color: var(--text-brown); 
      border: 1.5px solid rgba(255, 182, 193, 0.5); 
      box-sizing: border-box; 
      font-size: 0.78rem; 
      border-radius: 10px; 
      margin-top: 5px; 
      font-family: 'Montserrat', sans-serif;
      transition: border-color 0.2s;
    }
    .admin-form input:focus, .admin-form select:focus, .admin-form textarea:focus { outline: none; border-color: var(--pink-glow); }

    .btn-add-new { 
      position: fixed; 
      bottom: 30px; 
      left: 30px; 
      background: linear-gradient(135deg, var(--pink-glow), var(--pink-sweet)); 
      color: #fff; 
      width: 58px; 
      height: 58px; 
      border-radius: 50%; 
      border: 3px solid #fff; 
      font-size: 28px; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      z-index: 1000; 
      box-shadow: 0 6px 20px rgba(230, 0, 115, 0.4); 
      transition: transform 0.3s ease;
    }
    .btn-add-new:hover { transform: scale(1.1); }

    .whatsapp-float { 
      position: fixed; 
      bottom: 30px; 
      right: 30px; 
      background-color: #25d366; 
      color: #fff; 
      width: 60px; 
      height: 60px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 28px; 
      z-index: 999; 
      text-decoration: none; 
      border: 3px solid #fff; 
      box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
      transition: transform 0.3s ease;
    }
    .whatsapp-float:hover { transform: scale(1.1); }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      
      {mostrarBannerNotificacao && (
        <div style={{background: 'linear-gradient(135deg, var(--pink-glow), var(--pink-sweet))', color: '#fff', padding: '14px 6%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(230,0,115,0.25)', position: 'relative', zIndex: 600}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <span style={{fontSize: '1.5rem'}}>🔔</span>
            <div>
              <p style={{fontSize: '0.78rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px'}}>Ative as notificações!</p>
              <p style={{fontSize: '0.68rem', margin: '2px 0 0 0', opacity: 0.92}}>Receba avisos de novos doces fresquinhos e encomendas exclusivas.</p>
            </div>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button onClick={ativarNotificacoesPush} style={{background: '#fff', color: 'var(--pink-glow)', border: 'none', padding: '9px 16px', borderRadius: '25px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>ATIVAR</button>
            <button onClick={() => setMostrarBannerNotificacao(false)} style={{background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.7)', padding: '9px 12px', borderRadius: '25px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'}}>✕</button>
          </div>
        </div>
      )}

      <header>
        <div className="painel-btn" onClick={() => {
          if (isAdminAutenticado) {
            setAdminOpen(true);
          } else {
            setFormOpen(true);
          }
        }} title="Painel Administrativo">🧁</div>
        <div className="bag-wrapper" onClick={() => setCartOpen(true)}>
          <div className="bag-container">👜 {cart.length > 0 && <span className="bag-badge">{cart.reduce((a, b) => a + b.quantidadeEscolhida, 0)}</span>}</div>
          <span className="bag-text">Seus doces</span>
        </div>
      </header>

      <section className="hero-section" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-badge">🧁 Feitos com Carinho em Maringá</span>
          <h1 className="hero-title-main">Doces</h1>
          <h2 className="hero-title-sub">da Rosa</h2>
          <p className="hero-subtitle">Doces irresistíveis, feitos com carinho para deixar seu momento ainda mais especial!</p>
        </div>
      </section>

      {isAdminAutenticado && <button className="btn-add-new" onClick={() => { resetForm(); setFormOpen(true); }}>+</button>}

      <nav className="nav-main">
        {Object.keys(categoriasMap).map(g => (
          <button key={g} className={genderFilter === g ? 'active-gender' : ''} onClick={() => { setGenderFilter(g); setSubFilter(categoriasMap[g]?.[0] || ''); }}>
            {g === 'DIARIO' ? '🧁 Disponíveis Hoje' : '📅 Encomendas Especiais'}
          </button>
        ))}
      </nav>

      <div className="sub-nav">
        {categoriasMap[genderFilter]?.map(cat => (
          <button key={cat} className={`sub-btn ${subFilter === cat ? 'active' : ''}`} onClick={() => setSubFilter(cat)}>
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
              {isAdminAutenticado && (
                <div style={{position:'absolute', zIndex:10, top:'12px', left:'12px', display:'flex', gap:'6px'}}>
                  <button onClick={() => { setEditingId(prod.id); setProductForm(prod); setFormOpen(true); }} style={{background:'#111', color:'#fff', border:'none', padding:'6px 12px', cursor:'pointer', fontSize:'0.65rem', borderRadius:'8px', fontWeight:700, boxShadow: '0 2px 8px rgba(0,0,0,0.2)'}}>EDITAR</button>
                  <button onClick={() => handleDelete(prod.id)} style={{background:'#e60000', color:'#fff', border:'none', padding:'6px 12px', cursor:'pointer', fontSize:'0.65rem', borderRadius:'8px', fontWeight:700, boxShadow: '0 2px 8px rgba(0,0,0,0.2)'}}>EXCLUIR</button>
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
                  {prod.descricao && <div className="desc-box">{prod.descricao}</div>}
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
        <div onClick={() => setModalImage(null)} style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)'}}>
          <div style={{position: 'relative', maxWidth: '90%', maxHeight: '90%'}}>
            <img src={modalImage} alt="Zoom" style={{maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}} />
            <button onClick={() => setModalImage(null)} style={{position: 'absolute', top: '-16px', right: '-16px', background: '#fff', color: '#000', border: 'none', width: '38px', height: '38px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>✕</button>
          </div>
        </div>
      )}

      <div className={`drawer ${cartOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid rgba(255, 182, 193, 0.4)', paddingBottom:'14px'}}>
          <h2 style={{fontFamily: 'Playfair Display', fontSize: '1.3rem', margin:0, color: 'var(--pink-glow)'}}>SUA SACOLA 👜</h2>
          <button onClick={() => setCartOpen(false)} style={{background:'rgba(255, 182, 193, 0.2)', border:'none', width:'32px', height:'32px', borderRadius:'50%', fontSize:'1rem', cursor:'pointer', color: 'var(--pink-glow)', fontWeight: 800, display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
        </div>
        {cart.length === 0 ? (
          <p style={{textAlign:'center', marginTop:'50px', color:'#9c6c7c', fontSize:'0.8rem', fontWeight:600}}>Sua sacola está vazia.</p>
        ) : (
          <>
            <div style={{marginTop:'14px'}}>
              {cart.map((item) => (
                <div key={item.idCarrinho} className="cart-item">
                  <img src={item.fotoEscolhida || ''} alt="" />
                  <div style={{flex:1}}>
                    <p style={{fontSize:'0.78rem', fontWeight:'700', margin:0, color: 'var(--text-brown)'}}>{item.nome}</p>
                    <p style={{fontSize:'0.68rem', color:'#888', margin:'3px 0'}}>Qtd: {item.quantidadeEscolhida}x</p>
                    <p style={{fontSize:'0.85rem', fontWeight:'800', color:'var(--pink-glow)', margin:0}}>R$ {(item.preco * item.quantidadeEscolhida).toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.idCarrinho)} style={{background:'none', border:'none', color:'#e60000', cursor:'pointer', fontSize:'0.7rem', fontWeight:700}}>Excluir</button>
                </div>
              ))}
            </div>
            {(genderFilter === 'ENCOMENDAS' || cart.some(item => item.genero === 'ENCOMENDAS')) && (
              <div style={{marginTop: '24px', background: 'var(--pink-light)', padding: '14px', borderRadius: '14px', border: '1.5px solid rgba(255, 182, 193, 0.5)'}}>
                <label style={{display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--pink-glow)', marginBottom: '8px'}}>📅 Data e Hora da Encomenda:</label>
                <input type="datetime-local" value={dataEncomenda} onChange={(e) => setDataEncomenda(e.target.value)} style={{width: '100%', padding: '12px', background: '#fff', border: '1.5px solid rgba(255, 182, 193, 0.6)', fontSize: '0.78rem', borderRadius: '10px'}} />
              </div>
            )}
            <div style={{marginTop:'25px', borderTop:'2px solid rgba(255, 182, 193, 0.4)', paddingTop:'18px'}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom: '16px', fontWeight:700}}>
                <span>VALOR TOTAL:</span>
                <span style={{color:'var(--pink-glow)', fontSize: '1.2rem', fontWeight:900}}>R$ {totalCart.toFixed(2)}</span>
              </div>
              <button className="primary-btn" onClick={finalizarPedido}>ENVIAR PEDIDO PRO WHATSAPP</button>
            </div>
          </>
        )}
      </div>

      <div className={`drawer ${formOpen ? 'open' : ''}`}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '2px solid rgba(255, 182, 193, 0.4)', paddingBottom: '14px'}}>
          <h2 style={{fontFamily: 'Playfair Display', fontSize: '1.15rem', margin:0, color: 'var(--pink-glow)'}}>
            {isAdminAutenticado ? 'PAINEL DE ADMINISTRAÇÃO' : '🔐 ACESSO RESTRITO'}
          </h2>
          <button onClick={() => { setFormOpen(false); resetForm(); }} style={{background: 'var(--pink-light)', color: 'var(--pink-glow)', border:'none', padding:'6px 14px', cursor:'pointer', fontSize:'0.7rem', borderRadius:'20px', fontWeight:800}}>FECHAR</button>
        </div>

        {!isAdminAutenticado ? (
          <form onSubmit={handleLoginAdmin} style={{marginTop: '40px', textAlign: 'center'}}>
            <p style={{fontSize: '0.8rem', color: 'var(--text-brown)', marginBottom: '20px', fontWeight: 600}}>Digite a senha para acessar o painel de controle:</p>
            <input 
              type="password" 
              placeholder="Digite a senha..." 
              value={senhaInput} 
              onChange={e => setSenhaInput(e.target.value)} 
              style={{width: '100%', padding: '14px', fontSize: '1rem', textAlign: 'center', borderRadius: '12px', border: '1.5px solid rgba(255, 182, 193, 0.6)', marginBottom: '20px'}} 
              autoFocus
            />
            <button type="submit" className="primary-btn">ENTRAR NO PAINEL</button>
          </form>
        ) : (
          <>
            <div style={{display: 'flex', gap: '6px', marginTop: '16px', borderBottom: '1px solid rgba(255, 182, 193, 0.4)', paddingBottom: '12px'}}>
              <button onClick={() => setAbaAdminAtiva('produtos')} style={{flex: 1, background: abaAdminAtiva === 'produtos' ? 'var(--pink-glow)' : '#fff', color: abaAdminAtiva === 'produtos' ? '#fff' : 'var(--text-brown)', border: '1.5px solid rgba(255, 182, 193, 0.6)', padding: '8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight:800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)'}}>🧁 PRODUTOS</button>
              <button onClick={() => setAbaAdminAtiva('agenda')} style={{flex: 1, background: abaAdminAtiva === 'agenda' ? 'var(--pink-glow)' : '#fff', color: abaAdminAtiva === 'agenda' ? '#fff' : 'var(--text-brown)', border: '1.5px solid rgba(255, 182, 193, 0.6)', padding: '8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight:800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)'}}>📅 AGENDA</button>
              <button onClick={() => setAbaAdminAtiva('financeiro')} style={{flex: 1, background: abaAdminAtiva === 'financeiro' ? 'var(--pink-glow)' : '#fff', color: abaAdminAtiva === 'financeiro' ? '#fff' : 'var(--text-brown)', border: '1.5px solid rgba(255, 182, 193, 0.6)', padding: '8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight:800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)'}}>💰 FINANCEIRO</button>
            </div>

            {abaAdminAtiva === 'agenda' ? (
              <div style={{marginTop: '18px'}}>
                <h3 style={{fontSize: '0.85rem', color: 'var(--pink-glow)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 800}}>📅 Próximas Encomendas Agendadas</h3>
                <p style={{fontSize: '0.72rem', color: '#666', marginBottom: '14px'}}>Acompanhe abaixo o nome, telefone e o horário de entrega de cada encomenda:</p>

                {listaEncomendasAgenda.length === 0 ? (
                  <div style={{background: 'var(--pink-light)', padding: '24px', borderRadius: '14px', textAlign: 'center', border: '1.5px solid rgba(255, 182, 193, 0.5)'}}>
                    <p style={{fontSize: '0.78rem', color: 'var(--text-brown)', fontWeight: 600, margin: 0}}>Nenhuma encomenda agendada no momento! 🎉</p>
                  </div>
                ) : (
                  listaEncomendasAgenda.map((ped) => {
                    const dataFormatada = !isNaN(ped.dataEntregaObj.getTime()) 
                      ? ped.dataEntregaObj.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                      : ped.dataEntregaStr;

                    return (
                      <div key={ped.id} style={{background: 'var(--pink-light)', padding: '14px', borderRadius: '14px', border: '1.5px solid rgba(255, 182, 193, 0.5)', marginBottom: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                          <span style={{fontSize: '0.75rem', fontWeight: 800, background: 'var(--pink-glow)', color: '#fff', padding: '4px 10px', borderRadius: '8px'}}>🕒 {dataFormatada}</span>
                          <span style={{fontSize: '0.85rem', fontWeight: 900, color: 'var(--pink-glow)'}}>R$ {Number(ped.preco).toFixed(2)}</span>
                        </div>
                        <p style={{fontSize: '0.82rem', fontWeight: 800, margin: '6px 0 2px 0', color: 'var(--text-brown)'}}>👤 {ped.clienteStr}</p>
                        {ped.telStr && (
                          <p style={{fontSize: '0.75rem', margin: '0 0 8px 0'}}>
                            📞 <a href={`https://wa.me/55${ped.telStr.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{color: 'var(--pink-glow)', fontWeight: 700, textDecoration: 'underline'}}>{ped.telStr}</a>
                          </p>
                        )}
                        <p style={{fontSize: '0.72rem', color: '#555', margin: '4px 0', background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255, 182, 193, 0.4)'}}>📦 {ped.nome}</p>
                        
                        <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(255, 182, 193, 0.3)', paddingTop: '8px'}}>
                          <button onClick={() => handleDeletarPedido(ped.id)} style={{background: 'none', border: 'none', color: '#e60000', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700}}>Excluir Encomenda</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : abaAdminAtiva === 'financeiro' ? (
              <div style={{marginTop: '18px'}}>
                <h3 style={{fontSize: '0.85rem', color: 'var(--pink-glow)', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 800}}>📊 Relatório & Venda Manual</h3>
                <div style={{background: 'var(--pink-light)', padding: '14px', borderRadius: '14px', border: '1.5px solid rgba(255, 182, 193, 0.5)', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'}}>
                  <h4 style={{fontSize: '0.75rem', color: 'var(--pink-glow)', textTransform: 'uppercase', margin: '0 0 10px 0', fontWeight:800}}>➕ Lançar Venda / Encomenda Manual</h4>
                  
                  <div style={{display: 'flex', gap: '8px', marginBottom: '10px'}}>
                    <div style={{flex: 2}}>
                      <label style={{display: 'block', fontSize: '0.68rem', fontWeight:700, marginBottom: '3px'}}>Nome da Cliente:</label>
                      <input type="text" placeholder="Ex: Dona Maria" value={manualCliente} onChange={(e) => setManualCliente(e.target.value)} />
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{display: 'block', fontSize: '0.68rem', fontWeight:700, marginBottom: '3px'}}>Telefone:</label>
                      <input type="text" placeholder="44 99999-9999" value={manualTelefone} onChange={(e) => setManualTelefone(e.target.value)} />
                    </div>
                  </div>

                  <label style={{display: 'block', fontSize: '0.68rem', fontWeight:700, marginBottom: '3px'}}>O que foi encomendado / vendido:</label>
                  <input type="text" placeholder="Ex: 1 Bolo de Chocolate" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} style={{marginBottom: '10px'}} />
                  
                  <div style={{display: 'flex', gap: '8px', marginBottom: '10px'}}>
                    <div style={{flex: 1}}>
                      <label style={{display: 'block', fontSize: '0.68rem', fontWeight:700, marginBottom: '3px'}}>Valor (R$):</label>
                      <input type="number" step="0.01" placeholder="0.00" value={manualValor} onChange={(e) => setManualValor(e.target.value)} />
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{display: 'block', fontSize: '0.68rem', fontWeight:700, marginBottom: '3px'}}>Data da Venda:</label>
                      <input type="date" value={manualData} onChange={(e) => setManualData(e.target.value)} />
                    </div>
                  </div>

                  <label style={{display: 'block', fontSize: '0.68rem', fontWeight:700, marginBottom: '3px'}}>📅 Data e Hora de Entrega (Opcional):</label>
                  <input type="datetime-local" value={manualDataEntrega} onChange={(e) => setManualDataEntrega(e.target.value)} style={{marginBottom: '12px'}} />

                  <button type="button" onClick={handleLancarManual} style={{width: '100%', background: 'linear-gradient(135deg, var(--pink-glow), var(--pink-sweet))', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight:800, fontSize: '0.72rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(230,0,115,0.25)'}}>SALVAR NO FINANCEIRO E AGENDA</button>
                </div>

                {Object.keys(faturamentoPorMes).map((mes) => {
                  const dadosMes = faturamentoPorMes[mes];
                  return (
                    <div key={mes} style={{background: 'var(--pink-light)', padding: '14px', borderRadius: '14px', border: '1.5px solid rgba(255, 182, 193, 0.5)', marginBottom: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{fontSize: '0.78rem', fontWeight: 800}}>{mes}</span>
                        <span style={{fontSize: '0.9rem', fontWeight: 900, color: 'var(--pink-glow)'}}>R$ {dadosMes.total.toFixed(2)}</span>
                      </div>
                      <p style={{fontSize: '0.68rem', color: '#666', margin: '4px 0 10px 0'}}>Total de pedidos: <b>{dadosMes.quantidade}</b></p>
                      <div style={{maxHeight: '140px', overflowY: 'auto', background: '#fff', padding: '8px', borderRadius: '10px', border: '1.5px solid rgba(255, 182, 193, 0.4)'}}>
                        {dadosMes.pedidos.map((p: any) => (
                          <div key={p.id} style={{fontSize: '0.65rem', borderBottom: '1px solid #fdf2f4', padding: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span>{p.nome}</span>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <span style={{fontWeight: 700, color: 'var(--pink-glow)'}}>R$ {Number(p.preco).toFixed(2)}</span>
                              <button onClick={() => handleDeletarPedido(p.id)} style={{background: 'none', border: 'none', color: '#e60000', cursor: 'pointer', fontWeight: 900}}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <div style={{background: 'var(--pink-light)', padding: '14px', borderRadius: '14px', marginTop: '16px', border: '1.5px solid rgba(255, 182, 193, 0.5)'}}>
                  <h3 style={{fontSize: '0.75rem', margin: '0 0 8px 0', color: 'var(--pink-glow)', fontWeight: 800, textTransform: 'uppercase'}}>🖼️ Foto de Fundo do Banner</h3>
                  <input type="file" accept="image/*" onChange={handleBannerUpload} style={{width: '100%', background: '#fff', padding: '8px', fontSize: '0.72rem', borderRadius: '8px', border: '1.5px solid rgba(255, 182, 193, 0.5)'}} />
                </div>

                <div style={{background: 'var(--pink-light)', padding: '14px', borderRadius: '14px', marginTop: '16px', border: '1.5px solid rgba(255, 182, 193, 0.5)'}}>
                  <h3 style={{fontSize: '0.75rem', margin: '0 0 8px 0', color: 'var(--pink-glow)', fontWeight: 800, textTransform: 'uppercase'}}>📂 Gerenciar Categorias</h3>
                  <div style={{display: 'flex', gap: '6px', marginTop: '6px'}}>
                    <input type="text" placeholder="Nome da categoria" value={novaCatNome} onChange={e => setNovaCatNome(e.target.value)} style={{flex: 1}} />
                    <select value={novaCatGrupo} onChange={e => setNovaCatGrupo(e.target.value)} style={{width: '100px'}}>
                      <option value="DIARIO">Hoje</option>
                      <option value="ENCOMENDAS">Encomenda</option>
                    </select>
                    <button type="button" onClick={handleCriarCategoria} style={{background: 'var(--pink-glow)', color: '#fff', border: 'none', padding: '0 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem'}}>CRIAR</button>
                  </div>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', maxHeight: '100px', overflowY: 'auto', background: '#fff', padding: '8px', borderRadius: '8px', border: '1.5px solid rgba(255, 182, 193, 0.4)'}}>
                    {categoriasMap[novaCatGrupo]?.map(cat => (
                      <span key={cat} style={{fontSize: '0.65rem', background: '#ffe4e8', color: 'var(--text-brown)', padding: '4px 10px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700}}>
                        {cat.toUpperCase()}
                        <button type="button" onClick={() => handleExcluirCategoria(novaCatGrupo, cat)} style={{background: 'none', border: 'none', color: 'var(--pink-glow)', cursor: 'pointer', fontWeight: 900}}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="admin-form" style={{marginTop: '16px'}}>
                  <h3 style={{fontSize: '0.85rem', color: 'var(--pink-glow)', textTransform: 'uppercase', margin: '18px 0 6px 0', fontWeight: 800}}>{editingId ? '✏️ Editar Doce' : '➕ Cadastrar Novo Doce'}</h3>
                  
                  <label>Nome do Doce</label>
                  <input type="text" value={productForm.nome} onChange={e => setProductForm({...productForm, nome: e.target.value})} />

                  <label>Preço (R$)</label>
                  <input type="number" step="0.01" value={productForm.preco} onChange={e => setProductForm({...productForm, preco: e.target.value})} />

                  <label>Grupo Principal</label>
                  <select value={productForm.genero} onChange={e => setProductForm({...productForm, genero: e.target.value, categoria: categoriasMap[e.target.value]?.[0] || ''})}>
                    <option value="DIARIO">Disponíveis Hoje</option>
                    <option value="ENCOMENDAS">Encomendas Especiais</option>
                  </select>

                  <label>Categoria Específica</label>
                  <select value={productForm.categoria} onChange={e => setProductForm({...productForm, categoria: e.target.value})}>
                    {categoriasMap[productForm.genero]?.map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>

                  <label>Descrição / Ingredientes</label>
                  <textarea rows={3} value={productForm.descricao} onChange={e => setProductForm({...productForm, descricao: e.target.value})} />

                  <label>Fotos do Doce</label>
                  <input type="file" accept="image/*" multiple onChange={handleLocalImageUpload} />

                  {productForm.fotos?.length > 0 && (
                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'12px'}}>
                      {productForm.fotos.map((f: string, i: number) => (
                        <div key={i} style={{position: 'relative', display: 'inline-block'}}>
                          <img src={f} alt="" style={{width:'60px', height:'60px', objectFit:'cover', borderRadius:'10px', border: '1.5px solid rgba(255, 182, 193, 0.6)'}} />
                          <button type="button" onClick={() => handleRemoveSinglePhoto(i)} style={{position: 'absolute', top: '-6px', right: '-6px', background: '#e60000', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '50%', fontSize: '10px', cursor: 'pointer', fontWeight: 900}}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{background: 'var(--pink-light)', padding: '12px', borderRadius: '10px', margin: '16px 0', border: '1.5px solid rgba(255, 182, 193, 0.5)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'}}>
                      <input type="checkbox" id="chkPush" checked={productForm.enviarNotificacaoPush || false} onChange={e => setProductForm({...productForm, enviarNotificacaoPush: e.target.checked})} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                      <label htmlFor="chkPush" style={{margin: 0, fontSize: '0.7rem', cursor: 'pointer', color: 'var(--pink-glow)', fontWeight: 800}}>📢 Enviar notificação push ao salvar</label>
                    </div>
                  </div>

                  <div style={{background: 'var(--pink-light)', padding: '14px', borderRadius: '10px', margin: '16px 0', border: '1.5px solid rgba(255, 182, 193, 0.5)'}}>
                    <label style={{display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--pink-glow)', marginBottom: '8px'}}>📢 DISPARAR NOTIFICAÇÃO PUSH IMEDIATA</label>
                    <textarea rows={2} value={mensagemPush} onChange={e => setMensagemPush(e.target.value)} style={{width: '100%', padding: '10px', background: '#fff', border: '1.5px solid rgba(255, 182, 193, 0.6)', fontSize: '0.72rem', borderRadius: '8px', marginBottom: '8px'}} />
                    <button 
                      type="button" 
                      onClick={async () => {
                        if (!confirm("Deseja enviar esta notificação agora para todos os clientes?")) return;
                        try {
                          const res = await supabase.functions.invoke('send-push-notification', {
                            body: { title: "🧁 Doces da Rosa", body: mensagemPush }
                          });
                          if (res.error) throw res.error;
                          alert("Notificação enviada com sucesso!");
                        } catch (err: any) {
                          alert("Erro ao enviar notificação: " + (err.message || err));
                        }
                      }} 
                      style={{width: '100%', background: 'var(--pink-glow)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(230,0,115,0.2)'}}
                    >
                      ENVIAR NOTIFICAÇÃO AGORA
                    </button>
                  </div>

                  <div style={{display:'flex', gap:'10px', marginTop:'24px'}}>
                    <button className="primary-btn" onClick={handleSave}>SALVAR DOCE</button>
                    {editingId && (
                      <button type="button" onClick={() => handleDelete()} style={{background:'#e60000', color:'#fff', border:'none', padding:'12px 16px', borderRadius:'12px', cursor:'pointer', fontWeight:800, fontSize:'0.72rem', boxShadow: '0 4px 12px rgba(230,0,0,0.2)'}}>EXCLUIR</button>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <a href={`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent("Olá! Gostaria de tirar dúvidas sobre os doces da Rosa.")}`} className="whatsapp-float" target="_blank" rel="noopener noreferrer">💬</a>
    </>
  );
}