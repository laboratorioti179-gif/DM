import React, { useState, useEffect, useRef } from 'react';

/* eslint-disable */

const App = () => {
    const [view, setView] = useState('home');
    const [carrinho, setCarrinho] = useState([]);
    const [restaurante, setRestaurante] = useState({
        id: null,
        nome: 'DOGS DO MIRSO',
        is_aberto: true,
        tempo_entrega: '30-45 min',
        raio_entrega: 5,
        foto_capa_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        logo_url: '',
        cep: '',
        lat: -23.5329,
        lng: -46.7920
    });
    
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [pedidosAdmin, setPedidosAdmin] = useState([]);
    const [clienteAuth, setClienteAuth] = useState(false);
    const [clienteDados, setClienteDados] = useState({ nome: '', celular: '', cep: '', endereco: '', referencia: '', lat: null, lng: null });
    const [erroCep, setErroCep] = useState('');
    const [cepBuscando, setCepBuscando] = useState(false);
    const [meusPedidos, setMeusPedidos] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminView, setAdminView] = useState('pedidos');
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    
    const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState({ aberto: false, id: null });
    const [checkoutForm, setCheckoutForm] = useState({ tipo: 'entrega', endereco: '', pagamento: 'Cartão', troco: '', referencia: '' });
    const [mapaAberto, setMapaAberto] = useState(false);
    const mapRef = useRef(null);
    const [redirectPosLogin, setRedirectPosLogin] = useState(null);
    
    const [cepLojaBuscando, setCepLojaBuscando] = useState(false);
    const [erroCepLoja, setErroCepLoja] = useState('');
    const [lojas, setLojas] = useState([]);
    const [novaLojaForm, setNovaLojaForm] = useState({ nome: '', tempo_entrega: '30-45 min', raio_entrega: 5 });
    
    const [financeiroForm, setFinanceiroForm] = useState({ restaurante_id: '', tipo: 'entrada', valor: '', descricao: '' });
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [filtroLoja, setFiltroLoja] = useState('');
    const [filtroData, setFiltroData] = useState('');
    
    const [promoForm, setPromoForm] = useState({ titulo: '', mensagem: '', webhookUrl: '' });
    const [webhookEditavel, setWebhookEditavel] = useState(true);
    
    const [supabase, setSupabase] = useState(null);
    const [dbLoading, setDbLoading] = useState(true);

    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const buscarCepLoja = async (cepInput) => {
        const cepLimpo = cepInput.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return;
        setCepLojaBuscando(true);
        setErroCepLoja('');
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await res.json();
            if (data.erro) {
                setErroCepLoja('CEP não encontrado.');
                setCepLojaBuscando(false);
                return;
            }
            
            const q = `${data.logradouro}, ${data.localidade}, ${data.uf}, Brasil`;
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
            const geoData = await geoRes.json();
            
            if (geoData && geoData.length > 0) {
                setRestaurante(prev => ({
                    ...prev,
                    cep: cepInput,
                    lat: parseFloat(geoData[0].lat),
                    lng: parseFloat(geoData[0].lon)
                }));
            } else {
                 setErroCepLoja('Não foi possível obter a localização exata no mapa.');
            }
        } catch (err) {
            setErroCepLoja('Erro ao buscar CEP.');
        }
        setCepLojaBuscando(false);
    };

    const buscarCep = async (cepInput) => {
        const cepLimpo = cepInput.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return;
        setCepBuscando(true);
        setErroCep('');
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await res.json();
            if (data.erro) {
                setErroCep('CEP não encontrado.');
                setCepBuscando(false);
                return;
            }
            
            const q = `${data.logradouro}, ${data.localidade}, ${data.uf}, Brasil`;
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
            const geoData = await geoRes.json();
            
            let lat = null;
            let lng = null;
            if (geoData && geoData.length > 0) {
                lat = parseFloat(geoData[0].lat);
                lng = parseFloat(geoData[0].lon);
                
                const lojaLat = restaurante.lat || -23.5329;
                const lojaLng = restaurante.lng || -46.7920;
                const dist = calcularDistancia(lojaLat, lojaLng, lat, lng);
                
                if (dist > (restaurante.raio_entrega || 5)) {
                    setErroCep(`Não fazemos entrega neste local. Distância: ${dist.toFixed(1)}km (Raio Máx: ${restaurante.raio_entrega}km).`);
                }
            } else {
                 setErroCep('Atenção: Não foi possível validar a distância exata. Confirme com a loja.');
            }
            
            setClienteDados(prev => ({
                ...prev,
                endereco: `${data.logradouro}, , ${data.bairro}, ${data.localidade} - ${data.uf}`,
                lat, lng
            }));
        } catch (err) {
            setErroCep('Erro ao buscar CEP.');
        }
        setCepBuscando(false);
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

    const pedidosConcluidos = pedidosAdmin.filter(p => p.status === 'finalizado');
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
            descricao: `Pedido #${p.id.substring(0,6).toUpperCase()} (${nomesLanches})`,
            tipo: 'entrada',
            valor: Number(p.total)
        };
    });
    
    const historicoMovimentacoes = movimentacoes.map(m => ({
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
    
    const totalEntradasManuais = movimentacoes.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + Number(m.valor), 0);
    const totalSaidasManuais = movimentacoes.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + Number(m.valor), 0);
    const saldoGeral = totalPedidosFinalizados + totalEntradasManuais - totalSaidasManuais;
    
    const historicoFiltrado = historicoCombinado.filter(item => {
        const matchLoja = filtroLoja ? item.loja === filtroLoja : true;
        const matchData = filtroData ? new Date(item.data).toISOString().split('T')[0] === filtroData : true;
        return matchLoja && matchData;
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
        link.setAttribute('download', 'relatorio_financeiro.csv');
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
                    titulo: promoForm.titulo,
                    mensagem: promoForm.mensagem,
                    data_disparo: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                alert("Promoção disparada para o N8N com sucesso!");
                setPromoForm({...promoForm, titulo: '', mensagem: ''});
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
        const carrinhoAtual = [...carrinho];
        const index = carrinhoAtual.findIndex(item => item.id === produto.id);
        if (index > -1) {
            carrinhoAtual[index].quantidade += 1;
        } else {
            carrinhoAtual.push({ ...produto, quantidade: 1, observacao: '' });
        }
        setCarrinho(carrinhoAtual);
    };

    const alterarQuantidade = (id, delta) => {
        const carrinhoAtual = [...carrinho];
        const index = carrinhoAtual.findIndex(item => item.id === id);
        if (index > -1) {
            carrinhoAtual[index].quantidade += delta;
            if (carrinhoAtual[index].quantidade <= 0) {
                carrinhoAtual.splice(index, 1);
            }
            setCarrinho(carrinhoAtual);
        }
    };

    const atualizarObs = (id, obs) => {
        const carrinhoAtual = [...carrinho];
        const index = carrinhoAtual.findIndex(item => item.id === id);
        if (index > -1) {
            carrinhoAtual[index].observacao = obs;
            setCarrinho(carrinhoAtual);
        }
    };

    const salvarPerfil = async () => {
        if (!clienteDados.nome || !clienteDados.celular) {
            alert('Preencha nome e celular.');
            return;
        }
        localStorage.setItem('cliente_nome', clienteDados.nome);
        localStorage.setItem('cliente_celular', clienteDados.celular);
        localStorage.setItem('cliente_cep', clienteDados.cep || '');
        localStorage.setItem('cliente_endereco', clienteDados.endereco || '');
        localStorage.setItem('cliente_referencia', clienteDados.referencia || '');
        setClienteAuth(true);
        
        if (supabase) {
             await supabase.from('clientes').upsert({ celular: clienteDados.celular, nome: clienteDados.nome }, { onConflict: 'celular' });
             carregarMeusPedidos(clienteDados.celular);
        }
        
        if (redirectPosLogin) {
            setView(redirectPosLogin);
            setRedirectPosLogin(null);
        } else {
            setView('home');
        }
    };

    useEffect(() => {
        const initScripts = async () => {
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
                sbScript.onload = () => {
                     const sbUrl = 'https://vzcrfnyfiqsfrwswlvyf.supabase.co';
                     const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Y3JmbnlmaXFzZnJ3c3dsdnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTQ1NjksImV4cCI6MjA5NDc5MDU2OX0.es2duCl9cJQjSH787kCxtUbl-UqqcwedvKF5lf-uc7s';
                     
                     const options = {
                         auth: { persistSession: false },
                         global: { fetch: window.fetch.bind(window) }
                     };
                     
                     const sbClient = window.supabase.createClient(sbUrl, sbKey, options);
                     setSupabase(sbClient);
                };
                document.head.appendChild(sbScript);
            }
        };
        initScripts();
        
        const nome = localStorage.getItem('cliente_nome');
        const cel = localStorage.getItem('cliente_celular');
        const cep = localStorage.getItem('cliente_cep') || '';
        const end = localStorage.getItem('cliente_endereco') || '';
        const ref = localStorage.getItem('cliente_referencia') || '';
        
        if (nome && cel) {
            setClienteAuth(true);
            setClienteDados({ nome, celular: cel, cep, endereco: end, referencia: ref });
        }
        
        if (localStorage.getItem('isAdminBypass') === 'true') {
            setIsAdmin(true);
        }
    }, []);

    useEffect(() => {
        if (!supabase) return;

        const carregarDados = async () => {
            try {
                const { data: catData, error: catError } = await supabase.from('categorias').select('*').order('ordem', { ascending: true });
                if (catError) throw catError;
                if (catData && catData.length > 0) setCategorias(catData);

                const { data: prodData, error: prodError } = await supabase.from('produtos').select('*');
                if (prodError) throw prodError;
                if (prodData) setProdutos(prodData);

                const { data: restData, error: restError } = await supabase.from('restaurante').select('*');
                if (restError && restError.code !== 'PGRST116') throw restError; 
                
                if (restData && restData.length > 0) {
                    setLojas(restData);
                    const selectedId = localStorage.getItem('loja_selecionada');
                    const lojaAtual = restData.find(r => r.id === selectedId) || restData[0];
                    setRestaurante(lojaAtual);
                } else {
                     const { data: novoRest } = await supabase.from('restaurante').insert([{ nome: 'DOGS DO MIRSO' }]).select().single();
                     if (novoRest) {
                         setRestaurante(novoRest);
                         setLojas([novoRest]);
                     }
                }
                
                if (isAdmin) {
                    carregarPedidosAdminLocal();
                    carregarMovimentacoes();
                }
                if (clienteAuth) carregarMeusPedidos(clienteDados.celular);

            } catch (err) {
                console.error("Erro ao carregar do banco:", err);
            } finally {
                setDbLoading(false);
            }
        };

        carregarDados();

        // Evita a inicialização do WebSocket caso esteja rodando em um Iframe/Canvas restrito
        const isInIframe = () => {
            try { return window.self !== window.top; }
            catch (e) { return true; }
        };

        let channel = null;

        // Só tenta ligar o Realtime (WebSocket) se NÃO estiver no modo de visualização do Canvas
        if (!isInIframe()) {
             channel = supabase.channel('realtime-cardapio')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => carregarDados())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, () => carregarDados())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurante' }, () => carregarDados())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => carregarDados())
                .subscribe();
        } else {
             console.warn('Realtime desabilitado para o ambiente de preview. O app funcionará estaticamente.');
        }

        // Limpa o canal caso o componente seja desmontado e o canal exista
        return () => {
            if (channel) {
                try { supabase.removeChannel(channel); } catch (e) {}
            }
        };
    }, [supabase, isAdmin, clienteAuth, clienteDados.celular]);

    const carregarMeusPedidos = (celular) => {
        if (!supabase) return;
        supabase.from('pedidos').select('*').eq('cliente_celular', celular).order('created_at', { ascending: false }).then(({ data }) => {
            if (data) setMeusPedidos(data);
        });
    };

    const loginAdminForm = (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const senha = e.target.senha.value;
        
        if(email === 'dogsdomirso.ls@outlook.com' && senha === 'K1nder$202525') {
            localStorage.setItem('isAdminBypass', 'true');
            setIsAdmin(true);
            carregarPedidosAdminLocal();
            carregarMovimentacoes();
        } else {
            alert("Credenciais Inválidas");
        }
    };

    const sairAdmin = () => {
        localStorage.removeItem('isAdminBypass');
        setIsAdmin(false);
        setView('home');
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
                tempo_entrega: restaurante.tempo_entrega,
                raio_entrega: restaurante.raio_entrega,
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
        if (view === 'carrinho' && checkoutForm.tipo === 'entrega' && !mapRef.current && window.L) {
            setTimeout(() => {
                try {
                    const lojaLat = restaurante.lat || -23.5329;
                    const lojaLng = restaurante.lng || -46.7920;
                    const raioMeters = (restaurante.raio_entrega || 5) * 1000;

                    const map = window.L.map('mapa-raio-container', { zoomControl: false, attributionControl: false }).setView([lojaLat, lojaLng], 13);
                    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
                    window.L.circle([lojaLat, lojaLng], { color: '#d79e51', fillColor: '#d79e51', fillOpacity: 0.2, radius: raioMeters }).addTo(map);
                    window.L.marker([lojaLat, lojaLng]).addTo(map).bindPopup('Restaurante');
                    
                    if (clienteDados.lat && clienteDados.lng) {
                        window.L.marker([clienteDados.lat, clienteDados.lng]).addTo(map).bindPopup('Sua Entrega');
                    }

                    mapRef.current = map;
                    setMapaAberto(true);
                } catch (e) { console.log("Erro ao carregar mapa", e); }
            }, 500);
        } else if ((view !== 'carrinho' || checkoutForm.tipo !== 'entrega') && mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            setMapaAberto(false);
        }
    }, [view, checkoutForm.tipo, restaurante.raio_entrega]);

    const finalizarPedido = async () => {
        if (!restaurante.is_aberto) {
            alert("A loja está fechada no momento.");
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

        const totalCalc = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
        
        const novoPedido = {
            id: Math.random().toString(36).substring(2, 9),
            cliente_nome: clienteDados.nome,
            cliente_celular: clienteDados.celular,
            total: totalCalc,
            status: 'novo',
            itens: {
                filial_id: restaurante.id,
                filial_nome: restaurante.nome,
                lanches: carrinho,
                endereco: checkoutForm.tipo === 'entrega' ? clienteDados.endereco : 'Retirada',
                referencia: checkoutForm.tipo === 'entrega' ? clienteDados.referencia : '',
                pagamento: checkoutForm.pagamento,
                troco: checkoutForm.troco
            }
        };

        if (supabase) {
             try {
                  const { error } = await supabase.from('pedidos').insert([novoPedido]);
                  if (error) {
                      console.error("Erro insert pedido:", error);
                      alert("Erro ao enviar pedido para o restaurante.");
                      return;
                  }
             } catch (err) {
                  console.error(err);
                  return;
             }
        }
        
        setCarrinho([]);
        carregarMeusPedidos(clienteDados.celular);
        setView('pedidos');
        alert("Pedido enviado com sucesso!");
    };

    const moverPedidoStatus = async (id, novoStatus) => {
        setPedidosAdmin(pedidosAdmin.map(p => p.id === id ? { ...p, status: novoStatus } : p));
        if (supabase) {
            await supabase.from('pedidos').update({ status: novoStatus }).eq('id', id);
        }
    };

    const imprimirNota = (pedido) => {
        let info = {};
        if (typeof pedido.itens === 'string') {
            try { info = JSON.parse(pedido.itens); } catch(e) {}
        } else {
            info = pedido.itens || {};
        }
        
        const lanchesHtml = info.lanches ? info.lanches.map(l => 
            `${l.quantidade}x ${l.nome} ${l.observacao ? `(Obs: ${l.observacao})` : ''} - R$ ${(l.quantidade * l.preco).toFixed(2).replace('.',',')}`
        ).join('<br/>') : '';

        const d = new Date(pedido.created_at || Date.now());
        const dataFormat = d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR');

        const win = window.open('', '_blank', 'width=350,height=600');
        win.document.write(`
            <html><head><style>body{font-family:monospace; margin:10px;} hr{border-top:1px dashed #000;}</style></head>
            <body>
                <h3 style="text-align:center; margin-bottom:5px;">${restaurante.nome}</h3>
                <h4 style="text-align:center; margin-top:0;">PEDIDO #${pedido.id.toUpperCase()}</h4>
                <div style="text-align:center; font-size:12px;">${dataFormat}</div>
                <hr/>
                <div>Cliente: ${pedido.cliente_nome}</div>
                <div>Tel: ${pedido.cliente_celular}</div>
                <hr/>
                <div><b>ITENS:</b><br/>${lanchesHtml}</div>
                <hr/>
                <div>Total: R$ ${Number(pedido.total).toFixed(2).replace('.',',')}</div>
                <hr/>
                <div>Endereço: ${info.endereco || 'Retirada'}</div>
                ${info.referencia ? `<div>Ref: ${info.referencia}</div>` : ''}
                <div>Pagamento: ${info.pagamento} ${info.troco ? '(Troco: '+info.troco+')' : ''}</div>
                <hr/>
                <div style="text-align:center; font-size:12px; margin-top:10px;">Obrigado pela preferência!</div>
                <script>window.print(); window.close();</script>
            </body></html>
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
    
    const handleSaveProduto = async () => {
        if (!supabase) return;
        
        if (produtoEditando.imagem_url && produtoEditando.imagem_url.length > 2000000) {
            alert("Erro: A imagem escolhida é muito pesada para o banco de dados. Por favor, escolha uma imagem de menor tamanho/resolução.");
            return;
        }

        if (!produtoEditando.nome) { alert("Nome do produto é obrigatório."); return; }
        if (!produtoEditando.preco) { alert("Preço do produto é obrigatório."); return; }

        try {
            const catIdFinal = produtoEditando.categoria_id || (categorias.length > 0 ? categorias[0].id : null);
            
            const payload = {
                nome: produtoEditando.nome,
                preco: produtoEditando.preco,
                descricao: produtoEditando.descricao || '',
                categoria_id: catIdFinal,
                ativo: produtoEditando.ativo,
                is_destaque: produtoEditando.is_destaque,
                imagem_url: produtoEditando.imagem_url || ''
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

    const totalCarrinho = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const badgeCount = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

    if (isAdmin) {
        return (
            <div className="fixed inset-0 bg-[#1a191c] flex w-full h-full text-white font-sans overflow-hidden z-50">
                <div className={`absolute md:relative z-[60] w-64 bg-[#242326] border-r border-gray-800 flex flex-col h-full transform ${adminMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 flex-shrink-0`}>
                    <div className="p-5 flex items-center justify-between border-b border-gray-800">
                        <h2 className="font-bold text-xl text-[#d79e51] uppercase tracking-wider">Gestão</h2>
                        <button onClick={() => setAdminMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white transition-colors">
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
                                <button onClick={() => setAdminView('nova_loja')} className={`w-full flex items-center px-4 py-3 rounded-lg border transition-all ${adminView === 'nova_loja' ? 'bg-[#363539] text-white border-gray-700 shadow-sm' : 'border-transparent text-gray-400 hover:bg-[#363539] hover:text-white'}`}>
                                    <i className={`fas fa-store w-6 ${adminView === 'nova_loja' ? 'text-[#d79e51]' : ''}`}></i>
                                    <span className="text-sm font-medium">Nova Loja</span>
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

                {adminMenuOpen && <div onClick={() => setAdminMenuOpen(false)} className="fixed inset-0 bg-black/60 z-[55] md:hidden backdrop-blur-sm transition-opacity"></div>}

                <div className="flex-1 flex flex-col overflow-hidden relative bg-[#1a191c] w-full">
                    <header className="bg-[#1f1e22] border-b border-gray-800 p-4 flex justify-between items-center z-10 flex-shrink-0">
                        <div className="flex items-center">
                            <button onClick={() => setAdminMenuOpen(true)} className="md:hidden text-gray-400 hover:text-white mr-4 transition-colors">
                                <i className="fas fa-bars text-xl"></i>
                            </button>
                            <h3 className="text-white text-lg font-medium">
                                {adminView === 'pedidos' ? 'Gestão de Pedidos' : adminView === 'cardapio' ? 'Cardápio Web' : adminView === 'nova_loja' ? 'Nova Loja' : adminView === 'financeiro' ? 'Financeiro' : adminView === 'promocoes' ? 'Disparo Promo' : 'Configurações do App'}
                            </h3>
                        </div>
                        {adminView === 'cardapio' && (
                            <div className="flex items-center space-x-4">
                                <button onClick={() => {
                                    setProdutoEditando({nome: '', preco: '', categoria_id: categorias[0]?.id || '', descricao: '', ativo: true, is_destaque: false, imagem_url: ''}); 
                                    setModalProdutoAberto(true);
                                }} className="bg-[#d79e51] hover:bg-[#e8b776] text-[#1a191c] px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-[11px] md:text-sm shadow-md transition-colors flex items-center">
                                    <i className="fas fa-plus md:mr-2"></i> <span className="hidden md:inline">Novo Lanche</span>
                                </button>
                            </div>
                        )}
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-8 relative">
                        
                        {/* Area de Pedidos */}
                        {}
                        {adminView === 'pedidos' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 h-full items-start">
                                {['novo', 'preparo', 'pronto'].map(status => (
                                    <div key={status} className="bg-[#242326] rounded-xl border border-gray-800 flex flex-col max-h-[80vh] shadow-sm">
                                        <div className="p-3.5 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                                            <h4 className="text-white font-medium tracking-wide uppercase text-sm">{status === 'novo' ? 'Novos Pedidos' : status === 'preparo' ? 'Em Preparo' : 'Prontos / Entrega'}</h4>
                                        </div>
                                        <div className="p-3 overflow-y-auto space-y-3 hide-scrollbar flex-1 min-h-[150px]">
                                            {pedidosAdmin.filter(p => p.status === status).map(p => {
                                                let info = {};
                                                if (typeof p.itens === 'string') {
                                                    try { info = JSON.parse(p.itens); } catch(e) {}
                                                } else {
                                                    info = p.itens || {};
                                                }
                                                return (
                                                    <div key={p.id} className="bg-[#363539] p-3 rounded-lg border border-gray-700 shadow-sm">
                                                        <div className="flex justify-between border-b border-gray-700 pb-2 mb-2">
                                                            <span className="text-white font-bold text-sm">#{p.id.substring(0,6).toUpperCase()} - {p.cliente_nome}</span>
                                                            <span className="text-[#d79e51] font-bold text-sm">R$ {Number(p.total).toFixed(2).replace('.',',')}</span>
                                                        </div>
                                                        <div className="mb-2 text-xs text-gray-300">
                                                            {info.lanches?.map((l, i) => <div key={i}>• {l.quantidade}x {l.nome} {l.observacao && <span className="text-red-400">({l.observacao})</span>}</div>)}
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
                                                                    <button onClick={() => moverPedidoStatus(p.id, 'rejeitado')} className="flex-1 bg-red-900/50 text-red-300 border border-red-700/50 font-bold py-1.5 rounded text-xs">Rejeitar</button>
                                                                </div>
                                                            )}
                                                            {status === 'preparo' && <button onClick={() => moverPedidoStatus(p.id, 'pronto')} className="w-full bg-green-500 text-white font-bold py-1.5 rounded text-xs">Pronto / Entrega</button>}
                                                            {status === 'pronto' && <button onClick={() => moverPedidoStatus(p.id, 'finalizado')} className="w-full bg-gray-600 text-white font-bold py-1.5 rounded text-xs">Concluir / Arquivar</button>}
                                                            {(status === 'finalizado' || p.status === 'rejeitado') && <span className="w-full block text-center text-gray-500 font-bold py-1.5 rounded text-xs border border-gray-700">{p.status === 'rejeitado' ? 'Pedido Rejeitado' : 'Finalizado'}</span>}
                                                            
                                                            <button onClick={() => imprimirNota(p)} className="w-full bg-transparent border border-gray-600 text-gray-400 hover:text-white py-1.5 rounded text-xs"><i className="fas fa-print mr-1"></i> Imprimir Nota</button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {pedidosAdmin.filter(p => p.status === status).length === 0 && (
                                                <div className="text-gray-500 text-center text-sm mt-4">Vazio</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Area do Cardapio */}
                        {}
                        {adminView === 'cardapio' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                                {produtos.map(p => {
                                    const cName = categorias.find(c => c.id === p.categoria_id)?.nome || 'Sem Categoria';
                                    return (
                                    <div key={p.id} className="bg-[#1f1e22] border border-gray-800 rounded-xl overflow-hidden shadow-md">
                                        <img src={p.imagem_url || 'https://placehold.co/400x300/2b2a2d/8e8e8e?text=X'} alt={p.nome} className={`w-full h-28 object-cover ${!p.ativo ? 'grayscale opacity-50' : ''}`} />
                                        <div className="p-4">
                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest">{cName}</p>
                                            <h4 className="text-white font-medium text-sm my-1">{p.nome}</h4>
                                            <p className="text-[#d79e51] font-bold mb-3">R$ {Number(p.preco).toFixed(2).replace('.',',')}</p>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs px-2 py-1 rounded border ${p.ativo ? 'border-green-800 text-green-500' : 'border-red-800 text-red-500'}`}>{p.ativo ? 'Ativo' : 'Pausado'}</span>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => excluirProduto(p.id)} className="text-xs px-3 py-1.5 bg-red-900/50 text-red-400 rounded hover:bg-red-800 hover:text-white transition-colors"><i className="fas fa-trash"></i></button>
                                                    <button onClick={() => {setProdutoEditando(p); setModalProdutoAberto(true);}} className="text-xs px-3 py-1.5 bg-[#d79e51] text-[#1a191c] rounded"><i className="fas fa-pen"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        )}

                        {/* Area de Configs */}
                        {}
                        {adminView === 'configs' && (
                            <div className="max-w-3xl mx-auto space-y-6 pt-2">
                                <div className="bg-[#242326] rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl">
                                        <h4 className="text-white font-medium tracking-wide uppercase text-sm">Operação da Loja</h4>
                                    </div>
                                    <div className="p-5 space-y-5">
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
                        {}
                        {adminView === 'nova_loja' && (
                            <div className="max-w-3xl mx-auto space-y-6 pt-2">
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
                        {}
                        {adminView === 'financeiro' && (
                            <div className="max-w-4xl mx-auto space-y-6 pt-2">
                                <div className="bg-[#242326] rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl">
                                        <h4 className="text-white font-medium tracking-wide uppercase text-sm">Registrar Movimentação</h4>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Loja *</label>
                                                <select value={financeiroForm.restaurante_id} onChange={(e) => setFinanceiroForm({...financeiroForm, restaurante_id: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm">
                                                    <option value="">Selecione...</option>
                                                    {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
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
                                        <div className="text-sm font-bold text-gray-300">
                                            Saldo Geral: <span className={saldoGeral >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>R$ {saldoGeral.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 border-b border-gray-800 bg-[#1a191c] flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 w-full">
                                            <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Filtrar por Loja</label>
                                            <select value={filtroLoja} onChange={(e) => setFiltroLoja(e.target.value)} className="w-full bg-[#242326] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-xs">
                                                <option value="">Todas as Lojas</option>
                                                {lojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-1 w-full">
                                            <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Filtrar por Data</label>
                                            <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} className="w-full bg-[#242326] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-xs" />
                                        </div>
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
                        {}
                        {adminView === 'promocoes' && (
                            <div className="max-w-3xl mx-auto space-y-6 pt-2">
                                <div className="bg-[#242326] rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl">
                                        <h4 className="text-white font-medium tracking-wide uppercase text-sm">Disparo de Promoção via N8N</h4>
                                    </div>
                                    <div className="p-5 space-y-5">
                                        <div>
                                            <label className="block text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">Webhook URL (N8N) *</label>
                                            <div className="flex gap-2">
                                                <input type="text" value={promoForm.webhookUrl} readOnly={!webhookEditavel} onChange={(e) => setPromoForm({...promoForm, webhookUrl: e.target.value})} className={`w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm ${!webhookEditavel ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="https://seu-n8n.com/webhook/..." />
                                                {webhookEditavel ? (
                                                    <button onClick={() => setWebhookEditavel(false)} className="px-4 py-2 bg-[#d79e51] hover:bg-[#e8b776] text-[#1a191c] rounded-lg font-bold text-xs shadow-md transition-all whitespace-nowrap">
                                                        Confirmar
                                                    </button>
                                                ) : (
                                                    <button onClick={() => { if(window.confirm("Deseja realmente editar a URL do Webhook?")) setWebhookEditavel(true); }} className="px-4 py-2 bg-[#363539] hover:bg-gray-700 text-white rounded-lg font-bold text-xs shadow-md transition-all whitespace-nowrap border border-gray-600">
                                                        Editar
                                                    </button>
                                                )}
                                            </div>
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
                
                {}
                {/* Modal Produto */}
                {modalProdutoAberto && (
                    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-[#242326] border border-gray-700 rounded-xl w-full max-w-md flex flex-col max-h-[90vh] shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
                            <div className="p-4 md:p-5 border-b border-gray-800 flex justify-between items-center flex-shrink-0">
                                <h3 className="text-white text-lg font-bold">{produtoEditando?.id ? 'Editar Produto' : 'Novo Produto'}</h3>
                                <button onClick={() => setModalProdutoAberto(false)} className="text-gray-400 hover:text-[#d79e51] transition-colors"><i className="fas fa-times text-xl"></i></button>
                            </div>
                            <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Nome do Item *</label>
                                    <input type="text" value={produtoEditando?.nome || ''} onChange={(e) => setProdutoEditando({...produtoEditando, nome: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:border-[#d79e51] outline-none text-sm" />
                                </div>
                                <div className="flex space-x-3">
                                    <div className="flex-1">
                                        <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Preço (R$) *</label>
                                        <input type="number" step="0.01" value={produtoEditando?.preco || ''} onChange={(e) => setProdutoEditando({...produtoEditando, preco: parseFloat(e.target.value) || 0})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:border-[#d79e51] outline-none text-sm" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Categoria *</label>
                                        <select value={produtoEditando?.categoria_id || ''} onChange={(e) => setProdutoEditando({...produtoEditando, categoria_id: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:border-[#d79e51] outline-none text-sm">
                                            {categorias.map(c => (
                                                <option key={c.id} value={c.id}>{c.nome}</option>
                                            ))}
                                        </select>
                                    </div>
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
                                <div className="flex items-center space-x-6 pt-3 border-t border-gray-800">
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
                            <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-[#1f1e22] rounded-b-xl">
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
                    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-[#242326] border border-red-900/50 rounded-xl w-full max-w-sm flex flex-col shadow-[0_15px_40px_rgba(0,0,0,0.5)] transform animate-fade-in">
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
        <div className="min-h-screen bg-[#1a191c] flex justify-center items-start text-white font-sans w-full">
            <div className="w-full max-w-md min-h-screen bg-[#2b2a2d] relative flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 mx-auto">
                
                {/* Header fixo da loja */}
                <div className="bg-[#1a191c] flex flex-col justify-center items-center py-2 border-b border-gray-800 text-xs shadow-md z-20">
                    {lojas.length > 1 && (
                        <button onClick={() => setView('selecionar_loja')} className="text-white font-bold mb-1.5 flex items-center hover:text-[#d79e51] transition-colors">
                            {restaurante.nome} <i className="fas fa-chevron-down ml-1.5 text-[10px]"></i>
                        </button>
                    )}
                    <div className="flex justify-center items-center">
                        <span className="text-gray-300 flex items-center">
                            <i className="fas fa-motorcycle text-[#d79e51] mr-2"></i> Delivery: {restaurante.tempo_entrega}
                        </span>
                        <span className="mx-3 text-gray-600">|</span>
                        <span className={`font-medium ${restaurante.is_aberto ? 'text-[#d79e51]' : 'text-red-500'}`}>
                            {restaurante.is_aberto ? 'Aberto' : 'Fechado'}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                    
                    {/* View Selecionar Loja */}
                    {view === 'selecionar_loja' && (
                        <div className="pt-10 px-6 flex flex-col items-center min-h-[60vh]">
                            <h2 className="font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">Selecione a Loja</h2>
                            <p className="text-gray-400 text-sm text-center mb-8">Escolha de qual unidade você deseja pedir hoje.</p>
                            <div className="w-full space-y-4">
                                {lojas.map(loja => (
                                    <button key={loja.id} onClick={() => {
                                        setRestaurante(loja);
                                        localStorage.setItem('loja_selecionada', loja.id);
                                        setView('home');
                                    }} className="w-full bg-[#1f1e22] border border-gray-700 hover:border-[#d79e51] p-5 rounded-xl flex items-center justify-between transition-colors shadow-sm">
                                        <div className="flex flex-col text-left">
                                            <span className="text-white font-bold text-lg">{loja.nome}</span>
                                            {loja.cep && <span className="text-gray-400 text-[11px] mt-1">CEP Ref: {loja.cep}</span>}
                                        </div>
                                        <i className="fas fa-chevron-right text-[#d79e51] text-lg"></i>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View Home */}
                    {view === 'home' && (
                        <div>
                            <div className="relative flex flex-col items-center mb-6">
                                <div className="w-full h-48 relative bg-gray-900 overflow-hidden">
                                    <img src={restaurante.foto_capa_url} alt="Capa" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
                                </div>
                                <div className="w-32 h-32 rounded-full border-4 border-[#d79e51] flex flex-col items-center justify-center -mt-16 z-10 bg-[#1f1e22] shadow-xl overflow-hidden relative">
                                    {restaurante.logo_url ? (
                                        <img src={restaurante.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <h1 className="font-bold text-xl tracking-wider text-white text-center leading-none z-10 px-2">{restaurante.nome}</h1>
                                    )}
                                </div>
                                <div className="text-center mt-4 w-full px-4">
                                    <h2 className="font-bold text-white text-xl tracking-wider">{restaurante.nome}</h2>
                                    <p className="text-[#d79e51] text-xs tracking-[0.35em] mt-1 uppercase">Cardápio Digital</p>
                                </div>
                                <div className="w-full px-6 mt-6 max-w-sm mx-auto">
                                    <button onClick={fazerPedidoAgora} className="w-full font-bold text-xl py-4 rounded-xl active:scale-95 transition-transform" style={{ backgroundColor: '#d79e51', backgroundImage: 'linear-gradient(to right, #d79e51, #e8b776)', color: '#2b2a2d', boxShadow: '0 6px 20px rgba(215,158,81,0.25)' }}>
                                        FAZER PEDIDO AGORA
                                    </button>
                                </div>
                            </div>
                            
                            <div className="px-6 mt-8">
                                <h3 className="font-medium text-lg text-white mb-3 uppercase tracking-wider">Destaques</h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                                    {produtos.filter(p => p.is_destaque).map(p => (
                                        <div key={p.id} className="w-[80vw] max-w-[280px] bg-[#363539] rounded-2xl overflow-hidden shadow-lg flex-none border border-gray-700/50 snap-start">
                                            <div className="h-40 relative">
                                                <img src={p.imagem_url || 'https://placehold.co/400x300/2b2a2d/8e8e8e?text=Foto'} alt={p.nome} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                            </div>
                                            <div className="p-4 relative bg-gradient-to-b from-[#363539] to-[#2c2b2e]">
                                                <h4 className="font-medium text-lg text-white uppercase truncate">{p.nome}</h4>
                                                <p className="text-[#d79e51] font-bold text-xl mt-1">R$ {p.preco.toFixed(2).replace('.',',')}</p>
                                                <button onClick={() => adicionarAoCarrinho(p)} className="absolute bottom-4 right-4 w-9 h-9 border border-[#d79e51]/50 rounded-full flex items-center justify-center text-[#d79e51] hover:bg-[#d79e51] hover:text-[#1a191c] transition-colors"><i className="fas fa-plus"></i></button>
                                            </div>
                                        </div>
                                    ))}
                                    {produtos.filter(p => p.is_destaque).length === 0 && !dbLoading && (
                                        <p className="text-gray-500 text-sm">Nenhum destaque no momento.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Cardapio */}
                    {view === 'cardapio' && (
                        <div className="pt-6 px-4">
                            <div className="sticky top-0 bg-[#2b2a2d] z-10 pb-4 pt-2 mb-4 border-b border-gray-800">
                                <h2 className="font-bold text-2xl text-white uppercase tracking-wider text-center">Nosso Cardápio</h2>
                            </div>
                            
                            <div className="flex overflow-x-auto gap-3 pb-4 mb-4 hide-scrollbar">
                                {categorias.map(c => (
                                    <div key={c.id} className="flex-none bg-[#363539] border border-gray-700 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium text-gray-300 hover:text-[#d79e51] hover:border-[#d79e51] cursor-pointer transition-colors">
                                        {c.nome}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-8">
                                {dbLoading && <p className="text-center text-gray-500 py-10"><i className="fas fa-spinner fa-spin mr-2"></i>Carregando cardápio...</p>}
                                {!dbLoading && categorias.map(cat => {
                                    const prods = produtos.filter(p => p.categoria_id === cat.id && p.ativo);
                                    if(prods.length === 0) return null;
                                    return (
                                        <div key={cat.id}>
                                            <h3 className="text-xl text-[#d79e51] mb-4 border-b border-gray-700/50 pb-2 uppercase">{cat.nome}</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                {prods.map(p => (
                                                    <div key={p.id} className="bg-[#363539] rounded-2xl p-3 flex shadow border border-gray-700/50 h-full hover:border-[#d79e51]/40 transition-colors">
                                                        <img src={p.imagem_url || 'https://placehold.co/400x300/2b2a2d/8e8e8e?text=X'} alt={p.nome} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                                                        <div className="ml-3 flex flex-col justify-between flex-grow min-w-0">
                                                            <div>
                                                                <h4 className="text-white text-lg leading-tight truncate">{p.nome}</h4>
                                                                <p className="text-gray-400 text-[11px] mt-1 line-clamp-2">{p.descricao}</p>
                                                            </div>
                                                            <div className="flex justify-between items-end mt-2">
                                                                <span className="text-[#d79e51] font-bold text-lg">R$ {p.preco.toFixed(2).replace('.',',')}</span>
                                                                <button onClick={() => adicionarAoCarrinho(p)} className="w-8 h-8 border border-[#d79e51]/50 rounded-full text-[#d79e51] flex items-center justify-center hover:bg-[#d79e51] hover:text-[#1a191c] transition-colors"><i className="fas fa-plus"></i></button>
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
                    {}
                    {view === 'carrinho' && (
                        <div className="pt-6 px-4">
                            <div className="sticky top-0 bg-[#2b2a2d] z-10 pb-4 pt-2 mb-6 border-b border-gray-800">
                                <h2 className="font-bold text-2xl text-white uppercase tracking-wider text-center">Seu Pedido</h2>
                            </div>

                            {carrinho.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center mt-10">
                                    <i className="fas fa-shopping-basket text-4xl text-gray-600 mb-4"></i>
                                    <h3 className="font-medium text-xl text-gray-300 mb-2">Seu carrinho está vazio</h3>
                                    <button onClick={() => setView('cardapio')} className="mt-4 px-6 py-3 border border-[#d79e51] text-[#d79e51] rounded-xl font-bold uppercase hover:bg-[#d79e51] hover:text-[#1a191c] transition-colors">Ver Cardápio</button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-start w-full">
                                    <div className="w-full space-y-4 mb-8">
                                        <h3 className="text-[#d79e51] font-medium uppercase text-sm border-b border-gray-800 pb-2 mb-4">Resumo dos Itens</h3>
                                        {carrinho.map(item => (
                                            <div key={item.id} className="bg-[#363539] rounded-xl p-3 border border-gray-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-white">{item.nome}</h4>
                                                    <span className="text-[#d79e51] font-bold">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <input type="text" placeholder="Observação (Ex: sem cebola)" value={item.observacao} onChange={(e) => atualizarObs(item.id, e.target.value)} className="w-full bg-[#1a191c] text-xs text-gray-300 border border-gray-700 rounded mb-3 px-2 py-1 outline-none focus:border-[#d79e51]" />
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

                                    <div className="w-full bg-[#242326] p-5 rounded-2xl border border-gray-800 shadow-lg">
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-[#d79e51] font-medium uppercase mb-3 text-sm flex items-center"><i className="fas fa-map-marker-alt mr-2"></i> 1. Entrega</h4>
                                                <select value={checkoutForm.tipo} onChange={e => setCheckoutForm({...checkoutForm, tipo: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-3 mb-3 outline-none focus:border-[#d79e51] text-sm">
                                                    <option value="entrega">Entregar no meu endereço</option>
                                                    <option value="retirada">Retirar no estabelecimento</option>
                                                </select>
                                                
                                                {checkoutForm.tipo === 'entrega' && (
                                                    <div className="space-y-3 animate-fade-in">
                                                        <div className="bg-[#1f1e22] p-3 rounded-lg border border-gray-700 text-sm">
                                                            <p className="text-gray-400 text-xs mb-1">Entregar em:</p>
                                                            <p className="text-white">{clienteDados.endereco || 'Nenhum endereço cadastrado no perfil.'}</p>
                                                            {clienteDados.referencia && <p className="text-gray-400 text-xs mt-1">Ref: {clienteDados.referencia}</p>}
                                                            <button onClick={() => setView('perfil')} className="text-[#d79e51] text-xs mt-2 underline">Editar no Perfil</button>
                                                        </div>
                                                        {erroCep && erroCep.includes('Não fazemos entrega') && (
                                                            <div className="bg-red-900/30 p-2 rounded border border-red-700 text-red-400 text-xs text-center font-bold">
                                                                {erroCep}
                                                            </div>
                                                        )}
                                                        
                                                        <div className="relative w-full h-40 bg-[#1a191c] rounded-lg border border-gray-700 overflow-hidden">
                                                            <div id="mapa-raio-container" className="absolute inset-0 w-full h-full z-0"></div>
                                                            {!mapaAberto && <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs z-10"><i className="fas fa-spinner fa-spin mr-2"></i> Carregando Área...</div>}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 text-center"><i className="fas fa-info-circle"></i> O círculo indica nossa área máxima de entrega ({restaurante.raio_entrega}km).</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="text-[#d79e51] font-medium uppercase mb-3 text-sm flex items-center"><i className="fas fa-wallet mr-2"></i> 2. Pagamento</h4>
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    <button onClick={() => setCheckoutForm({...checkoutForm, pagamento: 'Cartão'})} className={`py-2 rounded-lg text-sm font-medium transition-all border ${checkoutForm.pagamento === 'Cartão' ? 'border-[#d79e51] bg-[#363539] text-white' : 'border-gray-700 bg-transparent text-gray-400'}`}>Cartão</button>
                                                    <button onClick={() => setCheckoutForm({...checkoutForm, pagamento: 'Dinheiro'})} className={`py-2 rounded-lg text-sm font-medium transition-all border ${checkoutForm.pagamento === 'Dinheiro' ? 'border-[#d79e51] bg-[#363539] text-white' : 'border-gray-700 bg-transparent text-gray-400'}`}>Dinheiro</button>
                                                </div>
                                                {checkoutForm.pagamento === 'Dinheiro' && (
                                                    <input type="text" placeholder="Troco para quanto?" value={checkoutForm.troco} onChange={e => setCheckoutForm({...checkoutForm, troco: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm animate-fade-in" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-700 pt-4 mt-6 mb-6">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-bold text-xl uppercase">Total</span>
                                                <span className="text-[#d79e51] font-bold text-2xl">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        </div>

                                        <button onClick={finalizarPedido} className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-xl py-4 rounded-xl active:scale-95 transition-transform flex justify-center items-center shadow-lg">
                                            <i className="fas fa-check-circle mr-2"></i> ENVIAR PEDIDO
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Pedidos */}
                    {}
                    {view === 'pedidos' && (
                        <div className="pt-6 px-4">
                            <div className="sticky top-0 bg-[#2b2a2d] z-10 pb-4 pt-2 mb-4 border-b border-gray-800">
                                <h2 className="font-bold text-2xl text-white uppercase tracking-wider text-center">Meus Pedidos</h2>
                            </div>
                            
                            {!clienteAuth ? (
                                <div className="flex flex-col items-center justify-center text-center mt-10">
                                    <i className="fas fa-user-lock text-4xl text-gray-600 mb-4"></i>
                                    <p className="text-gray-400 mb-4">Identifique-se para ver seus pedidos.</p>
                                    <button onClick={() => setView('perfil')} className="px-6 py-2 border border-[#d79e51] text-[#d79e51] rounded-xl font-bold">Ir para Perfil</button>
                                </div>
                            ) : meusPedidos.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">Nenhum pedido feito ainda.</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {meusPedidos.map(p => {
                                        let info = {};
                                        if (typeof p.itens === 'string') {
                                            try { info = JSON.parse(p.itens); } catch(e) {}
                                        } else {
                                            info = p.itens || {};
                                        }
                                        return (
                                            <div key={p.id} className="bg-[#363539] rounded-xl p-4 border border-gray-700">
                                                <div className="flex justify-between items-start mb-2 border-b border-gray-700/50 pb-2">
                                                    <div>
                                                        <h4 className="font-medium text-white text-sm">Pedido #{p.id.substring(0,6).toUpperCase()}</h4>
                                                        <span className="text-[10px] text-gray-500">{new Date(p.created_at).toLocaleString('pt-BR')}</span>
                                                    </div>
                                                    <span className="text-[#d79e51] font-bold text-sm">R$ {Number(p.total).toFixed(2).replace('.',',')}</span>
                                                </div>
                                                <p className="text-xs text-gray-300 mb-3 truncate">{info.lanches?.map(l => `${l.quantidade}x ${l.nome}`).join(', ')}</p>
                                                <div className="flex justify-between items-center bg-[#1f1e22] p-2 rounded-lg">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">Status</span>
                                                    <span className={`text-xs font-bold uppercase ${p.status==='novo'?'text-blue-400':p.status==='preparo'?'text-yellow-400':p.status==='pronto'?'text-green-400':p.status==='rejeitado'?'text-red-400':'text-gray-500'}`}>
                                                        {p.status}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Perfil e Admin Login */}
                    {}
                    {view === 'perfil' && (
                        <div className="pt-10 flex flex-col items-center min-h-[60vh] px-4">
                            <h2 className="font-bold text-2xl text-white uppercase tracking-wider text-center mb-2">Seu Perfil</h2>
                            <p className="text-gray-400 text-sm text-center mb-8">Identifique-se para facilitar seus pedidos.</p>
                            
                            {!clienteAuth ? (
                                <form onSubmit={(e) => { e.preventDefault(); salvarPerfil(); }} className="w-full max-w-sm space-y-4">
                                    <div>
                                        <label className="block text-[#d79e51] text-xs font-bold mb-1 ml-1 uppercase">Nome Completo</label>
                                        <input type="text" value={clienteDados.nome} onChange={e => setClienteDados({...clienteDados, nome: e.target.value})} className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d79e51] transition-colors" required />
                                    </div>
                                    <div>
                                        <label className="block text-[#d79e51] text-xs font-bold mb-1 ml-1 uppercase">Celular (WhatsApp)</label>
                                        <input type="tel" value={clienteDados.celular} onChange={e => setClienteDados({...clienteDados, celular: e.target.value})} className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d79e51] transition-colors" required />
                                    </div>
                                    <div>
                                        <label className="block text-[#d79e51] text-xs font-bold mb-1 ml-1 uppercase">CEP</label>
                                        <input type="text" value={clienteDados.cep || ''} onBlur={(e) => buscarCep(e.target.value)} onChange={e => setClienteDados({...clienteDados, cep: e.target.value})} className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d79e51] transition-colors" placeholder="Ex: 01001-000" />
                                        {cepBuscando && <p className="text-[10px] text-gray-400 mt-1"><i className="fas fa-spinner fa-spin"></i> Buscando endereço e validando área...</p>}
                                        {erroCep && <p className="text-[10px] text-red-400 mt-1 font-bold">{erroCep}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[#d79e51] text-xs font-bold mb-1 ml-1 uppercase">Endereço (Rua, Número, Bairro)</label>
                                        <textarea value={clienteDados.endereco || ''} onChange={e => setClienteDados({...clienteDados, endereco: e.target.value})} className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d79e51] transition-colors" rows="2" placeholder="Digite seu endereço completo"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[#d79e51] text-xs font-bold mb-1 ml-1 uppercase">Ponto de Referência</label>
                                        <input type="text" value={clienteDados.referencia || ''} onChange={e => setClienteDados({...clienteDados, referencia: e.target.value})} className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d79e51] transition-colors" />
                                    </div>
                                    <button type="submit" className="w-full bg-[#d79e51] text-[#1a191c] font-bold text-xl py-3.5 rounded-xl shadow-lg mt-4">ACESSAR / SALVAR</button>
                                </form>
                            ) : (
                                <div className="w-full max-w-sm space-y-4">
                                    <div className="bg-[#1f1e22] border border-gray-700 rounded-xl p-4">
                                        <div className="mb-4 border-b border-gray-700 pb-4">
                                            <span className="block text-gray-400 text-xs font-bold mb-1 uppercase">Nome Completo</span>
                                            <span className="text-white text-lg font-medium">{clienteDados.nome}</span>
                                        </div>
                                        <div className="mb-4 border-b border-gray-700 pb-4">
                                            <span className="block text-gray-400 text-xs font-bold mb-1 uppercase">Celular (WhatsApp)</span>
                                            <span className="text-[#d79e51] text-lg tracking-wide">{clienteDados.celular}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400 text-xs font-bold mb-1 uppercase">Endereço de Entrega</span>
                                            <span className="text-gray-200 text-sm block">{clienteDados.endereco || 'Não cadastrado'}</span>
                                            {clienteDados.referencia && <span className="block text-gray-400 text-xs mt-1">Ref: {clienteDados.referencia}</span>}
                                            {erroCep && erroCep.includes('Não fazemos entrega') && <span className="block text-red-400 text-xs mt-1 font-bold">{erroCep}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => setClienteAuth(false)} className="w-full bg-[#363539] border border-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 mb-2 transition-colors">Editar Dados / Endereço</button>
                                    <button onClick={() => {setClienteAuth(false); setClienteDados({nome:'', celular:'', cep:'', endereco:'', referencia:'', lat:null, lng:null}); setErroCep(''); localStorage.removeItem('cliente_nome'); localStorage.removeItem('cliente_celular'); localStorage.removeItem('cliente_cep'); localStorage.removeItem('cliente_endereco'); localStorage.removeItem('cliente_referencia');}} className="w-full bg-transparent border border-red-900/50 text-red-400 py-3 rounded-xl hover:bg-red-900/10 transition-colors">Sair da Conta</button>
                                </div>
                            )}

                            <div className="mt-8 pt-4 border-t border-gray-800 text-center w-full">
                                <button onClick={() => setView('admin-login')} className="text-[10px] text-gray-600 font-sans uppercase tracking-widest hover:text-[#d79e51] transition-colors">Área Restrita</button>
                            </div>
                        </div>
                    )}

                    {view === 'admin-login' && (
                        <div className="pt-10 flex flex-col items-center px-6 min-h-[60vh]">
                            <h2 className="font-bold text-2xl text-[#d79e51] uppercase tracking-wider text-center mb-2">Acesso Restrito</h2>
                            <p className="text-gray-400 text-sm text-center mb-8">Área exclusiva para gestão.</p>
                            <form onSubmit={loginAdminForm} className="w-full max-w-sm space-y-4">
                                <div>
                                    <label className="block text-[#d79e51] text-xs font-bold mb-1 ml-1 uppercase tracking-wider">E-mail</label>
                                    <input type="email" name="email" placeholder="admin@email.com" className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d79e51] transition-colors text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-[#d79e51] text-xs font-bold mb-1 ml-1 uppercase tracking-wider">Senha</label>
                                    <input type="password" name="senha" placeholder="••••••••" className="w-full bg-[#1f1e22] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d79e51] transition-colors text-sm" required />
                                </div>
                                <button type="submit" className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-xl py-3.5 rounded-xl border border-gray-600 active:scale-95 transition-all mt-4">
                                    ENTRAR NO PAINEL
                                </button>
                                <button type="button" onClick={() => setView('perfil')} className="w-full bg-transparent text-gray-500 hover:text-white text-sm py-2 mt-2">Voltar</button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Navbar Inferior */}
                {}
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#242326]/95 backdrop-blur-xl border-t border-gray-700/50 flex justify-around items-center z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] py-2 pb-safe">
                    <button onClick={() => setView('home')} className={`flex flex-col items-center space-y-1 w-1/5 py-1 transition-colors ${view === 'home' ? 'text-[#d79e51]' : 'text-gray-400 hover:text-white'}`}>
                        <i className="fas fa-home text-xl"></i><span className="text-[10px] font-medium">Início</span>
                    </button>
                    <button onClick={() => setView('cardapio')} className={`flex flex-col items-center space-y-1 w-1/5 py-1 transition-colors ${view === 'cardapio' ? 'text-[#d79e51]' : 'text-gray-400 hover:text-white'}`}>
                        <i className="fas fa-book-open text-xl"></i><span className="text-[10px] font-medium">Cardápio</span>
                    </button>
                    <button onClick={() => setView('pedidos')} className={`flex flex-col items-center space-y-1 w-1/5 py-1 transition-colors ${view === 'pedidos' ? 'text-[#d79e51]' : 'text-gray-400 hover:text-white'}`}>
                        <i className="fas fa-receipt text-xl"></i><span className="text-[10px] font-medium">Pedidos</span>
                    </button>
                    <button onClick={() => setView('carrinho')} className={`relative flex flex-col items-center space-y-1 w-1/5 py-1 transition-colors ${view === 'carrinho' ? 'text-[#d79e51]' : 'text-gray-400 hover:text-white'}`}>
                        <i className="fas fa-shopping-cart text-xl"></i><span className="text-[10px] font-medium">Carrinho</span>
                        {badgeCount > 0 && <span className="absolute -top-1 right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{badgeCount}</span>}
                    </button>
                    <button onClick={() => setView('perfil')} className={`flex flex-col items-center space-y-1 w-1/5 py-1 transition-colors ${view === 'perfil' ? 'text-[#d79e51]' : 'text-gray-400 hover:text-white'}`}>
                        <i className="fas fa-user text-xl"></i><span className="text-[10px] font-medium">Perfil</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
