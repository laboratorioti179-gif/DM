import React, { useState, useEffect, useRef } from 'react';

const supabaseUrl = 'https://ganonghurphzojglfvri.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhbm9uZ2h1cnBoem9qZ2xmdnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTU1NjksImV4cCI6MjEwMTQzMTU2OX0.BGlMDrN0WtuWjfTtJcwin-H9UbnhgLWWtJBUFTn2Q8Q';

// Helper for dynamic script loading
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

function App() {
    const [supabaseClient, setSupabaseClient] = useState(null);
    const [isAppInicializado, setIsAppInicializado] = useState(false);
    const [carrinho, setCarrinho] = useState([]);
    const [restaurante, setRestaurante] = useState(null);
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [abaAtiva, setAbaAtiva] = useState('home');
    const [abaAdminAtiva, setAbaAdminAtiva] = useState('cardapio');
    
    // Auth & User States
    const [cliente, setCliente] = useState({ nome: '', celular: '' });
    const [isClienteIdentificado, setIsClienteIdentificado] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCredenciais, setAdminCredenciais] = useState({ email: '', senha: '' });
    const [loginMsg, setLoginMsg] = useState({ text: '', type: '' });
    
    // Checkout States
    const [checkoutForm, setCheckoutForm] = useState({
        tipoEntrega: 'entrega',
        endereco: '',
        pagamento: 'Cartão',
        troco: ''
    });
    
    // Admin States
    const [menuAdminAberto, setMenuAdminAberto] = useState(false);
    const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState({ aberto: false, id: null });
    const [produtoEditando, setProdutoEditando] = useState(null);

    useEffect(() => {
        const initLibs = async () => {
            try {
                // Force Tailwind CSS load
                await loadScript('https://cdn.tailwindcss.com');
                window.tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                'app-bg': '#2b2a2d',
                                'app-gold': '#d79e51',
                                'app-gold-light': '#e8b776',
                                'app-gold-dark': '#b37a3b',
                                'app-gray': '#4a4a4a',
                                'app-gray-light': '#8e8e8e',
                                'app-card': '#363539',
                            },
                            fontFamily: {
                                'heading': ['Oswald', 'sans-serif'],
                                'body': ['Roboto', 'sans-serif'],
                            }
                        }
                    }
                };

                const linkFont = document.createElement('link');
                linkFont.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Roboto:wght@400;500&display=swap';
                linkFont.rel = 'stylesheet';
                document.head.appendChild(linkFont);

                const linkFA = document.createElement('link');
                linkFA.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
                linkFA.rel = 'stylesheet';
                document.head.appendChild(linkFA);

                await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
                const client = window.supabase.createClient(supabaseUrl, supabaseKey);
                setSupabaseClient(client);
            } catch (error) {
                console.error("Failed to load libraries", error);
            }
        };
        initLibs();
    }, []);

    useEffect(() => {
        if (!supabaseClient) return;

        const fetchData = async () => {
            try {
                // Fetch Restaurante
                const { data: restData } = await supabaseClient.from('restaurante').select('*').limit(1).single();
                if (restData) {
                    setRestaurante({
                        ...restData,
                        tempo_entrega: localStorage.getItem('backup_tempo_delivery') || restData.tempo_entrega,
                        raio_entrega: localStorage.getItem('backup_raio_entrega') || restData.raio_entrega,
                        is_aberto: localStorage.getItem('backup_status_loja') !== null ? (localStorage.getItem('backup_status_loja') === 'true') : restData.is_aberto,
                        foto_capa_url: localStorage.getItem('backup_cover') || restData.foto_capa_url,
                        logo_url: localStorage.getItem('backup_logo') || restData.logo_url
                    });
                } else {
                    // Fallback
                    setRestaurante({
                        id: 'demo',
                        nome: 'DOGS DO MIRSO',
                        tempo_entrega: localStorage.getItem('backup_tempo_delivery') || '30-45 min',
                        raio_entrega: localStorage.getItem('backup_raio_entrega') || 5,
                        is_aberto: localStorage.getItem('backup_status_loja') !== null ? (localStorage.getItem('backup_status_loja') === 'true') : true,
                        foto_capa_url: localStorage.getItem('backup_cover') || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        logo_url: localStorage.getItem('backup_logo') || ''
                    });
                }

                // Fetch Categories
                let { data: cats } = await supabaseClient.from('categorias').select('id, nome').order('ordem');
                if (!cats || cats.length === 0) {
                     cats = [
                        { id: '1', nome: 'Cachorros', ordem: 1 },
                        { id: '2', nome: 'Porções', ordem: 2 },
                        { id: '3', nome: 'Bebidas', ordem: 3 },
                        { id: '4', nome: 'Combos', ordem: 4 }
                    ];
                }
                setCategorias(cats);

                // Fetch Produtos
                const { data: prodData } = await supabaseClient.from('produtos').select('*');
                if (prodData) setProdutos(prodData);
                else {
                    // Demo Data
                    setProdutos([
                        { id: 'p1', nome: 'Dogão Clássico', preco: 15.90, categoria_id: '1', ativo: true, is_destaque: true, descricao: 'Pão, salsicha, purê, batata palha, milho e molho.', imagem_url: 'https://images.unsplash.com/photo-1594212699903-a8c2f1f4561a?w=400&q=80' },
                        { id: 'p2', nome: 'Batata Frita', preco: 22.00, categoria_id: '2', ativo: true, is_destaque: false, descricao: 'Porção 400g', imagem_url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&q=80' },
                    ]);
                }

            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setIsAppInicializado(true);
            }
        };

        fetchData();

        // Check Local Storage Auth
        const clienteNome = localStorage.getItem('cliente_nome');
        const clienteCelular = localStorage.getItem('cliente_celular');
        if (clienteNome && clienteCelular) {
            setCliente({ nome: clienteNome, celular: clienteCelular });
            setIsClienteIdentificado(true);
        }

        const adminBypass = localStorage.getItem('isAdminBypass');
        if (adminBypass === 'true') {
            setIsAdmin(true);
            setAbaAtiva('admin');
        }

    }, [supabaseClient]);

    const adicionarAoCarrinho = (produto) => {
        setCarrinho(prev => {
            const exist = prev.find(item => item.id === produto.id);
            if (exist) {
                return prev.map(item => item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item);
            }
            return [...prev, { ...produto, quantidade: 1, observacao: '' }];
        });
    };

    const alterarQuantidade = (index, delta) => {
        setCarrinho(prev => {
            const newCart = [...prev];
            newCart[index].quantidade += delta;
            if (newCart[index].quantidade <= 0) {
                newCart.splice(index, 1);
            }
            return newCart;
        });
    };

    const atualizarObs = (index, valor) => {
        setCarrinho(prev => {
            const newCart = [...prev];
            newCart[index].observacao = valor;
            return newCart;
        });
    };

    const totalCarrinho = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

    const fazerPedidoAgora = () => {
        if (!isClienteIdentificado) {
            setAbaAtiva('perfil');
        } else {
            setAbaAtiva('cardapio');
        }
    };

    const irParaCategoria = (catNome) => {
        setAbaAtiva('cardapio');
        setTimeout(() => {
            const headers = Array.from(document.querySelectorAll('h3'));
            const target = headers.find(el => el.textContent.trim().toLowerCase() === catNome.toLowerCase());
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    };

    const salvarPerfil = async () => {
        if (!cliente.nome || !cliente.celular) {
            setLoginMsg({ text: 'Preencha nome e celular.', type: 'error' });
            return;
        }
        setLoginMsg({ text: 'Autenticando...', type: 'info' });
        
        localStorage.setItem('cliente_nome', cliente.nome);
        localStorage.setItem('cliente_celular', cliente.celular);
        setIsClienteIdentificado(true);
        setLoginMsg({ text: 'Tudo pronto!', type: 'success' });
        setTimeout(() => {
            setAbaAtiva('cardapio');
            setLoginMsg({ text: '', type: '' });
        }, 800);
    };

    const confirmarCheckout = async () => {
        if (!isClienteIdentificado) {
            setAbaAtiva('perfil');
            return;
        }
        if (!restaurante?.is_aberto && !isAdmin) {
            alert("A loja está fechada no momento.");
            return;
        }
        if (checkoutForm.tipoEntrega === 'entrega' && !checkoutForm.endereco) {
            alert("Preencha o endereço.");
            return;
        }

        const novoPedido = {
            id: Math.random().toString(36).substr(2, 9),
            cliente_nome: cliente.nome,
            cliente_celular: cliente.celular,
            total: totalCarrinho,
            status: 'novo',
            created_at: new Date().toISOString(),
            itens: JSON.stringify({
                lanches: carrinho,
                endereco: checkoutForm.tipoEntrega === 'entrega' ? checkoutForm.endereco : 'Retirada',
                pagamento: checkoutForm.pagamento,
                troco: checkoutForm.pagamento === 'Dinheiro' ? checkoutForm.troco : ''
            })
        };

        setPedidos(prev => [novoPedido, ...prev]);
        setCarrinho([]);
        setCheckoutForm({ ...checkoutForm, endereco: '', troco: '' });
        alert("Pedido enviado com sucesso!");
        setAbaAtiva('pedidos');
    };

    const loginAdminForm = () => {
        if (adminCredenciais.email === 'dogsdomirso.ls@outlook.com' && adminCredenciais.senha === 'K1nder$202525') {
            localStorage.setItem('isAdminBypass', 'true');
            setIsAdmin(true);
            setAbaAtiva('admin');
        } else {
            alert("Credenciais Inválidas");
        }
    };

    const sairAdmin = () => {
        localStorage.removeItem('isAdminBypass');
        setIsAdmin(false);
        setAbaAtiva('home');
    };

    // Função de Exclusão Corrigida
    const excluirProduto = (id) => {
        setModalConfirmacaoAberto({ aberto: true, id: id });
    };

    const confirmarExclusao = async () => {
        if (modalConfirmacaoAberto.id) {
            // Em ambiente real com DB: await supabaseClient.from('produtos').delete().eq('id', modalConfirmacaoAberto.id);
            setProdutos(prev => prev.filter(p => p.id !== modalConfirmacaoAberto.id));
        }
        setModalConfirmacaoAberto({ aberto: false, id: null });
        setModalProdutoAberto(false);
    };

    const toggleStatusLoja = () => {
        const novoStatus = !restaurante.is_aberto;
        setRestaurante({ ...restaurante, is_aberto: novoStatus });
        localStorage.setItem('backup_status_loja', novoStatus);
    };

    const abrirModalProdutoEdicao = (produto = null) => {
        if (produto) {
            setProdutoEditando({ ...produto });
        } else {
            setProdutoEditando({ id: null, nome: '', preco: '', categoria_id: categorias[0]?.id, descricao: '', ativo: true, is_destaque: false, imagem_url: '' });
        }
        setModalProdutoAberto(true);
    };

    const salvarProdutoAdmin = () => {
        if (!produtoEditando.nome || !produtoEditando.preco) return;
        
        const payload = {
            ...produtoEditando,
            preco: parseFloat(produtoEditando.preco)
        };

        setProdutos(prev => {
            if (payload.id) {
                return prev.map(p => p.id === payload.id ? payload : p);
            } else {
                return [...prev, { ...payload, id: Math.random().toString(36).substr(2, 9) }];
            }
        });
        setModalProdutoAberto(false);
    };

    const moverPedidoAdmin = (id, novoStatus) => {
        setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus } : p));
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 800;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const b64 = await compressImage(file);
        setProdutoEditando({ ...produtoEditando, imagem_url: b64 });
    };

    if (!isAppInicializado) return <div className="min-h-screen bg-[#1a191c] flex items-center justify-center text-white font-body">Carregando...</div>;

    const renderClientView = () => (
        <div className="phone-container w-full min-h-screen mx-auto bg-[#2b2a2d] relative flex flex-col transition-all duration-300">
            {/* Header Delivery Info */}
            <div className="bg-[#1a191c] flex justify-center items-center py-2.5 border-b border-gray-800 text-xs font-body shadow-md z-20 flex-shrink-0">
                <span className="text-gray-300 flex items-center">
                    <i className="fas fa-motorcycle text-app-gold mr-2"></i>
                    Delivery: {restaurante?.tempo_entrega}
                </span>
                <span className="mx-3 text-gray-600">|</span>
                <span className={`font-medium ${restaurante?.is_aberto ? 'text-app-gold' : 'text-red-500'}`}>{restaurante?.is_aberto ? 'Aberto' : 'Fechado'}</span>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
                
                {/* --- ABA HOME --- */}
                {abaAtiva === 'home' && (
                    <div>
                        <div className="relative flex flex-col items-center mb-6">
                            <div className="w-full h-36 relative bg-gray-900 overflow-hidden">
                                <img src={restaurante?.foto_capa_url} alt="Capa" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
                            </div>
                            
                            <div className="w-36 h-36 rounded-full flex flex-col items-center justify-center p-1.5 -mt-16 z-10 relative bg-[#2b2a2d] shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
                                <div className="w-full h-full border-2 border-app-gold rounded-full flex flex-col items-center justify-center relative bg-[#1f1e22] overflow-hidden">
                                    {restaurante?.logo_url ? (
                                        <img src={restaurante.logo_url} className="absolute inset-0 w-full h-full object-cover z-20" alt="Logo"/>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center relative z-10">
                                            <span className="text-[9px] text-gray-400 absolute top-4 left-5">since</span>
                                            <span className="text-[9px] text-gray-400 absolute top-4 right-5">2017</span>
                                            <i className="fas fa-hotdog text-3xl text-app-gold mb-1 drop-shadow-sm"></i>
                                            <h1 className="font-heading font-bold text-xl tracking-wider text-white leading-none whitespace-nowrap drop-shadow-md">DOGS DO MIRSO</h1>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-center mb-7 w-full px-2 mt-4 flex flex-col items-center justify-center">
                                <h2 className="font-heading flex flex-row items-center justify-center space-x-1.5 whitespace-nowrap">
                                    <span className="font-bold text-white text-[1.1rem] tracking-wider">{restaurante?.nome}</span>
                                    <span className="text-app-gold font-light mx-1">|</span>
                                    <span className="text-gray-300 font-normal text-[1.1rem] tracking-wide">CARDÁPIO DIGITAL</span>
                                </h2>
                            </div>

                            <div className="w-full px-6 max-w-sm mx-auto">
                                <button onClick={fazerPedidoAgora} className="w-full bg-gradient-to-r from-app-gold to-app-gold-light hover:from-app-gold-light hover:to-app-gold text-white/90 font-heading font-bold text-2xl py-4 rounded-xl shadow-[0_6px_20px_rgba(215,158,81,0.25)] active:scale-95 transition-all flex items-center justify-center space-x-2">
                                    <span>FAZER PEDIDO AGORA</span>
                                </button>
                            </div>
                        </div>

                        {/* Categorias */}
                        <div className="mt-8 px-2 pb-6">
                            <div className="flex justify-between overflow-x-auto hide-scrollbar px-4 pb-4 pt-2 space-x-5 snap-x">
                                <div onClick={() => irParaCategoria('Cachorros')} className="flex flex-col items-center space-y-3 cursor-pointer flex-shrink-0 snap-center">
                                    <div className="w-[75px] h-[75px] rounded-full bg-[#363539] border border-gray-700 flex items-center justify-center shadow-lg"><i className="fas fa-hotdog text-3xl text-app-gold"></i></div>
                                    <span className="text-gray-400 text-[13px] font-body">Cachorros</span>
                                </div>
                                <div onClick={() => irParaCategoria('Porções')} className="flex flex-col items-center space-y-3 cursor-pointer flex-shrink-0 snap-center">
                                    <div className="w-[75px] h-[75px] rounded-full bg-[#363539] border border-gray-700 flex items-center justify-center shadow-lg"><i className="fas fa-utensils text-3xl text-app-gold"></i></div>
                                    <span className="text-gray-400 text-[13px] font-body">Porções</span>
                                </div>
                                <div onClick={() => irParaCategoria('Bebidas')} className="flex flex-col items-center space-y-3 cursor-pointer flex-shrink-0 snap-center">
                                    <div className="w-[75px] h-[75px] rounded-full bg-[#363539] border border-gray-700 flex items-center justify-center shadow-lg"><i className="fas fa-glass-water text-3xl text-app-gold"></i></div>
                                    <span className="text-gray-400 text-[13px] font-body">Bebidas</span>
                                </div>
                                <div onClick={() => irParaCategoria('Combos')} className="flex flex-col items-center space-y-3 cursor-pointer flex-shrink-0 snap-center">
                                    <div className="w-[75px] h-[75px] rounded-full bg-[#363539] border border-gray-700 flex items-center justify-center shadow-lg"><i className="fas fa-box-open text-3xl text-app-gold"></i></div>
                                    <span className="text-gray-400 text-[13px] font-body">Combos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ABA CARDAPIO --- */}
                {abaAtiva === 'cardapio' && (
                    <div className="px-6 pt-6 pb-20">
                        <div className="sticky top-0 bg-[#2b2a2d] z-10 pb-4 pt-2 mb-4 border-b border-gray-800 text-center">
                            <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider">Nosso Cardápio</h2>
                        </div>
                        <div className="space-y-6">
                            {categorias.map(cat => {
                                const prods = produtos.filter(p => p.categoria_id === cat.id && p.ativo);
                                if (prods.length === 0) return null;
                                return (
                                    <div key={cat.id}>
                                        <h3 className="font-heading text-[1.3rem] text-app-gold mb-4 border-b border-gray-700/50 pb-2 uppercase">{cat.nome}</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {prods.map(p => (
                                                <div key={p.id} className="bg-app-card rounded-2xl p-3 flex shadow border border-gray-700/50">
                                                    <img src={p.imagem_url || 'https://placehold.co/400'} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" alt={p.nome}/>
                                                    <div className="ml-3 flex flex-col justify-between flex-grow">
                                                        <div>
                                                            <h4 className="font-heading text-white text-[1.1rem] leading-tight">{p.nome}</h4>
                                                            <p className="text-gray-400 text-[11px] mt-1">{p.descricao}</p>
                                                        </div>
                                                        <div className="flex justify-between items-end mt-2">
                                                            <span className="text-app-gold font-bold text-lg">R$ {Number(p.preco).toFixed(2).replace('.',',')}</span>
                                                            <button onClick={() => adicionarAoCarrinho(p)} className="w-9 h-9 border border-app-gold/50 rounded-full text-app-gold flex items-center justify-center hover:bg-app-gold hover:text-app-bg transition-colors">
                                                                <i className="fas fa-plus"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- ABA CARRINHO --- */}
                {abaAtiva === 'carrinho' && (
                    <div className="px-6 pt-6 pb-20 flex flex-col min-h-[80vh]">
                        <div className="sticky top-0 bg-[#2b2a2d] z-10 pb-4 pt-2 mb-4 border-b border-gray-800 text-center">
                            <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider">Seu Pedido</h2>
                        </div>
                        
                        {carrinho.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center mt-10">
                                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4"><i className="fas fa-shopping-basket text-4xl text-gray-600"></i></div>
                                <h3 className="font-heading font-medium text-xl text-gray-300 mb-2">Seu carrinho está vazio</h3>
                                <button onClick={() => setAbaAtiva('cardapio')} className="px-6 py-3 border border-app-gold text-app-gold rounded-xl font-bold font-heading uppercase mt-4">Ver Cardápio</button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                <div className="space-y-4 mb-6">
                                    {carrinho.map((item, idx) => (
                                        <div key={idx} className="bg-app-card rounded-xl p-3 border border-gray-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-heading font-medium text-white">{item.nome}</h4>
                                                <span className="text-app-gold font-bold">R$ {(item.preco * item.quantidade).toFixed(2).replace('.',',')}</span>
                                            </div>
                                            <input type="text" placeholder="Observação (Ex: sem cebola)" value={item.observacao} onChange={(e) => atualizarObs(idx, e.target.value)} className="w-full bg-[#1a191c] text-xs text-gray-300 border border-gray-700 rounded mb-3 px-2 py-1 outline-none focus:border-app-gold"/>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400">R$ {Number(item.preco).toFixed(2).replace('.',',')} un</span>
                                                <div className="flex items-center space-x-3 bg-[#1a191c] rounded-lg px-2 py-1">
                                                    <button onClick={() => alterarQuantidade(idx, -1)} className="text-app-gold font-bold w-6 h-6">-</button>
                                                    <span className="text-white font-bold w-4 text-center">{item.quantidade}</span>
                                                    <button onClick={() => alterarQuantidade(idx, 1)} className="text-app-gold font-bold w-6 h-6">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6 mb-6">
                                    <div>
                                        <h4 className="text-app-gold font-heading font-medium uppercase mb-3 text-sm flex items-center"><i className="fas fa-map-marker-alt mr-2"></i> 1. Entrega</h4>
                                        <select value={checkoutForm.tipoEntrega} onChange={(e) => setCheckoutForm({...checkoutForm, tipoEntrega: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-3 mb-3 outline-none font-body text-sm">
                                            <option value="entrega">Entregar no meu endereço</option>
                                            <option value="retirada">Retirar no estabelecimento</option>
                                        </select>
                                        {checkoutForm.tipoEntrega === 'entrega' && (
                                            <textarea placeholder="Rua, Número, Bairro..." value={checkoutForm.endereco} onChange={(e) => setCheckoutForm({...checkoutForm, endereco: e.target.value})} rows="3" className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none font-body text-sm"></textarea>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-app-gold font-heading font-medium uppercase mb-3 text-sm flex items-center"><i className="fas fa-wallet mr-2"></i> 2. Pagamento na Entrega</h4>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <button onClick={() => setCheckoutForm({...checkoutForm, pagamento: 'Cartão'})} className={`border py-2 rounded-lg text-sm font-medium ${checkoutForm.pagamento === 'Cartão' ? 'border-app-gold bg-[#363539] text-white' : 'border-gray-700 text-gray-400'}`}>Cartão</button>
                                            <button onClick={() => setCheckoutForm({...checkoutForm, pagamento: 'Dinheiro'})} className={`border py-2 rounded-lg text-sm font-medium ${checkoutForm.pagamento === 'Dinheiro' ? 'border-app-gold bg-[#363539] text-white' : 'border-gray-700 text-gray-400'}`}>Dinheiro</button>
                                        </div>
                                        {checkoutForm.pagamento === 'Dinheiro' && (
                                            <input type="text" placeholder="Troco para quanto?" value={checkoutForm.troco} onChange={(e) => setCheckoutForm({...checkoutForm, troco: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none font-body text-sm"/>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-700 pt-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-heading font-bold text-xl uppercase">Total</span>
                                        <span className="text-app-gold font-bold font-body text-2xl">R$ {totalCarrinho.toFixed(2).replace('.',',')}</span>
                                    </div>
                                </div>
                                <button onClick={confirmarCheckout} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-heading font-bold text-xl py-4 rounded-xl shadow-[0_6px_20px_rgba(34,197,94,0.3)] active:scale-95 transition-all">
                                    <i className="fas fa-check-circle mr-2"></i> ENVIAR PEDIDO
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- ABA PEDIDOS --- */}
                {abaAtiva === 'pedidos' && (
                    <div className="px-6 pt-6 pb-20">
                        <div className="sticky top-0 bg-[#2b2a2d] z-10 pb-4 pt-2 mb-4 border-b border-gray-800 text-center">
                            <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider">Meus Pedidos</h2>
                        </div>
                        {!isClienteIdentificado ? (
                            <div className="flex flex-col items-center justify-center text-center mt-10">
                                <h3 className="font-heading font-medium text-xl text-gray-300 mb-2">Identifique-se</h3>
                                <button onClick={() => setAbaAtiva('perfil')} className="px-6 py-3 border border-app-gold text-app-gold rounded-xl mt-4">Ir para Perfil</button>
                            </div>
                        ) : pedidos.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10">Nenhum pedido recente.</div>
                        ) : (
                            <div className="space-y-4">
                                {pedidos.filter(p => p.cliente_celular === cliente.celular).map((p, idx) => {
                                    let info = { lanches: [] };
                                    try { info = JSON.parse(p.itens); } catch(e){}
                                    
                                    let statusProps = { label: 'Pendente', color: 'text-gray-400', w: '10%' };
                                    if(p.status==='novo') statusProps = { label: 'Enviado', color: 'text-blue-400', w: '25%' };
                                    else if(p.status==='preparo') statusProps = { label: 'Em Preparo', color: 'text-yellow-400', w: '50%' };
                                    else if(p.status==='pronto') statusProps = { label: 'Pronto/Entrega', color: 'text-green-400', w: '75%' };
                                    else if(p.status==='finalizado') statusProps = { label: 'Concluído', color: 'text-gray-500', w: '100%' };

                                    return (
                                        <div key={idx} className="bg-[#363539] rounded-xl p-4 border border-gray-700 shadow-sm">
                                            <div className="flex justify-between mb-2 pb-2 border-b border-gray-700/50">
                                                <h4 className="font-heading font-medium text-white text-sm">Pedido #{p.id.toUpperCase()}</h4>
                                                <span className="text-app-gold font-bold text-sm">R$ {Number(p.total).toFixed(2).replace('.',',')}</span>
                                            </div>
                                            <p className="text-xs text-gray-300 mb-3 truncate">{info.lanches?.map(l => `${l.quantidade}x ${l.nome}`).join(', ')}</p>
                                            <div className={`text-xs font-bold ${statusProps.color} uppercase tracking-wider mb-2`}>{statusProps.label}</div>
                                            <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-app-gold h-1.5 rounded-full" style={{width: statusProps.w}}></div></div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* --- ABA PERFIL --- */}
                {abaAtiva === 'perfil' && (
                    <div className="px-6 pt-10 pb-20 flex flex-col items-center min-h-[70vh] justify-between">
                        <div className="w-full max-w-sm mx-auto flex flex-col items-center">
                            <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-2">Seu Perfil</h2>
                            
                            {!isClienteIdentificado ? (
                                <div className="w-full space-y-4">
                                    <p className="text-gray-400 text-sm font-body text-center mb-8">Identifique-se para pedir.</p>
                                    <div>
                                        <label className="block text-app-gold text-xs font-bold mb-1 ml-1 uppercase">Nome Completo</label>
                                        <input type="text" value={cliente.nome} onChange={(e) => setCliente({...cliente, nome: e.target.value})} className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-app-gold text-xs font-bold mb-1 ml-1 uppercase">Celular (WhatsApp)</label>
                                        <input type="tel" value={cliente.celular} onChange={(e) => setCliente({...cliente, celular: e.target.value})} className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 outline-none" />
                                    </div>
                                    <button onClick={salvarPerfil} className="w-full bg-app-gold text-white font-heading font-bold text-xl py-3.5 rounded-xl mt-4">ACESSAR</button>
                                    {loginMsg.text && <div className={`text-center text-sm mt-2 ${loginMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{loginMsg.text}</div>}
                                </div>
                            ) : (
                                <div className="w-full space-y-4">
                                    <p className="text-green-400 text-sm font-body text-center mb-8">Você está identificado.</p>
                                    <div className="bg-[#1f1e22] border border-gray-700 rounded-xl p-4">
                                        <div className="mb-4 border-b border-gray-700 pb-4">
                                            <span className="block text-gray-400 text-xs font-bold mb-1 uppercase">Nome</span>
                                            <span className="text-white text-lg">{cliente.nome}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400 text-xs font-bold mb-1 uppercase">Celular</span>
                                            <span className="text-app-gold text-lg">{cliente.celular}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsClienteIdentificado(false)} className="w-full bg-transparent border border-gray-600 text-gray-300 py-3 rounded-xl mt-4">EDITAR DADOS</button>
                                </div>
                            )}
                        </div>
                        <div className="mt-8 pt-4 border-t border-gray-800 text-center w-full">
                            <button onClick={() => setAbaAtiva('admin-login')} className="text-[10px] text-gray-600 uppercase hover:text-app-gold">Área Restrita</button>
                        </div>
                    </div>
                )}

                {/* --- ABA LOGIN ADMIN --- */}
                {abaAtiva === 'admin-login' && (
                    <div className="px-6 pt-10 pb-20 flex flex-col items-center">
                        <div className="w-full max-w-sm mx-auto space-y-4">
                            <h2 className="font-heading font-bold text-2xl text-app-gold uppercase text-center mb-8">Acesso Restrito</h2>
                            <div>
                                <label className="block text-app-gold text-xs font-bold mb-1 ml-1 uppercase">E-mail</label>
                                <input type="email" value={adminCredenciais.email} onChange={(e) => setAdminCredenciais({...adminCredenciais, email: e.target.value})} className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 outline-none" />
                            </div>
                            <div>
                                <label className="block text-app-gold text-xs font-bold mb-1 ml-1 uppercase">Senha</label>
                                <input type="password" value={adminCredenciais.senha} onChange={(e) => setAdminCredenciais({...adminCredenciais, senha: e.target.value})} className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 outline-none" />
                            </div>
                            <button onClick={loginAdminForm} className="w-full bg-gray-800 text-white font-heading font-bold py-3.5 rounded-xl border border-gray-600 mt-4">ENTRAR</button>
                            <button onClick={() => setAbaAtiva('perfil')} className="w-full bg-transparent text-gray-500 py-2 mt-2">Voltar</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation Bar */}
            {abaAtiva !== 'admin-login' && abaAtiva !== 'admin' && (
                <div className="absolute bottom-0 left-0 right-0 bg-[#242326]/90 backdrop-blur-xl border-t border-gray-700/50 px-3 py-3.5 flex justify-between items-center z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
                    <button onClick={() => setAbaAtiva('home')} className={`flex flex-col items-center w-[20%] ${abaAtiva === 'home' ? 'opacity-100' : 'opacity-60'}`}>
                        <i className={`fas fa-home text-xl ${abaAtiva === 'home' ? 'text-app-gold' : 'text-white'}`}></i>
                        <span className={`text-[10px] mt-1 ${abaAtiva === 'home' ? 'text-app-gold' : 'text-gray-300'}`}>Início</span>
                    </button>
                    <button onClick={() => setAbaAtiva('cardapio')} className={`flex flex-col items-center w-[20%] ${abaAtiva === 'cardapio' ? 'opacity-100' : 'opacity-60'}`}>
                        <i className={`fas fa-book-open text-xl ${abaAtiva === 'cardapio' ? 'text-app-gold' : 'text-white'}`}></i>
                        <span className={`text-[10px] mt-1 ${abaAtiva === 'cardapio' ? 'text-app-gold' : 'text-gray-300'}`}>Cardápio</span>
                    </button>
                    <button onClick={() => setAbaAtiva('pedidos')} className={`flex flex-col items-center w-[20%] ${abaAtiva === 'pedidos' ? 'opacity-100' : 'opacity-60'}`}>
                        <i className={`fas fa-receipt text-xl ${abaAtiva === 'pedidos' ? 'text-app-gold' : 'text-white'}`}></i>
                        <span className={`text-[10px] mt-1 ${abaAtiva === 'pedidos' ? 'text-app-gold' : 'text-gray-300'}`}>Pedidos</span>
                    </button>
                    <button onClick={() => setAbaAtiva('carrinho')} className={`flex flex-col items-center w-[20%] relative ${abaAtiva === 'carrinho' ? 'opacity-100' : 'opacity-60'}`}>
                        <i className={`fas fa-shopping-cart text-xl ${abaAtiva === 'carrinho' ? 'text-app-gold' : 'text-white'}`}></i>
                        <span className={`text-[10px] mt-1 ${abaAtiva === 'carrinho' ? 'text-app-gold' : 'text-gray-300'}`}>Carrinho</span>
                        {carrinho.length > 0 && <div className="absolute -top-1.5 right-1.5 bg-app-gold text-app-bg text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{carrinho.reduce((s,i)=>s+i.quantidade,0)}</div>}
                    </button>
                    <button onClick={() => setAbaAtiva('perfil')} className={`flex flex-col items-center w-[20%] ${abaAtiva === 'perfil' ? 'opacity-100' : 'opacity-60'}`}>
                        <i className={`far fa-user text-xl ${abaAtiva === 'perfil' ? 'text-app-gold' : 'text-white'}`}></i>
                        <span className={`text-[10px] mt-1 ${abaAtiva === 'perfil' ? 'text-app-gold' : 'text-gray-300'}`}>Perfil</span>
                    </button>
                </div>
            )}
        </div>
    );

    const renderAdminView = () => (
        <div className="fixed inset-0 z-50 bg-[#1a191c] flex w-full h-full font-body">
            {/* Sidebar */}
            <div className={`absolute md:relative z-[60] w-64 bg-[#242326] border-r border-gray-800 flex flex-col h-full transform ${menuAdminAberto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300`}>
                <div className="p-5 flex justify-between items-center border-b border-gray-800">
                    <h2 className="font-heading font-bold text-xl text-app-gold uppercase">Gestão</h2>
                    <button onClick={() => setMenuAdminAberto(false)} className="md:hidden text-gray-400"><i className="fas fa-times"></i></button>
                </div>
                <nav className="flex-1 p-3 space-y-2">
                    <button onClick={() => setAbaAdminAtiva('cardapio')} className={`w-full flex items-center px-4 py-3 rounded-lg border ${abaAdminAtiva === 'cardapio' ? 'bg-[#363539] text-white border-gray-700' : 'text-gray-400 border-transparent hover:bg-[#363539] hover:text-white'}`}>
                        <i className={`fas fa-book-open w-6 ${abaAdminAtiva === 'cardapio' ? 'text-app-gold' : ''}`}></i> <span>Cardápio</span>
                    </button>
                    <button onClick={() => setAbaAdminAtiva('pedidos')} className={`w-full flex items-center px-4 py-3 rounded-lg border ${abaAdminAtiva === 'pedidos' ? 'bg-[#363539] text-white border-gray-700' : 'text-gray-400 border-transparent hover:bg-[#363539] hover:text-white'}`}>
                        <i className={`fas fa-receipt w-6 ${abaAdminAtiva === 'pedidos' ? 'text-app-gold' : ''}`}></i> <span>Pedidos</span>
                    </button>
                    <button onClick={() => setAbaAdminAtiva('configs')} className={`w-full flex items-center px-4 py-3 rounded-lg border ${abaAdminAtiva === 'configs' ? 'bg-[#363539] text-white border-gray-700' : 'text-gray-400 border-transparent hover:bg-[#363539] hover:text-white'}`}>
                        <i className={`fas fa-cog w-6 ${abaAdminAtiva === 'configs' ? 'text-app-gold' : ''}`}></i> <span>Configurações</span>
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <button onClick={sairAdmin} className="w-full flex items-center justify-center px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                        <i className="fas fa-sign-out-alt mr-2"></i> Voltar ao App
                    </button>
                </div>
            </div>

            {/* Overlay */}
            {menuAdminAberto && <div onClick={() => setMenuAdminAberto(false)} className="fixed inset-0 bg-black/60 z-[55] md:hidden backdrop-blur-sm"></div>}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full bg-[#1a191c] relative">
                <header className="bg-[#1f1e22] border-b border-gray-800 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center">
                        <button onClick={() => setMenuAdminAberto(true)} className="md:hidden text-gray-400 mr-4"><i className="fas fa-bars text-xl"></i></button>
                        <h3 className="text-white font-heading text-lg">Painel Admin</h3>
                    </div>
                    {abaAdminAtiva === 'cardapio' && (
                        <button onClick={() => abrirModalProdutoEdicao(null)} className="bg-app-gold text-app-bg px-4 py-2 rounded-lg font-bold text-sm">
                            <i className="fas fa-plus mr-2"></i> Novo Lanche
                        </button>
                    )}
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-8">
                    {/* Admin Cardapio */}
                    {abaAdminAtiva === 'cardapio' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {produtos.map(p => (
                                <div key={p.id} className="bg-[#1f1e22] border border-gray-800 rounded-xl overflow-hidden shadow-md">
                                    <img src={p.imagem_url || 'https://placehold.co/400x300/2b2a2d/8e8e8e?text=X'} className={`w-full h-28 object-cover ${!p.ativo ? 'grayscale opacity-50' : ''}`} alt={p.nome}/>
                                    <div className="p-4">
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest">{categorias.find(c=>c.id === p.categoria_id)?.nome}</p>
                                        <h4 className="text-white font-medium text-sm my-1">{p.nome}</h4>
                                        <p className="text-app-gold font-bold mb-3">R$ {Number(p.preco).toFixed(2).replace('.',',')}</p>
                                        <div className="flex justify-between">
                                            <button onClick={() => setProdutos(prev => prev.map(pr => pr.id === p.id ? {...pr, ativo: !pr.ativo} : pr))} className="text-xs px-2 py-1 rounded border border-gray-600 text-gray-300">{p.ativo ? 'Pausar' : 'Ativar'}</button>
                                            <button onClick={() => abrirModalProdutoEdicao(p)} className="text-xs px-2 py-1 bg-app-gold text-app-bg rounded"><i className="fas fa-pen"></i> Editar</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Admin Pedidos Kanban */}
                    {abaAdminAtiva === 'pedidos' && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-full items-start">
                            {['novo', 'preparo', 'pronto', 'finalizado'].map(colStatus => {
                                const colNome = colStatus === 'novo' ? 'Novos' : colStatus === 'preparo' ? 'Em Preparo' : colStatus === 'pronto' ? 'Prontos' : 'Finalizados';
                                return (
                                    <div key={colStatus} className="bg-[#242326] rounded-xl border border-gray-800 flex flex-col max-h-[80vh]">
                                        <div className="p-3 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl"><h4 className="text-white font-heading font-medium text-sm uppercase">{colNome}</h4></div>
                                        <div className="p-3 overflow-y-auto space-y-3">
                                            {pedidos.filter(p => p.status === colStatus).map(p => {
                                                let info = { lanches: [] }; try { info = JSON.parse(p.itens); } catch(e){}
                                                return (
                                                    <div key={p.id} className="bg-[#363539] p-3 rounded-lg border border-gray-700">
                                                        <div className="flex justify-between border-b border-gray-700 pb-2 mb-2"><span className="text-white font-bold text-sm">{p.cliente_nome}</span><span className="text-app-gold text-sm font-bold">R$ {Number(p.total).toFixed(2).replace('.',',')}</span></div>
                                                        <div className="text-xs text-gray-300 mb-2">{info.lanches?.map(l => `${l.quantidade}x ${l.nome}`).join(', ')}</div>
                                                        {colStatus === 'novo' && <button onClick={()=>moverPedidoAdmin(p.id, 'preparo')} className="w-full bg-app-gold text-app-bg py-1.5 rounded text-xs font-bold mt-2">Aceitar</button>}
                                                        {colStatus === 'preparo' && <button onClick={()=>moverPedidoAdmin(p.id, 'pronto')} className="w-full bg-green-500 text-white py-1.5 rounded text-xs font-bold mt-2">Pronto</button>}
                                                        {colStatus === 'pronto' && <button onClick={()=>moverPedidoAdmin(p.id, 'finalizado')} className="w-full bg-gray-600 text-white py-1.5 rounded text-xs font-bold mt-2">Finalizar</button>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Admin Configurações */}
                    {abaAdminAtiva === 'configs' && (
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="bg-[#242326] rounded-xl border border-gray-800">
                                <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl"><h4 className="text-white font-heading font-medium text-sm uppercase">Operação da Loja</h4></div>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Status (Aberto/Fechado)</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={restaurante?.is_aberto} onChange={toggleStatusLoja} />
                                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-xs mb-1 uppercase">Tempo de Entrega</label>
                                        <div className="flex space-x-2">
                                            <input type="text" value={restaurante?.tempo_entrega} onChange={(e) => setRestaurante({...restaurante, tempo_entrega: e.target.value})} className="bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 flex-1 outline-none" />
                                            <button onClick={() => localStorage.setItem('backup_tempo_delivery', restaurante.tempo_entrega)} className="bg-app-gold text-app-bg px-4 rounded-lg font-bold"><i className="fas fa-save"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* MODAL DE PRODUTO COMPLETO E RESTAURADO COM FUNÇÃO EXCLUIR */}
                {modalProdutoAberto && (
                    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-[#242326] border border-gray-700 rounded-xl w-full max-w-md flex flex-col max-h-[90vh] shadow-2xl">
                            <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
                                <h3 className="text-white font-heading text-lg font-bold">{produtoEditando?.id ? 'Editar Lanche' : 'Novo Lanche'}</h3>
                                <button onClick={() => setModalProdutoAberto(false)} className="text-gray-400 hover:text-white"><i className="fas fa-times text-xl"></i></button>
                            </div>
                            <div className="p-4 overflow-y-auto space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase">Nome do Item *</label>
                                    <input type="text" value={produtoEditando?.nome} onChange={(e) => setProdutoEditando({...produtoEditando, nome: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none font-body text-sm" />
                                </div>
                                <div className="flex space-x-3">
                                    <div className="flex-1">
                                        <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase">Preço (R$) *</label>
                                        <input type="number" step="0.01" value={produtoEditando?.preco} onChange={(e) => setProdutoEditando({...produtoEditando, preco: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none font-body text-sm" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase">Categoria *</label>
                                        <select value={produtoEditando?.categoria_id} onChange={(e) => setProdutoEditando({...produtoEditando, categoria_id: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none font-body text-sm">
                                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase">Descrição</label>
                                    <textarea rows="2" value={produtoEditando?.descricao} onChange={(e) => setProdutoEditando({...produtoEditando, descricao: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 outline-none font-body text-sm"></textarea>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Foto (Opcional)</label>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-white text-xs mb-2" />
                                    {produtoEditando?.imagem_url && (
                                        <div className="w-full h-28 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                                            <img src={produtoEditando.imagem_url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Switches Corrigidos usando a técnica After do Tailwind */}
                                <div className="flex items-center space-x-6 pt-3 border-t border-gray-800">
                                    <label className="flex items-center space-x-2 cursor-pointer group">
                                        <div className="relative">
                                            <input type="checkbox" checked={produtoEditando?.ativo ?? true} onChange={(e) => setProdutoEditando({...produtoEditando, ativo: e.target.checked})} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-app-gold after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                        </div>
                                        <span className="text-xs text-gray-300">Em Estoque</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer group">
                                        <div className="relative">
                                            <input type="checkbox" checked={produtoEditando?.is_destaque ?? false} onChange={(e) => setProdutoEditando({...produtoEditando, is_destaque: e.target.checked})} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-app-gold after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                        </div>
                                        <span className="text-xs text-gray-300">Destaque</span>
                                    </label>
                                </div>

                            </div>
                            <div className="p-4 border-t border-gray-800 flex justify-between items-center shrink-0 bg-[#1f1e22] rounded-b-xl">
                                {produtoEditando?.id ? (
                                    <button onClick={() => excluirProduto(produtoEditando.id)} className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold text-xs transition-colors border border-red-500/50">Excluir Lanche</button>
                                ) : <div></div>}
                                
                                <div className="flex space-x-3">
                                    <button onClick={() => setModalProdutoAberto(false)} className="px-4 py-2 rounded-lg font-bold text-xs text-gray-400 border border-gray-600 hover:text-white">Cancelar</button>
                                    <button onClick={salvarProdutoAdmin} className="px-5 py-2 bg-app-gold text-app-bg rounded-lg font-bold text-xs">Salvar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
                {modalConfirmacaoAberto.aberto && (
                    <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-[#242326] border border-gray-700 rounded-xl w-full max-w-xs flex flex-col shadow-2xl p-5 text-center">
                            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                            <h3 className="text-white font-heading text-xl font-bold mb-2">Excluir Produto?</h3>
                            <p className="text-sm text-gray-400 font-body mb-6">Esta ação não pode ser desfeita. O lanche será removido permanentemente.</p>
                            
                            <div className="flex justify-center space-x-3">
                                <button onClick={() => setModalConfirmacaoAberto({ aberto: false, id: null })} className="px-4 py-2 rounded-lg font-bold text-sm text-gray-300 border border-gray-600 hover:bg-gray-700">Cancelar</button>
                                <button onClick={confirmarExclusao} className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700">Sim, Excluir</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return isAdmin ? renderAdminView() : renderClientView();
}

export default App;
