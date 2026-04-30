<header style={{ 
        flexDirection: 'column', 
        padding: '20px 10px', 
        gap: '10px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #eee'
      }}>
        {/* Container Superior: Engrenagem e Sacola */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          width: '100%', 
          position: 'absolute', 
          top: '15px', 
          padding: '0 15px',
          zIndex: 10
        }}>
          <div style={{cursor:'pointer', fontSize: '20px'}} onClick={() => prompt('Acesso:') === '2004' ? setAdminOpen(!adminOpen) : null}>⚙️</div>
          
          <div className="bag-container" onClick={() => setCartOpen(true)} style={{ position: 'relative' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            {cart.length > 0 && <span className="bag-badge" style={{ backgroundColor: '#c9a96e' }}>{cart.reduce((a, b) => a + b.quantidadeEscolhida, 0)}</span>}
          </div>
        </div>

        {/* Logo Centralizada e Maior */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          marginTop: '10px' 
        }}>
          <img 
            src="https://hhzqgrnuedzabacarjoi.supabase.co/storage/v1/object/public/logo%20mabellen.jpeg/mabellen-logo.jpeg.jpeg" 
            alt="Mabellen Logo" 
            style={{ 
              height: '110px', // Aumentado para dar mais destaque
              width: 'auto', 
              objectFit: 'contain',
              marginBottom: '5px'
            }} 
          />
          {/* Subtítulo Estilizado */}
          <span style={{ 
            fontSize: '13px', 
            letterSpacing: '3px', 
            fontWeight: '300', 
            color: '#c9a96e', // Cor dourada do tema
            textTransform: 'uppercase',
            fontFamily: 'serif'
          }}>
            Moda Íntima e Casual
          </span>
        </div>
      </header>