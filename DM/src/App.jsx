import React, { useState, useEffect, useRef } from 'react';

export default function App() {
    // --- ESTADOS DO SISTEMA ---
    const [view, setView] = useState('home'); 
    const [adminView, setAdminView] = useState('pedidos');
    const [carrinho, setCarrinho] = useState([]);
    const [clienteAuth, setClienteAuth] = useState(false);
    
    // Estados do Perfil
    const [perfilNome, setPerfilNome] = useState('');
    const [perfilCelular, setPerfilCelular] = useState('');
    const [perfilMsg, setPerfilMsg] = useState({ text: '', type: '' });
    const [redirectPosLogin, setRedirectPosLogin] = useState(null);

    // Dados da Loja
    const [restaurante, setRestaurante] = useState({
        nome: 'DOGS DO MIRSO',
        is_aberto: true,
        tempo_entrega: '30-45 min',
        raio_entrega: 5,
        foto_capa_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    });

    // Produtos Demo (Se não houver banco conectado)
    const [produtos] = useState([
        { id: 1, nome: 'Dogão Tradicional', preco: 15.90, categoria: 'Cachorros', descricao: 'Salsicha, purê, batata palha, milho, ervilha.', imagem_url: 'https://images.unsplash.com/photo-1594212720993-8ad57b54abfb?auto=format&fit=crop&w=400&q=80', is_destaque: true },
        { id: 2, nome: 'Batata Frita com Cheddar', preco: 25.00, categoria: 'Porções', descricao: 'Batata frita sequinha com cheddar e bacon.', imagem_url: 'https://images.unsplash.com/photo-1576107240321-93c66041ec64?auto=format&fit=crop&w=400&q=80', is_destaque: true },
        { id: 3, nome: 'Refrigerante Lata', preco: 6.00, categoria: 'Bebidas', descricao: 'Coca-cola, Guaraná, Fanta.', imagem_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', is_destaque: false }
    ]);

    // Estados do Checkout e Mapa
    const [checkoutForm, setCheckoutForm] = useState({ tipo: 'entrega', cep: '', endereco: '', referencia: '', pagamento: 'cartao', troco: '' });
    const [mapaValidado, setMapaValidado] = useState(false);
    
    // Estados do Admin
    const [adminTempTempo, setAdminTempTempo] = useState(restaurante.tempo_entrega);
    const [adminTempRaio, setAdminTempRaio] = useState(restaurante.raio_entrega);

    useEffect(() => {
        // Carregar Tailwind CSS dinamicamente (Garante que o layout não quebre em nenhum ambiente)
        if (!document.getElementById('tailwind-cdn')) {
            const tw = document.createElement('script');
            tw.id = 'tailwind-cdn';
            tw.src = 'https://cdn.tailwindcss.com';
            document.head.appendChild(tw);
        }

        // Carregar ícones dinamicamente para garantir funcionamento
        if (!document.getElementById('font-awesome')) {
            const fa = document.createElement('link');
            fa.id = 'font-awesome';
            fa.rel = 'stylesheet';
            fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(fa);
        }
    }, []);

    const fazerPedidoAgora = () => {
        if (!clienteAuth) {
            setRedirectPosLogin('cardapio');
            setView('perfil');
        } else {
            setView('cardapio');
        }
    };

    const salvarPerfil = async () => {
        if (!perfilNome || !perfilCelular) {
            setPerfilMsg({ text: 'Preencha nome e celular.', type: 'error' });
            return;
        }
        
        setPerfilMsg({ text: 'Autenticando...', type: 'loading' });
        
        try {
            // Simulated API Call
            await new Promise(resolve => setTimeout(resolve, 800));
            
            localStorage.setItem('cliente_nome', perfilNome);
            localStorage.setItem('cliente_celular', perfilCelular);
            setClienteAuth(true);
            setPerfilMsg({ text: 'Tudo pronto!', type: 'success' });
            
            setTimeout(() => {
                setView(redirectPosLogin || 'cardapio');
                setRedirectPosLogin(null);
                setPerfilMsg({ text: '', type: '' });
            }, 800);
        } catch (e) {
            setPerfilMsg({ text: 'Erro ao autenticar.', type: 'error' });
        }
    };

    const adicionarAoCarrinho = (produto) => {
        const existente = carrinho.find(item => item.id === produto.id);
        if (existente) {
            setCarrinho(carrinho.map(item => item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item));
        } else {
            setCarrinho([...carrinho, { ...produto, quantidade: 1, observacao: '' }]);
        }
    };

    const alterarQuantidade = (id, delta) => {
        setCarrinho(carrinho.map(item => {
            if (item.id === id) return { ...item, quantidade: Math.max(0, item.quantidade + delta) };
            return item;
        }).filter(item => item.quantidade > 0));
    };

    const salvarTempoDelivery = () => {
        setRestaurante(prev => ({ ...prev, tempo_entrega: adminTempTempo }));
        alert('Tempo de entrega atualizado!');
    };

    const salvarRaioEntrega = () => {
        setRestaurante(prev => ({ ...prev, raio_entrega: adminTempRaio }));
        alert('Raio de entrega atualizado!');
    };

    const toggleStatusLoja = () => {
        setRestaurante(prev => ({ ...prev, is_aberto: !prev.is_aberto }));
    };

    const totalCarrinho = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const badgeCount = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

    return (
        <div className="min-h-screen bg-[#1a191c] md:bg-gray-900 md:bg-[url('https://images.unsplash.com/photo-1541214113241-21578d2d9b62?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-blend-overlay bg-cover bg-center bg-fixed flex justify-center items-start">
            
            {/* CONTAINER MOBILE CENTRALIZADO NO DESKTOP */}
            <div className="w-full max-w-md min-h-screen bg-[#2b2a2d] relative flex flex-col font-sans text-white shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-x-hidden">
                
                {/* Header Fixo */}
                <div className="bg-[#1a191c] flex justify-center items-center py-2.5 border-b border-gray-800 text-xs shadow-md z-20">
                    <span className="text-gray-300 flex items-center">
                        <i className="fas fa-motorcycle text-[#d79e51] mr-2"></i>
                        Delivery: {restaurante.tempo_entrega}
                    </span>
                    <span className="mx-3 text-gray-600">|</span>
                    <span className={restaurante.is_aberto ? "text-[#d79e51] font-medium" : "text-red-500 font-medium"}>
                        {restaurante.is_aberto ? 'Aberto' : 'Fechado'}
                    </span>
                </div>

                {/* Conteúdo Rolável Principal */}
                <div className="flex-1 pb-24 overflow-y-auto">
                    
                    {}
                    {/* --- HOME VIEW --- */}
                    {view === 'home' && (
                        <div>
                            {/* Capa e Logo */}
                            <div className="relative flex flex-col items-center mb-6">
                                <div className="w-full h-40 relative bg-gray-900 overflow-hidden">
                                    <img src={restaurante.foto_capa_url} alt="Capa" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
                                </div>
                                <div className="w-32 h-32 rounded-full border-4 border-[#d79e51] flex items-center justify-center -mt-16 z-10 bg-[#1f1e22] shadow-xl overflow-hidden relative">
                                    <h1 className="font-bold text-xl tracking-wider text-white text-center leading-none z-10">DOGS DO<br/>MIRSO</h1>
                                </div>
                                <div className="text-center mt-4 w-full px-4">
                                    <h2 className="font-bold text-white text-lg tracking-wider">{restaurante.nome}</h2>
                                    <p className="text-[#d79e51] text-[10px] tracking-[0.35em] mt-1 uppercase">Cardápio Digital</p>
                                </div>
                                <div className="w-full px-6 mt-6">
                                    <button onClick={fazerPedidoAgora} className="w-full bg-gradient-to-r from-[#d79e51] to-[#e8b776] text-[#2b2a2d] font-bold text-xl py-4 rounded-xl shadow-[0_6px_20px_rgba(215,158,81,0.25)] active:scale-95 transition-transform flex items-center justify-center space-x-2">
                                        <span>FAZER PEDIDO AGORA</span>
                                    </button>
                                </div>
                            </div>

                            {/* Categorias */}
                            <div className="mt-8 px-2 pb-6">
                                <div className="flex justify-between overflow-x-auto px-4 pb-4 pt-2 space-x-5">
                                    {[
                                        { nome: 'Cachorros', icone: 'fa-hotdog' },
                                        { nome: 'Porções', icone: 'fa-utensils' },
                                        { nome: 'Bebidas', icone: 'fa-glass-water' },
                                        { nome: 'Combos', icone: 'fa-box-open' }
                                    ].map(cat => (
                                        <div key={cat.nome} onClick={() => setView('cardapio')} className="flex flex-col items-center space-y-3 cursor-pointer flex-shrink-0 group">
                                            <div className="w-[70px] h-[70px] rounded-full bg-[#363539] border border-gray-700 flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                                                <i className={`fas ${cat.icone} text-2xl text-[#d79e51] opacity-90`}></i>
                                            </div>
                                            <span className="text-gray-400 text-xs font-medium">{cat.nome}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {/* --- CARDÁPIO VIEW --- */}
                    {view === 'cardapio' && (
                        <div className="px-6 pt-6 pb-20">
                            <div className="sticky top-0 bg-[#2b2a2d] z-10 pb-4 pt-2 mb-4 border-b border-gray-800">
                                <h2 className="font-bold text-2xl text-white uppercase tracking-wider text-center">Nosso Cardápio</h2>
                            </div>
                            <div className="space-y-6">
                                {produtos.map(p => (
                                    <div key={p.id} className="bg-[#363539] rounded-2xl p-3 flex shadow border border-gray-700/50">
                                        <img src={p.imagem_url} alt={p.nome} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                                        <div className="ml-3 flex flex-col justify-between flex-grow">
                                            <div>
                                                <h4 className="text-white text-lg font-medium leading-tight">{p.nome}</h4>
                                                <p className="text-gray-400 text-xs mt-1">{p.descricao}</p>
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="text-[#d79e51] font-bold text-lg">R$ {p.preco.toFixed(2).replace('.', ',')}</span>
                                                <button onClick={() => adicionarAoCarrinho(p)} className="w-9 h-9 border border-[#d79e51]/50 rounded-full text-[#d79e51] flex items-center justify-center hover:bg-[#d79e51] hover:text-[#2b2a2d] transition-colors">
                                                    <i className="fas fa-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {}
                    {/* --- CARRINHO VIEW --- */}
                    {view === 'carrinho' && (
                        <div className="px-6 pt-6 pb-20 flex flex-col min-h-[80vh]">
                            <div className="sticky top-0 bg-[#2b2a2d] z-10 pb-4 pt-2 mb-4 border-b border-gray-800">
                                <h2 className="font-bold text-2xl text-white uppercase tracking-wider text-center">Seu Pedido</h2>
                            </div>

                            {carrinho.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center mt-10">
                                    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                                        <i className="fas fa-shopping-basket text-4xl text-gray-600"></i>
                                    </div>
                                    <h3 className="font-medium text-xl text-gray-300 mb-2">Seu carrinho está vazio</h3>
                                    <p className="text-sm text-gray-500 mb-6">Bateu a fome? Escolha algo delicioso.</p>
                                    <button onClick={() => setView('cardapio')} className="px-6 py-3 bg-transparent border border-[#d79e51] text-[#d79e51] rounded-xl font-bold uppercase">Ver Cardápio</button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                                        {carrinho.map(item => (
                                            <div key={item.id} className="bg-[#363539] rounded-xl p-3 border border-gray-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-white">{item.nome}</h4>
                                                    <span className="text-[#d79e51] font-bold">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-gray-400">R$ {item.preco.toFixed(2).replace('.', ',')} un</span>
                                                    <div className="flex items-center space-x-3 bg-[#1a191c] rounded-lg px-2 py-1">
                                                        <button onClick={() => alterarQuantidade(item.id, -1)} className="text-[#d79e51] w-6 h-6 flex justify-center items-center font-bold text-lg">-</button>
                                                        <span className="text-white font-bold w-4 text-center">{item.quantidade}</span>
                                                        <button onClick={() => alterarQuantidade(item.id, 1)} className="text-[#d79e51] w-6 h-6 flex justify-center items-center font-bold text-lg">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Checkout Forms */}
                                    <div className="space-y-6 mb-6">
                                        <div>
                                            <h4 className="text-[#d79e51] font-medium uppercase mb-3 text-sm flex items-center"><i className="fas fa-map-marker-alt mr-2"></i> 1. Entrega</h4>
                                            <select value={checkoutForm.tipo} onChange={e => setCheckoutForm({...checkoutForm, tipo: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-3 mb-3 outline-none focus:border-[#d79e51] text-sm">
                                                <option value="entrega">Entregar no meu endereço</option>
                                                <option value="retirada">Retirar no estabelecimento</option>
                                            </select>
                                            {checkoutForm.tipo === 'entrega' && (
                                                <textarea placeholder="Rua, Número, Bairro..." value={checkoutForm.endereco} onChange={e => setCheckoutForm({...checkoutForm, endereco: e.target.value})} rows="3" className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm"></textarea>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-700 pt-4 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white font-bold text-xl uppercase">Total</span>
                                            <span className="text-[#d79e51] font-bold text-2xl">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>

                                    <button onClick={() => { alert('Pedido Enviado!'); setCarrinho([]); setView('pedidos'); }} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-xl py-4 rounded-xl active:scale-95 transition-transform flex justify-center items-center">
                                        <i className="fas fa-check-circle mr-2"></i> ENVIAR PEDIDO
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {}
                    {/* --- PERFIL VIEW --- */}
                    {view === 'perfil' && (
                        <div className="px-6 pt-10 pb-20 flex flex-col items-center min-h-[70vh] justify-between">
                            <div className="w-full flex flex-col items-center max-w-sm mx-auto">
                                <h2 className="font-bold text-2xl text-white uppercase tracking-wider text-center mb-2">Seu Perfil</h2>
                                <p className="text-gray-400 text-sm text-center mb-8">
                                    {clienteAuth ? 'Você está identificado. Boas compras!' : 'Para fazer pedidos, identifique-se abaixo.'}
                                </p>
                                
                                {!clienteAuth ? (
                                    <div className="w-full space-y-4">
                                        <div>
                                            <label className="block text-[#d79e51] text-xs font-bold mb-1 ml-1 uppercase">Nome Completo</label>
                                            <input type="text" value={perfilNome} onChange={(e) => setPerfilNome(e.target.value)} placeholder="Ex: João Silva" className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 focus:border-[#d79e51] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[#d79e51] text-xs font-bold mb-1 ml-1 uppercase">Celular</label>
                                            <input type="tel" value={perfilCelular} onChange={(e) => setPerfilCelular(e.target.value)} placeholder="(11) 90000-0000" className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 focus:border-[#d79e51] outline-none" />
                                        </div>
                                        <button onClick={salvarPerfil} className="w-full bg-gradient-to-r from-[#d79e51] to-[#e8b776] text-[#1a191c] font-bold text-xl py-3.5 rounded-xl active:scale-95 transition-all mt-4">ACESSAR</button>
                                        {perfilMsg.text && (
                                            <div className={`text-center text-sm mt-2 ${perfilMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{perfilMsg.text}</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full space-y-4 mt-4">
                                        <div className="bg-[#1f1e22] border border-gray-700 rounded-xl p-4 shadow-sm">
                                            <div className="mb-4 border-b border-gray-700 pb-4">
                                                <span className="block text-gray-400 text-xs font-bold mb-1 uppercase">Nome Completo</span>
                                                <span className="text-white text-lg font-medium">{perfilNome}</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-400 text-xs font-bold mb-1 uppercase">Celular</span>
                                                <span className="text-[#d79e51] text-lg">{perfilCelular}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setClienteAuth(false)} className="w-full border border-gray-600 text-gray-300 hover:text-white font-bold text-lg py-3 rounded-xl active:scale-95 transition-all mt-4">SAIR / EDITAR DADOS</button>
                                    </div>
                                )}
                            </div>
                            <div className="mt-8 pt-4 border-t border-gray-800 text-center w-full">
                                <button onClick={() => setView('admin')} className="text-[10px] text-gray-600 uppercase hover:text-[#d79e51]">Área Restrita</button>
                            </div>
                        </div>
                    )}

                    {}
                    {/* --- PEDIDOS VIEW --- */}
                    {view === 'pedidos' && (
                        <div className="px-6 pt-6 pb-20">
                            <div className="sticky top-0 bg-[#2b2a2d] z-10 pb-4 pt-2 mb-4 border-b border-gray-800">
                                <h2 className="font-bold text-2xl text-white uppercase tracking-wider text-center">Meus Pedidos</h2>
                            </div>
                            <div className="text-center text-gray-400 mt-10">
                                <i className="fas fa-receipt text-4xl mb-4"></i>
                                <p>Nenhum pedido recente.</p>
                            </div>
                        </div>
                    )}

                    {}
                    {/* --- ADMIN VIEW --- */}
                    {view === 'admin' && (
                         <div className="px-6 pt-6 pb-20">
                            <h2 className="font-bold text-xl text-[#d79e51] uppercase mb-4 border-b border-gray-800 pb-2">Painel Admin</h2>
                            
                            <div className="flex space-x-2 mb-6">
                                <button onClick={() => setAdminView('pedidos')} className={`px-4 py-2 rounded-lg text-sm font-bold ${adminView === 'pedidos' ? 'bg-[#d79e51] text-black' : 'bg-[#363539] text-white'}`}>Pedidos</button>
                                <button onClick={() => setAdminView('configs')} className={`px-4 py-2 rounded-lg text-sm font-bold ${adminView === 'configs' ? 'bg-[#d79e51] text-black' : 'bg-[#363539] text-white'}`}>Configs</button>
                            </div>

                            {adminView === 'configs' && (
                                <div className="space-y-4">
                                    <div className="bg-[#1f1e22] p-4 rounded-xl border border-gray-800">
                                        <h3 className="text-white font-medium mb-3">Configurações da Loja</h3>
                                        
                                        <div className="mb-4">
                                            <label className="block text-gray-400 text-xs mb-1">Tempo de Entrega</label>
                                            <div className="flex">
                                                <input type="text" value={adminTempTempo} onChange={e => setAdminTempTempo(e.target.value)} className="bg-[#1a191c] text-white border border-gray-700 rounded-l-md px-3 py-2 text-sm w-full outline-none" />
                                                <button onClick={salvarTempoDelivery} className="bg-[#363539] text-[#d79e51] px-4 rounded-r-md border border-l-0 border-gray-700"><i className="fas fa-save"></i></button>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-gray-400 text-xs mb-1">Raio (KM)</label>
                                            <div className="flex">
                                                <input type="number" value={adminTempRaio} onChange={e => setAdminTempRaio(e.target.value)} className="bg-[#1a191c] text-white border border-gray-700 rounded-l-md px-3 py-2 text-sm w-full outline-none" />
                                                <button onClick={salvarRaioEntrega} className="bg-[#363539] text-[#d79e51] px-4 rounded-r-md border border-l-0 border-gray-700"><i className="fas fa-save"></i></button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                                            <div>
                                                <span className="text-gray-400 text-xs block">Status da Loja</span>
                                                <span className={`text-sm font-bold ${restaurante.is_aberto ? 'text-green-400' : 'text-red-400'}`}>{restaurante.is_aberto ? 'Aberto' : 'Fechado'}</span>
                                            </div>
                                            <label className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" checked={restaurante.is_aberto} onChange={toggleStatusLoja} className="sr-only" />
                                                    <div className={`block w-14 h-8 rounded-full transition-colors duration-300 ${restaurante.is_aberto ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                                                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${restaurante.is_aberto ? 'translate-x-6' : ''}`}></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <button onClick={() => setView('home')} className="w-full text-center text-sm text-gray-500 hover:text-white mt-4">Sair do Admin</button>
                                </div>
                            )}

                            {adminView === 'pedidos' && (
                                <div className="text-center text-gray-500 mt-10">
                                    <p>Nenhum pedido na fila.</p>
                                </div>
                            )}
                         </div>
                    )}

                </div>

                {}
                {/* --- NAVEGAÇÃO INFERIOR --- */}
                {view !== 'admin' && (
                    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#242326]/90 backdrop-blur-xl border-t border-gray-700/50 px-3 py-3.5 flex justify-between items-center z-30">
                        {[
                            { id: 'home', icon: 'fa-home', label: 'Início' },
                            { id: 'cardapio', icon: 'fa-book-open', label: 'Cardápio' },
                            { id: 'pedidos', icon: 'fa-receipt', label: 'Pedidos' },
                            { id: 'carrinho', icon: 'fa-shopping-cart', label: 'Carrinho', badge: true },
                            { id: 'perfil', icon: 'fa-user', label: 'Perfil' }
                        ].map(nav => (
                            <button key={nav.id} onClick={() => setView(nav.id)} className={`flex flex-col items-center space-y-1.5 w-[20%] relative transition-opacity ${view === nav.id ? 'opacity-100' : 'opacity-60'}`}>
                                <i className={`fas ${nav.icon} text-xl ${view === nav.id ? 'text-[#d79e51]' : 'text-white'}`}></i>
                                <span className={`text-[10px] font-medium ${view === nav.id ? 'text-[#d79e51]' : 'text-gray-300'}`}>{nav.label}</span>
                                {nav.badge && badgeCount > 0 && (
                                    <div className="absolute -top-1.5 right-1.5 bg-[#d79e51] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                        {badgeCount}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}