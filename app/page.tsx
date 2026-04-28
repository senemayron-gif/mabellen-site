"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// CONFIGURAÇÃO DO SUPABASE (Verifique se as variáveis de ambiente estão no seu .env)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MabellenStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState("todos");
  const [cartCount, setCartCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Busca os produtos do Supabase ao carregar a página
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products") // Nome da sua tabela
        .select("*");

      if (error) {
        console.error("Erro ao buscar produtos:", error);
      } else {
        setProducts(data || []);
        setFilteredProducts(data || []);
      }
    }
    fetchProducts();
  }, []);

  // Filtro de categorias
  useEffect(() => {
    if (activeCat === "todos") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter((p) => p.cat === activeCat));
    }
  }, [activeCat, products]);

  const addCart = () => {
    setCartCount(prev => prev + 1);
    const toast = document.getElementById("toast");
    toast?.classList.add("show");
    setTimeout(() => toast?.classList.remove("show"), 2500);
  };

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --gold: #c9a96e;
          --gold-light: #e8c87a;
          --dark: #111111;
          --dark2: #1e1e1e;
          --dark3: #2a2a2a;
          --white: #faf8f6;
          --gray: #888;
          --gray-light: #f5f2ee;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--white); font-family: 'Montserrat', sans-serif; color: var(--dark); }
        
        header {
          background: var(--dark); padding: 0 5%; display: flex; align-items: center; justify-content: space-between;
          height: 70px; position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 20px #00000044;
        }
        .logo { font-family: 'Playfair Display', serif; font-size: 1.7rem; font-weight: 700; color: #fff; letter-spacing: 3px; text-decoration: none; }
        .logo span { color: var(--gold); }
        
        nav { display: flex; gap: 28px; align-items: center; }
        nav a { color: #aaa; font-size: 0.72rem; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; transition: color 0.2s; cursor: pointer; }
        nav a:hover { color: var(--gold); }

        .cart-btn {
          background: var(--gold); color: var(--dark); border: none; padding: 8px 20px; border-radius: 25px;
          font-size: 0.72rem; font-weight: 700; cursor: pointer; letter-spacing: 1px; transition: background 0.2s;
        }

        .hero {
          background: linear-gradient(135deg, var(--dark) 0%, #2a1a2e 50%, var(--dark) 100%);
          padding: 100px 5% 80px; text-align: center; position: relative; overflow: hidden; min-height: 520px; display: flex; align-items: center; justify-content: center;
        }
        .hero h1 { font-family: 'Playfair Display', serif; font-size: 3rem; color: #fff; line-height: 1.15; margin-bottom: 16px; }
        .hero h1 span { color: var(--gold); font-style: italic; }

        .cats-section { background: var(--dark); padding: 50px 5%; text-align: center; }
        .cats { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-top: 20px; }
        .cat {
          background: var(--dark2); border-radius: 16px; padding: 22px 28px; text-align: center;
          cursor: pointer; transition: all 0.25s; border: 1px solid #333; min-width: 120px;
        }
        .cat.active { border-color: var(--gold); background: #c9a96e0d; }
        .cat-name { font-size: 0.68rem; font-weight: 600; color: #ccc; letter-spacing: 2px; text-transform: uppercase; }

        .products-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
            gap: 22px; padding: 40px 5%; 
            background: var(--gray-light);
        }
        .product-card { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 2px 12px #0000000a; transition: 0.3s; }
        .product-card:hover { transform: translateY(-6px); }
        .product-img { height: 200px; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 4rem; }
        .product-info { padding: 16px; }
        .product-name { font-weight: 700; margin-bottom: 5px; }
        .product-price { color: var(--dark); font-weight: 700; font-size: 1.1rem; }
        
        .add-btn {
          background: var(--dark); color: #fff; border: none; width: 34px; height: 34px; border-radius: 50%;
          cursor: pointer; font-size: 1.2rem;
        }

        .toast {
          position: fixed; bottom: 30px; right: 30px; background: var(--dark); color: #fff;
          padding: 13px 22px; border-radius: 14px; border-left: 3px solid var(--gold);
          transform: translateX(220px); opacity: 0; transition: 0.35s; z-index: 9999;
        }
        .toast.show { transform: translateX(0); opacity: 1; }
      ` }} />

      {/* HEADER */}
      <header>
        <a href="#" className="logo">Mabe<span>llen</span></a>
        <nav>
          <a onClick={() => setActiveCat('feminino')}>Feminino</a>
          <a onClick={() => setActiveCat('masculino')}>Masculino</a>
          <a onClick={() => setActiveCat('pijama')}>Pijamas</a>
        </nav>
        <button className="cart-btn">🛍️ Carrinho ({cartCount})</button>
      </header>

      {/* HERO */}
      <div className="hero">
        <div style={{ position: 'relative', z-index: 1 }}>
          <div style={{ color: 'var(--gold)', letterSpacing: '5px', textTransform: 'uppercase', fontSize: '0.65rem', marginBottom: '20px' }}>
            ✨ Nova Coleção 2026
          </div>
          <h1>Conforto que<br /><span>seduz</span> e encanta</h1>
          <p style={{ color: '#aaa', marginTop: '20px' }}>Elegância e qualidade em cada detalhe.</p>
        </div>
      </div>

      {/* CATEGORIAS */}
      <div className="cats-section">
        <h2 style={{ color: '#fff', fontFamily: 'Playfair Display' }}>Nossas Categorias</h2>
        <div className="cats">
          {['todos', 'feminino', 'masculino', 'pijama', 'kit'].map((c) => (
            <div 
              key={c} 
              className={`cat ${activeCat === c ? 'active' : ''}`} 
              onClick={() => setActiveCat(c)}
            >
              <span className="cat-name">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LISTA DE PRODUTOS DINÂMICA */}
      <div className="products-grid">
        {filteredProducts.map((p) => (
          <div key={p.id} className="product-card">
            <div className="product-img">
                {/* Se você tiver coluna 'image_url' no Supabase, use aqui */}
                {p.image_url ? <img src={p.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : '👙'}
            </div>
            <div className="product-info">
              <div style={{ color: 'var(--gold)', fontSize: '0.6rem', textTransform: 'uppercase' }}>{p.cat}</div>
              <div className="product-name">{p.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span className="product-price">{fmt(p.price || 0)}</span>
                <button className="add-btn" onClick={addCart}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="toast" id="toast">✅ Adicionado ao carrinho!</div>
    </>
  );
}