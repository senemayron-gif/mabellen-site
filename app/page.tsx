{/* Header Ajustado - Admin na Esquerda, Sacola na Direita */}
      <header className="py-6 text-center bg-black text-[#D4AF37] sticky top-0 z-50 shadow-lg">
        {/* BOTÃO ADMIN - Movido para a Esquerda e mais visível */}
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 opacity-50 hover:opacity-100 transition-opacity"
        >
          <Settings size={24} />
        </button>

        <h1 className="text-3xl tracking-[0.3em] font-light italic">MABELLEN</h1>
        
        <div className="flex justify-center gap-8 mt-4 text-[10px] font-bold tracking-[0.2em]">
          <button onClick={() => setAbaGeral('FEMININO')} className={`pb-1 border-b-2 ${abaGeral === 'FEMININO' ? 'border-[#D4AF37]' : 'border-transparent opacity-40'}`}>FEMININO</button>
          <button onClick={() => setAbaGeral('MASCULINO')} className={`pb-1 border-b-2 ${abaGeral === 'MASCULINO' ? 'border-[#D4AF37]' : 'border-transparent opacity-40'}`}>MASCULINO</button>
        </div>

        {/* BOTÃO SACOLA - No Canto Direito */}
        <button 
          onClick={() => setShowCarrinho(true)} 
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2"
        >
          <div className="relative">
            <ShoppingBag size={28} />
            {carrinho.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-black">
                {carrinho.length}
              </span>
            )}
          </div>
        </button>
      </header>