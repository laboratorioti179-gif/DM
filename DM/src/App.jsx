import React, { useState, useEffect, useRef } from 'react';

/* eslint-disable */

// Padroniza nomes antigos sem alterar os IDs das categorias já existentes.
const chaveCategoria = (nome = '') =>
    String(nome)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/-+/g, '-');

const normalizarNomeCategoria = (nome = '') => {
    const chave = chaveCategoria(nome);

    if (['cachorro', 'cachorros', 'hot-dog', 'hotdog'].includes(chave)) {
        return 'Hot-Dog';
    }

    if (['sobremesa', 'sobremesas'].includes(chave)) {
        return 'Sobremesa';
    }

    if (['adicional', 'adicionais'].includes(chave)) {
        return 'Adicionais';
    }

    return nome;
};

const CATEGORIAS_EXTRAS_ADMIN = [
    { idVirtual: '__categoria_sobremesa__', nome: 'Sobremesa' },
    { idVirtual: '__categoria_adicionais__', nome: 'Adicionais' }
];

const normalizarCategoriasExibicao = (lista = []) =>
    (Array.isArray(lista) ? lista : []).map(categoria => ({
        ...categoria,
        nome: normalizarNomeCategoria(categoria?.nome || '')
    }));

const App = () => {
    const [view, setView] = useState('selecionar_loja');
    const [carrinho, setCarrinho] = useState([]);
    const [restaurante, setRestaurante] = useState({
        id: null,
        nome: 'DOGS DO MIRSO',
        is_aberto: true,
        tempo_entrega: '30-45 min',
        raio_entrega: 5,
        taxa_entrega: 0,
        whatsapp: '',
        foto_capa_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        logo_url: '',
        cep: '',
        lat: -23.5329,
        lng: -46.7920
    });
    
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState(() => {
        if (typeof window === 'undefined') return [];
        try {
            const cache = localStorage.getItem('dogs_categorias_cache');
            return cache ? normalizarCategoriasExibicao(JSON.parse(cache)) : [];
        } catch (e) {
            return [];
        }
    });
    const [pedidosAdmin, setPedidosAdmin] = useState([]);
    const [clienteAuth, setClienteAuth] = useState(false);
    const [clienteDados, setClienteDados] = useState({ nome: '', celular: '', cep: '', endereco: '', referencia: '', bairro: '', lat: null, lng: null, taxa_entrega_calculada: 5 });
    const [clienteEmail, setClienteEmail] = useState('');
    const [clienteSenha, setClienteSenha] = useState('');
    const [clienteModoAcesso, setClienteModoAcesso] = useState('login'); // login | cadastro
    const [clienteAuthLoading, setClienteAuthLoading] = useState(false);
    const [clienteEditandoPerfil, setClienteEditandoPerfil] = useState(false);
    const [bairroLoja, setBairroLoja] = useState('');
    const [distanciaEntrega, setDistanciaEntrega] = useState(null);
    const [erroCep, setErroCep] = useState('');
    const [cepBuscando, setCepBuscando] = useState(false);
    const [meusPedidos, setMeusPedidos] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminView, setAdminView] = useState('pedidos');
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [adminRestauranteId, setAdminRestauranteId] = useState(null);
    const [adminRole, setAdminRole] = useState('');
    const [adminLoginLoading, setAdminLoginLoading] = useState(false);
    const [authUserId, setAuthUserId] = useState(null);
    
    const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState({ aberto: false, id: null });
    const [checkoutForm, setCheckoutForm] = useState({ tipo: 'entrega', endereco: '', pagamento: 'Cartão', troco: '', referencia: '' });
    const [mapaAberto, setMapaAberto] = useState(false);
    const mapRef = useRef(null);
    const [redirectPosLogin, setRedirectPosLogin] = useState(null);
    
    const [itemSelecionado, setItemSelecionado] = useState(null);
    const [observacao, setObservacao] = useState("");
    const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);
    const [adicionaisSelecionadosItem, setAdicionaisSelecionadosItem] = useState({});
    const [enviandoPedido, setEnviandoPedido] = useState(false);
    const [modalRejeicao, setModalRejeicao] = useState({ aberto: false, pedidoId: null, motivo: '' });
    const [alertaNovoPedido, setAlertaNovoPedido] = useState(null);
    const pedidosNovosConhecidosRef = useRef(new Set());
    const alertasInicializadosRef = useRef(false);
    
    const [cepLojaBuscando, setCepLojaBuscando] = useState(false);
    const [erroCepLoja, setErroCepLoja] = useState('');
    const [lojas, setLojas] = useState(() => {
        if (typeof window === 'undefined') return [];
        try {
            const cache = localStorage.getItem('dogs_lojas_cache');
            return cache ? JSON.parse(cache) : [];
        } catch (e) {
            return [];
        }
    });
    const [lojasLoading, setLojasLoading] = useState(() => {
        if (typeof window === 'undefined') return true;
        try {
            return !localStorage.getItem('dogs_lojas_cache');
        } catch (e) {
            return true;
        }
    });
    const [seletorLojaAberto, setSeletorLojaAberto] = useState(false);
    const seletorLojaRef = useRef(null);
    const [novaLojaForm, setNovaLojaForm] = useState({ nome: '', tempo_entrega: '30-45 min', raio_entrega: 5 });
    
    const [financeiroForm, setFinanceiroForm] = useState({ restaurante_id: '', tipo: 'entrada', valor: '', descricao: '' });
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [filtroLoja, setFiltroLoja] = useState('');
    const [filtroDataInicio, setFiltroDataInicio] = useState('');
    const [filtroDataFim, setFiltroDataFim] = useState('');
    
    const [promoForm, setPromoForm] = useState({ titulo: '', mensagem: '', webhookUrl: '' });
    const [webhookEditavel, setWebhookEditavel] = useState(true);
    const [webhookLoading, setWebhookLoading] = useState(false);
    const [webhookSalvando, setWebhookSalvando] = useState(false);
    
    const [supabase, setSupabase] = useState(null);
    const [dbLoading, setDbLoading] = useState(true);

    // Regra única de autorização administrativa.
    // app_metadata é controlado pelo servidor no Supabase e não pode ser alterado pelo próprio cliente.
    // Mantemos os dois e-mails administrativos existentes como compatibilidade legada.
    const obterPermissaoAdmin = (user) => {
        const meta = user?.app_metadata || {};
        const role = String(meta.role || '').toLowerCase();
        const email = String(user?.email || '').trim().toLowerCase();
        const emailsAdminLegados = ['dogsdomirso.ls@outlook.com', 'dogsdomirso.ls2@outlook.com'];
        const emailLegadoAutorizado = emailsAdminLegados.includes(email);
        const roleAutorizada = ['admin', 'matriz'].includes(role);
        const restauranteConfigurado = Boolean(meta.restaurante_id);

        return {
            autorizado: Boolean(email) && (roleAutorizada || restauranteConfigurado || emailLegadoAutorizado),
            email,
            role: role || (email === 'dogsdomirso.ls@outlook.com' ? 'matriz' : 'admin'),
            restauranteId: meta.restaurante_id || null
        };
    };

    const isMatriz = adminRole === 'matriz' || adminEmail === 'dogsdomirso.ls@outlook.com';
    const isFranquia2 = adminEmail === 'dogsdomirso.ls2@outlook.com';
    
    const lojaMatriz = lojas.length > 0 ? lojas[0] : null;
    const lojaFranquia = lojas.length > 1 ? lojas[1] : (lojas.length > 0 ? lojas[0] : null);
    
    const adminLojaAtual = adminRestauranteId
        ? (lojas.find(l => String(l.id) === String(adminRestauranteId)) || lojaMatriz)
        : (isFranquia2 ? lojaFranquia : lojaMatriz);
    const idAdminLogado = adminLojaAtual ? adminLojaAtual.id : null;

    // Mantém Sobremesa e Adicionais visíveis no cadastro, mesmo antes de existirem no banco.
    // Ao salvar o primeiro produto nessas opções, a categoria real é criada automaticamente.
    const categoriasAdmin = (() => {
        const lista = [...categorias];

        CATEGORIAS_EXTRAS_ADMIN.forEach(padrao => {
            const jaExiste = lista.some(
                categoria => chaveCategoria(normalizarNomeCategoria(categoria?.nome || '')) === chaveCategoria(padrao.nome)
            );

            if (!jaExiste) {
                lista.push({
                    id: padrao.idVirtual,
                    nome: padrao.nome,
                    ordem: Number.MAX_SAFE_INTEGER,
                    virtual: true
                });
            }
        });

        return lista;
    })();

    const categoriaAdicionais = categorias.find(
        categoria => chaveCategoria(normalizarNomeCategoria(categoria?.nome || '')) === 'adicionais'
    );

    const produtoEhAdicional = (produto) =>
        Boolean(
            categoriaAdicionais &&
            String(produto?.categoria_id) === String(categoriaAdicionais.id)
        );

    const descontoProduto = (produto) => {
        const valor = Number(produto?.desconto_percentual || 0);
        if (!Number.isFinite(valor)) return 0;
        return Math.max(0, Math.min(100, valor));
    };

    const precoFinalProduto = (produto) => {
        const precoOriginal = Number(produto?.preco || 0);
        const desconto = descontoProduto(produto);
        const precoFinal = precoOriginal * (1 - (desconto / 100));
        return Math.round((precoFinal + Number.EPSILON) * 100) / 100;
    };

    const produtoTemDesconto = (produto) => descontoProduto(produto) > 0;

    const formatarPercentualDesconto = (produto) => {
        const valor = descontoProduto(produto);
        return Number.isInteger(valor)
            ? String(valor)
            : valor.toFixed(2).replace('.', ',').replace(/,00$/, '');
    };

    // Fotos ilustrativas do cardápio - lote 1.
    // Se o produto já tiver imagem_url cadastrada no Supabase, ela sempre tem prioridade.
    const IMAGENS_PRODUTOS_LOTE_1 = {
        'n6tquei': 'https://images.pexels.com/photos/16108602/pexels-photo-16108602/free-photo-of-close-up-of-a-cheeseburger-with-bacon.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
        'kt9d2on': 'https://images.pexels.com/photos/15264024/pexels-photo-15264024/free-photo-of-food-on-a-plate.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
        'hw98xp0': 'https://images.pexels.com/photos/36501077/pexels-photo-36501077/free-photo-of-gourmet-hot-dog-with-cheese-and-bacon-topping.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
        '3k8wlgi': 'https://images.pexels.com/photos/36501077/pexels-photo-36501077/free-photo-of-gourmet-hot-dog-with-cheese-and-bacon-topping.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
        'thmd6kc': 'https://images.pexels.com/photos/8946523/pexels-photo-8946523.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
        'sdi640n': 'https://images.pexels.com/photos/8946523/pexels-photo-8946523.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
        '4s7o5t3': 'https://images.pexels.com/photos/16108602/pexels-photo-16108602/free-photo-of-close-up-of-a-cheeseburger-with-bacon.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
        '2c8mby9': 'https://images.pexels.com/photos/31450807/pexels-photo-31450807/free-photo-of-delicious-gourmet-cheeseburger-on-plate.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
        'mxabhg3': 'https://images.pexels.com/photos/8946523/pexels-photo-8946523.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop',
        '43f8yp3': 'https://images.pexels.com/photos/36501077/pexels-photo-36501077/free-photo-of-gourmet-hot-dog-with-cheese-and-bacon-topping.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop'
    };

    const obterImagemProduto = (produto) => {
        if (!produto) {
            return 'https://placehold.co/800x600/2b2a2d/8e8e8e?text=X';
        }

        const imagemBanco = String(produto.imagem_url || '').trim();
        if (imagemBanco) return imagemBanco;

        return IMAGENS_PRODUTOS_LOTE_1[String(produto.id)] ||
            'https://placehold.co/800x600/2b2a2d/8e8e8e?text=X';
    };

    const adicionaisDisponiveis = produtos.filter(
        produto =>
            produto.ativo &&
            String(produto.restaurante_id) === String(restaurante.id) &&
            produtoEhAdicional(produto)
    );

    const normalizarObservacao = (valor = '') => valor.trim().replace(/\s+/g, ' ').toLowerCase();
    const criarCartKey = (produtoId, obs = '') => `${produtoId}__${normalizarObservacao(obs)}__${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const tocarSomNovoPedido = () => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
            osc.onended = () => ctx.close();
        } catch (e) {
            console.warn('Não foi possível tocar o alerta sonoro.', e);
        }
    };

    const garantirSessaoCliente = async () => {
        if (!supabase) return null;
        const { data: sessaoAtual } = await supabase.auth.getSession();
        if (sessaoAtual?.session?.user && !sessaoAtual.session.user.email) {
            setAuthUserId(sessaoAtual.session.user.id);
            return sessaoAtual.session.user;
        }
        if (sessaoAtual?.session?.user && sessaoAtual.session.user.email && !isAdmin) {
            setAuthUserId(sessaoAtual.session.user.id);
            return sessaoAtual.session.user;
        }
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
            console.error('Erro ao criar sessão anônima:', error);
            throw new Error('Não foi possível criar uma sessão segura para o cliente. Ative Anonymous Sign-Ins no Supabase Auth.');
        }
        setAuthUserId(data.user?.id || null);
        return data.user || null;
    };

    const numeroPedidoVisivel = (pedido) => {
        if (pedido?.numero_pedido !== null && pedido?.numero_pedido !== undefined && pedido?.numero_pedido !== '') {
            return String(pedido.numero_pedido);
        }

        // Fallback apenas para pedidos antigos caso a migração ainda não tenha sido executada.
        return String(pedido?.id || '').substring(0, 6).toUpperCase();
    };

    const abrirWhatsAppLoja = (numero, pedido = null) => {
        const digits = String(numero || '').replace(/\D/g, '');
        if (!digits) {
            alert('O WhatsApp da loja ainda não foi configurado.');
            return;
        }
        const numeroBrasil = digits.startsWith('55') ? digits : `55${digits}`;
        const numeroPedido = pedido ? numeroPedidoVisivel(pedido) : '';
        const mensagem = numeroPedido
            ? `Olá! Gostaria de falar sobre o pedido #${numeroPedido}.`
            : 'Olá! Gostaria de falar com a loja.';
        window.open(`https://wa.me/${numeroBrasil}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer');
    };

    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };


    const normalizarBairro = (valor = '') =>
        String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();

    const bairrosIguais = (bairroA, bairroB) => {
        const a = normalizarBairro(bairroA);
        const b = normalizarBairro(bairroB);
        return Boolean(a && b && a === b);
    };


    // Geocodificação resiliente para CEPs brasileiros.
    // 1) ViaCEP resolve o endereço textual.
    // 2) BrasilAPI CEP v2 tenta fornecer latitude/longitude diretamente.
    // 3) Nominatim/OpenStreetMap entra como fallback, com consultas progressivas.
    const geocodificarCep = async (cepInput, enderecoViaCep = null) => {
        const cepLimpo = String(cepInput || '').replace(/\D/g, '');
        if (cepLimpo.length !== 8) return null;

        const coordenadasValidas = (lat, lng) => {
            const latitude = Number(lat);
            const longitude = Number(lng);
            return Number.isFinite(latitude) && Number.isFinite(longitude) &&
                latitude >= -90 && latitude <= 90 &&
                longitude >= -180 && longitude <= 180;
        };

        // 1. BrasilAPI CEP v2 — normalmente já retorna coordenadas.
        try {
            const brasilRes = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);
            if (brasilRes.ok) {
                const brasilData = await brasilRes.json();
                const coords = brasilData?.location?.coordinates || {};
                const lat = Number(coords.latitude);
                const lng = Number(coords.longitude);

                if (coordenadasValidas(lat, lng)) {
                    return {
                        lat,
                        lng,
                        fonte: 'BrasilAPI',
                        endereco: brasilData
                    };
                }
            }
        } catch (err) {
            console.warn('BrasilAPI não retornou coordenadas para o CEP:', err);
        }

        // 2. Nominatim/OpenStreetMap — fallback.
        const endereco = enderecoViaCep || {};
        const logradouro = String(endereco.logradouro || '').trim();
        const bairro = String(endereco.bairro || '').trim();
        const cidade = String(endereco.localidade || endereco.city || '').trim();
        const uf = String(endereco.uf || endereco.state || '').trim();
        const cepFormatado = `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;

        const tentativas = [
            // Consulta estruturada pelo CEP, mais precisa quando o OSM conhece o código postal.
            {
                postalcode: cepFormatado,
                city: cidade,
                state: uf,
                country: 'Brasil'
            },
            {
                q: [logradouro, bairro, cidade, uf, cepFormatado, 'Brasil'].filter(Boolean).join(', ')
            },
            {
                q: [logradouro, bairro, cidade, uf, 'Brasil'].filter(Boolean).join(', ')
            },
            {
                q: [cepFormatado, cidade, uf, 'Brasil'].filter(Boolean).join(', ')
            },
            {
                q: [cepLimpo, 'Brasil'].filter(Boolean).join(', ')
            }
        ].filter(params => Object.values(params).some(Boolean));

        for (let i = 0; i < tentativas.length; i++) {
            try {
                const params = new URLSearchParams({
                    format: 'jsonv2',
                    limit: '1',
                    countrycodes: 'br',
                    addressdetails: '1',
                    'accept-language': 'pt-BR',
                    ...tentativas[i]
                });

                const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
                if (!geoRes.ok) continue;

                const geoData = await geoRes.json();
                if (Array.isArray(geoData) && geoData.length > 0) {
                    const lat = Number(geoData[0].lat);
                    const lng = Number(geoData[0].lon);

                    if (coordenadasValidas(lat, lng)) {
                        return {
                            lat,
                            lng,
                            fonte: 'Nominatim',
                            endereco: geoData[0]
                        };
                    }
                }

                // Evita rajadas de requisições no serviço público do Nominatim.
                if (i < tentativas.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1100));
                }
            } catch (err) {
                console.warn(`Falha na tentativa ${i + 1} de geocodificação:`, err);
            }
        }

        return null;
    };

    const buscarCepLoja = async (cepInput) => {
        const cepLimpo = String(cepInput || '').replace(/\D/g, '');
        if (cepLimpo.length !== 8) return;

        setCepLojaBuscando(true);
        setErroCepLoja('');

        try {
            // ViaCEP continua sendo a fonte principal para o endereço textual.
            const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            if (!res.ok) throw new Error(`ViaCEP respondeu ${res.status}`);

            const data = await res.json();

            if (data.erro) {
                setErroCepLoja('CEP não encontrado. Confira os 8 dígitos informados.');
                return;
            }

            // Salva o CEP e guarda o bairro da loja para o cálculo automático do frete.
            setBairroLoja(data.bairro || '');
            setRestaurante(prev => ({
                ...prev,
                cep: cepInput
            }));

            const local = await geocodificarCep(cepLimpo, data);

            if (local) {
                setRestaurante(prev => ({
                    ...prev,
                    cep: cepInput,
                    lat: local.lat,
                    lng: local.lng
                }));

                setErroCepLoja('');
                console.info(`CEP da loja geocodificado por ${local.fonte}:`, local.lat, local.lng);
            } else {
                // Não apaga coordenadas já salvas da loja caso o serviço externo falhe.
                setErroCepLoja(
                    'CEP encontrado, mas não foi possível obter as coordenadas automaticamente. ' +
                    'Tente novamente em alguns instantes ou mantenha a localização já cadastrada.'
                );
            }
        } catch (err) {
            console.error('Erro ao buscar CEP da loja:', err);
            setErroCepLoja('Não foi possível consultar a localização agora. Tente novamente em alguns instantes.');
        } finally {
            setCepLojaBuscando(false);
        }
    };

    const buscarCep = async (cepInput) => {
        const cepLimpo = String(cepInput || '').replace(/\D/g, '');
        if (cepLimpo.length !== 8) return;

        setCepBuscando(true);
        setErroCep('');

        try {
            const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            if (!res.ok) throw new Error(`ViaCEP respondeu ${res.status}`);

            const data = await res.json();

            if (data.erro) {
                setErroCep('CEP não encontrado. Confira os 8 dígitos informados.');
                return;
            }

            let bairroOrigem = bairroLoja;

            if (!bairroOrigem && restaurante.cep) {
                try {
                    const cepLojaLimpo = String(restaurante.cep).replace(/\D/g, '');

                    if (cepLojaLimpo.length === 8) {
                        const resLoja = await fetch(`https://viacep.com.br/ws/${cepLojaLimpo}/json/`);
                        const dadosLoja = await resLoja.json();

                        if (!dadosLoja.erro) {
                            bairroOrigem = dadosLoja.bairro || '';
                            setBairroLoja(bairroOrigem);
                        }
                    }
                } catch (e) {
                    console.warn('Não foi possível atualizar o bairro da loja.', e);
                }
            }

            // FRETE AUTOMÁTICO:
            // R$ 2,00 no mesmo bairro da loja.
            // R$ 5,00 para outros bairros, desde que estejam dentro do raio máximo.
            const mesmoBairro = bairrosIguais(bairroOrigem, data.bairro);
            const taxaEntregaCalculada = mesmoBairro ? 2 : 5;

            const local = await geocodificarCep(cepLimpo, data);

            let lat = null;
            let lng = null;
            let dist = null;

            if (local) {
                lat = local.lat;
                lng = local.lng;

                const lojaLat = Number(restaurante.lat) || -23.5329;
                const lojaLng = Number(restaurante.lng) || -46.7920;
                const raioEntrega = Number(restaurante.raio_entrega) || 5;

                dist = calcularDistancia(lojaLat, lojaLng, lat, lng);
                setDistanciaEntrega(dist);

                if (dist > raioEntrega) {
                    setErroCep(
                        `Não fazemos entrega neste local. Distância aproximada: ${dist.toFixed(1)} km ` +
                        `(raio máximo: ${raioEntrega} km).`
                    );
                } else {
                    setErroCep('');
                }

                console.info(
                    `CEP do cliente geocodificado por ${local.fonte}:`,
                    lat,
                    lng,
                    `| Distância: ${dist.toFixed(2)} km`,
                    `| Frete: R$ ${taxaEntregaCalculada.toFixed(2)}`
                );
            } else {
                setDistanciaEntrega(null);
                setErroCep(
                    'CEP encontrado, mas não foi possível validar a distância automaticamente. ' +
                    'A taxa foi calculada pelo bairro; confirme o endereço com a loja antes de concluir o pedido.'
                );
            }

            const partesEndereco = [
                data.logradouro,
                data.bairro,
                `${data.localidade || ''}${data.uf ? ` - ${data.uf}` : ''}`
            ].filter(Boolean);

            setClienteDados(prev => ({
                ...prev,
                cep: cepInput,
                endereco: partesEndereco.join(', '),
                bairro: data.bairro || '',
                lat,
                lng,
                taxa_entrega_calculada: taxaEntregaCalculada
            }));

        } catch (err) {
            console.error('Erro ao buscar CEP do cliente:', err);
            setErroCep('Não foi possível consultar o CEP agora. Tente novamente em alguns instantes.');
        } finally {
            setCepBuscando(false);
        }
    };


    const cadastrarNovaLoja = async () => {
        if (!supabase) return;
        if (!novaLojaForm.nome) {
            alert("Preencha o nome da loja.");
            return;
        }
        try {
            const payload = {
                nome: novaLojaForm.nome,
                tempo_entrega: novaLojaForm.tempo_entrega,
                raio_entrega: novaLojaForm.raio_entrega,
                taxa_entrega: 0,
                whatsapp: '',
                is_aberto: true
            };
            const { data, error } = await supabase.from('restaurante').insert([payload]).select();
            if (error) throw error;
            
            if (data && data.length > 0) {
                setLojas([...lojas, data[0]]);
                alert("Loja cadastrada com sucesso!");
                setNovaLojaForm({nome: '', tempo_entrega: '30-45 min', raio_entrega: 5});
                setAdminView('configs');
            }
        } catch (err) {
            console.error("Erro ao cadastrar loja:", err);
            alert("Erro ao cadastrar loja.");
        }
    };

    const carregarPedidosAdminLocal = () => {
        if (!supabase) return;
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }).then(({ data }) => {
            if (data) setPedidosAdmin(data);
        });
    };

    const carregarMovimentacoes = () => {
        if (!supabase) return;
        supabase.from('financeiro').select('*').order('created_at', { ascending: false }).then(({ data }) => {
            if (data) setMovimentacoes(data);
        });
    };

    const pedidosAdminFiltrados = pedidosAdmin.filter(p => {
        if (!isAdmin || !idAdminLogado) return true;
        let info = {};
        try { info = typeof p.itens === 'string' ? JSON.parse(p.itens) : (p.itens || {}); } catch(e) {}
        return info.filial_id === idAdminLogado;
    });

    const dataLocalParaFiltro = (valorData) => {
        if (!valorData) return '';

        const data = new Date(valorData);
        if (Number.isNaN(data.getTime())) return '';

        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');

        return `${ano}-${mes}-${dia}`;
    };

    const estaDentroDoPeriodoFinanceiro = (valorData) => {
        const dataItem = dataLocalParaFiltro(valorData);
        if (!dataItem) return false;

        if (filtroDataInicio && dataItem < filtroDataInicio) return false;
        if (filtroDataFim && dataItem > filtroDataFim) return false;

        return true;
    };

    const limparPeriodoFinanceiro = () => {
        setFiltroDataInicio('');
        setFiltroDataFim('');
    };

    const pedidosConcluidos = pedidosAdminFiltrados.filter(
        p => p.status === 'finalizado' && estaDentroDoPeriodoFinanceiro(p.created_at)
    );
    const totalPedidosFinalizados = pedidosConcluidos.reduce((acc, p) => acc + Number(p.total), 0);
    
    const vendasPorProduto = {};
    pedidosConcluidos.forEach(pedido => {
        let info = {};
        if (typeof pedido.itens === 'string') {
            try { info = JSON.parse(pedido.itens); } catch(e) {}
        } else {
            info = pedido.itens || {};
        }
        if (info.lanches && Array.isArray(info.lanches)) {
            info.lanches.forEach(lanche => {
                const totalItem = (lanche.preco || 0) * (lanche.quantidade || 0);
                if (vendasPorProduto[lanche.nome]) {
                    vendasPorProduto[lanche.nome] += totalItem;
                } else {
                    vendasPorProduto[lanche.nome] = totalItem;
                }
            });
        }
    });

    const dadosGraficoPizza = Object.keys(vendasPorProduto).map(nome => ({
        name: nome,
        value: vendasPorProduto[nome]
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    const CORES_GRAFICO = ['#d79e51', '#e8b776', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#38bdf8', '#c084fc', '#fb7185'];

    const historicoPedidos = pedidosConcluidos.map(p => {
        let info = {};
        try {
            info = typeof p.itens === 'string' ? JSON.parse(p.itens) : (p.itens || {});
        } catch(e) {}
        
        const nomesLanches = info.lanches ? info.lanches.map(l => `${l.quantidade}x ${l.nome}`).join(', ') : 'Venda';
        
        return {
            id: `ped-${p.id}`,
            data: p.created_at,
            loja: info.filial_nome || 'Filial Desconhecida',
            descricao: `Pedido #${numeroPedidoVisivel(p)} (${nomesLanches})`,
            tipo: 'entrada',
            valor: Number(p.total)
        };
    });
    
    const movimentacoesFiltradas = movimentacoes.filter(m => {
        const matchLojaAdmin = (!isAdmin || !idAdminLogado)
            ? true
            : m.restaurante_id === idAdminLogado;

        return matchLojaAdmin && estaDentroDoPeriodoFinanceiro(m.created_at);
    });

    const historicoMovimentacoes = movimentacoesFiltradas.map(m => ({
        id: `mov-${m.id}`,
        data: m.created_at,
        loja: lojas.find(l => l.id === m.restaurante_id)?.nome || 'Loja Excluída',
        descricao: m.descricao,
        tipo: m.tipo,
        valor: Number(m.valor)
    }));

    const historicoCombinado = [...historicoMovimentacoes, ...historicoPedidos].sort((a, b) => {
        return new Date(b.data || 0) - new Date(a.data || 0);
    });
    
    const totalEntradasManuais = movimentacoesFiltradas.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + Number(m.valor), 0);
    const totalSaidasManuais = movimentacoesFiltradas.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + Number(m.valor), 0);
    const saldoGeral = totalPedidosFinalizados + totalEntradasManuais - totalSaidasManuais;
    
    const historicoFiltrado = historicoCombinado.filter(item => {
        const matchLoja = filtroLoja ? item.loja === filtroLoja : true;
        return matchLoja;
    });

    const baixarRelatorio = () => {
        let csv = 'Data,Loja,Descricao,Tipo,Valor\n';
        historicoFiltrado.forEach(item => {
            const dataFormatada = item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '--';
            const valorFormatado = item.valor.toFixed(2);
            csv += `${dataFormatada},"${item.loja}","${item.descricao}",${item.tipo},${valorFormatado}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const sufixoPeriodo = filtroDataInicio || filtroDataFim
            ? `_${filtroDataInicio || 'inicio'}_a_${filtroDataFim || 'hoje'}`
            : '';

        link.setAttribute('download', `relatorio_financeiro${sufixoPeriodo}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const registrarMovimentacao = async () => {
        if (!supabase) return;
        if (!financeiroForm.restaurante_id || !financeiroForm.valor || !financeiroForm.descricao) {
            alert("Preencha os campos obrigatórios (Loja, Valor e Descrição).");
            return;
        }
        try {
            const payload = {
                restaurante_id: financeiroForm.restaurante_id,
                tipo: financeiroForm.tipo,
                valor: parseFloat(financeiroForm.valor),
                descricao: financeiroForm.descricao
            };
            const { error } = await supabase.from('financeiro').insert([payload]);
            if (error) throw error;
            
            alert("Movimentação registrada com sucesso!");
            setFinanceiroForm({ ...financeiroForm, valor: '', descricao: '' });
            carregarMovimentacoes();
        } catch (err) {
            console.error("Erro ao registrar movimentação:", err);
            alert("Erro ao registrar movimentação.");
        }
    };

    const carregarWebhookRestaurante = async (restauranteId) => {
        if (!supabase || !restauranteId) {
            setPromoForm(prev => ({ ...prev, webhookUrl: '' }));
            setWebhookEditavel(true);
            return;
        }

        setWebhookLoading(true);
        try {
            const { data, error } = await supabase
                .from('integracoes_restaurante')
                .select('n8n_webhook_url')
                .eq('restaurante_id', restauranteId)
                .maybeSingle();

            if (error) throw error;

            const url = (data?.n8n_webhook_url || '').trim();
            setPromoForm(prev => ({ ...prev, webhookUrl: url }));
            setWebhookEditavel(!url);
        } catch (err) {
            console.error('Erro ao carregar webhook do restaurante:', err);
            setPromoForm(prev => ({ ...prev, webhookUrl: '' }));
            setWebhookEditavel(true);
        } finally {
            setWebhookLoading(false);
        }
    };

    const salvarWebhookRestaurante = async () => {
        if (!supabase || !idAdminLogado || webhookSalvando) return;

        const url = promoForm.webhookUrl.trim();
        if (!url) {
            alert('Informe a URL do Webhook do N8N.');
            return;
        }

        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Protocolo inválido');
        } catch (e) {
            alert('Digite uma URL válida começando com http:// ou https://');
            return;
        }

        setWebhookSalvando(true);
        try {
            const { error } = await supabase
                .from('integracoes_restaurante')
                .upsert({
                    restaurante_id: idAdminLogado,
                    n8n_webhook_url: url,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'restaurante_id' });

            if (error) throw error;

            setPromoForm(prev => ({ ...prev, webhookUrl: url }));
            setWebhookEditavel(false);
            alert('Webhook salvo para esta franquia com sucesso!');
        } catch (err) {
            console.error('Erro ao salvar webhook do restaurante:', err);
            alert(`Não foi possível salvar o webhook. ${err.message || ''}`.trim());
        } finally {
            setWebhookSalvando(false);
        }
    };

    const dispararPromocao = async () => {
        if (!promoForm.webhookUrl || !promoForm.titulo || !promoForm.mensagem) {
            alert("Preencha a URL do Webhook, Título e Mensagem da promoção.");
            return;
        }
        
        try {
            const response = await fetch(promoForm.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    loja: restaurante.nome,
                    restaurante_id: idAdminLogado || restaurante.id,
                    titulo: promoForm.titulo,
                    mensagem: promoForm.mensagem,
                    data_disparo: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                alert("Promoção disparada para o N8N com sucesso!");
                setPromoForm(prev => ({ ...prev, titulo: '', mensagem: '' }));
            } else {
                alert("Erro ao disparar promoção. O N8N retornou um erro.");
            }
        } catch (err) {
            console.error("Erro ao comunicar com N8N:", err);
            alert("Falha na conexão. Verifique se a URL do Webhook está correta e aceita CORS.");
        }
    };

    const fazerPedidoAgora = () => {
        if (!clienteAuth) {
            setRedirectPosLogin('cardapio');
            setView('perfil');
        } else {
            setView('cardapio');
        }
    };

    const adicionarAoCarrinho = (produto) => {
        const obsNormalizada = '';
        const produtoComPrecoFinal = {
            ...produto,
            preco_original: Number(produto.preco || 0),
            preco: precoFinalProduto(produto),
            desconto_percentual: descontoProduto(produto)
        };

        setCarrinho(prev => {
            const index = prev.findIndex(item => item.id === produto.id && normalizarObservacao(item.observacao) === obsNormalizada);
            if (index > -1) {
                return prev.map((item, i) => i === index ? { ...item, quantidade: item.quantidade + 1 } : item);
            }
            return [...prev, { ...produtoComPrecoFinal, cartKey: criarCartKey(produto.id, ''), quantidade: 1, observacao: '' }];
        });
    };

    const rolarParaCategoria = (categoriaId) => {
        const elemento = document.getElementById(`categoria-${categoriaId}`);
        if (!elemento) return;

        elemento.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const abrirDetalheItem = (item) => {
        setItemSelecionado(item);
        setObservacao("");
        setQuantidadeSelecionada(1);
        setAdicionaisSelecionadosItem({});
    };

    const fecharDetalheItem = () => {
        setItemSelecionado(null);
        setObservacao("");
        setQuantidadeSelecionada(1);
        setAdicionaisSelecionadosItem({});
    };

    const alterarAdicionalItem = (adicionalId, delta) => {
        setAdicionaisSelecionadosItem(prev => {
            const atual = Number(prev[adicionalId] || 0);
            const novaQuantidade = Math.max(0, atual + delta);

            if (novaQuantidade === 0) {
                const copia = { ...prev };
                delete copia[adicionalId];
                return copia;
            }

            return {
                ...prev,
                [adicionalId]: novaQuantidade
            };
        });
    };

    const confirmarItemSelecionado = () => {
        if (!itemSelecionado) return;

        const obsFinal = observacao.trim();
        const cartKeyPrincipal = criarCartKey(itemSelecionado.id, obsFinal);

        const itemPrincipal = {
            ...itemSelecionado,
            preco_original: Number(itemSelecionado.preco || 0),
            preco: precoFinalProduto(itemSelecionado),
            desconto_percentual: descontoProduto(itemSelecionado),
            cartKey: cartKeyPrincipal,
            quantidade: quantidadeSelecionada,
            observacao: obsFinal
        };

        const adicionaisDoItem = adicionaisDisponiveis
            .map(adicional => ({
                adicional,
                quantidade: Number(adicionaisSelecionadosItem[adicional.id] || 0)
            }))
            .filter(item => item.quantidade > 0)
            .map(({ adicional, quantidade }) => ({
                ...adicional,
                preco_original: Number(adicional.preco || 0),
                preco: precoFinalProduto(adicional),
                desconto_percentual: descontoProduto(adicional),
                tipo_item: 'adicional',
                cartKey: criarCartKey(adicional.id, `adicional-${cartKeyPrincipal}`),
                quantidade,
                observacao: '',
                produto_principal_id: itemSelecionado.id,
                produto_principal_nome: itemSelecionado.nome,
                produto_principal_cart_key: cartKeyPrincipal
            }));

        setCarrinho(prev => [
            ...prev,
            itemPrincipal,
            ...adicionaisDoItem
        ]);

        fecharDetalheItem();
    };

    const alterarQuantidade = (cartKey, delta) => {
        setCarrinho(prev => prev
            .map(item => item.cartKey === cartKey ? { ...item, quantidade: item.quantidade + delta } : item)
            .filter(item => item.quantidade > 0)
        );
    };

    const atualizarObs = (cartKey, obs) => {
        setCarrinho(prev => prev.map(item => item.cartKey === cartKey ? { ...item, observacao: obs } : item));
    };

    const salvarPerfilLocal = (dados = clienteDados) => {
        try {
            localStorage.setItem('cliente_nome', dados.nome || '');
            localStorage.setItem('cliente_celular', dados.celular || '');
            localStorage.setItem('cliente_cep', dados.cep || '');
            localStorage.setItem('cliente_endereco', dados.endereco || '');
            localStorage.setItem('cliente_referencia', dados.referencia || '');
            localStorage.setItem('cliente_bairro', dados.bairro || '');
            localStorage.setItem('cliente_taxa_entrega', String(dados.taxa_entrega_calculada ?? 5));
        } catch (e) {
            console.warn('Não foi possível salvar o perfil localmente.', e);
        }
    };

    const limparPerfilLocal = () => {
        [
            'cliente_nome',
            'cliente_celular',
            'cliente_cep',
            'cliente_endereco',
            'cliente_referencia',
            'cliente_bairro',
            'cliente_taxa_entrega'
        ].forEach(chave => localStorage.removeItem(chave));
    };

    const salvarPerfilNoBanco = async (userId, email = clienteEmail, dados = clienteDados) => {
        if (!supabase || !userId) throw new Error('Sessão do cliente indisponível.');

        const celularNormalizado = String(dados.celular || '').trim();

        const payload = {
            user_id: userId,
            email: email || null,
            nome: dados.nome || '',
            celular: celularNormalizado,
            cep: dados.cep || '',
            endereco: dados.endereco || '',
            referencia: dados.referencia || '',
            bairro: dados.bairro || '',
            taxa_entrega_calculada: Number(dados.taxa_entrega_calculada ?? 5),
            updated_at: new Date().toISOString()
        };

        // 1) Se a conta já estiver vinculada a um registro, atualiza esse registro.
        const { data: perfilPorUsuario, error: erroBuscaUsuario } = await supabase
            .from('clientes')
            .select('user_id,celular')
            .eq('user_id', userId)
            .maybeSingle();

        if (erroBuscaUsuario && erroBuscaUsuario.code !== 'PGRST116') {
            throw erroBuscaUsuario;
        }

        if (perfilPorUsuario) {
            const { data, error } = await supabase
                .from('clientes')
                .update(payload)
                .eq('user_id', userId)
                .select()
                .maybeSingle();

            if (error) throw error;

            salvarPerfilLocal(dados);
            return data || payload;
        }

        // 2) Compatibilidade com clientes antigos:
        // antes do login por e-mail, o cadastro era identificado pelo celular.
        // Se o celular já existir, reaproveitamos a mesma linha e vinculamos
        // ao novo user_id, evitando o erro "duplicate key ... clientes_pkey".
        if (celularNormalizado) {
            const { data: perfilPorCelular, error: erroBuscaCelular } = await supabase
                .from('clientes')
                .select('user_id,celular')
                .eq('celular', celularNormalizado)
                .maybeSingle();

            if (erroBuscaCelular && erroBuscaCelular.code !== 'PGRST116') {
                throw erroBuscaCelular;
            }

            if (perfilPorCelular) {
                const { data, error } = await supabase
                    .from('clientes')
                    .update(payload)
                    .eq('celular', celularNormalizado)
                    .select()
                    .maybeSingle();

                if (error) throw error;

                salvarPerfilLocal(dados);
                return data || payload;
            }
        }

        // 3) Cliente realmente novo: cria uma nova linha.
        const { data, error } = await supabase
            .from('clientes')
            .insert([payload])
            .select()
            .maybeSingle();

        if (error) throw error;

        salvarPerfilLocal(dados);
        return data || payload;
    };

    const carregarPerfilCliente = async (user) => {
        if (!supabase || !user?.id || !user?.email) return null;

        setClienteEmail(user.email);

        const { data, error } = await supabase
            .from('clientes')
            .select('user_id,email,nome,celular,cep,endereco,referencia,bairro,taxa_entrega_calculada')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.warn('Não foi possível carregar o perfil do cliente:', error);
        }

        let perfil = data || null;

        // Primeiro acesso após confirmação de e-mail:
        // recupera os dados guardados no user_metadata durante o cadastro.
        if (!perfil) {
            const meta = user.user_metadata || {};
            const dadosMeta = {
                nome: meta.nome || '',
                celular: meta.celular || '',
                cep: meta.cep || '',
                endereco: meta.endereco || '',
                referencia: meta.referencia || '',
                bairro: meta.bairro || '',
                lat: null,
                lng: null,
                taxa_entrega_calculada: Number(meta.taxa_entrega_calculada ?? 5)
            };

            if (dadosMeta.nome || dadosMeta.celular || dadosMeta.endereco) {
                try {
                    perfil = await salvarPerfilNoBanco(user.id, user.email, dadosMeta);
                } catch (e) {
                    console.warn('Não foi possível criar o perfil a partir dos dados do cadastro:', e);
                }
            }
        }

        if (perfil) {
            const dadosCarregados = {
                nome: perfil.nome || '',
                celular: perfil.celular || '',
                cep: perfil.cep || '',
                endereco: perfil.endereco || '',
                referencia: perfil.referencia || '',
                bairro: perfil.bairro || '',
                lat: null,
                lng: null,
                taxa_entrega_calculada: Number(perfil.taxa_entrega_calculada ?? 5)
            };

            setClienteDados(dadosCarregados);
            salvarPerfilLocal(dadosCarregados);

            // Revalida o CEP para restaurar latitude, longitude, distância e frete.
            if (dadosCarregados.cep) {
                buscarCep(dadosCarregados.cep).catch?.(() => {});
            }
        }

        setClienteAuth(true);
        setAuthUserId(user.id);
        return perfil;
    };

    const cadastrarCliente = async (e) => {
        e?.preventDefault?.();
        if (!supabase || clienteAuthLoading) return;

        if (!clienteEmail || !clienteSenha) {
            alert('Informe e-mail e senha.');
            return;
        }
        if (clienteSenha.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (!clienteDados.nome || !clienteDados.celular) {
            alert('Preencha nome e celular.');
            return;
        }

        setClienteAuthLoading(true);

        try {
            // Remove somente a sessão anônima antes de criar a conta real.
            const { data: sessaoAtual } = await supabase.auth.getSession();
            if (sessaoAtual?.session?.user && !sessaoAtual.session.user.email) {
                await supabase.auth.signOut();
            }

            const { data, error } = await supabase.auth.signUp({
                email: clienteEmail.trim(),
                password: clienteSenha,
                options: {
                    data: {
                        role: 'cliente',
                        nome: clienteDados.nome,
                        celular: clienteDados.celular,
                        cep: clienteDados.cep || '',
                        endereco: clienteDados.endereco || '',
                        referencia: clienteDados.referencia || '',
                        bairro: clienteDados.bairro || '',
                        taxa_entrega_calculada: Number(clienteDados.taxa_entrega_calculada ?? 5)
                    }
                }
            });

            if (error) throw error;

            salvarPerfilLocal(clienteDados);

            if (data?.session?.user) {
                await salvarPerfilNoBanco(data.session.user.id, data.session.user.email, clienteDados);
                setClienteAuth(true);
                setAuthUserId(data.session.user.id);
                setClienteEditandoPerfil(false);
                setClienteSenha('');
                carregarMeusPedidos();

                if (redirectPosLogin) {
                    setView(redirectPosLogin);
                    setRedirectPosLogin(null);
                }
            } else {
                alert('Conta criada! Verifique seu e-mail para confirmar o cadastro. Depois, volte aqui e entre com seu e-mail e senha.');
                setClienteModoAcesso('login');
                setClienteSenha('');
            }
        } catch (err) {
            console.error('Erro ao criar conta:', err);
            const msg = String(err?.message || '');
            if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
                alert('Este e-mail já possui uma conta. Use a opção “Já tenho conta”.');
                setClienteModoAcesso('login');
            } else {
                alert(msg || 'Não foi possível criar sua conta.');
            }
        } finally {
            setClienteAuthLoading(false);
        }
    };

    const loginCliente = async (e) => {
        e?.preventDefault?.();
        if (!supabase || clienteAuthLoading) return;

        if (!clienteEmail || !clienteSenha) {
            alert('Informe e-mail e senha.');
            return;
        }

        setClienteAuthLoading(true);

        try {
            const { data: sessaoAtual } = await supabase.auth.getSession();
            if (sessaoAtual?.session?.user && !sessaoAtual.session.user.email) {
                await supabase.auth.signOut();
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: clienteEmail.trim(),
                password: clienteSenha
            });

            if (error) throw error;

            const user = data?.user;
            const meta = user?.app_metadata || {};
            const role = String(meta.role || '').toLowerCase();
            const usuarioAdmin =
                ['admin', 'matriz'].includes(role) ||
                Boolean(meta.restaurante_id) ||
                ['dogsdomirso.ls@outlook.com', 'dogsdomirso.ls2@outlook.com'].includes(String(user?.email || '').toLowerCase());

            if (usuarioAdmin) {
                await supabase.auth.signOut();
                throw new Error('Este acesso pertence à área administrativa. Use “Área Restrita (Gestão)”.');
            }

            await carregarPerfilCliente(user);
            setClienteSenha('');
            carregarMeusPedidos();

            if (redirectPosLogin) {
                setView(redirectPosLogin);
                setRedirectPosLogin(null);
            }
        } catch (err) {
            console.error('Erro no login do cliente:', err);
            const msg = String(err?.message || '');
            if (msg.toLowerCase().includes('invalid login credentials')) {
                alert('E-mail ou senha incorretos.');
            } else if (msg.toLowerCase().includes('email not confirmed')) {
                alert('Confirme seu e-mail antes de entrar.');
            } else {
                alert(msg || 'Não foi possível entrar na sua conta.');
            }
        } finally {
            setClienteAuthLoading(false);
        }
    };

    const salvarPerfil = async () => {
        if (!clienteAuth || !authUserId) {
            alert('Entre na sua conta para salvar o perfil.');
            return;
        }

        if (!clienteDados.nome || !clienteDados.celular) {
            alert('Preencha nome e celular.');
            return;
        }

        setClienteAuthLoading(true);

        try {
            await salvarPerfilNoBanco(authUserId, clienteEmail, clienteDados);
            setClienteEditandoPerfil(false);
            carregarMeusPedidos();

            if (redirectPosLogin) {
                setView(redirectPosLogin);
                setRedirectPosLogin(null);
            } else {
                alert('Perfil atualizado com sucesso!');
            }
        } catch (err) {
            console.error(err);
            alert(err.message || 'Não foi possível salvar o perfil.');
        } finally {
            setClienteAuthLoading(false);
        }
    };

    const sairCliente = async () => {
        try {
            if (supabase) await supabase.auth.signOut();
        } catch (e) {
            console.warn('Erro ao sair da conta do cliente:', e);
        }

        setClienteAuth(false);
        setClienteEditandoPerfil(false);
        setClienteEmail('');
        setClienteSenha('');
        setAuthUserId(null);
        setMeusPedidos([]);
        setClienteDados({
            nome: '',
            celular: '',
            cep: '',
            endereco: '',
            referencia: '',
            bairro: '',
            lat: null,
            lng: null,
            taxa_entrega_calculada: 5
        });
        setErroCep('');
        setDistanciaEntrega(null);
        limparPerfilLocal();
        setClienteModoAcesso('login');

        try {
            await garantirSessaoCliente();
        } catch (e) {
            console.warn(e.message);
        }
    };

    const salvarCacheSeguro = (chave, valor) => {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
        } catch (e) {
            console.warn(`Não foi possível salvar o cache ${chave}:`, e);
        }
    };

    const carregarLojas = async () => {
        if (!supabase) return [];
        setLojasLoading(true);

        try {
            const { data, error } = await supabase
                .from('restaurante')
                .select('id,nome,is_aberto,tempo_entrega,raio_entrega,taxa_entrega,whatsapp,foto_capa_url,logo_url,cep,lat,lng,created_at')
                .order('created_at', { ascending: true });

            if (error && error.code !== 'PGRST116') throw error;

            const restData = data || [];
            setLojas(restData);

            // O cache das lojas é propositalmente leve: não guardamos capa/logo em base64
            // para não estourar o limite do localStorage nem atrasar a próxima abertura.
            const lojasCacheLeve = restData.map(({ foto_capa_url, logo_url, ...loja }) => loja);
            salvarCacheSeguro('dogs_lojas_cache', lojasCacheLeve);

            if (restData.length > 0) {
                if (isAdmin) {
                    const lojaGestor = adminRestauranteId
                        ? (restData.find(r => String(r.id) === String(adminRestauranteId)) || restData[0])
                        : (isFranquia2 ? (restData.length > 1 ? restData[1] : restData[0]) : restData[0]);

                    setRestaurante(lojaGestor);
                } else {
                    const selectedId = localStorage.getItem('loja_selecionada');
                    const lojaAtual = restData.find(r => String(r.id) === String(selectedId)) || restData[0];
                    setRestaurante(lojaAtual);
                }
            }

            return restData;
        } catch (err) {
            console.error('Erro ao carregar restaurantes:', err);
            return [];
        } finally {
            setLojasLoading(false);
        }
    };

    const carregarCategorias = async () => {
        if (!supabase) return [];

        try {
            const { data, error } = await supabase
                .from('categorias')
                .select('id,nome,ordem')
                .order('ordem', { ascending: true });

            if (error) throw error;

            const catData = normalizarCategoriasExibicao(data || []);
            setCategorias(catData);
            salvarCacheSeguro('dogs_categorias_cache', catData);
            return catData;
        } catch (err) {
            console.error('Erro ao carregar categorias:', err);
            return [];
        }
    };

    const carregarProdutosLoja = async (restauranteId, mostrarLoading = true) => {
        if (!supabase || !restauranteId) {
            setProdutos([]);
            return [];
        }

        if (mostrarLoading) setDbLoading(true);

        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('id,nome,preco,desconto_percentual,descricao,categoria_id,ativo,is_destaque,imagem_url,restaurante_id')
                .eq('restaurante_id', restauranteId);

            if (error) throw error;

            const prodData = data || [];
            setProdutos(prodData);
            return prodData;
        } catch (err) {
            console.error(`Erro ao carregar produtos da loja ${restauranteId}:`, err);
            setProdutos([]);
            return [];
        } finally {
            if (mostrarLoading) setDbLoading(false);
        }
    };

    useEffect(() => {
        const initScripts = async () => {
            document.title = 'Dogs Do Mirso';
            document.documentElement.setAttribute('translate', 'no');

            // Antecipar conexões críticas para reduzir o tempo da primeira abertura.
            const preconnects = [
                'https://vzcrfnyfiqsfrwswlvyf.supabase.co',
                'https://cdn.jsdelivr.net',
                'https://cdn.tailwindcss.com'
            ];
            preconnects.forEach((href) => {
                if (!document.querySelector(`link[data-dogs-preconnect="${href}"]`)) {
                    const link = document.createElement('link');
                    link.rel = 'preconnect';
                    link.href = href;
                    link.crossOrigin = 'anonymous';
                    link.dataset.dogsPreconnect = href;
                    document.head.appendChild(link);
                }
            });

            // Responsividade real em navegadores mobile, tablet e notebook.
            const viewportContent = 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover';
            let viewportMeta = document.querySelector('meta[name="viewport"]');
            if (!viewportMeta) {
                viewportMeta = document.createElement('meta');
                viewportMeta.name = 'viewport';
                document.head.appendChild(viewportMeta);
            }
            viewportMeta.content = viewportContent;

            if (!document.getElementById('dogs-responsive-style')) {
                const responsiveStyle = document.createElement('style');
                responsiveStyle.id = 'dogs-responsive-style';
                responsiveStyle.textContent = `
                    html, body, #root {
                        width: 100%;
                        min-width: 0;
                        min-height: 100%;
                        margin: 0;
                        padding: 0;
                        overflow-x: hidden;
                        background: #1a191c;
                    }

                    *, *::before, *::after {
                        box-sizing: border-box;
                    }

                    img, video, canvas, svg {
                        max-width: 100%;
                    }

                    button, input, select, textarea {
                        min-width: 0;
                    }

                    .dogs-admin-shell {
                        height: 100vh;
                    }

                    .dogs-app-shell {
                        min-height: 100vh;
                    }

                    .dogs-touch-scroll {
                        -webkit-overflow-scrolling: touch;
                        overscroll-behavior-y: contain;
                    }

                    @supports (height: 100dvh) {
                        .dogs-admin-shell {
                            height: 100dvh;
                        }

                        .dogs-app-shell {
                            min-height: 100dvh;
                        }
                    }

                    @media (max-width: 767px) {
                        html {
                            -webkit-text-size-adjust: 100%;
                            text-size-adjust: 100%;
                        }

                        input, select, textarea {
                            font-size: 16px !important;
                        }

                        .dogs-mobile-modal {
                            width: calc(100vw - 16px) !important;
                            max-width: calc(100vw - 16px) !important;
                            max-height: calc(100dvh - 16px) !important;
                            border-radius: 18px !important;
                        }
                    }
                `;
                document.head.appendChild(responsiveStyle);
            }
            
            if (!document.querySelector('meta[name="google"]')) {
                const meta = document.createElement('meta');
                meta.name = 'google';
                meta.content = 'notranslate';
                document.head.appendChild(meta);
            }

            if (!document.querySelector('link[rel="icon"]')) {
                const favicon = document.createElement('link');
                favicon.rel = 'icon';
                favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌭</text></svg>';
                document.head.appendChild(favicon);
            }

            if (!document.getElementById('tailwind-cdn')) {
                const script = document.createElement('script');
                script.id = 'tailwind-cdn';
                script.src = 'https://cdn.tailwindcss.com';
                document.head.appendChild(script);
                
                const fa = document.createElement('link');
                fa.rel = 'stylesheet';
                fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
                document.head.appendChild(fa);
                
                const leafletCss = document.createElement('link');
                leafletCss.rel = 'stylesheet';
                leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(leafletCss);

                const leafletJs = document.createElement('script');
                leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                document.head.appendChild(leafletJs);
            }

            if (!window.supabase) {
                const sbScript = document.createElement('script');
                sbScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                sbScript.async = true;
                sbScript.crossOrigin = 'anonymous';
                try { sbScript.fetchPriority = 'high'; } catch (e) {}
                sbScript.onload = () => {
                     const sbUrl = 'https://vzcrfnyfiqsfrwswlvyf.supabase.co';
                     const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Y3JmbnlmaXFzZnJ3c3dsdnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTQ1NjksImV4cCI6MjA5NDc5MDU2OX0.es2duCl9cJQjSH787kCxtUbl-UqqcwedvKF5lf-uc7s';
                     
                     const options = {
                         auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
                         global: { fetch: window.fetch.bind(window) }
                     };
                     
                     const sbClient = window.supabase.createClient(sbUrl, sbKey, options);
                     setSupabase(sbClient);
                };
                document.head.appendChild(sbScript);
            } else if (!supabase) {
                 const sbUrl = 'https://vzcrfnyfiqsfrwswlvyf.supabase.co';
                 const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Y3JmbnlmaXFzZnJ3c3dsdnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTQ1NjksImV4cCI6MjA5NDc5MDU2OX0.es2duCl9cJQjSH787kCxtUbl-UqqcwedvKF5lf-uc7s';
                 
                 const options = {
                     auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
                     global: { fetch: window.fetch.bind(window) }
                 };
                 
                 const sbClient = window.supabase.createClient(sbUrl, sbKey, options);
                 setSupabase(sbClient);
            }
        };
        initScripts();
        
        const nome = localStorage.getItem('cliente_nome');
        const cel = localStorage.getItem('cliente_celular');
        const cep = localStorage.getItem('cliente_cep') || '';
        const end = localStorage.getItem('cliente_endereco') || '';
        const ref = localStorage.getItem('cliente_referencia') || '';
        const bairro = localStorage.getItem('cliente_bairro') || '';
        const taxaEntrega = Number(localStorage.getItem('cliente_taxa_entrega') || 5);

        if (nome || cel || cep || end || ref) {
            // Mantém os dados antigos preenchidos para facilitar a criação da conta,
            // mas somente uma sessão autenticada por e-mail é considerada login.
            setClienteDados({
                nome: nome || '',
                celular: cel || '',
                cep,
                endereco: end,
                referencia: ref,
                bairro,
                lat: null,
                lng: null,
                taxa_entrega_calculada: Number.isFinite(taxaEntrega) ? taxaEntrega : 5
            });
        }

        // O webhook não é mais salvo no localStorage.
        // Cada restaurante carrega sua própria URL privada do Supabase após o login administrativo.
    }, []);

    useEffect(() => {
        const cepLojaLimpo = String(restaurante.cep || '').replace(/\D/g, '');

        if (cepLojaLimpo.length !== 8) {
            setBairroLoja('');
            return;
        }

        let cancelado = false;

        fetch(`https://viacep.com.br/ws/${cepLojaLimpo}/json/`)
            .then(res => res.json())
            .then(data => {
                if (!cancelado && !data.erro) {
                    setBairroLoja(data.bairro || '');
                }
            })
            .catch(err => console.warn('Não foi possível carregar o bairro da loja.', err));

        return () => {
            cancelado = true;
        };
    }, [restaurante.cep]);

    useEffect(() => {
        if (!supabase) return;
        let ativo = true;

        const aplicarSessao = (session) => {
            if (!ativo) return;
            const user = session?.user || null;
            setAuthUserId(user?.id || null);

            const acessoAdmin = obterPermissaoAdmin(user);

            if (acessoAdmin.autorizado) {
                setAdminEmail(user.email);
                setAdminRole(acessoAdmin.role);
                setAdminRestauranteId(acessoAdmin.restauranteId);
                setIsAdmin(true);
                setClienteAuth(false);
            } else {
                setIsAdmin(false);
                setAdminEmail('');
                setAdminRole('');
                setAdminRestauranteId(null);

                if (user?.email) {
                    setClienteEmail(user.email);
                    setClienteAuth(true);
                    carregarPerfilCliente(user).catch(err =>
                        console.warn('Não foi possível carregar o perfil após autenticação:', err)
                    );
                } else {
                    setClienteAuth(false);
                }
            }
        };

        supabase.auth.getSession().then(({ data }) => {
            aplicarSessao(data?.session || null);
            if (!data?.session) {
                garantirSessaoCliente().catch(err => console.warn(err.message));
            }
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => aplicarSessao(session));

        return () => {
            ativo = false;
            listener?.subscription?.unsubscribe();
        };
    }, [supabase]);

    useEffect(() => {
        if (!supabase) return;

        let cancelado = false;

        const carregarInicial = async () => {
            try {
                // As lojas e categorias são pequenas e carregam em paralelo.
                // Produtos NÃO são baixados aqui para não atrasar a tela inicial.
                const [restData] = await Promise.all([
                    carregarLojas(),
                    carregarCategorias()
                ]);

                if (cancelado) return;

                // No painel administrativo já carregamos apenas os produtos da loja logada.
                if (isAdmin) {
                    const lojaIdAdmin = adminRestauranteId || (restData[0] ? restData[0].id : null);
                    if (lojaIdAdmin) {
                        await carregarProdutosLoja(lojaIdAdmin, false);
                    }
                    carregarPedidosAdminLocal();
                    carregarMovimentacoes();
                }

                if (clienteAuth) carregarMeusPedidos();
            } catch (err) {
                console.error('Erro no carregamento inicial:', err);
            } finally {
                if (!cancelado) setDbLoading(false);
            }
        };

        carregarInicial();

        const isInIframe = () => {
            try { return window.self !== window.top; }
            catch (e) { return true; }
        };

        let channel = null;

        if (!isInIframe()) {
            channel = supabase.channel(`realtime-cardapio-${adminRestauranteId || 'publico'}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurante' }, async () => {
                    await carregarLojas();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, async () => {
                    await carregarCategorias();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, async (payload) => {
                    const lojaAtivaId = adminRestauranteId || localStorage.getItem('loja_selecionada');
                    const lojaAlteradaId = payload?.new?.restaurante_id || payload?.old?.restaurante_id;

                    if (lojaAtivaId && (!lojaAlteradaId || String(lojaAlteradaId) === String(lojaAtivaId))) {
                        await carregarProdutosLoja(lojaAtivaId, false);
                    }
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, async () => {
                    if (isAdmin) carregarPedidosAdminLocal();
                    if (clienteAuth) carregarMeusPedidos();
                })
                .subscribe();
        } else {
            console.warn('Realtime desabilitado para o ambiente de preview.');
        }

        return () => {
            cancelado = true;
            if (channel) {
                try { supabase.removeChannel(channel); } catch (e) {}
            }
        };
    }, [supabase, isAdmin, clienteAuth, adminEmail, adminRestauranteId]);

    // O cardápio só é baixado depois que o cliente escolhe uma loja.
    // Também cobre o caso em que a pessoa clicou numa loja antes do script do Supabase terminar de carregar.
    useEffect(() => {
        if (!supabase || isAdmin || view === 'selecionar_loja' || !restaurante.id) return;

        carregarProdutosLoja(restaurante.id, true);
    }, [supabase, restaurante.id, isAdmin]);

    // Fecha o seletor de franquias ao clicar fora dele ou pressionar ESC.
    useEffect(() => {
        if (!seletorLojaAberto) return;

        const fecharAoClicarFora = (event) => {
            if (seletorLojaRef.current && !seletorLojaRef.current.contains(event.target)) {
                setSeletorLojaAberto(false);
            }
        };

        const fecharComEsc = (event) => {
            if (event.key === 'Escape') setSeletorLojaAberto(false);
        };

        document.addEventListener('mousedown', fecharAoClicarFora);
        document.addEventListener('touchstart', fecharAoClicarFora, { passive: true });
        document.addEventListener('keydown', fecharComEsc);

        return () => {
            document.removeEventListener('mousedown', fecharAoClicarFora);
            document.removeEventListener('touchstart', fecharAoClicarFora);
            document.removeEventListener('keydown', fecharComEsc);
        };
    }, [seletorLojaAberto]);

    const selecionarLojaPeloTopo = (loja) => {
        const mudouDeLoja = String(loja.id) !== String(restaurante.id);

        if (mudouDeLoja && carrinho.length > 0) {
            const confirmarTroca = window.confirm(
                'Ao trocar de unidade, os itens atuais do carrinho serão removidos. Deseja continuar?'
            );
            if (!confirmarTroca) return;
            setCarrinho([]);
        }

        if (mudouDeLoja) {
            setProdutos([]);
            setRestaurante(loja);
            localStorage.setItem('loja_selecionada', loja.id);
        }

        setSeletorLojaAberto(false);
        setView('home');
    };

    useEffect(() => {
        if (!supabase || !isAdmin || !idAdminLogado) {
            if (!isAdmin) {
                setPromoForm(prev => ({ ...prev, webhookUrl: '' }));
                setWebhookEditavel(true);
            }
            return;
        }

        carregarWebhookRestaurante(idAdminLogado);
    }, [supabase, isAdmin, idAdminLogado]);

    const carregarMeusPedidos = async () => {
        if (!supabase) return;
        try {
            const { data: sessaoAtual } = await supabase.auth.getSession();
            const userId = sessaoAtual?.session?.user?.id || authUserId;
            if (!userId) return;

            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .eq('cliente_user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setMeusPedidos(data);
        } catch (err) {
            console.error('Erro ao carregar pedidos do cliente:', err);
        }
    };

    useEffect(() => {
        if (clienteAuth && authUserId && supabase && !isAdmin) {
            carregarMeusPedidos();
        }
    }, [clienteAuth, authUserId, supabase, isAdmin]);

    const loginAdminForm = async (e) => {
        e.preventDefault();
        if (!supabase || adminLoginLoading) return;

        const email = e.target.email.value.trim();
        const senha = e.target.senha.value;
        setAdminLoginLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
            if (error) throw error;

            const user = data.user;
            const acessoAdmin = obterPermissaoAdmin(user);

            if (!acessoAdmin.autorizado) {
                await supabase.auth.signOut();
                setIsAdmin(false);
                setAdminEmail('');
                setAdminRole('');
                setAdminRestauranteId(null);
                throw new Error('ADMIN_SEM_PERMISSAO');
            }

            setAdminEmail(user?.email || email);
            setAdminRole(acessoAdmin.role);
            setAdminRestauranteId(acessoAdmin.restauranteId);
            setIsAdmin(true);
            setClienteAuth(false);
            setView('home');

            if (!acessoAdmin.restauranteId) {
                console.warn('Administrador autenticado sem restaurante_id em app_metadata. Configure-o no Supabase Auth.');
            }
        } catch (err) {
            console.error('Falha no login administrativo:', err);
            if (err?.message === 'ADMIN_SEM_PERMISSAO') {
                alert('Esta conta não possui permissão para acessar a área administrativa.');
            } else {
                alert('Credenciais inválidas ou usuário administrativo não configurado no Supabase Auth.');
            }
        } finally {
            setAdminLoginLoading(false);
        }
    };

    const sairAdmin = async () => {
        try {
            if (supabase) await supabase.auth.signOut();
        } catch (e) {
            console.warn('Erro ao encerrar sessão administrativa:', e);
        }
        setAdminEmail('');
        setAdminRole('');
        setAdminRestauranteId(null);
        setIsAdmin(false);
        setView('home');
        try {
            await garantirSessaoCliente();
        } catch (e) {
            console.warn(e.message);
        }
    };

    const excluirProduto = (id) => {
        setModalConfirmacaoAberto({ aberto: true, id: id });
    };

    const confirmarExclusao = async () => {
        if (modalConfirmacaoAberto.id && supabase) {
            const idParaExcluir = modalConfirmacaoAberto.id;
            
            setProdutos(produtos.filter(p => p.id !== idParaExcluir));
            setModalConfirmacaoAberto({ aberto: false, id: null });
            setModalProdutoAberto(false);
            
            try {
                await supabase.from('produtos').delete().eq('id', idParaExcluir);
            } catch (err) {
                console.error("Erro ao excluir do banco:", err);
            }
        } else {
            setModalConfirmacaoAberto({ aberto: false, id: null });
        }
    };

    const cancelarExclusao = () => {
        setModalConfirmacaoAberto({ aberto: false, id: null });
    };

    const toggleStatusLoja = async () => {
        const novoStatus = !restaurante.is_aberto;
        setRestaurante({ ...restaurante, is_aberto: novoStatus });
        
        if (supabase && restaurante.id) {
             await supabase.from('restaurante').update({ is_aberto: novoStatus }).eq('id', restaurante.id);
        }
    };

    const handleCapaUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setRestaurante({ ...restaurante, foto_capa_url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setRestaurante({ ...restaurante, logo_url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const salvarConfiguracoes = async () => {
        if (!supabase || !restaurante.id) {
            alert("Sem conexão com o banco de dados.");
            return;
        }
        
        if (!restaurante.nome) {
            alert("O nome da franquia não pode estar vazio.");
            return;
        }
        
        if (restaurante.foto_capa_url && restaurante.foto_capa_url.length > 2000000) {
            alert("A foto de capa é muito grande! Escolha uma imagem mais leve.");
            return;
        }
        if (restaurante.logo_url && restaurante.logo_url.length > 2000000) {
            alert("A logo é muito grande! Escolha uma imagem mais leve.");
            return;
        }

        try {
            const { error } = await supabase.from('restaurante').update({
                nome: restaurante.nome,
                tempo_entrega: restaurante.tempo_entrega,
                raio_entrega: restaurante.raio_entrega,
                taxa_entrega: Number(restaurante.taxa_entrega || 0),
                whatsapp: restaurante.whatsapp || '',
                foto_capa_url: restaurante.foto_capa_url,
                logo_url: restaurante.logo_url,
                cep: restaurante.cep,
                lat: restaurante.lat,
                lng: restaurante.lng
            }).eq('id', restaurante.id);
            
            if (error) throw error;
            alert("Configurações atualizadas com sucesso!");
        } catch (err) {
            console.error("Erro ao salvar configurações:", err);
            alert("Falha ao salvar as configurações.");
        }
    };

    useEffect(() => {
        let timer;

        const podeCriarMapa =
            view === 'carrinho' &&
            carrinho.length > 0 &&
            checkoutForm.tipo === 'entrega' &&
            !mapRef.current &&
            window.L;

        if (podeCriarMapa) {
            timer = setTimeout(() => {
                const container = document.getElementById('mapa-raio-container');

                if (!container || mapRef.current) return;

                try {
                    const lojaLat = restaurante.lat || -23.5329;
                    const lojaLng = restaurante.lng || -46.7920;
                    const raioMeters = (restaurante.raio_entrega || 5) * 1000;

                    const map = window.L
                        .map(container, { zoomControl: false, attributionControl: false })
                        .setView([lojaLat, lojaLng], 13);

                    window.L
                        .tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png')
                        .addTo(map);

                    window.L.circle(
                        [lojaLat, lojaLng],
                        {
                            color: '#d79e51',
                            fillColor: '#d79e51',
                            fillOpacity: 0.2,
                            radius: raioMeters
                        }
                    ).addTo(map);

                    window.L.marker([lojaLat, lojaLng]).addTo(map).bindPopup('Restaurante');

                    if (clienteDados.lat && clienteDados.lng) {
                        window.L
                            .marker([clienteDados.lat, clienteDados.lng])
                            .addTo(map)
                            .bindPopup('Sua Entrega');
                    }

                    mapRef.current = map;
                    setMapaAberto(true);
                } catch (e) {
                    console.log("Erro ao carregar mapa", e);
                }
            }, 500);
        }

        if (
            (view !== 'carrinho' ||
                checkoutForm.tipo !== 'entrega' ||
                carrinho.length === 0) &&
            mapRef.current
        ) {
            mapRef.current.remove();
            mapRef.current = null;
            setMapaAberto(false);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [
        view,
        checkoutForm.tipo,
        carrinho.length,
        restaurante.raio_entrega,
        restaurante.lat,
        restaurante.lng,
        clienteDados.lat,
        clienteDados.lng
    ]);

    const obterTaxaEntregaAtual = () => {
        if (checkoutForm.tipo !== 'entrega') return 0;

        if (bairrosIguais(bairroLoja, clienteDados.bairro)) {
            return 2;
        }

        const taxaCalculada = Number(clienteDados.taxa_entrega_calculada);
        return Number.isFinite(taxaCalculada) ? taxaCalculada : 5;
    };

    const finalizarPedido = async () => {
        if (enviandoPedido) return;

        if (!clienteAuth) {
            alert('Entre na sua conta ou crie uma conta para finalizar o pedido.');
            setRedirectPosLogin('carrinho');
            setView('perfil');
            return;
        }

        if (!supabase) {
            alert('Sem conexão com o restaurante. O pedido NÃO foi enviado. Verifique sua internet e tente novamente.');
            return;
        }

        if (!restaurante.is_aberto) {
            alert("A loja está fechada no momento.");
            return;
        }

        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio.');
            return;
        }

        const temItemPrincipal = carrinho.some(item => item.tipo_item !== 'adicional');
        if (!temItemPrincipal) {
            alert('Escolha pelo menos um lanche ou produto principal para incluir os adicionais.');
            return;
        }

        if (checkoutForm.tipo === 'entrega') {
            if (!clienteDados.endereco) {
                alert("Cadastre seu endereço no seu Perfil para solicitar entrega.");
                return;
            }

            if (erroCep && erroCep.includes('Não fazemos entrega')) {
                alert("Seu endereço está fora da nossa área de entrega.");
                return;
            }
        }

        setEnviandoPedido(true);

        try {
            const usuario = await garantirSessaoCliente();
            if (!usuario) throw new Error('Sessão do cliente indisponível.');

            const subtotalCalc = carrinho.reduce(
                (sum, item) => sum + (Number(item.preco) * Number(item.quantidade)),
                0
            );
            const taxaCalc = obterTaxaEntregaAtual();
            const totalCalc = subtotalCalc + taxaCalc;
            const itensLimpos = carrinho.map(({ cartKey, ...item }) => item);

            const novoPedido = {
                id: Math.random().toString(36).substring(2, 9),
                cliente_user_id: usuario.id,
                cliente_nome: clienteDados.nome,
                cliente_celular: clienteDados.celular,
                total: totalCalc,
                status: 'novo',
                motivo_rejeicao: null,
                itens: {
                    filial_id: restaurante.id,
                    filial_nome: restaurante.nome,
                    lanches: itensLimpos,
                    subtotal: subtotalCalc,
                    taxa_entrega: taxaCalc,
                    bairro_cliente: clienteDados.bairro || '',
                    bairro_loja: bairroLoja || '',
                    distancia_entrega_km: distanciaEntrega,
                    tipo_recebimento: checkoutForm.tipo,
                    endereco: checkoutForm.tipo === 'entrega' ? clienteDados.endereco : 'Retirada',
                    referencia: checkoutForm.tipo === 'entrega' ? clienteDados.referencia : '',
                    pagamento: checkoutForm.pagamento,
                    troco: checkoutForm.troco,
                    whatsapp_loja: restaurante.whatsapp || ''
                }
            };

            const { data: pedidoCriado, error } = await supabase
                .from('pedidos')
                .insert([novoPedido])
                .select('id,numero_pedido')
                .single();

            if (error) throw error;

            setCarrinho([]);
            await carregarMeusPedidos();
            setView('pedidos');

            const numeroCriado = numeroPedidoVisivel(pedidoCriado);
            alert(`Pedido #${numeroCriado} enviado com sucesso!`);
        } catch (err) {
            console.error("Erro ao finalizar pedido:", err);
            alert(`O pedido NÃO foi enviado. ${err.message || 'Tente novamente.'}`);
        } finally {
            setEnviandoPedido(false);
        }
    };

    const moverPedidoStatus = async (id, novoStatus, extras = {}) => {
        const anterior = pedidosAdmin;
        setPedidosAdmin(prev =>
            prev.map(p => p.id === id ? { ...p, status: novoStatus, ...extras } : p)
        );

        if (!supabase) {
            setPedidosAdmin(anterior);
            alert('Sem conexão com o banco. O status não foi alterado.');
            return false;
        }

        const { error } = await supabase
            .from('pedidos')
            .update({ status: novoStatus, ...extras })
            .eq('id', id);

        if (error) {
            console.error("Erro ao atualizar pedido:", error);
            setPedidosAdmin(anterior);
            alert('Não foi possível atualizar o pedido.');
            carregarPedidosAdminLocal();
            return false;
        }
        return true;
    };

    const abrirModalRejeicao = (pedidoId) => {
        setModalRejeicao({ aberto: true, pedidoId, motivo: '' });
    };

    const confirmarRejeicaoPedido = async () => {
        const motivo = modalRejeicao.motivo.trim();
        if (!motivo) {
            alert('Informe o motivo da rejeição.');
            return;
        }
        const ok = await moverPedidoStatus(modalRejeicao.pedidoId, 'rejeitado', { motivo_rejeicao: motivo });
        if (ok) setModalRejeicao({ aberto: false, pedidoId: null, motivo: '' });
    };

    useEffect(() => {
        if (!isAdmin) {
            alertasInicializadosRef.current = false;
            pedidosNovosConhecidosRef.current = new Set();
            return;
        }

        const novos = pedidosAdminFiltrados.filter(p => p.status === 'novo');
        const idsAtuais = new Set(novos.map(p => p.id));

        if (!alertasInicializadosRef.current) {
            pedidosNovosConhecidosRef.current = idsAtuais;
            alertasInicializadosRef.current = true;
            return;
        }

        const chegaram = novos.filter(p => !pedidosNovosConhecidosRef.current.has(p.id));
        if (chegaram.length > 0) {
            tocarSomNovoPedido();
            const ultimo = chegaram[0];
            setAlertaNovoPedido({
                quantidade: chegaram.length,
                texto: chegaram.length === 1
                    ? `Novo pedido de ${ultimo.cliente_nome || 'cliente'}!`
                    : `${chegaram.length} novos pedidos recebidos!`
            });
        }
        pedidosNovosConhecidosRef.current = idsAtuais;
    }, [pedidosAdmin, isAdmin, idAdminLogado]);

    const imprimirNota = (pedido) => {
        let info = {};
        if (typeof pedido.itens === 'string') {
            try { info = JSON.parse(pedido.itens); } catch (e) {}
        } else {
            info = pedido.itens || {};
        }

        // Escapa conteúdo vindo do cliente/produto antes de inserir no HTML da impressão.
        const escapeHtml = (valor = '') => String(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        const formatarMoeda = (valor) =>
            Number(valor || 0).toFixed(2).replace('.', ',');

        const itens = Array.isArray(info.lanches) ? info.lanches : [];

        const itensHtml = itens.map((item) => {
            const qtd = Number(item.quantidade || 0);
            const preco = Number(item.preco || 0);
            const totalItem = qtd * preco;
            const obs = String(item.observacao || '').trim();

            const prefixoItem = item.tipo_item === 'adicional' ? 'ADICIONAL - ' : '';

            return `
                <div class="item">
                    <div class="item-linha">
                        <span class="item-nome">${qtd}x ${prefixoItem}${escapeHtml(item.nome || 'Item')}</span>
                        <span class="item-valor">R$ ${formatarMoeda(totalItem)}</span>
                    </div>
                    <div class="item-unitario">R$ ${formatarMoeda(preco)} un.</div>
                    ${obs ? `<div class="item-obs"><strong>OBS:</strong> ${escapeHtml(obs)}</div>` : ''}
                </div>
            `;
        }).join('');

        const dataPedido = new Date(pedido.created_at || Date.now());
        const dataFormatada = dataPedido.toLocaleDateString('pt-BR');
        const horaFormatada = dataPedido.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const subtotal = Number(
            info.subtotal ??
            (Number(pedido.total || 0) - Number(info.taxa_entrega || 0))
        );
        const taxaEntrega = Number(info.taxa_entrega || 0);
        const total = Number(pedido.total || 0);
        const tipoRecebimento = String(info.tipo_recebimento || '').toLowerCase();
        const ehEntrega = tipoRecebimento === 'entrega' || (info.endereco && info.endereco !== 'Retirada');
        const tituloRecebimento = ehEntrega ? 'ENTREGA' : 'RETIRADA';

        const numeroCurto = numeroPedidoVisivel(pedido);

        // A TM-T20X usa bobina de 80 mm (79,5 mm nominal).
        // O conteúdo é limitado a ~72 mm para respeitar a área útil do driver.
        const win = window.open('', '_blank', 'width=420,height=780');

        if (!win) {
            alert('O navegador bloqueou a janela de impressão. Libere pop-ups para imprimir a nota.');
            return;
        }

        win.document.open();
        win.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Pedido ${escapeHtml(numeroCurto)}</title>
                <style>
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    html, body {
                        width: 80mm;
                        margin: 0;
                        padding: 0;
                        background: #fff;
                        color: #000;
                        font-family: "Courier New", Courier, monospace;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    body {
                        font-size: 28px;
                        line-height: 1.12;
                    }

                    .receipt {
                        width: 76mm;
                        margin: 0 auto;
                        padding: 3mm 0 5mm;
                        overflow: hidden;
                    }

                    .center { text-align: center; }
                    .right { text-align: right; }
                    .bold { font-weight: 700; }
                    .uppercase { text-transform: uppercase; }

                    .loja {
                        font-size: 40px;
                        font-weight: 900;
                        line-height: 1.1;
                        text-transform: uppercase;
                        overflow-wrap: anywhere;
                    }

                    .pedido-numero {
                        font-size: 34px;
                        font-weight: 900;
                        margin-top: 1.5mm;
                    }

                    .tipo {
                        display: inline-block;
                        margin-top: 1.5mm;
                        border: 1px solid #000;
                        padding: 1mm 3mm;
                        font-size: 30px;
                        font-weight: 900;
                    }

                    .separador {
                        border: 0;
                        border-top: 1px dashed #000;
                        margin: 2.5mm 0;
                    }

                    .linha {
                        display: flex;
                        justify-content: space-between;
                        gap: 2mm;
                    }

                    .quebra {
                        overflow-wrap: anywhere;
                        word-break: break-word;
                    }

                    .titulo-bloco {
                        font-size: 29px;
                        font-weight: 900;
                        margin-bottom: 1.5mm;
                    }

                    .item {
                        margin-bottom: 2.2mm;
                        page-break-inside: avoid;
                    }

                    .item-linha {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 2mm;
                        font-weight: 700;
                    }

                    .item-nome {
                        flex: 1;
                        overflow-wrap: anywhere;
                    }

                    .item-valor {
                        white-space: nowrap;
                    }

                    .item-unitario {
                        font-size: 25px;
                        margin-top: 0.4mm;
                    }

                    .item-obs {
                        font-size: 26px;
                        margin-top: 0.8mm;
                        padding-left: 2mm;
                        border-left: 2px solid #000;
                        overflow-wrap: anywhere;
                    }

                    .total-linha {
                        display: flex;
                        justify-content: space-between;
                        gap: 2mm;
                        margin: 0.7mm 0;
                    }

                    .total-final {
                        font-size: 38px;
                        font-weight: 900;
                        margin-top: 1.5mm;
                    }

                    .rodape {
                        margin-top: 3mm;
                        font-size: 25px;
                        text-align: center;
                    }

                    .espaco-corte {
                        height: 7mm;
                    }

                    @media screen {
                        body {
                            margin: 0 auto;
                        }
                        .receipt {
                            box-shadow: 0 0 10px rgba(0,0,0,.15);
                        }
                    }

                    @media print {
                        html, body {
                            width: 80mm !important;
                            min-width: 80mm !important;
                            max-width: 80mm !important;
                        }
                        .receipt {
                            width: 76mm !important;
                            margin: 0 auto !important;
                            box-shadow: none !important;
                        }
                    }
                </style>
            </head>
            <body>
                <main class="receipt">
                    <div class="center loja">${escapeHtml(restaurante.nome || 'DOGS DO MIRSO')}</div>
                    <div class="center pedido-numero">PEDIDO #${escapeHtml(numeroCurto)}</div>
                    <div class="center">${escapeHtml(dataFormatada)} - ${escapeHtml(horaFormatada)}</div>
                    <div class="center"><span class="tipo">${tituloRecebimento}</span></div>

                    <hr class="separador" />

                    <div class="titulo-bloco">CLIENTE</div>
                    <div class="quebra"><strong>Nome:</strong> ${escapeHtml(pedido.cliente_nome || '-')}</div>
                    <div class="quebra"><strong>Telefone:</strong> ${escapeHtml(pedido.cliente_celular || '-')}</div>

                    <hr class="separador" />

                    <div class="titulo-bloco">ITENS DO PEDIDO</div>
                    ${itensHtml || '<div>Nenhum item informado.</div>'}

                    <hr class="separador" />

                    <div class="total-linha">
                        <span>Subtotal</span>
                        <span>R$ ${formatarMoeda(subtotal)}</span>
                    </div>
                    ${taxaEntrega > 0 ? `
                        <div class="total-linha">
                            <span>Taxa de entrega</span>
                            <span>R$ ${formatarMoeda(taxaEntrega)}</span>
                        </div>
                    ` : ''}
                    <div class="total-linha total-final">
                        <span>TOTAL</span>
                        <span>R$ ${formatarMoeda(total)}</span>
                    </div>

                    <hr class="separador" />

                    <div class="titulo-bloco">${tituloRecebimento}</div>
                    ${ehEntrega ? `
                        <div class="quebra"><strong>Endereço:</strong> ${escapeHtml(info.endereco || '-')}</div>
                        ${info.referencia ? `<div class="quebra"><strong>Referência:</strong> ${escapeHtml(info.referencia)}</div>` : ''}
                    ` : '<div>Retirada no balcão.</div>'}

                    <div class="quebra" style="margin-top:1.5mm;">
                        <strong>Pagamento:</strong> ${escapeHtml(info.pagamento || '-')}
                    </div>
                    ${info.troco ? `<div class="quebra"><strong>Troco para:</strong> ${escapeHtml(info.troco)}</div>` : ''}

                    <hr class="separador" />

                    <div class="rodape">
                        Obrigado pela preferência!<br/>
                        ${escapeHtml(restaurante.nome || 'DOGS DO MIRSO')}
                    </div>
                    <div class="espaco-corte"></div>
                </main>

                <script>
                    window.addEventListener('load', function () {
                        setTimeout(function () {
                            window.focus();
                            window.print();
                        }, 250);
                    });

                    window.addEventListener('afterprint', function () {
                        window.close();
                    });
                <\/script>
            </body>
            </html>
        `);
        win.document.close();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProdutoEditando({ ...produtoEditando, imagem_url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const resolverCategoriaIdParaSalvar = async (categoriaId) => {
        const categoriaVirtual = CATEGORIAS_EXTRAS_ADMIN.find(
            categoria => categoria.idVirtual === categoriaId
        );

        if (!categoriaVirtual) return categoriaId;

        const existente = categorias.find(
            categoria => chaveCategoria(normalizarNomeCategoria(categoria?.nome || '')) === chaveCategoria(categoriaVirtual.nome)
        );

        if (existente) return existente.id;

        const maiorOrdem = categorias.reduce(
            (maior, categoria) => Math.max(maior, Number(categoria?.ordem) || 0),
            0
        );

        const { data, error } = await supabase
            .from('categorias')
            .insert([{
                nome: categoriaVirtual.nome,
                ordem: maiorOrdem + 1
            }])
            .select('id,nome,ordem');

        if (error) {
            const atualizadas = await carregarCategorias();
            const encontrada = atualizadas.find(
                categoria => chaveCategoria(normalizarNomeCategoria(categoria?.nome || '')) === chaveCategoria(categoriaVirtual.nome)
            );

            if (encontrada) return encontrada.id;
            throw error;
        }

        const criada = data?.[0];
        if (!criada?.id) {
            throw new Error(`Não foi possível criar a categoria ${categoriaVirtual.nome}.`);
        }

        const categoriaNormalizada = {
            ...criada,
            nome: normalizarNomeCategoria(criada.nome)
        };

        const novasCategorias = [...categorias, categoriaNormalizada]
            .filter((categoria, index, lista) =>
                index === lista.findIndex(item => String(item.id) === String(categoria.id))
            )
            .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0));

        setCategorias(novasCategorias);
        salvarCacheSeguro('dogs_categorias_cache', novasCategorias);

        return criada.id;
    };

    const handleSaveProduto = async () => {
        if (!supabase) {
            alert("Aguarde a conexão com o banco de dados. (Se persistir, recarregue a página)");
            return;
        }
        
        if (produtoEditando.imagem_url && produtoEditando.imagem_url.length > 2000000) {
            alert("Erro: A imagem escolhida é muito pesada para o banco de dados. Por favor, escolha uma imagem de menor tamanho/resolução.");
            return;
        }

        if (!produtoEditando.nome) { alert("Nome do produto é obrigatório."); return; }
        if (!produtoEditando.preco) { alert("Preço do produto é obrigatório."); return; }

        const descontoInformado = Number(produtoEditando.desconto_percentual || 0);
        if (!Number.isFinite(descontoInformado) || descontoInformado < 0 || descontoInformado > 100) {
            alert("O desconto deve estar entre 0% e 100%.");
            return;
        }

        try {
            const categoriaSelecionada = produtoEditando.categoria_id || (categoriasAdmin.length > 0 ? categoriasAdmin[0].id : null);
            const catIdFinal = await resolverCategoriaIdParaSalvar(categoriaSelecionada);
            
            const payload = {
                nome: produtoEditando.nome,
                preco: Number(produtoEditando.preco),
                desconto_percentual: descontoInformado,
                descricao: produtoEditando.descricao || '',
                categoria_id: catIdFinal,
                ativo: produtoEditando.ativo,
                is_destaque: produtoEditando.is_destaque,
                imagem_url: produtoEditando.imagem_url || '',
                restaurante_id: idAdminLogado
            };

            let savedData = null;

            if (produtoEditando.id) {
                const { data, error } = await supabase.from('produtos').update(payload).eq('id', produtoEditando.id).select();
                if (error) throw error;
                savedData = data && data.length > 0 ? data[0] : { ...payload, id: produtoEditando.id };
                setProdutos(produtos.map(p => p.id === savedData.id ? savedData : p));
            } else {
                payload.id = Math.random().toString(36).substring(2, 9);
                const { data, error } = await supabase.from('produtos').insert([payload]).select();
                if (error) throw error;
                savedData = data && data.length > 0 ? data[0] : payload;
                setProdutos([...produtos, savedData]);
            }
            
            setModalProdutoAberto(false);
        } catch (err) {
            console.error("Erro detalhado ao salvar produto no Supabase:", err);
            alert(`ERRO AO SALVAR NO BANCO DE DADOS:\n\n${err.message || JSON.stringify(err)}\n\nVerifique as permissões de tabela no Supabase ou recarregue a página.`);
        }
    };

    const subtotalCarrinho = carrinho.reduce((sum, item) => sum + (Number(item.preco) * Number(item.quantidade)), 0);
    const taxaEntregaCarrinho = obterTaxaEntregaAtual();
    const totalCarrinho = subtotalCarrinho + taxaEntregaCarrinho;
    const badgeCount = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

    if (isAdmin) {
        return (
            <div className="dogs-admin-shell fixed inset-0 bg-[#1a191c] flex w-full min-w-0 text-white font-sans overflow-hidden z-50">
                
                {/* Textura de Fundo SVG Pattern Gestor */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30,45 C30,35 40,35 40,45 L40,75 C40,85 30,85 30,75 Z M32,45 L38,45 L38,75 L32,75 Z M70,40 L90,40 L88,80 L72,80 Z M74,42 L86,42 L84,78 L76,78 Z' fill='%23d79e51' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

                <div className={`absolute lg:relative z-[60] w-[84vw] max-w-[280px] sm:w-72 lg:w-64 bg-[#242326] border-r border-gray-800 flex flex-col h-full transform ${adminMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 flex-shrink-0`}>
                    <div className="p-5 flex items-center justify-between border-b border-gray-800">
                        <h2 className="font-bold text-xl text-[#d79e51] uppercase tracking-wider">Gestão</h2>
                        <button onClick={() => setAdminMenuOpen(false)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-2 px-3">
                            <li>
                                <button onClick={() => setAdminView('cardapio')} className={`w-full flex items-center px-4 py-3 rounded-lg border transition-all ${adminView === 'cardapio' ? 'bg-[#363539] text-white border-gray-700 shadow-sm' : 'border-transparent text-gray-400 hover:bg-[#363539] hover:text-white'}`}>
                                    <i className={`fas fa-book-open w-6 ${adminView === 'cardapio' ? 'text-[#d79e51]' : ''}`}></i>
                                    <span className="text-sm font-medium">Cardápio</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setAdminView('pedidos')} className={`w-full flex items-center px-4 py-3 rounded-lg border transition-all ${adminView === 'pedidos' ? 'bg-[#363539] text-white border-gray-700 shadow-sm' : 'border-transparent text-gray-400 hover:bg-[#363539] hover:text-white'}`}>
                                    <i className={`fas fa-receipt w-6 ${adminView === 'pedidos' ? 'text-[#d79e51]' : ''}`}></i>
                                    <span className="text-sm font-medium">Pedidos</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setAdminView('configs')} className={`w-full flex items-center px-4 py-3 rounded-lg border transition-all ${adminView === 'configs' ? 'bg-[#363539] text-white border-gray-700 shadow-sm' : 'border-transparent text-gray-400 hover:bg-[#363539] hover:text-white'}`}>
                                    <i className={`fas fa-cog w-6 ${adminView === 'configs' ? 'text-[#d79e51]' : ''}`}></i>
                                    <span className="text-sm font-medium">Configurações</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setAdminView('financeiro')} className={`w-full flex items-center px-4 py-3 rounded-lg border transition-all ${adminView === 'financeiro' ? 'bg-[#363539] text-white border-gray-700 shadow-sm' : 'border-transparent text-gray-400 hover:bg-[#363539] hover:text-white'}`}>
                                    <i className={`fas fa-dollar-sign w-6 ${adminView === 'financeiro' ? 'text-[#d79e51]' : ''}`}></i>
                                    <span className="text-sm font-medium">Financeiro</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setAdminView('promocoes')} className={`w-full flex items-center px-4 py-3 rounded-lg border transition-all ${adminView === 'promocoes' ? 'bg-[#363539] text-white border-gray-700 shadow-sm' : 'border-transparent text-gray-400 hover:bg-[#363539] hover:text-white'}`}>
                                    <i className={`fas fa-bullhorn w-6 ${adminView === 'promocoes' ? 'text-[#d79e51]' : ''}`}></i>
                                    <span className="text-sm font-medium">Disparo Promo</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                    <div className="p-4 border-t border-gray-800 space-y-3">
                        <button onClick={sairAdmin} className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/30 rounded-lg transition-all">
                            <i className="fas fa-sign-out-alt mr-2"></i> Voltar ao App
                        </button>
                    </div>
                </div>

                {adminMenuOpen && <div onClick={() => setAdminMenuOpen(false)} className="fixed inset-0 bg-black/60 z-[55] lg:hidden backdrop-blur-sm transition-opacity"></div>}

                <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative w-full z-10">
                    <header className="bg-[#1f1e22] border-b border-gray-800 p-3 sm:p-4 flex justify-between items-center gap-3 z-10 flex-shrink-0">
                        <div className="flex items-center min-w-0">
                            <button onClick={() => setAdminMenuOpen(true)} className="lg:hidden text-gray-400 hover:text-white mr-3 sm:mr-4 transition-colors flex-shrink-0">
                                <i className="fas fa-bars text-xl"></i>
                            </button>
                            <h3 className="text-white text-sm sm:text-base lg:text-lg font-medium truncate">
                                {adminView === 'pedidos' ? 'Gestão de Pedidos' : adminView === 'cardapio' ? 'Cardápio Web' : adminView === 'nova_loja' ? 'Nova Loja' : adminView === 'financeiro' ? 'Financeiro' : adminView === 'promocoes' ? 'Disparo Promo' : 'Configurações do App'}
                            </h3>
                        </div>
                        {adminView === 'cardapio' && (
                            <div className="flex items-center space-x-4">
                                <button onClick={() => {
                                    setProdutoEditando({nome: '', preco: '', desconto_percentual: 0, categoria_id: categoriasAdmin[0]?.id || '', descricao: '', ativo: true, is_destaque: false, imagem_url: ''}); 
                                    setModalProdutoAberto(true);
                                }} className="bg-[#d79e51] hover:bg-[#e8b776] text-[#1a191c] px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-[11px] md:text-sm shadow-md transition-colors flex items-center">
                                    <i className="fas fa-plus sm:mr-2"></i> <span className="hidden sm:inline">Novo Lanche</span>
                                </button>
                            </div>
                        )}
                    </header>

                    <main className="dogs-touch-scroll flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 pb-24 lg:pb-8 relative">
                        {alertaNovoPedido && (
                            <div className="mb-5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-xl p-4 flex items-center justify-between shadow-lg animate-pulse">
                                <div className="flex items-center">
                                    <i className="fas fa-bell mr-3 text-xl"></i>
                                    <span className="font-bold text-sm md:text-base">{alertaNovoPedido.texto}</span>
                                </div>
                                <button onClick={() => setAlertaNovoPedido(null)} className="text-emerald-200 hover:text-white w-8 h-8 rounded-lg hover:bg-emerald-500/20"><i className="fas fa-times"></i></button>
                            </div>
                        )}
                        
                        {/* Area de Pedidos */}
                        {adminView === 'pedidos' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 h-full items-start">
                                {['novo', 'preparo', 'pronto', 'saiu_entrega'].map(status => (
                                    <div key={status} className="bg-[#242326] rounded-xl border border-gray-800 flex flex-col max-h-none md:max-h-[calc(100dvh-9rem)] shadow-sm relative z-10">
                                        <div className="p-3.5 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                                            <h4 className="text-white font-medium tracking-wide uppercase text-sm">{status === 'novo' ? 'Novos Pedidos' : status === 'preparo' ? 'Em Preparo' : status === 'pronto' ? 'Prontos' : 'Saiu p/ Entrega'}</h4>
                                        </div>
                                        <div className="p-3 overflow-y-auto space-y-3 hide-scrollbar flex-1 min-h-[150px]">
                                            {pedidosAdminFiltrados.filter(p => p.status === status).map(p => {
                                                let info = {};
                                                if (typeof p.itens === 'string') {
                                                    try { info = JSON.parse(p.itens); } catch(e) {}
                                                } else {
                                                    info = p.itens || {};
                                                }
                                                return (
                                                    <div key={p.id} className="bg-[#363539] p-3 rounded-lg border border-gray-700 shadow-sm relative z-10">
                                                        <div className="flex justify-between border-b border-gray-700 pb-2 mb-2">
                                                            <span className="text-white font-bold text-sm">#{numeroPedidoVisivel(p)} - {p.cliente_nome}</span>
                                                            <span className="text-[#d79e51] font-bold text-sm">R$ {Number(p.total).toFixed(2).replace('.',',')}</span>
                                                        </div>
                                                        <div className="mb-2 text-xs text-gray-300">
                                                            {info.lanches?.map((l, i) => (
                                                                <div key={i}>
                                                                    • {l.quantidade}x {l.tipo_item === 'adicional' ? 'Adicional - ' : ''}{l.nome}
                                                                    {l.observacao && <span className="text-red-400"> ({l.observacao})</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 bg-[#1f1e22] p-1.5 rounded mt-2">
                                                            <i className="fas fa-map-marker-alt"></i> {info.endereco || 'Retirada'} <br/>
                                                            {info.referencia && <><i className="fas fa-directions mt-1"></i> Ref: {info.referencia}<br/></>}
                                                            <i className="fas fa-wallet mt-1"></i> {info.pagamento || 'N/A'} {info.troco ? `(Troco: ${info.troco})` : ''}
                                                        </div>
                                                        <div className="mt-3 flex flex-col space-y-2">
                                                            {status === 'novo' && (
                                                                <div className="flex space-x-2">
                                                                    <button onClick={() => moverPedidoStatus(p.id, 'preparo')} className="flex-1 bg-[#d79e51] text-[#1a191c] font-bold py-1.5 rounded text-xs">Aceitar</button>
                                                                    <button onClick={() => abrirModalRejeicao(p.id)} className="flex-1 bg-red-900/50 text-red-300 border border-red-700/50 font-bold py-1.5 rounded text-xs">Rejeitar</button>
                                                                </div>
                                                            )}
                                                            {status === 'preparo' && <button onClick={() => moverPedidoStatus(p.id, 'pronto')} className="w-full bg-green-500 text-white font-bold py-1.5 rounded text-xs">Marcar como Pronto</button>}
                                                            {status === 'pronto' && (info.endereco && info.endereco !== 'Retirada' ? <button onClick={() => moverPedidoStatus(p.id, 'saiu_entrega')} className="w-full bg-blue-600 text-white font-bold py-1.5 rounded text-xs">Saiu para Entrega</button> : <button onClick={() => moverPedidoStatus(p.id, 'finalizado')} className="w-full bg-gray-600 text-white font-bold py-1.5 rounded text-xs">Concluir Retirada</button>)}
                                                            {status === 'saiu_entrega' && <button onClick={() => moverPedidoStatus(p.id, 'finalizado')} className="w-full bg-gray-600 text-white font-bold py-1.5 rounded text-xs">Concluir / Arquivar</button>}
                                                            {(status === 'finalizado' || p.status === 'rejeitado') && <span className="w-full block text-center text-gray-500 font-bold py-1.5 rounded text-xs border border-gray-700">{p.status === 'rejeitado' ? 'Pedido Rejeitado' : 'Finalizado'}</span>}
                                                            
                                                            <button onClick={() => imprimirNota(p)} className="w-full bg-transparent border border-gray-600 text-gray-400 hover:text-white py-1.5 rounded text-xs"><i className="fas fa-print mr-1"></i> Imprimir Nota</button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {pedidosAdminFiltrados.filter(p => p.status === status).length === 0 && (
                                                <div className="text-gray-500 text-center text-sm mt-4">Vazio</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Area do Cardapio - separado por categoria */}
                        {adminView === 'cardapio' && (() => {
                            const produtosDaLoja = produtos.filter(
                                p => p.restaurante_id === idAdminLogado || (!p.restaurante_id && isMatriz)
                            );

                            const categoriasComProdutos = categorias
                                .map(categoria => ({
                                    ...categoria,
                                    produtos: produtosDaLoja.filter(
                                        produto => String(produto.categoria_id) === String(categoria.id)
                                    )
                                }))
                                .filter(categoria => categoria.produtos.length > 0);

                            const produtosSemCategoria = produtosDaLoja.filter(
                                produto => !categorias.some(
                                    categoria => String(categoria.id) === String(produto.categoria_id)
                                )
                            );

                            const renderProdutoAdmin = (p) => (
                                <div key={p.id} className="bg-[#1f1e22] border border-gray-800 rounded-xl overflow-hidden shadow-md">
                                    <img
                                        src={obterImagemProduto(p)}
                                        alt={p.nome}
                                        className={`w-full h-28 object-cover ${!p.ativo ? 'grayscale opacity-50' : ''}`}
                                    />
                                    <div className="p-4">
                                        <h4 className="text-white font-medium text-sm mb-1">{p.nome}</h4>
                                        {produtoTemDesconto(p) ? (
                                            <div className="mb-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-gray-500 text-xs line-through">
                                                        R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                                                    </span>
                                                    <span className="bg-red-500/15 border border-red-500/40 text-red-400 text-[9px] font-black px-2 py-0.5 rounded-full">
                                                        -{formatarPercentualDesconto(p)}%
                                                    </span>
                                                </div>
                                                <p className="text-[#d79e51] font-black">
                                                    R$ {precoFinalProduto(p).toFixed(2).replace('.', ',')}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-[#d79e51] font-bold mb-3">
                                                R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                                            </p>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className={`text-xs px-2 py-1 rounded border ${p.ativo ? 'border-green-800 text-green-500' : 'border-red-800 text-red-500'}`}>
                                                {p.ativo ? 'Ativo' : 'Pausado'}
                                            </span>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => excluirProduto(p.id)}
                                                    className="text-xs px-3 py-1.5 bg-red-900/50 text-red-400 rounded hover:bg-red-800 hover:text-white transition-colors"
                                                    title="Excluir produto"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                                <button
                                                    onClick={() => { setProdutoEditando({...p, desconto_percentual: Number(p.desconto_percentual || 0)}); setModalProdutoAberto(true); }}
                                                    className="text-xs px-3 py-1.5 bg-[#d79e51] text-[#1a191c] rounded hover:bg-[#e8b776] transition-colors"
                                                    title="Editar produto"
                                                >
                                                    <i className="fas fa-pen"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );

                            if (produtosDaLoja.length === 0) {
                                return (
                                    <div className="relative z-10 text-center text-gray-500 py-10">
                                        Nenhum produto cadastrado para esta loja ainda.
                                    </div>
                                );
                            }

                            return (
                                <div className="relative z-10 space-y-8">
                                    {categoriasComProdutos.map(categoria => (
                                        <section key={categoria.id} className="space-y-4">
                                            <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                                                <div className="w-1 h-7 rounded-full bg-[#d79e51]"></div>
                                                <div className="min-w-0">
                                                    <h4 className="text-white font-black text-base sm:text-lg uppercase tracking-wider">
                                                        {categoria.nome}
                                                    </h4>
                                                    <p className="text-[10px] sm:text-xs text-gray-500">
                                                        {categoria.produtos.length} {categoria.produtos.length === 1 ? 'produto' : 'produtos'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                                                {categoria.produtos.map(renderProdutoAdmin)}
                                            </div>
                                        </section>
                                    ))}

                                    {produtosSemCategoria.length > 0 && (
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                                                <div className="w-1 h-7 rounded-full bg-gray-600"></div>
                                                <div>
                                                    <h4 className="text-gray-300 font-black text-base sm:text-lg uppercase tracking-wider">
                                                        Sem Categoria
                                                    </h4>
                                                    <p className="text-[10px] sm:text-xs text-gray-500">
                                                        {produtosSemCategoria.length} {produtosSemCategoria.length === 1 ? 'produto' : 'produtos'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                                                {produtosSemCategoria.map(renderProdutoAdmin)}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Area de Configs */}
                        {adminView === 'configs' && (
                            <div className="max-w-3xl mx-auto space-y-6 pt-2 relative z-10">
                                <div className="bg-[#242326] rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl">
                                        <h4 className="text-white font-medium tracking-wide uppercase text-sm">Operação da Loja</h4>
                                    </div>
                                    <div className="p-5 space-y-5">
                                        <div>
                                            <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Nome da Franquia / Loja</label>
                                            <input type="text" value={restaurante.nome || ''} onChange={(e) => setRestaurante({...restaurante, nome: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" placeholder="Ex: Dogs do Mirso - Matriz" />
                                        </div>
                                        <div className="flex justify-between items-center border-b border-gray-800 pb-5">
                                            <div>
                                                <p className="text-white font-medium text-sm">Status do Restaurante</p>
                                                <p className="text-xs text-gray-400 mt-1">Abra ou feche para receber pedidos.</p>
                                            </div>
                                            <label className="flex items-center cursor-pointer group">
                                                <div className="relative" style={{ width: '40px', height: '24px' }}>
                                                    <input type="checkbox" checked={restaurante.is_aberto} onChange={toggleStatusLoja} className="sr-only" />
                                                    <div className="block w-10 h-6 rounded-full transition-colors duration-300 shadow-inner" style={{ backgroundColor: restaurante.is_aberto ? '#22c55e' : '#374151' }}></div>
                                                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-md" style={{ transform: restaurante.is_aberto ? 'translateX(16px)' : 'translateX(0)' }}></div>
                                                </div>
                                                <span className={`ml-3 text-xs font-bold uppercase tracking-wide ${restaurante.is_aberto ? 'text-green-400' : 'text-red-400'}`}>{restaurante.is_aberto ? 'Aberto' : 'Fechado'}</span>
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">CEP da Loja (Origem)</label>
                                                <input type="text" value={restaurante.cep || ''} onBlur={(e) => buscarCepLoja(e.target.value)} onChange={(e) => setRestaurante({...restaurante, cep: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" placeholder="Ex: 01001-000" />
                                                {cepLojaBuscando && <p className="text-[10px] text-gray-400 mt-1"><i className="fas fa-spinner fa-spin"></i> Buscando coordenadas...</p>}
                                                {erroCepLoja && <p className="text-[10px] text-red-400 mt-1 font-bold">{erroCepLoja}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Tempo Delivery (Ex: 30-45 min)</label>
                                                <input type="text" value={restaurante.tempo_entrega} onChange={(e) => setRestaurante({...restaurante, tempo_entrega: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Raio Máximo (KM)</label>
                                                <input type="number" value={restaurante.raio_entrega} onChange={(e) => setRestaurante({...restaurante, raio_entrega: Number(e.target.value)})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Frete Automático</label>
                                                <div className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 text-sm leading-relaxed">
                                                    <span className="font-bold text-[#d79e51]">R$ 2,00</span> no mesmo bairro da loja<br />
                                                    <span className="font-bold text-[#d79e51]">R$ 5,00</span> para outros bairros dentro do raio
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">WhatsApp da Loja</label>
                                                <input type="tel" value={restaurante.whatsapp || ''} onChange={(e) => setRestaurante({...restaurante, whatsapp: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" placeholder="Ex: (11) 99999-9999" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#242326] rounded-xl border border-gray-800 flex flex-col shadow-sm mt-6">
                                    <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl">
                                        <h4 className="text-white font-medium tracking-wide uppercase text-sm">Design do Aplicativo</h4>
                                    </div>
                                    <div className="p-5">
                                        <p className="text-gray-400 text-sm mb-5">Personalize a aparência visual do seu cardápio digital.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-xl hover:border-[#d79e51] hover:bg-[#d79e51]/5 transition-all group cursor-pointer relative overflow-hidden">
                                                <input type="file" accept="image/*" onChange={handleCapaUpload} className="hidden" />
                                                {restaurante.foto_capa_url && restaurante.foto_capa_url !== 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' && (
                                                    <img src={restaurante.foto_capa_url} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Capa" />
                                                )}
                                                <i className="fas fa-image text-3xl text-gray-500 group-hover:text-[#d79e51] mb-3 transition-colors relative z-10"></i>
                                                <span className="text-sm font-medium text-gray-300 group-hover:text-white relative z-10">Trocar Foto de Capa</span>
                                            </label>
                                            
                                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-xl hover:border-[#d79e51] hover:bg-[#d79e51]/5 transition-all group cursor-pointer relative overflow-hidden">
                                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                                {restaurante.logo_url && (
                                                    <img src={restaurante.logo_url} className="absolute inset-0 w-full h-full object-contain opacity-40 bg-[#1f1e22]" alt="Logo" />
                                                )}
                                                <i className="fas fa-bullseye text-3xl text-gray-500 group-hover:text-[#d79e51] mb-3 transition-colors relative z-10"></i>
                                                <span className="text-sm font-medium text-gray-300 group-hover:text-white relative z-10">Trocar Logo</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end mt-6">
                                    <button onClick={salvarConfiguracoes} className="px-6 py-3 bg-[#d79e51] hover:bg-[#e8b776] text-[#1a191c] rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center">
                                        <i className="fas fa-save mr-2"></i> Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Area Nova Loja */}
                        {adminView === 'nova_loja' && isMatriz && (
                            <div className="max-w-3xl mx-auto space-y-6 pt-2 relative z-10">
                                <div className="bg-[#242326] rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl">
                                        <h4 className="text-white font-medium tracking-wide uppercase text-sm">Cadastrar Nova Unidade</h4>
                                    </div>
                                    <div className="p-5 space-y-5">
                                        <div>
                                            <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Nome da Loja / Franquia *</label>
                                            <input type="text" value={novaLojaForm.nome} onChange={(e) => setNovaLojaForm({...novaLojaForm, nome: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" placeholder="Ex: Dogs do Mirso - Centro" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Tempo Delivery Inicial</label>
                                                <input type="text" value={novaLojaForm.tempo_entrega} onChange={(e) => setNovaLojaForm({...novaLojaForm, tempo_entrega: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Raio Máximo Padrão (KM)</label>
                                                <input type="number" value={novaLojaForm.raio_entrega} onChange={(e) => setNovaLojaForm({...novaLojaForm, raio_entrega: Number(e.target.value)})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-4">
                                            <button onClick={cadastrarNovaLoja} className="px-6 py-3 bg-[#d79e51] hover:bg-[#e8b776] text-[#1a191c] rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center">
                                                <i className="fas fa-plus mr-2"></i> Cadastrar Loja
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Area Financeiro */}
                        {adminView === 'financeiro' && (
                            <div className="max-w-4xl mx-auto space-y-6 pt-2 relative z-10">
                                <div className="bg-[#242326] rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl">
                                        <h4 className="text-white font-medium tracking-wide uppercase text-sm">Registrar Movimentação</h4>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Loja *</label>
                                                <select value={financeiroForm.restaurante_id} onChange={(e) => setFinanceiroForm({...financeiroForm, restaurante_id: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm">
                                                    <option value="">Selecione...</option>
                                                    {lojas.filter(l => l.id === idAdminLogado).map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Tipo *</label>
                                                <select value={financeiroForm.tipo} onChange={(e) => setFinanceiroForm({...financeiroForm, tipo: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm">
                                                    <option value="entrada">Entrada (+)</option>
                                                    <option value="saida">Saída (-)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Valor (R$) *</label>
                                                <input type="number" step="0.01" value={financeiroForm.valor} onChange={(e) => setFinanceiroForm({...financeiroForm, valor: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" placeholder="0.00" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Descrição *</label>
                                                <input type="text" value={financeiroForm.descricao} onChange={(e) => setFinanceiroForm({...financeiroForm, descricao: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" placeholder="Ex: Conta de Luz, Venda Extra..." />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button onClick={registrarMovimentacao} className="px-6 py-2 bg-[#d79e51] hover:bg-[#e8b776] text-[#1a191c] rounded-xl font-bold shadow-md active:scale-95 transition-all">
                                                Registrar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-[#242326] rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl flex justify-between items-center">
                                        <h4 className="text-white font-medium tracking-wide uppercase text-sm">Receita por Produto (Pedidos Finalizados)</h4>
                                        <div className="text-sm font-bold text-[#d79e51]">
                                            Vendas: R$ {totalPedidosFinalizados.toFixed(2).replace('.', ',')}
                                        </div>
                                    </div>
                                    <div className="p-5 h-64 w-full flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
                                        {dadosGraficoPizza.length > 0 ? (
                                            <>
                                                <div className="relative w-40 h-40 flex-shrink-0">
                                                    <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                                                        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#363539" strokeWidth="6"></circle>
                                                        {(() => {
                                                            let dashOffset = 0;
                                                            return dadosGraficoPizza.map((entry, index) => {
                                                                const percent = totalPedidosFinalizados > 0 ? (entry.value / totalPedidosFinalizados) * 100 : 0;
                                                                const dashArray = `${percent} ${100 - percent}`;
                                                                const currentOffset = dashOffset;
                                                                dashOffset -= percent; 
                                                                return (
                                                                    <circle
                                                                        key={`circle-${index}`}
                                                                        cx="21"
                                                                        cy="21"
                                                                        r="15.91549430918954"
                                                                        fill="transparent"
                                                                        stroke={CORES_GRAFICO[index % CORES_GRAFICO.length]}
                                                                        strokeWidth="6"
                                                                        strokeDasharray={dashArray}
                                                                        strokeDashoffset={currentOffset}
                                                                        className="transition-all duration-1000 ease-out"
                                                                    ></circle>
                                                                );
                                                            });
                                                        })()}
                                                    </svg>
                                                </div>
                                                <div className="flex-1 w-full overflow-y-auto max-h-48 pr-2 custom-scrollbar">
                                                    {dadosGraficoPizza.map((entry, index) => (
                                                        <div key={`legend-${index}`} className="flex justify-between items-center text-xs mb-2">
                                                            <div className="flex items-center text-gray-300">
                                                                <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: CORES_GRAFICO[index % CORES_GRAFICO.length] }}></div>
                                                                <span className="truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
                                                            </div>
                                                            <span className="text-[#d79e51] font-medium ml-2 whitespace-nowrap">R$ {entry.value.toFixed(2).replace('.', ',')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full text-gray-500 text-sm">
                                                Nenhum pedido finalizado ainda.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-[#242326] rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl flex justify-between items-center">
                                        <h4 className="text-white font-medium tracking-wide uppercase text-sm">Histórico e Saldo</h4>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-300">
                                                Saldo Geral: <span className={saldoGeral >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>R$ {saldoGeral.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                            {(filtroDataInicio || filtroDataFim) && (
                                                <div className="text-[10px] text-gray-500 mt-1">
                                                    Período: {filtroDataInicio ? new Date(`${filtroDataInicio}T12:00:00`).toLocaleDateString('pt-BR') : 'início'}
                                                    {' até '}
                                                    {filtroDataFim ? new Date(`${filtroDataFim}T12:00:00`).toLocaleDateString('pt-BR') : 'hoje'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 border-b border-gray-800 bg-[#1a191c] flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 w-full">
                                            <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Filtrar por Loja</label>
                                            <select value={filtroLoja} onChange={(e) => setFiltroLoja(e.target.value)} className="w-full bg-[#242326] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-xs">
                                                <option value="">Todas as Lojas</option>
                                                {lojas.filter(l => l.id === idAdminLogado).map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-1 w-full">
                                            <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Data inicial</label>
                                            <input
                                                type="date"
                                                value={filtroDataInicio}
                                                max={filtroDataFim || undefined}
                                                onChange={(e) => setFiltroDataInicio(e.target.value)}
                                                className="w-full bg-[#242326] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-xs"
                                            />
                                        </div>
                                        <div className="flex-1 w-full">
                                            <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Data final</label>
                                            <input
                                                type="date"
                                                value={filtroDataFim}
                                                min={filtroDataInicio || undefined}
                                                onChange={(e) => setFiltroDataFim(e.target.value)}
                                                className="w-full bg-[#242326] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-xs"
                                            />
                                        </div>
                                        {(filtroDataInicio || filtroDataFim) && (
                                            <button
                                                type="button"
                                                onClick={limparPeriodoFinanceiro}
                                                className="w-full md:w-auto px-4 py-2 bg-transparent hover:bg-[#363539] text-gray-300 rounded-lg font-bold text-xs transition-all flex items-center justify-center border border-gray-700"
                                            >
                                                <i className="fas fa-times mr-2"></i> Limpar período
                                            </button>
                                        )}
                                        <button onClick={baixarRelatorio} className="w-full md:w-auto px-4 py-2 bg-[#363539] hover:bg-gray-700 text-white rounded-lg font-bold text-xs shadow-md transition-all flex items-center justify-center border border-gray-600">
                                            <i className="fas fa-download mr-2"></i> Baixar CSV
                                        </button>
                                    </div>
                                    <div className="p-0 overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#1a191c] text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-800">
                                                    <th className="px-4 py-3 font-bold">Data</th>
                                                    <th className="px-4 py-3 font-bold">Loja</th>
                                                    <th className="px-4 py-3 font-bold">Descrição</th>
                                                    <th className="px-4 py-3 font-bold text-right">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800 text-sm">
                                                {historicoFiltrado.map(item => (
                                                    <tr key={item.id} className="hover:bg-[#1f1e22] transition-colors">
                                                        <td className="px-4 py-3 text-gray-400 text-xs">{item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '--'}</td>
                                                        <td className="px-4 py-3 text-gray-400 text-xs">{item.loja}</td>
                                                        <td className="px-4 py-3 text-white text-xs">{item.descricao}</td>
                                                        <td className={`px-4 py-3 font-bold text-right text-xs ${item.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                                                            {item.tipo === 'entrada' ? '+' : '-'} R$ {item.valor.toFixed(2).replace('.', ',')}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {historicoFiltrado.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-6 text-center text-gray-500 text-sm">Nenhum histórico encontrado para os filtros.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Area de Promocoes */}
                        {adminView === 'promocoes' && (
                            <div className="max-w-3xl mx-auto space-y-6 pt-2 relative z-10">
                                <div className="bg-[#242326] rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl">
                                        <h4 className="text-white font-medium tracking-wide uppercase text-sm">Disparo de Promoção via N8N</h4>
                                    </div>
                                    <div className="p-5 space-y-5">
                                        <div>
                                            <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Webhook URL (N8N) *</label>
                                            <div className="flex gap-2">
                                                <input type="text" value={promoForm.webhookUrl} readOnly={!webhookEditavel || webhookLoading || webhookSalvando} onChange={(e) => setPromoForm({...promoForm, webhookUrl: e.target.value})} className={`w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm ${(!webhookEditavel || webhookLoading || webhookSalvando) ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder={webhookLoading ? "Carregando webhook da franquia..." : "https://seu-n8n.com/webhook/..."} />
                                                {webhookEditavel ? (
                                                    <button disabled={webhookLoading || webhookSalvando} onClick={salvarWebhookRestaurante} className="px-4 py-2 bg-[#d79e51] hover:bg-[#e8b776] disabled:opacity-50 disabled:cursor-not-allowed text-[#1a191c] rounded-lg font-bold text-xs shadow-md transition-all whitespace-nowrap">
                                                        {webhookSalvando ? <><i className="fas fa-spinner fa-spin mr-2"></i>Salvando</> : 'Confirmar'}
                                                    </button>
                                                ) : (
                                                    <button disabled={webhookLoading} onClick={() => { if(window.confirm("Deseja realmente editar a URL do Webhook desta franquia?")) setWebhookEditavel(true); }} className="px-4 py-2 bg-[#363539] hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-md transition-all whitespace-nowrap border border-gray-600">
                                                        Editar
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-2">A URL é salva de forma privada no Supabase e fica vinculada à franquia logada.</p>
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Título da Promoção *</label>
                                            <input type="text" value={promoForm.titulo} onChange={(e) => setPromoForm({...promoForm, titulo: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" placeholder="Ex: Sextou com Frete Grátis!" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Mensagem *</label>
                                            <textarea value={promoForm.mensagem} onChange={(e) => setPromoForm({...promoForm, mensagem: e.target.value})} rows="4" className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm" placeholder="Digite o texto que será enviado aos clientes..."></textarea>
                                        </div>
                                        <div className="flex justify-end pt-4 border-t border-gray-800">
                                            <button onClick={dispararPromocao} className="px-6 py-3 bg-[#d79e51] hover:bg-[#e8b776] text-[#1a191c] rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center">
                                                <i className="fas fa-paper-plane mr-2"></i> Enviar Promoção
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
                
                {modalRejeicao.aberto && (
                    <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
                        <div className="dogs-mobile-modal bg-[#242326] border border-red-900/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="p-5 border-b border-gray-800">
                                <h3 className="text-white font-black text-lg">Rejeitar pedido</h3>
                                <p className="text-gray-400 text-sm mt-1">Informe o motivo. O cliente verá essa mensagem.</p>
                            </div>
                            <div className="p-5">
                                <textarea value={modalRejeicao.motivo} onChange={(e) => setModalRejeicao({...modalRejeicao, motivo: e.target.value})} rows="4" className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-xl p-4 outline-none focus:border-red-500 resize-none" placeholder="Ex.: item indisponível, endereço fora da área..." />
                            </div>
                            <div className="p-4 border-t border-gray-800 flex gap-3">
                                <button onClick={() => setModalRejeicao({ aberto: false, pedidoId: null, motivo: '' })} className="flex-1 border border-gray-600 text-gray-300 rounded-xl py-3 font-bold">Cancelar</button>
                                <button onClick={confirmarRejeicaoPedido} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-bold">Confirmar rejeição</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Produto */}
                {modalProdutoAberto && (
                    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
                        <div className="dogs-mobile-modal bg-[#242326] border border-gray-700 rounded-xl w-full max-w-md flex flex-col max-h-[90vh] shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
                            <div className="p-4 md:p-5 border-b border-gray-800 flex justify-between items-center flex-shrink-0">
                                <h3 className="text-white text-lg font-bold">{produtoEditando?.id ? 'Editar Produto' : 'Novo Produto'}</h3>
                                <button onClick={() => setModalProdutoAberto(false)} className="text-gray-400 hover:text-[#d79e51] transition-colors"><i className="fas fa-times text-xl"></i></button>
                            </div>
                            <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Nome do Item *</label>
                                    <input type="text" value={produtoEditando?.nome || ''} onChange={(e) => setProdutoEditando({...produtoEditando, nome: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:border-[#d79e51] outline-none text-sm" />
                                </div>
                                <div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Preço original (R$) *</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={produtoEditando?.preco ?? ''}
                                                onChange={(e) => setProdutoEditando({...produtoEditando, preco: e.target.value === '' ? '' : Number(e.target.value)})}
                                                className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:border-[#d79e51] outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Desconto (%)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={produtoEditando?.desconto_percentual ?? 0}
                                                    onChange={(e) => {
                                                        const valor = e.target.value === '' ? 0 : Math.max(0, Math.min(100, Number(e.target.value)));
                                                        setProdutoEditando({...produtoEditando, desconto_percentual: valor});
                                                    }}
                                                    className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg pl-3 pr-9 py-2.5 focus:border-[#d79e51] outline-none text-sm"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {Number(produtoEditando?.preco || 0) > 0 && (
                                        <div className={`mt-3 rounded-xl border p-3 ${Number(produtoEditando?.desconto_percentual || 0) > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#1a191c] border-gray-800'}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <span className="block text-[9px] uppercase tracking-widest font-black text-gray-500">Preço para o cliente</span>
                                                    {Number(produtoEditando?.desconto_percentual || 0) > 0 && (
                                                        <span className="block text-[10px] text-gray-500 line-through mt-1">
                                                            R$ {Number(produtoEditando.preco || 0).toFixed(2).replace('.', ',')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    {Number(produtoEditando?.desconto_percentual || 0) > 0 && (
                                                        <span className="inline-block mb-1 bg-red-500/15 border border-red-500/40 text-red-400 text-[9px] font-black px-2 py-0.5 rounded-full">
                                                            -{formatarPercentualDesconto(produtoEditando)}%
                                                        </span>
                                                    )}
                                                    <p className="text-[#d79e51] font-black text-lg">
                                                        R$ {precoFinalProduto(produtoEditando).toFixed(2).replace('.', ',')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Categoria *</label>
                                    <select value={produtoEditando?.categoria_id || ''} onChange={(e) => setProdutoEditando({...produtoEditando, categoria_id: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:border-[#d79e51] outline-none text-sm">
                                        {categoriasAdmin.map(c => (
                                            <option key={c.id} value={c.id}>{c.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Descrição</label>
                                    <textarea value={produtoEditando?.descricao || ''} onChange={(e) => setProdutoEditando({...produtoEditando, descricao: e.target.value})} rows="2" className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:border-[#d79e51] outline-none text-sm"></textarea>
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
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pt-3 border-t border-gray-800">
                                    <label className="flex items-center space-x-2 cursor-pointer group">
                                        <input type="checkbox" checked={produtoEditando?.ativo ?? true} onChange={(e) => setProdutoEditando({...produtoEditando, ativo: e.target.checked})} className="sr-only peer" />
                                        <div className="w-9 h-5 rounded-full relative transition-colors duration-200" style={{ backgroundColor: (produtoEditando?.ativo ?? true) ? '#d79e51' : '#374151' }}>
                                             <div className="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-4 w-4 transition-transform duration-200" style={{ transform: (produtoEditando?.ativo ?? true) ? 'translateX(16px)' : 'translateX(0)' }}></div>
                                        </div>
                                        <span className="text-xs text-gray-300">Em Estoque</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer group">
                                        <input type="checkbox" checked={produtoEditando?.is_destaque ?? false} onChange={(e) => setProdutoEditando({...produtoEditando, is_destaque: e.target.checked})} className="sr-only peer" />
                                        <div className="w-9 h-5 rounded-full relative transition-colors duration-200" style={{ backgroundColor: (produtoEditando?.is_destaque ?? false) ? '#d79e51' : '#374151' }}>
                                             <div className="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-4 w-4 transition-transform duration-200" style={{ transform: (produtoEditando?.is_destaque ?? false) ? 'translateX(16px)' : 'translateX(0)' }}></div>
                                        </div>
                                        <span className="text-xs text-gray-300">Destaque</span>
                                    </label>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-800 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[#1f1e22] rounded-b-xl">
                                <div>
                                    {produtoEditando?.id && (
                                        <button onClick={() => { excluirProduto(produtoEditando.id); }} className="px-4 py-2 rounded-lg font-bold text-xs text-red-400 border border-red-900/50 hover:bg-red-900/20 transition-colors">Excluir</button>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    <button onClick={() => setModalProdutoAberto(false)} className="px-4 py-2 rounded-lg font-bold text-xs text-gray-400 border border-gray-600 hover:text-white transition-colors">Cancelar</button>
                                    <button onClick={handleSaveProduto} className="px-5 py-2 bg-[#d79e51] text-[#1a191c] rounded-lg font-bold text-xs shadow-md shadow-[#d79e51]/20 active:scale-95 transition-all">Salvar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Confirmacao */}
                {modalConfirmacaoAberto.aberto && (
                    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
                        <div className="dogs-mobile-modal bg-[#242326] border border-red-900/50 rounded-xl w-full max-w-sm flex flex-col shadow-[0_15px_40px_rgba(0,0,0,0.5)] transform animate-fade-in">
                            <div className="p-5 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                    <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                                </div>
                                <h3 className="text-white text-lg font-bold mb-2">Excluir Produto?</h3>
                                <p className="text-gray-400 text-sm">Tem certeza que deseja apagar este item permanentemente? Esta ação não pode ser desfeita.</p>
                            </div>
                            <div className="p-4 border-t border-gray-800 flex justify-end space-x-3 bg-[#1f1e22] rounded-b-xl">
                                <button onClick={cancelarExclusao} className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-gray-400 border border-gray-600 hover:text-white transition-colors">Cancelar</button>
                                <button onClick={confirmarExclusao} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-md active:scale-95 transition-all">Sim, Excluir</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="dogs-app-shell bg-[#1a191c] flex justify-center items-start text-white font-sans w-full min-w-0 relative overflow-x-hidden">
            
            {/* Textura de Fundo SVG Pattern Cliente */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] md:opacity-[0.08]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30,45 C30,35 40,35 40,45 L40,75 C40,85 30,85 30,75 Z M32,45 L38,45 L38,75 L32,75 Z M70,40 L90,40 L88,80 L72,80 Z M74,42 L86,42 L84,78 L76,78 Z' fill='%23d79e51' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

            {/* Container Principal Inteligente (Fino no celular, Expandido no Desktop) */}
            <div className="dogs-app-shell w-full min-w-0 max-w-md md:max-w-4xl lg:max-w-6xl xl:max-w-7xl bg-[#2b2a2d] relative flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-300 mx-auto z-10">
                
                {/* Header fixo da loja */}
                <div className="bg-[#1a191c] flex flex-col sm:flex-row justify-center sm:justify-between items-stretch sm:items-center gap-2 sm:gap-3 py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 border-b border-gray-800 text-[11px] sm:text-xs md:text-sm shadow-md z-20">
                    {lojas.length > 1 && (
                        <div ref={seletorLojaRef} className="relative w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setSeletorLojaAberto(prev => !prev)}
                                aria-expanded={seletorLojaAberto}
                                aria-haspopup="listbox"
                                className="w-full sm:w-auto text-white font-bold flex items-center justify-center sm:justify-start hover:text-[#d79e51] transition-colors text-sm md:text-base min-w-0 px-2 py-1.5 rounded-xl hover:bg-[#242326]"
                            >
                                <i className="fas fa-store mr-2 text-[#d79e51] flex-shrink-0"></i>
                                <span className="truncate">{restaurante.nome}</span>
                                <i className={`fas fa-chevron-down ml-2 text-[10px] md:text-xs transition-transform duration-200 flex-shrink-0 ${seletorLojaAberto ? 'rotate-180' : ''}`}></i>
                            </button>

                            {seletorLojaAberto && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-[calc(100vw-24px)] sm:w-80 max-w-[360px] bg-[#242326] border border-gray-700 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.55)] overflow-hidden z-[100]">
                                    <div className="px-4 py-3 border-b border-gray-800 bg-[#1f1e22]">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.18em]">Escolha a unidade</p>
                                    </div>

                                    <div className="max-h-72 overflow-y-auto dogs-touch-scroll" role="listbox" aria-label="Restaurantes disponíveis">
                                        {lojas.map(loja => {
                                            const selecionada = String(loja.id) === String(restaurante.id);

                                            return (
                                                <button
                                                    type="button"
                                                    key={loja.id}
                                                    role="option"
                                                    aria-selected={selecionada}
                                                    onClick={() => selecionarLojaPeloTopo(loja)}
                                                    className={`w-full flex items-center justify-between gap-4 text-left px-4 py-4 border-b border-gray-800 last:border-b-0 transition-colors ${selecionada ? 'bg-[#d79e51]/10' : 'hover:bg-[#363539]'}`}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className={`font-bold text-sm md:text-base truncate ${selecionada ? 'text-[#d79e51]' : 'text-white'}`}>
                                                            {loja.nome}
                                                        </div>
                                                        {loja.cep && (
                                                            <div className="text-gray-500 text-xs mt-1 truncate">
                                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                                CEP {loja.cep}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {selecionada ? (
                                                        <i className="fas fa-check-circle text-[#d79e51] flex-shrink-0"></i>
                                                    ) : (
                                                        <i className="fas fa-chevron-right text-gray-600 text-xs flex-shrink-0"></i>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="w-full sm:w-auto flex flex-wrap justify-center items-center bg-[#242326] px-3 sm:px-4 py-1.5 md:py-2 md:px-5 rounded-2xl sm:rounded-full border border-gray-800 shadow-inner">
                        <span className="text-gray-300 flex items-center font-medium">
                            <i className="fas fa-motorcycle text-[#d79e51] mr-2 text-sm"></i> Delivery: <span className="ml-1 text-white">{restaurante.tempo_entrega}</span>
                        </span>
                        <span className="mx-3 md:mx-4 text-gray-700">|</span>
                        <span className={`font-bold flex items-center tracking-wider ${restaurante.is_aberto ? 'text-[#d79e51]' : 'text-red-500'}`}>
                            <span className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full mr-2 ${restaurante.is_aberto ? 'bg-[#d79e51] animate-pulse' : 'bg-red-500'}`}></span>
                            {restaurante.is_aberto ? 'ABERTO' : 'FECHADO'}
                        </span>
                    </div>
                </div>

                {/* Área Rolável */}
                <div className="dogs-touch-scroll flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-28 sm:pb-32 md:pb-28 relative">
                    
                    {/* View Selecionar Loja */}
                    {view === 'selecionar_loja' && (
                        <div className="pt-10 sm:pt-12 md:pt-20 px-4 sm:px-6 flex flex-col items-center min-h-[60vh] max-w-4xl mx-auto">
                            <h2 className="font-black text-3xl md:text-4xl text-white uppercase tracking-widest text-center mb-2">Selecione a Loja</h2>
                            <p className="text-gray-400 text-base md:text-lg text-center mb-10 md:mb-14">Escolha de qual unidade você deseja pedir hoje.</p>
                            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {lojasLoading && lojas.length === 0 && (
                                    <>
                                        {[1, 2].map(i => (
                                            <div key={i} className="w-full bg-[#1f1e22] border-2 border-transparent p-6 md:p-8 rounded-2xl md:rounded-3xl animate-pulse">
                                                <div className="h-6 md:h-7 w-1/2 bg-gray-700 rounded mb-3"></div>
                                                <div className="h-4 w-1/3 bg-gray-800 rounded"></div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {!lojasLoading && lojas.length === 0 && (
                                    <div className="md:col-span-2 text-center text-gray-400 bg-[#1f1e22] border border-gray-800 rounded-2xl p-8">
                                        <i className="fas fa-store-slash text-3xl mb-3 text-gray-600"></i>
                                        <p>Nenhum restaurante disponível no momento.</p>
                                    </div>
                                )}

                                {lojas.map(loja => (
                                    <button key={loja.id} onClick={() => {
                                        setRestaurante(loja);
                                        localStorage.setItem('loja_selecionada', loja.id);
                                        setProdutos([]);
                                        setView('home');

                                        // O cliente entra na loja imediatamente.
                                        // O useEffect de produtos carrega somente esta unidade em segundo plano.
                                    }} className="w-full bg-[#1f1e22] border-2 border-transparent hover:border-[#d79e51] p-6 md:p-8 rounded-2xl md:rounded-3xl flex items-center justify-between transition-all duration-300 shadow-lg hover:shadow-[0_10px_30px_rgba(215,158,81,0.15)] group">
                                        <div className="flex flex-col text-left">
                                            <span className="text-white font-bold text-xl md:text-2xl group-hover:text-[#d79e51] transition-colors">{loja.nome}</span>
                                            {loja.cep && <span className="text-gray-400 text-xs md:text-sm mt-2 font-medium"><i className="fas fa-map-marker-alt mr-1"></i> CEP Ref: {loja.cep}</span>}
                                        </div>
                                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#2b2a2d] flex items-center justify-center group-hover:bg-[#d79e51] transition-all duration-300 group-hover:scale-110">
                                            <i className="fas fa-chevron-right text-gray-400 group-hover:text-[#1a191c] text-lg md:text-xl"></i>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View Home */}
                    {view === 'home' && (
                        <div>
                            <div className="relative flex flex-col items-center mb-8 md:mb-16">
                                <div className="w-full h-56 md:h-[400px] lg:h-[450px] relative bg-gray-900 overflow-hidden">
                                    <img src={restaurante.foto_capa_url} alt="Capa" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-[#2b2a2d]"></div>
                                </div>
                                <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-56 md:h-56 rounded-full border-4 md:border-8 border-[#d79e51] flex flex-col items-center justify-center -mt-[64px] sm:-mt-[72px] md:-mt-28 z-10 bg-[#1f1e22] shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden relative">
                                    {restaurante.logo_url ? (
                                        <img src={restaurante.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <h1 className="font-bold text-2xl md:text-4xl tracking-wider text-white text-center leading-none z-10 px-2">{restaurante.nome}</h1>
                                    )}
                                </div>
                                <div className="text-center mt-5 md:mt-8 w-full px-4">
                                    <h2 className="font-black text-white text-3xl md:text-5xl tracking-wider">{restaurante.nome}</h2>
                                    <p className="text-[#d79e51] text-xs md:text-base tracking-[0.4em] mt-2 md:mt-4 uppercase font-bold">Cardápio Digital</p>
                                </div>
                                <div className="w-full px-6 mt-8 md:mt-10 max-w-sm md:max-w-lg mx-auto">
                                    <button onClick={fazerPedidoAgora} className="w-full font-black text-xl md:text-2xl py-4 md:py-6 rounded-2xl md:rounded-3xl active:scale-95 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center" style={{ backgroundColor: '#d79e51', backgroundImage: 'linear-gradient(135deg, #d79e51, #e8b776)', color: '#1a191c', boxShadow: '0 10px 30px rgba(215,158,81,0.3)' }}>
                                        <i className="fas fa-shopping-bag mr-3"></i> FAZER PEDIDO
                                    </button>
                                </div>
                            </div>
                            
                            <div className="px-6 md:px-10 mt-10 md:mt-16 max-w-[1400px] mx-auto">
                                <div className="flex items-center justify-between mb-6 md:mb-10">
                                    <h3 className="font-black text-xl md:text-3xl text-white uppercase tracking-widest">Destaques</h3>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-[#d79e51]/50 to-transparent ml-4 md:ml-8"></div>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-6 md:pb-8 snap-x md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible md:snap-none hide-scrollbar">
                                    {dbLoading && produtos.length === 0 && [1, 2, 3].map(i => (
                                        <div key={`loading-destaque-${i}`} className="w-[85vw] max-w-[300px] md:w-full md:max-w-none bg-[#363539] rounded-3xl overflow-hidden flex-none md:flex-auto border border-gray-700/50 snap-center animate-pulse">
                                            <div className="h-48 md:h-64 bg-gray-700"></div>
                                            <div className="p-5 md:p-7">
                                                <div className="h-5 bg-gray-700 rounded w-2/3 mb-4"></div>
                                                <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                                                <div className="h-4 bg-gray-800 rounded w-4/5"></div>
                                            </div>
                                        </div>
                                    ))}
                                    {produtos.filter(p => p.is_destaque && p.restaurante_id === restaurante.id && !produtoEhAdicional(p)).map(p => (
                                        <div key={p.id} className="w-[85vw] max-w-[300px] md:w-full md:max-w-none bg-[#363539] rounded-3xl overflow-hidden shadow-lg flex-none md:flex-auto border border-gray-700/50 snap-center hover:border-[#d79e51]/50 hover:shadow-[0_15px_35px_rgba(215,158,81,0.15)] hover:-translate-y-2 transition-all duration-300 group cursor-pointer" onClick={() => abrirDetalheItem(p)}>
                                            <div className="h-48 md:h-64 relative overflow-hidden">
                                                <img src={p.imagem_url || 'https://placehold.co/400x300/2b2a2d/8e8e8e?text=Foto'} alt={p.nome} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#2c2b2e] via-[#2c2b2e]/20 to-transparent opacity-90"></div>
                                                <div className="absolute top-4 left-4 bg-[#d79e51] text-[#1a191c] text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                                    Mais Vendido
                                                </div>
                                                {produtoTemDesconto(p) && (
                                                    <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                                        -{formatarPercentualDesconto(p)}% OFF
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-5 md:p-7 relative bg-[#2c2b2e]">
                                                <h4 className="font-bold text-lg md:text-2xl text-white uppercase truncate pr-14">{p.nome}</h4>
                                                <p className="text-gray-400 text-xs md:text-base mt-2 line-clamp-2 md:line-clamp-3 h-10 md:h-14">{p.descricao}</p>
                                                <div className="mt-4 md:mt-6 flex items-end justify-between">
                                                    <div>
                                                        {produtoTemDesconto(p) && (
                                                            <p className="text-gray-500 text-xs md:text-sm line-through mb-0.5">
                                                                R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                                                            </p>
                                                        )}
                                                        <p className="text-[#d79e51] font-black text-2xl md:text-3xl">
                                                            R$ {precoFinalProduto(p).toFixed(2).replace('.', ',')}
                                                        </p>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); abrirDetalheItem(p); }} className="absolute -top-7 right-6 w-14 h-14 bg-[#d79e51] rounded-full flex items-center justify-center text-[#1a191c] text-2xl shadow-[0_8px_20px_rgba(215,158,81,0.5)] group-hover:scale-110 active:scale-95 transition-all duration-300"><i className="fas fa-plus"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {produtos.filter(p => p.is_destaque && p.restaurante_id === restaurante.id && !produtoEhAdicional(p)).length === 0 && !dbLoading && (
                                        <p className="text-gray-500 text-sm md:text-base italic">Nenhum destaque no momento.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Cardapio */}
                    {view === 'cardapio' && (
                        <div className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-8 lg:px-10 max-w-[1400px] mx-auto min-w-0">
                            <div className="sticky top-0 bg-[#2b2a2d]/95 backdrop-blur-xl z-20 pb-4 pt-4 md:pt-6 mb-6 md:mb-10 border-b border-gray-800">
                                <h2 className="font-black text-2xl md:text-4xl text-white uppercase tracking-widest text-center">Nosso Cardápio</h2>
                            </div>
                            
                            <div className="flex overflow-x-auto md:flex-wrap md:justify-center gap-3 md:gap-4 pb-4 mb-8 md:mb-12 hide-scrollbar snap-x">
                                {categorias
                                    .filter(c =>
                                        chaveCategoria(normalizarNomeCategoria(c.nome)) !== 'adicionais' &&
                                        produtos.some(p =>
                                            String(p.categoria_id) === String(c.id) &&
                                            p.ativo &&
                                            String(p.restaurante_id) === String(restaurante.id)
                                        )
                                    )
                                    .map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => rolarParaCategoria(c.id)}
                                            className="flex-none snap-start bg-[#1f1e22] border border-gray-700 px-5 md:px-8 py-2.5 md:py-3.5 rounded-full whitespace-nowrap text-sm md:text-base font-bold text-gray-300 hover:text-[#1a191c] hover:bg-[#d79e51] hover:border-[#d79e51] active:scale-95 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer"
                                            aria-label={`Ir para a categoria ${c.nome}`}
                                        >
                                            {c.nome}
                                        </button>
                                    ))}
                            </div>

                            <div className="space-y-10 md:space-y-16">
                                {dbLoading && <p className="text-center text-gray-500 py-10 text-lg md:text-xl"><i className="fas fa-spinner fa-spin mr-3"></i>Carregando delícias...</p>}
                                {!dbLoading && categorias
                                    .filter(cat => chaveCategoria(normalizarNomeCategoria(cat.nome)) !== 'adicionais')
                                    .map(cat => {
                                    const prods = produtos.filter(p => p.categoria_id === cat.id && p.ativo && p.restaurante_id === restaurante.id);
                                    if(prods.length === 0) return null;
                                    return (
                                        <div
                                            key={cat.id}
                                            id={`categoria-${cat.id}`}
                                            className="animate-fade-in scroll-mt-28 md:scroll-mt-36"
                                        >
                                            <div className="flex items-center mb-6 md:mb-8">
                                                <h3 className="text-xl md:text-3xl font-black text-[#d79e51] uppercase tracking-widest">{cat.nome}</h3>
                                                <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-700 to-transparent ml-4 md:ml-6"></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                                {prods.map(p => (
                                                    <div key={p.id} className="bg-[#363539] rounded-2xl sm:rounded-3xl p-3 md:p-5 flex flex-col sm:flex-row shadow-md border border-gray-700/50 h-full hover:border-[#d79e51]/50 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer" onClick={() => abrirDetalheItem(p)}>
                                                        <div className="overflow-hidden rounded-2xl w-full h-40 sm:w-28 sm:h-28 md:w-40 md:h-40 flex-shrink-0 relative">
                                                            <img src={obterImagemProduto(p)} alt={p.nome} onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x600/2b2a2d/8e8e8e?text=Sem+foto'; }} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                                            {produtoTemDesconto(p) && (
                                                                <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] md:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                                                    -{formatarPercentualDesconto(p)}% OFF
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-3 sm:mt-0 sm:ml-4 md:ml-6 flex flex-col justify-between flex-grow min-w-0 py-1 md:py-2">
                                                            <div>
                                                                <h4 className="text-white text-lg md:text-2xl font-bold leading-tight truncate group-hover:text-[#d79e51] transition-colors">{p.nome}</h4>
                                                                <p className="text-gray-400 text-xs md:text-sm mt-1.5 md:mt-2.5 line-clamp-2 md:line-clamp-3 leading-relaxed">{p.descricao}</p>
                                                            </div>
                                                            <div className="flex justify-between items-end mt-3 md:mt-4 gap-3">
                                                                <div>
                                                                    {produtoTemDesconto(p) && (
                                                                        <span className="block text-gray-500 text-[10px] md:text-xs line-through">
                                                                            R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[#d79e51] font-black text-lg md:text-2xl">
                                                                        R$ {precoFinalProduto(p).toFixed(2).replace('.', ',')}
                                                                    </span>
                                                                </div>
                                                                <button onClick={(e) => { e.stopPropagation(); abrirDetalheItem(p); }} className="w-9 h-9 md:w-12 md:h-12 border-2 border-[#d79e51]/50 rounded-full text-[#d79e51] flex items-center justify-center hover:bg-[#d79e51] hover:text-[#1a191c] transition-all duration-300 active:scale-90 group-hover:shadow-[0_5px_15px_rgba(215,158,81,0.3)]"><i className="fas fa-plus md:text-lg"></i></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* View Carrinho */}
                    {view === 'carrinho' && (
                        <div className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-8 lg:px-10 max-w-[1400px] mx-auto min-w-0">
                            <div className="sticky top-0 bg-[#2b2a2d]/95 backdrop-blur-xl z-20 pb-4 pt-4 md:pt-6 mb-6 md:mb-10 border-b border-gray-800">
                                <h2 className="font-black text-2xl md:text-4xl text-white uppercase tracking-widest text-center">Seu Pedido</h2>
                            </div>

                            {carrinho.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center mt-16 md:mt-32 max-w-lg mx-auto">
                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-[#1f1e22] rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-inner border border-gray-800">
                                        <i className="fas fa-shopping-basket text-4xl md:text-6xl text-gray-600"></i>
                                    </div>
                                    <h3 className="font-bold text-xl md:text-3xl text-gray-300 mb-3">Seu carrinho está vazio</h3>
                                    <p className="text-gray-500 text-sm md:text-lg mb-8 md:mb-10">Bateu aquela fome? Adicione itens incríveis ao seu pedido e receba no conforto de casa!</p>
                                    <button onClick={() => setView('cardapio')} className="px-8 md:px-12 py-3.5 md:py-5 border-2 border-[#d79e51] text-[#d79e51] rounded-2xl md:rounded-3xl font-black text-base md:text-lg uppercase tracking-wider hover:bg-[#d79e51] hover:text-[#1a191c] transition-all duration-300 shadow-[0_5px_15px_rgba(215,158,81,0.1)] hover:shadow-[0_10px_30px_rgba(215,158,81,0.3)]">Explorar Cardápio</button>
                                </div>
                            ) : (
                                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full items-start">
                                    <div className="w-full lg:w-3/5 space-y-4 md:space-y-6">
                                        <h3 className="text-white font-black uppercase tracking-wider text-lg md:text-2xl border-b border-gray-800 pb-3 md:pb-4 mb-4 md:mb-6 flex items-center"><i className="fas fa-list-ul text-[#d79e51] mr-3"></i> Itens do Pedido</h3>
                                        {carrinho.map((item, index) => (
                                            <div key={item.cartKey || `${item.id}-${index}`} className="bg-[#363539] rounded-2xl md:rounded-3xl p-4 md:p-6 border border-gray-700/50 shadow-md hover:border-gray-500 transition-colors">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-3 mb-3 md:mb-4">
                                                    <div className="pr-4">
                                                        <h4 className="font-bold text-white text-base md:text-xl">{item.nome}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            {item.tipo_item === 'adicional' && (
                                                                <span className="inline-block text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#d79e51] border border-[#d79e51]/40 bg-[#d79e51]/10 px-2 py-1 rounded-full">
                                                                    Adicional
                                                                </span>
                                                            )}
                                                            {Number(item.desconto_percentual || 0) > 0 && (
                                                                <span className="inline-block text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-400 border border-red-500/40 bg-red-500/10 px-2 py-1 rounded-full">
                                                                    -{Number(item.desconto_percentual).toString().replace('.', ',')}% OFF
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-[#d79e51] font-black text-lg md:text-2xl whitespace-nowrap">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <input type="text" placeholder="Alguma observação? (Ex: sem cebola)" value={item.observacao} onChange={(e) => atualizarObs(item.cartKey, e.target.value)} className="w-full bg-[#1a191c] text-sm md:text-base text-gray-300 border border-gray-700/80 rounded-xl mb-4 md:mb-5 px-4 md:px-5 py-2.5 md:py-3.5 outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all" />
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        {Number(item.desconto_percentual || 0) > 0 && Number(item.preco_original || 0) > 0 && (
                                                            <span className="block text-[10px] md:text-xs text-gray-500 line-through">
                                                                R$ {Number(item.preco_original).toFixed(2).replace('.', ',')}
                                                            </span>
                                                        )}
                                                        <span className="text-sm md:text-base text-gray-400 font-medium">
                                                            R$ {Number(item.preco).toFixed(2).replace('.', ',')} / un
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 md:space-x-2 bg-[#1a191c] rounded-xl p-1 border border-gray-800 shadow-inner">
                                                        <button onClick={() => alterarQuantidade(item.cartKey, -1)} className="text-[#d79e51] hover:bg-[#363539] rounded-lg w-8 h-8 md:w-10 md:h-10 flex justify-center items-center font-bold text-xl md:text-2xl transition-colors">-</button>
                                                        <span className="text-white font-black w-8 md:w-10 text-center md:text-lg">{item.quantidade}</span>
                                                        <button onClick={() => alterarQuantidade(item.cartKey, 1)} className="text-[#d79e51] hover:bg-[#363539] rounded-lg w-8 h-8 md:w-10 md:h-10 flex justify-center items-center font-bold text-xl md:text-2xl transition-colors">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="w-full lg:w-2/5 bg-[#1f1e22] p-6 md:p-8 rounded-3xl border border-gray-700/50 shadow-[0_15px_50px_rgba(0,0,0,0.5)] lg:sticky lg:top-32">
                                        <div className="space-y-8 md:space-y-10">
                                            <div>
                                                <h4 className="text-white font-black uppercase tracking-wider mb-4 md:mb-5 text-base md:text-xl border-b border-gray-800 pb-3 flex items-center"><i className="fas fa-motorcycle text-[#d79e51] mr-3"></i> 1. Recebimento</h4>
                                                <select value={checkoutForm.tipo} onChange={e => setCheckoutForm({...checkoutForm, tipo: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-xl px-4 md:px-5 py-3.5 md:py-4 mb-4 md:mb-5 outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] text-base md:text-lg font-medium transition-all shadow-sm cursor-pointer">
                                                    <option value="entrega">Entregar no meu endereço</option>
                                                    <option value="retirada">Retirar no estabelecimento</option>
                                                </select>
                                                
                                                {checkoutForm.tipo === 'entrega' && (
                                                    <div className="space-y-4 animate-fade-in bg-[#2b2a2d] p-5 md:p-6 rounded-2xl border border-gray-700/50 shadow-inner">
                                                        <div className="text-sm md:text-base">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <p className="text-gray-400 text-xs md:text-sm font-bold uppercase tracking-widest">Entregar em:</p>
                                                                <button onClick={() => setView('perfil')} className="text-[#d79e51] hover:text-white text-xs md:text-sm font-bold transition-colors flex items-center bg-[#1a191c] px-3 py-1.5 rounded-lg border border-gray-800"><i className="fas fa-edit mr-2"></i> Alterar</button>
                                                            </div>
                                                            {clienteDados.endereco ? (
                                                                <>
                                                                    <p className="text-white font-medium leading-relaxed">{clienteDados.endereco}</p>
                                                                    {clienteDados.referencia && <p className="text-gray-400 text-xs md:text-sm mt-2 border-t border-gray-700/50 pt-2"><i className="fas fa-info-circle mr-1"></i> Ref: {clienteDados.referencia}</p>}
                                                                </>
                                                            ) : (
                                                                <p className="text-red-400 font-medium py-3"><i className="fas fa-exclamation-triangle mr-2"></i>Nenhum endereço cadastrado no perfil.</p>
                                                            )}
                                                        </div>
                                                        {erroCep && erroCep.includes('Não fazemos entrega') && (
                                                            <div className="bg-red-500/10 p-3 md:p-4 rounded-xl border border-red-500/30 text-red-400 text-xs md:text-sm text-center font-bold">
                                                                <i className="fas fa-times-circle mr-2"></i> {erroCep}
                                                            </div>
                                                        )}
                                                        
                                                        <div className="relative w-full h-48 md:h-64 bg-[#1a191c] rounded-xl border border-gray-700 overflow-hidden shadow-inner mt-5">
                                                            <div id="mapa-raio-container" className="absolute inset-0 w-full h-full z-0"></div>
                                                            {!mapaAberto && <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm md:text-base font-medium z-10"><i className="fas fa-spinner fa-spin mr-3"></i> Carregando mapa de entrega...</div>}
                                                        </div>
                                                        <p className="text-xs md:text-sm text-gray-400 text-center mt-3"><i className="fas fa-shield-alt mr-1.5"></i> Área de cobertura: Raio de {restaurante.raio_entrega}km.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="text-white font-black uppercase tracking-wider mb-4 md:mb-5 text-base md:text-xl border-b border-gray-800 pb-3 flex items-center"><i className="fas fa-wallet text-[#d79e51] mr-3"></i> 2. Pagamento</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
                                                    <button onClick={() => setCheckoutForm({...checkoutForm, pagamento: 'Cartão'})} className={`py-3.5 md:py-4 rounded-xl text-sm md:text-lg font-bold transition-all border-2 ${checkoutForm.pagamento === 'Cartão' ? 'border-[#d79e51] bg-[#d79e51]/10 text-[#d79e51] shadow-inner' : 'border-gray-700 bg-[#1a191c] text-gray-400 hover:border-gray-500 hover:bg-[#242326]'}`}><i className="fas fa-credit-card mr-2"></i> Cartão</button>
                                                    <button onClick={() => setCheckoutForm({...checkoutForm, pagamento: 'Dinheiro'})} className={`py-3.5 md:py-4 rounded-xl text-sm md:text-lg font-bold transition-all border-2 ${checkoutForm.pagamento === 'Dinheiro' ? 'border-[#d79e51] bg-[#d79e51]/10 text-[#d79e51] shadow-inner' : 'border-gray-700 bg-[#1a191c] text-gray-400 hover:border-gray-500 hover:bg-[#242326]'}`}><i className="fas fa-money-bill-wave mr-2"></i> Dinheiro</button>
                                                </div>
                                                {checkoutForm.pagamento === 'Dinheiro' && (
                                                    <div className="animate-fade-in mt-4 md:mt-5">
                                                        <label className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Precisa de troco?</label>
                                                        <input type="text" placeholder="Ex: Troco para R$ 100" value={checkoutForm.troco} onChange={e => setCheckoutForm({...checkoutForm, troco: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-xl px-4 md:px-5 py-3.5 md:py-4 outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] text-base md:text-lg transition-all shadow-inner" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-[#1a191c] rounded-2xl md:rounded-3xl p-5 md:p-7 mt-8 md:mt-10 border border-gray-800 shadow-inner">
                                            <div className="flex justify-between items-center mb-3 text-gray-400 text-sm md:text-base font-medium">
                                                <span>Subtotal</span>
                                                <span>R$ {subtotalCarrinho.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                            {checkoutForm.tipo === 'entrega' && (
                                                <div className="flex justify-between items-center mb-5 text-gray-400 text-sm md:text-base font-medium">
                                                    <span>
                                                        Taxa de Entrega
                                                        {clienteDados.bairro && (
                                                            <span className="block text-[10px] md:text-xs text-gray-500 font-normal mt-0.5">
                                                                {bairrosIguais(bairroLoja, clienteDados.bairro)
                                                                    ? 'Mesmo bairro da loja'
                                                                    : distanciaEntrega !== null
                                                                        ? `Distância aprox. ${distanciaEntrega.toFixed(1)} km`
                                                                        : 'Outro bairro'}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-[#d79e51] font-bold">R$ {taxaEntregaCarrinho.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            )}
                                            <div className="border-t border-gray-800 pt-4 mt-2 flex justify-between items-center">
                                                <span className="text-white font-black text-lg md:text-2xl uppercase tracking-wider">Total</span>
                                                <span className="text-[#d79e51] font-black text-2xl md:text-4xl">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={finalizarPedido}
                                            disabled={enviandoPedido}
                                            style={{
                                                background: enviandoPedido
                                                    ? '#15803d'
                                                    : 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                                                color: '#ffffff',
                                                boxShadow: enviandoPedido
                                                    ? '0 8px 22px rgba(34,197,94,0.18)'
                                                    : '0 10px 30px rgba(34,197,94,0.38)'
                                            }}
                                            className={`w-full mt-8 font-black tracking-widest text-lg md:text-xl py-4 md:py-6 rounded-2xl md:rounded-3xl active:scale-95 transition-all duration-300 flex justify-center items-center border border-green-400/30 ${enviandoPedido ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 hover:-translate-y-0.5'}`}
                                        >
                                            <i className={`fas ${enviandoPedido ? 'fa-spinner fa-spin' : 'fa-check-circle'} mr-3 text-2xl`}></i>
                                            {enviandoPedido ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Pedidos */}
                    {view === 'pedidos' && (
                        <div className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-8 lg:px-10 max-w-[1400px] mx-auto min-w-0">
                            <div className="sticky top-0 bg-[#2b2a2d]/95 backdrop-blur-xl z-20 pb-4 pt-4 md:pt-6 mb-6 md:mb-10 border-b border-gray-800">
                                <h2 className="font-black text-2xl md:text-4xl text-white uppercase tracking-widest text-center">Meus Pedidos</h2>
                            </div>
                            
                            {!clienteAuth ? (
                                <div className="flex flex-col items-center justify-center text-center mt-16 md:mt-32 max-w-lg mx-auto">
                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-[#1f1e22] rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-inner border border-gray-800">
                                        <i className="fas fa-user-lock text-4xl md:text-6xl text-gray-500"></i>
                                    </div>
                                    <h3 className="font-bold text-xl md:text-3xl text-white mb-3">Faça login para ver o histórico</h3>
                                    <p className="text-gray-400 mb-8 md:mb-10 text-sm md:text-lg">Identifique-se com o seu celular para acessar todos os pedidos realizados e acompanhar os status.</p>
                                    <button onClick={() => setView('perfil')} className="w-full px-8 py-4 md:py-5 bg-[#363539] hover:bg-[#d79e51] hover:text-[#1a191c] text-white rounded-2xl md:rounded-3xl font-black text-base md:text-lg uppercase tracking-wider transition-all duration-300 border border-gray-700 hover:border-[#d79e51] shadow-lg">Identificar-me Agora</button>
                                </div>
                            ) : meusPedidos.length === 0 ? (
                                <div className="text-center text-gray-500 mt-20 md:mt-32 text-lg md:text-2xl flex flex-col items-center font-medium">
                                    <i className="fas fa-receipt text-6xl md:text-8xl mb-6 opacity-30"></i>
                                    Você ainda não tem pedidos no histórico.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-8">
                                    {meusPedidos.map(p => {
                                        let info = {};
                                        if (typeof p.itens === 'string') {
                                            try { info = JSON.parse(p.itens); } catch(e) {}
                                        } else {
                                            info = p.itens || {};
                                        }
                                        return (
                                            <div key={p.id} className="bg-[#363539] rounded-3xl p-5 md:p-7 border border-gray-700/50 shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-gray-500 transition-all duration-300 flex flex-col">
                                                <div className="flex justify-between items-start mb-4 md:mb-5 border-b border-gray-700/50 pb-4">
                                                    <div>
                                                        <h4 className="font-black text-white text-lg md:text-xl">Pedido #{numeroPedidoVisivel(p)}</h4>
                                                        <span className="text-xs md:text-sm text-gray-400 font-medium flex items-center mt-1.5"><i className="far fa-clock mr-2 text-[#d79e51]"></i> {new Date(p.created_at).toLocaleString('pt-BR')}</span>
                                                    </div>
                                                    <span className="text-[#d79e51] font-black text-xl md:text-2xl">R$ {Number(p.total).toFixed(2).replace('.',',')}</span>
                                                </div>
                                                <div className="bg-[#242326] rounded-2xl p-4 mb-5 flex-1 border border-gray-800 shadow-inner">
                                                    <p className="text-sm md:text-base text-gray-300 leading-relaxed line-clamp-4 font-medium">
                                                        {info.lanches?.map(l => `${l.quantidade}x ${l.nome}`).join(', ')}
                                                    </p>
                                                </div>
                                                {p.status === 'rejeitado' ? (
                                                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                                                        <div className="flex items-center text-red-400 font-black uppercase tracking-wider text-sm"><i className="fas fa-times-circle mr-2"></i>Pedido Rejeitado</div>
                                                        {p.motivo_rejeicao && <p className="text-red-200/80 text-xs md:text-sm mt-2">Motivo: {p.motivo_rejeicao}</p>}
                                                    </div>
                                                ) : (
                                                    <div className="bg-[#1a191c] px-4 md:px-5 py-4 rounded-2xl border border-gray-800">
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Acompanhe seu pedido</p>
                                                        {(() => {
                                                            const entrega = info.endereco && info.endereco !== 'Retirada';
                                                            const etapas = entrega
                                                                ? [
                                                                    ['novo', 'Recebido'],
                                                                    ['preparo', 'Em preparo'],
                                                                    ['pronto', 'Pronto'],
                                                                    ['saiu_entrega', 'Saiu para entrega'],
                                                                    ['finalizado', 'Finalizado']
                                                                ]
                                                                : [
                                                                    ['novo', 'Recebido'],
                                                                    ['preparo', 'Em preparo'],
                                                                    ['pronto', 'Pronto para retirada'],
                                                                    ['finalizado', 'Finalizado']
                                                                ];
                                                            const indiceAtual = etapas.findIndex(([status]) => status === p.status);
                                                            return (
                                                                <div className="space-y-2">
                                                                    {etapas.map(([status, label], idx) => {
                                                                        const ativo = idx <= indiceAtual;
                                                                        return <div key={status} className={`flex items-center text-xs md:text-sm ${ativo ? 'text-emerald-400' : 'text-gray-600'}`}><i className={`fas ${ativo ? 'fa-check-circle' : 'fa-circle'} mr-2`}></i><span className={idx === indiceAtual ? 'font-black' : 'font-medium'}>{label}</span></div>;
                                                                    })}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                                {(info.whatsapp_loja || restaurante.whatsapp) && (
                                                    <button onClick={() => abrirWhatsAppLoja(info.whatsapp_loja || restaurante.whatsapp, p)} className="mt-3 w-full bg-emerald-600/15 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600 hover:text-white py-3 rounded-xl font-bold text-sm transition-colors"><i className="fab fa-whatsapp mr-2"></i>Falar com a loja</button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Perfil e Admin Login */}
                    {view === 'perfil' && (
                        <div className="pt-8 md:pt-14 flex flex-col items-center min-h-[60vh] px-4 max-w-4xl mx-auto">
                            <h2 className="font-black text-3xl md:text-5xl text-white uppercase tracking-widest text-center mb-3">Seu Perfil</h2>
                            <p className="text-gray-400 text-sm md:text-lg text-center mb-8 md:mb-12">
                                Entre na sua conta para manter endereço, dados e pedidos salvos em qualquer aparelho.
                            </p>

                            {!clienteAuth ? (
                                <div className="w-full max-w-md md:max-w-xl">
                                    <div className="grid grid-cols-2 gap-2 bg-[#1a191c] border border-gray-800 p-1.5 rounded-2xl mb-5">
                                        <button
                                            type="button"
                                            onClick={() => { setClienteModoAcesso('login'); setClienteSenha(''); }}
                                            className={`py-3 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all ${clienteModoAcesso === 'login' ? 'bg-[#d79e51] text-[#1a191c]' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Já tenho conta
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setClienteModoAcesso('cadastro'); setClienteSenha(''); }}
                                            className={`py-3 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all ${clienteModoAcesso === 'cadastro' ? 'bg-[#d79e51] text-[#1a191c]' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Criar conta
                                        </button>
                                    </div>

                                    {clienteModoAcesso === 'login' ? (
                                        <form onSubmit={loginCliente} className="space-y-5 md:space-y-6 bg-[#1f1e22] p-6 md:p-10 rounded-3xl border border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                            <div className="text-center mb-2">
                                                <div className="w-16 h-16 bg-[#363539] rounded-full mx-auto flex items-center justify-center mb-4 border border-gray-700">
                                                    <i className="fas fa-user text-2xl text-[#d79e51]"></i>
                                                </div>
                                                <h3 className="text-white text-xl md:text-2xl font-black">Bem-vindo de volta</h3>
                                                <p className="text-gray-500 text-xs md:text-sm mt-2">Seus dados e endereço serão carregados automaticamente.</p>
                                            </div>

                                            <div>
                                                <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-widest">E-mail</label>
                                                <input
                                                    type="email"
                                                    value={clienteEmail}
                                                    onChange={e => setClienteEmail(e.target.value)}
                                                    className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all text-base md:text-lg"
                                                    required
                                                    placeholder="seu@email.com"
                                                    autoComplete="email"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-widest">Senha</label>
                                                <input
                                                    type="password"
                                                    value={clienteSenha}
                                                    onChange={e => setClienteSenha(e.target.value)}
                                                    className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all text-base md:text-lg"
                                                    required
                                                    placeholder="••••••••"
                                                    autoComplete="current-password"
                                                />
                                            </div>

                                            <button type="submit" disabled={clienteAuthLoading} className={`w-full bg-[#d79e51] text-[#1a191c] font-black text-lg md:text-xl py-4 md:py-5 rounded-xl md:rounded-2xl shadow-[0_10px_30px_rgba(215,158,81,0.3)] transition-all mt-6 tracking-wider ${clienteAuthLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#e8b776] active:scale-95'}`}>
                                                {clienteAuthLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>ENTRANDO...</> : 'ENTRAR'}
                                            </button>

                                            <p className="text-center text-gray-500 text-xs md:text-sm">
                                                Ainda não tem conta?{' '}
                                                <button type="button" onClick={() => setClienteModoAcesso('cadastro')} className="text-[#d79e51] font-bold hover:text-white">
                                                    Criar minha conta
                                                </button>
                                            </p>
                                        </form>
                                    ) : (
                                        <form onSubmit={cadastrarCliente} className="space-y-5 md:space-y-6 bg-[#1f1e22] p-6 md:p-10 rounded-3xl border border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                            <div className="mb-2">
                                                <h3 className="text-white text-xl md:text-2xl font-black">Criar sua conta</h3>
                                                <p className="text-gray-500 text-xs md:text-sm mt-2">Cadastre uma vez e seus dados ficam disponíveis nos próximos pedidos.</p>
                                            </div>

                                            <div>
                                                <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-widest">E-mail *</label>
                                                <input type="email" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all text-base md:text-lg" required placeholder="seu@email.com" autoComplete="email" />
                                            </div>

                                            <div>
                                                <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-widest">Crie uma senha *</label>
                                                <input type="password" value={clienteSenha} onChange={e => setClienteSenha(e.target.value)} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all text-base md:text-lg" required minLength="6" placeholder="Mínimo de 6 caracteres" autoComplete="new-password" />
                                            </div>

                                            <div className="border-t border-gray-800 pt-6">
                                                <div className="grid grid-cols-1 gap-5">
                                                    <div>
                                                        <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-widest">Nome Completo *</label>
                                                        <input type="text" value={clienteDados.nome} onChange={e => setClienteDados({...clienteDados, nome: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-[#d79e51] text-base md:text-lg" required placeholder="Como gosta de ser chamado?" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-widest">Celular (WhatsApp) *</label>
                                                        <input type="tel" value={clienteDados.celular} onChange={e => setClienteDados({...clienteDados, celular: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-[#d79e51] text-base md:text-lg" required placeholder="(00) 90000-0000" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-800 pt-6 md:pt-8">
                                                <h4 className="text-white text-base md:text-lg font-black uppercase tracking-widest mb-5 flex items-center"><i className="fas fa-map-marker-alt text-[#d79e51] mr-3"></i> Endereço de Entrega</h4>
                                                <div className="space-y-5">
                                                    <div>
                                                        <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-wider">CEP</label>
                                                        <input type="text" value={clienteDados.cep || ''} onBlur={(e) => buscarCep(e.target.value)} onChange={e => setClienteDados({...clienteDados, cep: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-gray-500 text-base" placeholder="00000-000" />
                                                        {cepBuscando && <p className="text-xs md:text-sm text-[#d79e51] mt-3 font-medium"><i className="fas fa-spinner fa-spin mr-2"></i> Buscando endereço...</p>}
                                                        {erroCep && <p className="text-xs md:text-sm text-red-400 mt-3 font-bold bg-red-500/10 p-3 rounded-lg"><i className="fas fa-exclamation-circle mr-2"></i>{erroCep}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-wider">Endereço Completo</label>
                                                        <textarea value={clienteDados.endereco || ''} onChange={e => setClienteDados({...clienteDados, endereco: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-gray-500 resize-none text-base" rows="2" placeholder="Rua, Número, Bairro"></textarea>
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-wider">Ponto de Referência</label>
                                                        <input type="text" value={clienteDados.referencia || ''} onChange={e => setClienteDados({...clienteDados, referencia: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-gray-500 text-base" placeholder="Apto, Bloco, Casa de esquina..." />
                                                    </div>
                                                </div>
                                            </div>

                                            <button type="submit" disabled={clienteAuthLoading} className={`w-full bg-[#d79e51] text-[#1a191c] font-black text-lg md:text-xl py-4 md:py-5 rounded-xl md:rounded-2xl shadow-[0_10px_30px_rgba(215,158,81,0.3)] transition-all mt-8 tracking-wider ${clienteAuthLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#e8b776] active:scale-95'}`}>
                                                {clienteAuthLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>CRIANDO...</> : 'CRIAR CONTA'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            ) : clienteEditandoPerfil ? (
                                <form onSubmit={(e) => { e.preventDefault(); salvarPerfil(); }} className="w-full max-w-md md:max-w-xl space-y-5 md:space-y-6 bg-[#1f1e22] p-6 md:p-10 rounded-3xl border border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center justify-between gap-3 border-b border-gray-800 pb-5">
                                        <div>
                                            <span className="text-gray-500 text-[10px] md:text-xs uppercase tracking-widest font-bold">Conta</span>
                                            <p className="text-white font-bold text-sm md:text-base mt-1 break-all">{clienteEmail}</p>
                                        </div>
                                        <button type="button" onClick={() => setClienteEditandoPerfil(false)} className="text-gray-400 hover:text-white w-10 h-10 rounded-xl border border-gray-700"><i className="fas fa-times"></i></button>
                                    </div>

                                    <div>
                                        <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 uppercase tracking-widest">Nome Completo</label>
                                        <input type="text" value={clienteDados.nome} onChange={e => setClienteDados({...clienteDados, nome: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-xl px-5 py-4 focus:outline-none focus:border-[#d79e51]" required />
                                    </div>
                                    <div>
                                        <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 uppercase tracking-widest">Celular</label>
                                        <input type="tel" value={clienteDados.celular} onChange={e => setClienteDados({...clienteDados, celular: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-xl px-5 py-4 focus:outline-none focus:border-[#d79e51]" required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 uppercase tracking-wider">CEP</label>
                                        <input type="text" value={clienteDados.cep || ''} onBlur={(e) => buscarCep(e.target.value)} onChange={e => setClienteDados({...clienteDados, cep: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-xl px-5 py-4 focus:outline-none focus:border-[#d79e51]" />
                                        {cepBuscando && <p className="text-xs text-[#d79e51] mt-2"><i className="fas fa-spinner fa-spin mr-2"></i>Buscando endereço...</p>}
                                        {erroCep && <p className="text-xs text-red-400 mt-2">{erroCep}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 uppercase tracking-wider">Endereço Completo</label>
                                        <textarea value={clienteDados.endereco || ''} onChange={e => setClienteDados({...clienteDados, endereco: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-xl px-5 py-4 focus:outline-none focus:border-[#d79e51] resize-none" rows="2"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 uppercase tracking-wider">Ponto de Referência</label>
                                        <input type="text" value={clienteDados.referencia || ''} onChange={e => setClienteDados({...clienteDados, referencia: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-xl px-5 py-4 focus:outline-none focus:border-[#d79e51]" />
                                    </div>

                                    <button type="submit" disabled={clienteAuthLoading} className={`w-full bg-[#d79e51] text-[#1a191c] font-black py-4 rounded-xl uppercase tracking-widest ${clienteAuthLoading ? 'opacity-60' : 'hover:bg-[#e8b776]'}`}>
                                        {clienteAuthLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>SALVANDO...</> : 'SALVAR ALTERAÇÕES'}
                                    </button>
                                </form>
                            ) : (
                                <div className="w-full max-w-md md:max-w-xl space-y-4 md:space-y-6">
                                    <div className="bg-[#1f1e22] border border-gray-800 rounded-3xl p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                                        <div className="mb-6 md:mb-8 border-b border-gray-800 pb-6 flex items-center">
                                            <div className="w-14 h-14 md:w-20 md:h-20 bg-[#363539] rounded-full flex items-center justify-center mr-4 md:mr-6 text-white text-2xl md:text-3xl border-2 border-gray-700 shadow-inner">
                                                <i className="fas fa-user-check text-[#d79e51]"></i>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-widest">Conta conectada</span>
                                                <span className="text-white text-xl md:text-3xl font-black tracking-wide block">{clienteDados.nome || 'Cliente'}</span>
                                                <span className="text-gray-500 text-xs md:text-sm mt-1 block truncate">{clienteEmail}</span>
                                            </div>
                                        </div>

                                        <div className="mb-6 border-b border-gray-800 pb-6">
                                            <span className="block text-gray-500 text-xs md:text-sm font-bold mb-3 uppercase tracking-widest"><i className="fab fa-whatsapp mr-2 text-[#d79e51]"></i> Celular</span>
                                            <span className="text-white text-lg font-bold">{clienteDados.celular || 'Não cadastrado'}</span>
                                        </div>

                                        <div>
                                            <span className="block text-gray-500 text-xs md:text-sm font-bold mb-3 uppercase tracking-widest"><i className="fas fa-map-marker-alt mr-2 text-[#d79e51]"></i> Endereço de Entrega</span>
                                            <div className="bg-[#1a191c] p-5 md:p-6 rounded-2xl border border-gray-800 shadow-inner">
                                                {clienteDados.cep && <span className="text-gray-500 text-xs block mb-2">CEP {clienteDados.cep}</span>}
                                                <span className="text-gray-200 text-sm md:text-base block leading-relaxed font-medium">{clienteDados.endereco || <span className="italic text-gray-500">Não cadastrado</span>}</span>
                                                {clienteDados.referencia && <span className="block text-gray-400 text-xs md:text-sm mt-3 border-t border-gray-800 pt-3"><strong className="text-gray-500 uppercase tracking-widest mr-2">Ref:</strong> {clienteDados.referencia}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
                                        <button onClick={() => setClienteEditandoPerfil(true)} className="w-full bg-[#363539] border border-gray-700 text-white py-4 md:py-5 rounded-2xl font-bold text-sm md:text-base uppercase tracking-wider hover:bg-[#d79e51] hover:text-[#1a191c] hover:border-[#d79e51] transition-all shadow-md">
                                            <i className="fas fa-pen mr-2"></i>Editar Perfil
                                        </button>
                                        <button onClick={sairCliente} className="w-full bg-[#1a191c] border border-red-900/50 text-red-400 py-4 md:py-5 rounded-2xl font-bold text-sm md:text-base uppercase tracking-wider hover:bg-red-900/20 hover:text-red-300 transition-all shadow-md">
                                            <i className="fas fa-sign-out-alt mr-2"></i>Sair da Conta
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-14 md:mt-20 pt-8 border-t border-gray-800 text-center w-full max-w-md md:max-w-xl">
                                <button onClick={() => setView('admin-login')} className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-widest hover:text-[#d79e51] transition-colors flex items-center justify-center mx-auto bg-transparent border border-transparent hover:border-gray-800 py-2 px-4 rounded-lg"><i className="fas fa-lock mr-2"></i> Área Restrita (Gestão)</button>
                            </div>
                        </div>
                    )}

                    {/* View Login Admin */}
                    {view === 'admin-login' && (
                        <div className="pt-10 sm:pt-16 md:pt-24 flex flex-col items-center px-4 sm:px-6 min-h-[60vh] max-w-md md:max-w-lg mx-auto">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#1f1e22] rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-inner border-2 border-[#d79e51]/30">
                                <i className="fas fa-user-shield text-4xl md:text-5xl text-[#d79e51]"></i>
                            </div>
                            <h2 className="font-black text-2xl md:text-4xl text-[#d79e51] uppercase tracking-widest text-center mb-3">Acesso Restrito</h2>
                            <p className="text-gray-400 text-sm md:text-base text-center mb-10 md:mb-12">Área exclusiva para proprietários e gerentes de loja.</p>
                            <form onSubmit={loginAdminForm} className="w-full space-y-5 md:space-y-6 bg-[#1f1e22] p-6 md:p-10 rounded-3xl border border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <div>
                                    <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-widest">E-mail</label>
                                    <div className="relative">
                                        <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 md:text-lg"></i>
                                        <input type="email" name="email" placeholder="admin@email.com" className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-xl md:rounded-2xl pl-12 md:pl-14 pr-4 py-4 focus:outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all text-base md:text-lg" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-widest">Senha</label>
                                    <div className="relative">
                                        <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 md:text-lg"></i>
                                        <input type="password" name="senha" placeholder="••••••••" className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-xl md:rounded-2xl pl-12 md:pl-14 pr-4 py-4 focus:outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all text-base md:text-lg" required />
                                    </div>
                                </div>
                                <button type="submit" disabled={adminLoginLoading} className={`w-full bg-[#d79e51] text-[#1a191c] font-black tracking-widest text-lg md:text-xl py-4 md:py-5 rounded-xl md:rounded-2xl shadow-[0_10px_25px_rgba(215,158,81,0.3)] active:scale-95 transition-all mt-8 ${adminLoginLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#e8b776]'}`}>
                                    {adminLoginLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>ENTRANDO...</> : 'ENTRAR NO PAINEL'}
                                </button>
                                <button type="button" onClick={() => setView('perfil')} className="w-full bg-transparent text-gray-500 hover:text-white font-bold text-sm md:text-base uppercase tracking-wider py-3 md:py-4 mt-2 rounded-xl transition-colors border border-transparent hover:border-gray-700">Voltar para a Loja</button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Navbar Inferior Responsiva (Dock Flutuante no Desktop) */}
                <div className="fixed bottom-0 md:bottom-6 lg:bottom-8 left-0 right-0 w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto bg-[#1a191c]/95 md:bg-[#242326]/90 backdrop-blur-xl border-t md:border border-gray-800 flex justify-around items-center z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] md:shadow-[0_20px_50px_rgba(0,0,0,0.8)] py-1 md:py-3 px-1 sm:px-2 pb-safe md:pb-3 md:rounded-[2rem]">
                    <button onClick={() => setView('home')} className={`flex flex-col items-center justify-center space-y-1 w-1/5 py-2 md:py-2.5 transition-all duration-300 rounded-2xl md:hover:bg-[#363539] ${view === 'home' ? 'text-[#d79e51] md:bg-[#363539]' : 'text-gray-400 hover:text-white'}`}>
                        <i className={`fas fa-home text-xl md:text-[28px] mb-0.5 md:mb-1 ${view === 'home' ? 'animate-bounce-short' : ''}`}></i>
                        <span className="text-[8px] sm:text-[9px] md:text-xs font-bold uppercase tracking-wide sm:tracking-widest">Início</span>
                    </button>
                    <button onClick={() => setView('cardapio')} className={`flex flex-col items-center justify-center space-y-1 w-1/5 py-2 md:py-2.5 transition-all duration-300 rounded-2xl md:hover:bg-[#363539] ${view === 'cardapio' ? 'text-[#d79e51] md:bg-[#363539]' : 'text-gray-400 hover:text-white'}`}>
                        <i className={`fas fa-book-open text-xl md:text-[28px] mb-0.5 md:mb-1 ${view === 'cardapio' ? 'animate-bounce-short' : ''}`}></i>
                        <span className="text-[8px] sm:text-[9px] md:text-xs font-bold uppercase tracking-wide sm:tracking-widest">Cardápio</span>
                    </button>
                    <button onClick={() => setView('pedidos')} className={`flex flex-col items-center justify-center space-y-1 w-1/5 py-2 md:py-2.5 transition-all duration-300 rounded-2xl md:hover:bg-[#363539] ${view === 'pedidos' ? 'text-[#d79e51] md:bg-[#363539]' : 'text-gray-400 hover:text-white'}`}>
                        <i className={`fas fa-receipt text-xl md:text-[28px] mb-0.5 md:mb-1 ${view === 'pedidos' ? 'animate-bounce-short' : ''}`}></i>
                        <span className="text-[8px] sm:text-[9px] md:text-xs font-bold uppercase tracking-wide sm:tracking-widest">Pedidos</span>
                    </button>
                    <button onClick={() => setView('carrinho')} className={`relative flex flex-col items-center justify-center space-y-1 w-1/5 py-2 md:py-2.5 transition-all duration-300 rounded-2xl md:hover:bg-[#363539] ${view === 'carrinho' ? 'text-[#d79e51] md:bg-[#363539]' : 'text-gray-400 hover:text-white'}`}>
                        <div className="relative">
                            <i className={`fas fa-shopping-bag text-xl md:text-[28px] mb-0.5 md:mb-1 ${view === 'carrinho' ? 'animate-bounce-short' : ''}`}></i>
                            {badgeCount > 0 && <span className="absolute -top-2 -right-3 md:-top-3 md:-right-4 bg-red-500 border-2 border-[#1a191c] md:border-[#242326] text-white text-[10px] md:text-xs font-black min-w-[20px] md:min-w-[24px] h-[20px] md:h-[24px] px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">{badgeCount}</span>}
                        </div>
                        <span className="text-[8px] sm:text-[9px] md:text-xs font-bold uppercase tracking-wide sm:tracking-widest mt-0.5 md:mt-1">Carrinho</span>
                    </button>
                    <button onClick={() => setView('perfil')} className={`flex flex-col items-center justify-center space-y-1 w-1/5 py-2 md:py-2.5 transition-all duration-300 rounded-2xl md:hover:bg-[#363539] ${view === 'perfil' ? 'text-[#d79e51] md:bg-[#363539]' : 'text-gray-400 hover:text-white'}`}>
                        <i className={`fas fa-user text-xl md:text-[28px] mb-0.5 md:mb-1 ${view === 'perfil' ? 'animate-bounce-short' : ''}`}></i>
                        <span className="text-[8px] sm:text-[9px] md:text-xs font-bold uppercase tracking-wide sm:tracking-widest">Perfil</span>
                    </button>
                </div>

                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes bounce-short {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-4px); }
                    }
                    .animate-bounce-short {
                        animation: bounce-short 0.4s ease-in-out;
                    }
                    .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
                    
                    /* Melhora as barras de rolagem no desktop */
                    ::-webkit-scrollbar { width: 8px; height: 8px; }
                    ::-webkit-scrollbar-track { background: #1a191c; }
                    ::-webkit-scrollbar-thumb { background: #363539; border-radius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: #d79e51; }
                `}} />

                {/* Modal de Detalhe do Produto */}
                {itemSelecionado && (
                    <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
                        <div className="dogs-mobile-modal bg-[#242326] border border-gray-700 rounded-3xl w-full max-w-lg flex flex-col max-h-[90vh] shadow-[0_15px_50px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in relative">
                            
                            <button onClick={fecharDetalheItem} className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center z-10 transition-colors backdrop-blur-md">
                                <i className="fas fa-times text-lg"></i>
                            </button>

                            <div className="w-full h-40 sm:h-48 md:h-64 relative bg-gray-900 flex-shrink-0">
                                <img src={obterImagemProduto(itemSelecionado)} alt={itemSelecionado.nome} onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x600/2b2a2d/8e8e8e?text=Sem+foto'; }} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#242326] to-transparent"></div>
                                {produtoTemDesconto(itemSelecionado) && (
                                    <div className="absolute top-4 left-4 bg-red-500 text-white text-xs md:text-sm font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                        -{formatarPercentualDesconto(itemSelecionado)}% OFF
                                    </div>
                                )}
                            </div>

                            <div className="p-5 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-2">{itemSelecionado.nome}</h2>
                                <div className="mb-4">
                                    {produtoTemDesconto(itemSelecionado) && (
                                        <p className="text-gray-500 text-sm line-through mb-0.5">
                                            R$ {Number(itemSelecionado.preco).toFixed(2).replace('.', ',')}
                                        </p>
                                    )}
                                    <p className="text-[#d79e51] font-black text-2xl">
                                        R$ {precoFinalProduto(itemSelecionado).toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                                
                                {itemSelecionado.descricao && (
                                    <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 bg-[#1a191c] p-4 rounded-2xl border border-gray-800">
                                        {itemSelecionado.descricao}
                                    </p>
                                )}

                                <div className="mb-6 flex items-center justify-between bg-[#1a191c] p-4 rounded-2xl border border-gray-800 shadow-sm">
                                    <span className="text-gray-400 text-xs md:text-sm font-bold uppercase tracking-widest">Quantidade</span>
                                    <div className="flex items-center space-x-1 md:space-x-2 bg-[#242326] rounded-xl p-1 border border-gray-700 shadow-inner">
                                        <button onClick={() => setQuantidadeSelecionada(q => Math.max(1, q - 1))} className="text-[#d79e51] hover:bg-[#363539] rounded-lg w-8 h-8 md:w-10 md:h-10 flex justify-center items-center font-bold text-xl md:text-2xl transition-colors">-</button>
                                        <span className="text-white font-black w-8 md:w-10 text-center md:text-lg">{quantidadeSelecionada}</span>
                                        <button onClick={() => setQuantidadeSelecionada(q => q + 1)} className="text-[#d79e51] hover:bg-[#363539] rounded-lg w-8 h-8 md:w-10 md:h-10 flex justify-center items-center font-bold text-xl md:text-2xl transition-colors">+</button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 uppercase tracking-widest"><i className="far fa-comment-dots mr-2"></i>Observação</label>
                                    <textarea
                                        value={observacao}
                                        onChange={(e) => setObservacao(e.target.value)}
                                        placeholder="Ex.: sem cebola, molho separado, bem passado..."
                                        rows="3"
                                        className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-2xl px-5 py-4 outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all resize-none text-sm md:text-base"
                                    ></textarea>
                                </div>

                                {adicionaisDisponiveis.length > 0 && !produtoEhAdicional(itemSelecionado) && (
                                    <div className="mt-6">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <label className="block text-gray-400 text-xs md:text-sm font-bold uppercase tracking-widest">
                                                <i className="fas fa-plus-circle mr-2 text-[#d79e51]"></i>Adicionais
                                            </label>
                                            <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Opcional</span>
                                        </div>

                                        <div className="space-y-2.5">
                                            {adicionaisDisponiveis.map(adicional => {
                                                const quantidadeAdicional = Number(adicionaisSelecionadosItem[adicional.id] || 0);

                                                return (
                                                    <div
                                                        key={adicional.id}
                                                        className={`flex items-center justify-between gap-3 p-3 md:p-4 rounded-2xl border transition-all ${
                                                            quantidadeAdicional > 0
                                                                ? 'border-[#d79e51]/60 bg-[#d79e51]/10'
                                                                : 'border-gray-800 bg-[#1a191c]'
                                                        }`}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-white font-bold text-sm md:text-base">{adicional.nome}</p>
                                                            {adicional.descricao && (
                                                                <p className="text-gray-500 text-[10px] md:text-xs mt-1 line-clamp-2">{adicional.descricao}</p>
                                                            )}
                                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                {produtoTemDesconto(adicional) && (
                                                                    <>
                                                                        <span className="text-gray-600 text-[10px] line-through">
                                                                            R$ {Number(adicional.preco).toFixed(2).replace('.', ',')}
                                                                        </span>
                                                                        <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                                                            -{formatarPercentualDesconto(adicional)}%
                                                                        </span>
                                                                    </>
                                                                )}
                                                                <p className="text-[#d79e51] font-black text-sm">
                                                                    + R$ {precoFinalProduto(adicional).toFixed(2).replace('.', ',')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-1 bg-[#242326] rounded-xl p-1 border border-gray-700 flex-shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => alterarAdicionalItem(adicional.id, -1)}
                                                                disabled={quantidadeAdicional === 0}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg transition-colors ${
                                                                    quantidadeAdicional === 0
                                                                        ? 'text-gray-600 cursor-not-allowed'
                                                                        : 'text-[#d79e51] hover:bg-[#363539]'
                                                                }`}
                                                            >
                                                                -
                                                            </button>
                                                            <span className="text-white font-black w-7 text-center">{quantidadeAdicional}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => alterarAdicionalItem(adicional.id, 1)}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg text-[#d79e51] hover:bg-[#363539] transition-colors"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 md:p-6 border-t border-gray-800 bg-[#1f1e22] flex-shrink-0">
                                <button onClick={confirmarItemSelecionado} className="w-full bg-[#d79e51] hover:bg-[#e8b776] text-[#1a191c] font-black text-lg py-4 rounded-2xl shadow-[0_10px_30px_rgba(215,158,81,0.3)] active:scale-95 transition-all flex items-center justify-center tracking-wider">
                                    <i className="fas fa-shopping-bag mr-3"></i> ADICIONAR AO CARRINHO
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
