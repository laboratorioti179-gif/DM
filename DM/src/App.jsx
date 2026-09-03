import React, { useState, useEffect, useRef } from 'react';

/* eslint-disable */

const App = () => {
    const [view, setView] = useState('selecionar_loja');
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
    const [adminEmail, setAdminEmail] = useState('');
    
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

    const isMatriz = adminEmail === 'dogsdomirso.ls@outlook.com';
    const isFranquia2 = adminEmail === 'dogsdomirso.ls2@outlook.com';
    
    const lojaMatriz = lojas.length > 0 ? lojas[0] : null;
    const lojaFranquia = lojas.length > 1 ? lojas[1] : (lojas.length > 0 ? lojas[0] : null);
    
    const adminLojaAtual = isFranquia2 ? lojaFranquia : lojaMatriz;
    const idAdminLogado = adminLojaAtual ? adminLojaAtual.id : null;

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

    const pedidosAdminFiltrados = pedidosAdmin.filter(p => {
        if (!isAdmin || !idAdminLogado) return true;
        let info = {};
        try { info = typeof p.itens === 'string' ? JSON.parse(p.itens) : (p.itens || {}); } catch(e) {}
        return info.filial_id === idAdminLogado;
    });

    const pedidosConcluidos = pedidosAdminFiltrados.filter(p => p.status === 'finalizado');
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
    
    const movimentacoesFiltradas = movimentacoes.filter(m => {
        if (!isAdmin || !idAdminLogado) return true;
        return m.restaurante_id === idAdminLogado;
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
            } else if (!supabase) {
                 const sbUrl = 'https://vzcrfnyfiqsfrwswlvyf.supabase.co';
                 const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Y3JmbnlmaXFzZnJ3c3dsdnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTQ1NjksImV4cCI6MjA5NDc5MDU2OX0.es2duCl9cJQjSH787kCxtUbl-UqqcwedvKF5lf-uc7s';
                 
                 const options = {
                     auth: { persistSession: false },
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
        
        if (nome && cel) {
            setClienteAuth(true);
            setClienteDados({ nome, celular: cel, cep, endereco: end, referencia: ref });
        }
        
        if (localStorage.getItem('isAdminBypass') === 'true') {
            setIsAdmin(true);
            const savedEmail = localStorage.getItem('adminEmail');
            if (savedEmail) setAdminEmail(savedEmail);
        }
        
        const savedWebhook = localStorage.getItem('n8n_webhook_url');
        if (savedWebhook) {
            setPromoForm(prev => ({ ...prev, webhookUrl: savedWebhook }));
            setWebhookEditavel(false);
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

                const { data: restData, error: restError } = await supabase.from('restaurante').select('*').order('created_at', { ascending: true });
                if (restError && restError.code !== 'PGRST116') throw restError; 
                
                if (restData && restData.length > 0) {
                    setLojas(restData);
                    
                    if (isAdmin) {
                        const emailAtivo = adminEmail || localStorage.getItem('adminEmail');
                        const adminEhFranquia = emailAtivo === 'dogsdomirso.ls2@outlook.com';
                        const lojaGestor = adminEhFranquia ? (restData.length > 1 ? restData[1] : restData[0]) : restData[0];
                        setRestaurante(lojaGestor);
                    } else {
                        const selectedId = localStorage.getItem('loja_selecionada');
                        const lojaAtual = restData.find(r => r.id === selectedId) || restData[0];
                        setRestaurante(lojaAtual);
                    }
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

        const isInIframe = () => {
            try { return window.self !== window.top; }
            catch (e) { return true; }
        };

        let channel = null;

        if (!isInIframe()) {
             channel = supabase.channel('realtime-cardapio')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => carregarDados())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, () => carregarDados())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurante' }, () => carregarDados())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => carregarDados())
                .subscribe();
        } else {
             console.warn('Realtime desabilitado para o ambiente de preview.');
        }

        return () => {
            if (channel) {
                try { supabase.removeChannel(channel); } catch (e) {}
            }
        };
    }, [supabase, isAdmin, clienteAuth, clienteDados.celular, adminEmail]);

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
            localStorage.setItem('adminEmail', email);
            setAdminEmail(email);
            setIsAdmin(true);
            carregarPedidosAdminLocal();
            carregarMovimentacoes();
        } else if(email === 'dogsdomirso.ls2@outlook.com' && senha === 'Dogs2@2026') {
            localStorage.setItem('isAdminBypass', 'true');
            localStorage.setItem('adminEmail', email);
            setAdminEmail(email);
            setIsAdmin(true);
            carregarPedidosAdminLocal();
            carregarMovimentacoes();
        } else {
            alert("Credenciais Inválidas");
        }
    };

    const sairAdmin = () => {
        localStorage.removeItem('isAdminBypass');
        localStorage.removeItem('adminEmail');
        setAdminEmail('');
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

        try {
            const catIdFinal = produtoEditando.categoria_id || (categorias.length > 0 ? categorias[0].id : null);
            
            const payload = {
                nome: produtoEditando.nome,
                preco: produtoEditando.preco,
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

    const totalCarrinho = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const badgeCount = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

    if (isAdmin) {
        return (
            <div className="fixed inset-0 bg-[#1a191c] flex w-full h-full text-white font-sans overflow-hidden z-50">
                
                {/* Textura de Fundo SVG Pattern Gestor */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30,45 C30,35 40,35 40,45 L40,75 C40,85 30,85 30,75 Z M32,45 L38,45 L38,75 L32,75 Z M70,40 L90,40 L88,80 L72,80 Z M74,42 L86,42 L84,78 L76,78 Z' fill='%23d79e51' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

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
                            {isMatriz && (
                                <li>
                                    <button onClick={() => setAdminView('nova_loja')} className={`w-full flex items-center px-4 py-3 rounded-lg border transition-all ${adminView === 'nova_loja' ? 'bg-[#363539] text-white border-gray-700 shadow-sm' : 'border-transparent text-gray-400 hover:bg-[#363539] hover:text-white'}`}>
                                        <i className={`fas fa-store w-6 ${adminView === 'nova_loja' ? 'text-[#d79e51]' : ''}`}></i>
                                        <span className="text-sm font-medium">Nova Loja</span>
                                    </button>
                                </li>
                            )}
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

                <div className="flex-1 flex flex-col overflow-hidden relative w-full z-10">
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
                        {adminView === 'pedidos' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 h-full items-start">
                                {['novo', 'preparo', 'pronto'].map(status => (
                                    <div key={status} className="bg-[#242326] rounded-xl border border-gray-800 flex flex-col max-h-[80vh] shadow-sm relative z-10">
                                        <div className="p-3.5 border-b border-gray-800 bg-[#1f1e22] rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                                            <h4 className="text-white font-medium tracking-wide uppercase text-sm">{status === 'novo' ? 'Novos Pedidos' : status === 'preparo' ? 'Em Preparo' : 'Prontos / Entrega'}</h4>
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
                                            {pedidosAdminFiltrados.filter(p => p.status === status).length === 0 && (
                                                <div className="text-gray-500 text-center text-sm mt-4">Vazio</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Area do Cardapio */}
                        {adminView === 'cardapio' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 relative z-10">
                                {produtos.filter(p => p.restaurante_id === idAdminLogado || (!p.restaurante_id && isMatriz)).map(p => {
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
                                {produtos.filter(p => p.restaurante_id === idAdminLogado || (!p.restaurante_id && isMatriz)).length === 0 && (
                                    <div className="col-span-full text-center text-gray-500 py-10">
                                        Nenhum produto cadastrado para esta loja ainda.
                                    </div>
                                )}
                            </div>
                        )}

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
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                        <div className="text-sm font-bold text-gray-300">
                                            Saldo Geral: <span className={saldoGeral >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>R$ {saldoGeral.toFixed(2).replace('.', ',')}</span>
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
                                                <input type="text" value={promoForm.webhookUrl} readOnly={!webhookEditavel} onChange={(e) => setPromoForm({...promoForm, webhookUrl: e.target.value})} className={`w-full bg-[#1a191c] text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-[#d79e51] text-sm ${!webhookEditavel ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="https://seu-n8n.com/webhook/..." />
                                                {webhookEditavel ? (
                                                    <button onClick={() => { setWebhookEditavel(false); localStorage.setItem('n8n_webhook_url', promoForm.webhookUrl); }} className="px-4 py-2 bg-[#d79e51] hover:bg-[#e8b776] text-[#1a191c] rounded-lg font-bold text-xs shadow-md transition-all whitespace-nowrap">
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
        <div className="min-h-screen bg-[#1a191c] flex justify-center items-start text-white font-sans w-full relative overflow-hidden">
            
            {/* Textura de Fundo SVG Pattern Cliente */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] md:opacity-[0.08]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30,45 C30,35 40,35 40,45 L40,75 C40,85 30,85 30,75 Z M32,45 L38,45 L38,75 L32,75 Z M70,40 L90,40 L88,80 L72,80 Z M74,42 L86,42 L84,78 L76,78 Z' fill='%23d79e51' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

            {/* Container Principal Inteligente (Fino no celular, Expandido no Desktop) */}
            <div className="w-full max-w-md md:max-w-4xl lg:max-w-6xl xl:max-w-7xl min-h-screen bg-[#2b2a2d] relative flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] md:shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-300 mx-auto z-10">
                
                {/* Header fixo da loja */}
                <div className="bg-[#1a191c] flex flex-col md:flex-row justify-center md:justify-between items-center py-3 md:py-4 px-6 border-b border-gray-800 text-xs md:text-sm shadow-md z-20">
                    {lojas.length > 1 && (
                        <button onClick={() => setView('selecionar_loja')} className="text-white font-bold mb-2 md:mb-0 flex items-center hover:text-[#d79e51] transition-colors text-sm md:text-base">
                            {restaurante.nome} <i className="fas fa-chevron-down ml-2 text-[10px] md:text-xs"></i>
                        </button>
                    )}
                    <div className="flex justify-center items-center bg-[#242326] px-4 py-1.5 md:py-2 md:px-5 rounded-full border border-gray-800 shadow-inner">
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
                <div className="flex-1 overflow-y-auto pb-32 md:pb-28 relative">
                    
                    {/* View Selecionar Loja */}
                    {view === 'selecionar_loja' && (
                        <div className="pt-12 md:pt-20 px-6 flex flex-col items-center min-h-[60vh] max-w-4xl mx-auto">
                            <h2 className="font-black text-3xl md:text-4xl text-white uppercase tracking-widest text-center mb-2">Selecione a Loja</h2>
                            <p className="text-gray-400 text-base md:text-lg text-center mb-10 md:mb-14">Escolha de qual unidade você deseja pedir hoje.</p>
                            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {lojas.map(loja => (
                                    <button key={loja.id} onClick={() => {
                                        setRestaurante(loja);
                                        localStorage.setItem('loja_selecionada', loja.id);
                                        setView('home');
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
                                <div className="w-36 h-36 md:w-56 md:h-56 rounded-full border-4 md:border-8 border-[#d79e51] flex flex-col items-center justify-center -mt-18 md:-mt-28 z-10 bg-[#1f1e22] shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden relative">
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
                                    {produtos.filter(p => p.is_destaque && p.restaurante_id === restaurante.id).map(p => (
                                        <div key={p.id} className="w-[85vw] max-w-[300px] md:w-full md:max-w-none bg-[#363539] rounded-3xl overflow-hidden shadow-lg flex-none md:flex-auto border border-gray-700/50 snap-center hover:border-[#d79e51]/50 hover:shadow-[0_15px_35px_rgba(215,158,81,0.15)] hover:-translate-y-2 transition-all duration-300 group cursor-pointer" onClick={() => adicionarAoCarrinho(p)}>
                                            <div className="h-48 md:h-64 relative overflow-hidden">
                                                <img src={p.imagem_url || 'https://placehold.co/400x300/2b2a2d/8e8e8e?text=Foto'} alt={p.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#2c2b2e] via-[#2c2b2e]/20 to-transparent opacity-90"></div>
                                                <div className="absolute top-4 left-4 bg-[#d79e51] text-[#1a191c] text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                                    Mais Vendido
                                                </div>
                                            </div>
                                            <div className="p-5 md:p-7 relative bg-[#2c2b2e]">
                                                <h4 className="font-bold text-lg md:text-2xl text-white uppercase truncate pr-14">{p.nome}</h4>
                                                <p className="text-gray-400 text-xs md:text-base mt-2 line-clamp-2 md:line-clamp-3 h-10 md:h-14">{p.descricao}</p>
                                                <div className="mt-4 md:mt-6 flex items-end justify-between">
                                                    <p className="text-[#d79e51] font-black text-2xl md:text-3xl">R$ {p.preco.toFixed(2).replace('.',',')}</p>
                                                    <button onClick={(e) => { e.stopPropagation(); adicionarAoCarrinho(p); }} className="absolute -top-7 right-6 w-14 h-14 bg-[#d79e51] rounded-full flex items-center justify-center text-[#1a191c] text-2xl shadow-[0_8px_20px_rgba(215,158,81,0.5)] group-hover:scale-110 active:scale-95 transition-all duration-300"><i className="fas fa-plus"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {produtos.filter(p => p.is_destaque && p.restaurante_id === restaurante.id).length === 0 && !dbLoading && (
                                        <p className="text-gray-500 text-sm md:text-base italic">Nenhum destaque no momento.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Cardapio */}
                    {view === 'cardapio' && (
                        <div className="pt-6 px-4 md:px-10 max-w-[1400px] mx-auto">
                            <div className="sticky top-0 bg-[#2b2a2d]/95 backdrop-blur-xl z-20 pb-4 pt-4 md:pt-6 mb-6 md:mb-10 border-b border-gray-800">
                                <h2 className="font-black text-2xl md:text-4xl text-white uppercase tracking-widest text-center">Nosso Cardápio</h2>
                            </div>
                            
                            <div className="flex overflow-x-auto md:flex-wrap md:justify-center gap-3 md:gap-4 pb-4 mb-8 md:mb-12 hide-scrollbar snap-x">
                                {categorias.map(c => (
                                    <button key={c.id} className="flex-none snap-start bg-[#1f1e22] border border-gray-700 px-5 md:px-8 py-2.5 md:py-3.5 rounded-full whitespace-nowrap text-sm md:text-base font-bold text-gray-300 hover:text-[#1a191c] hover:bg-[#d79e51] hover:border-[#d79e51] transition-all duration-300 shadow-sm hover:shadow-lg">
                                        {c.nome}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-10 md:space-y-16">
                                {dbLoading && <p className="text-center text-gray-500 py-10 text-lg md:text-xl"><i className="fas fa-spinner fa-spin mr-3"></i>Carregando delícias...</p>}
                                {!dbLoading && categorias.map(cat => {
                                    const prods = produtos.filter(p => p.categoria_id === cat.id && p.ativo && p.restaurante_id === restaurante.id);
                                    if(prods.length === 0) return null;
                                    return (
                                        <div key={cat.id} className="animate-fade-in">
                                            <div className="flex items-center mb-6 md:mb-8">
                                                <h3 className="text-xl md:text-3xl font-black text-[#d79e51] uppercase tracking-widest">{cat.nome}</h3>
                                                <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-700 to-transparent ml-4 md:ml-6"></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                                {prods.map(p => (
                                                    <div key={p.id} className="bg-[#363539] rounded-3xl p-3 md:p-5 flex shadow-md border border-gray-700/50 h-full hover:border-[#d79e51]/50 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer" onClick={() => adicionarAoCarrinho(p)}>
                                                        <div className="overflow-hidden rounded-2xl w-28 h-28 md:w-40 md:h-40 flex-shrink-0 relative">
                                                            <img src={p.imagem_url || 'https://placehold.co/400x300/2b2a2d/8e8e8e?text=X'} alt={p.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                                        </div>
                                                        <div className="ml-4 md:ml-6 flex flex-col justify-between flex-grow min-w-0 py-1 md:py-2">
                                                            <div>
                                                                <h4 className="text-white text-lg md:text-2xl font-bold leading-tight truncate group-hover:text-[#d79e51] transition-colors">{p.nome}</h4>
                                                                <p className="text-gray-400 text-xs md:text-sm mt-1.5 md:mt-2.5 line-clamp-2 md:line-clamp-3 leading-relaxed">{p.descricao}</p>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-3 md:mt-4">
                                                                <span className="text-[#d79e51] font-black text-lg md:text-2xl">R$ {p.preco.toFixed(2).replace('.',',')}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); adicionarAoCarrinho(p); }} className="w-9 h-9 md:w-12 md:h-12 border-2 border-[#d79e51]/50 rounded-full text-[#d79e51] flex items-center justify-center hover:bg-[#d79e51] hover:text-[#1a191c] transition-all duration-300 active:scale-90 group-hover:shadow-[0_5px_15px_rgba(215,158,81,0.3)]"><i className="fas fa-plus md:text-lg"></i></button>
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
                        <div className="pt-6 px-4 md:px-10 max-w-[1400px] mx-auto">
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
                                        {carrinho.map(item => (
                                            <div key={item.id} className="bg-[#363539] rounded-2xl md:rounded-3xl p-4 md:p-6 border border-gray-700/50 shadow-md hover:border-gray-500 transition-colors">
                                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                                    <h4 className="font-bold text-white text-base md:text-xl pr-4">{item.nome}</h4>
                                                    <span className="text-[#d79e51] font-black text-lg md:text-2xl whitespace-nowrap">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <input type="text" placeholder="Alguma observação? (Ex: sem cebola)" value={item.observacao} onChange={(e) => atualizarObs(item.id, e.target.value)} className="w-full bg-[#1a191c] text-sm md:text-base text-gray-300 border border-gray-700/80 rounded-xl mb-4 md:mb-5 px-4 md:px-5 py-2.5 md:py-3.5 outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm md:text-base text-gray-400 font-medium">R$ {item.preco.toFixed(2).replace('.', ',')} / un</span>
                                                    <div className="flex items-center space-x-1 md:space-x-2 bg-[#1a191c] rounded-xl p-1 border border-gray-800 shadow-inner">
                                                        <button onClick={() => alterarQuantidade(item.id, -1)} className="text-[#d79e51] hover:bg-[#363539] rounded-lg w-8 h-8 md:w-10 md:h-10 flex justify-center items-center font-bold text-xl md:text-2xl transition-colors">-</button>
                                                        <span className="text-white font-black w-8 md:w-10 text-center md:text-lg">{item.quantidade}</span>
                                                        <button onClick={() => alterarQuantidade(item.id, 1)} className="text-[#d79e51] hover:bg-[#363539] rounded-lg w-8 h-8 md:w-10 md:h-10 flex justify-center items-center font-bold text-xl md:text-2xl transition-colors">+</button>
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
                                                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
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
                                                <span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                            {checkoutForm.tipo === 'entrega' && (
                                                <div className="flex justify-between items-center mb-5 text-gray-400 text-sm md:text-base font-medium">
                                                    <span>Taxa de Entrega</span>
                                                    <span className="text-[#d79e51] font-bold">A combinar</span>
                                                </div>
                                            )}
                                            <div className="border-t border-gray-800 pt-4 mt-2 flex justify-between items-center">
                                                <span className="text-white font-black text-lg md:text-2xl uppercase tracking-wider">Total</span>
                                                <span className="text-[#d79e51] font-black text-2xl md:text-4xl">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        </div>

                                        <button onClick={finalizarPedido} className="w-full mt-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-[#1a191c] font-black tracking-widest text-lg md:text-xl py-4 md:py-6 rounded-2xl md:rounded-3xl active:scale-95 transition-all duration-300 flex justify-center items-center shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.4)]">
                                            <i className="fas fa-check-circle mr-3 text-2xl"></i> CONFIRMAR PEDIDO
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Pedidos */}
                    {view === 'pedidos' && (
                        <div className="pt-6 px-4 md:px-10 max-w-[1400px] mx-auto">
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
                                                        <h4 className="font-black text-white text-lg md:text-xl">Pedido #{p.id.substring(0,6).toUpperCase()}</h4>
                                                        <span className="text-xs md:text-sm text-gray-400 font-medium flex items-center mt-1.5"><i className="far fa-clock mr-2 text-[#d79e51]"></i> {new Date(p.created_at).toLocaleString('pt-BR')}</span>
                                                    </div>
                                                    <span className="text-[#d79e51] font-black text-xl md:text-2xl">R$ {Number(p.total).toFixed(2).replace('.',',')}</span>
                                                </div>
                                                <div className="bg-[#242326] rounded-2xl p-4 mb-5 flex-1 border border-gray-800 shadow-inner">
                                                    <p className="text-sm md:text-base text-gray-300 leading-relaxed line-clamp-4 font-medium">
                                                        {info.lanches?.map(l => `${l.quantidade}x ${l.nome}`).join(', ')}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-center bg-[#1a191c] px-4 md:px-5 py-3 md:py-4 rounded-2xl border border-gray-800">
                                                    <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest">Status Atual</span>
                                                    <span className={`text-sm md:text-base font-black uppercase tracking-wider ${p.status==='novo'?'text-blue-400':p.status==='preparo'?'text-yellow-400 animate-pulse':p.status==='pronto'?'text-emerald-400':p.status==='rejeitado'?'text-red-400':'text-gray-500'}`}>
                                                        {p.status === 'novo' ? 'Aguardando' : p.status === 'preparo' ? 'Em Preparo' : p.status === 'pronto' ? 'A Caminho' : p.status}
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
                    {view === 'perfil' && (
                        <div className="pt-10 md:pt-16 flex flex-col items-center min-h-[60vh] px-4 max-w-4xl mx-auto">
                            <h2 className="font-black text-3xl md:text-5xl text-white uppercase tracking-widest text-center mb-3">Seu Perfil</h2>
                            <p className="text-gray-400 text-sm md:text-lg text-center mb-10 md:mb-14">Configure seus dados para agilizar seus próximos pedidos.</p>
                            
                            {!clienteAuth ? (
                                <form onSubmit={(e) => { e.preventDefault(); salvarPerfil(); }} className="w-full max-w-md md:max-w-xl space-y-5 md:space-y-6 bg-[#1f1e22] p-6 md:p-10 rounded-3xl border border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                    <div>
                                        <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 md:mb-3 ml-1 uppercase tracking-widest">Nome Completo</label>
                                        <input type="text" value={clienteDados.nome} onChange={e => setClienteDados({...clienteDados, nome: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all text-base md:text-lg" required placeholder="Como gosta de ser chamado?" />
                                    </div>
                                    <div>
                                        <label className="block text-[#d79e51] text-xs md:text-sm font-bold mb-2 md:mb-3 ml-1 uppercase tracking-widest">Celular (WhatsApp)</label>
                                        <input type="tel" value={clienteDados.celular} onChange={e => setClienteDados({...clienteDados, celular: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-[#d79e51] focus:ring-1 focus:ring-[#d79e51] transition-all text-base md:text-lg" required placeholder="(00) 90000-0000" />
                                    </div>
                                    <div className="border-t border-gray-800 pt-6 md:pt-8 mt-4 md:mt-6">
                                        <h4 className="text-white text-base md:text-lg font-black uppercase tracking-widest mb-5 flex items-center"><i className="fas fa-map-marker-alt text-[#d79e51] mr-3"></i> Endereço de Entrega</h4>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-wider">CEP</label>
                                                <input type="text" value={clienteDados.cep || ''} onBlur={(e) => buscarCep(e.target.value)} onChange={e => setClienteDados({...clienteDados, cep: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-gray-500 transition-all text-base" placeholder="00000-000" />
                                                {cepBuscando && <p className="text-xs md:text-sm text-[#d79e51] mt-3 font-medium flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i> Buscando endereço e validando área...</p>}
                                                {erroCep && <p className="text-xs md:text-sm text-red-400 mt-3 font-bold flex items-center bg-red-500/10 p-3 rounded-lg"><i className="fas fa-exclamation-circle mr-2"></i>{erroCep}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-wider">Endereço Completo</label>
                                                <textarea value={clienteDados.endereco || ''} onChange={e => setClienteDados({...clienteDados, endereco: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-gray-500 transition-all resize-none text-base" rows="2" placeholder="Rua, Número, Bairro"></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 ml-1 uppercase tracking-wider">Ponto de Referência</label>
                                                <input type="text" value={clienteDados.referencia || ''} onChange={e => setClienteDados({...clienteDados, referencia: e.target.value})} className="w-full bg-[#1a191c] text-white border border-gray-700/80 rounded-xl md:rounded-2xl px-5 py-4 focus:outline-none focus:border-gray-500 transition-all text-base" placeholder="Apto, Bloco, Casa de esquina..." />
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-[#d79e51] text-[#1a191c] font-black text-xl md:text-2xl py-4 md:py-5 rounded-xl md:rounded-2xl shadow-[0_10px_30px_rgba(215,158,81,0.3)] hover:bg-[#e8b776] hover:shadow-[0_15px_40px_rgba(215,158,81,0.4)] active:scale-95 transition-all mt-8 md:mt-10 tracking-wider">ACESSAR / SALVAR</button>
                                </form>
                            ) : (
                                <div className="w-full max-w-md md:max-w-xl space-y-4 md:space-y-6">
                                    <div className="bg-[#1f1e22] border border-gray-800 rounded-3xl p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                                        <div className="mb-6 md:mb-8 border-b border-gray-800 pb-6 md:pb-8 flex items-center">
                                            <div className="w-14 h-14 md:w-20 md:h-20 bg-[#363539] rounded-full flex items-center justify-center mr-4 md:mr-6 text-white text-2xl md:text-3xl border-2 border-gray-700 shadow-inner">
                                                <i className="fas fa-user"></i>
                                            </div>
                                            <div>
                                                <span className="block text-gray-500 text-xs md:text-sm font-bold mb-1 md:mb-2 uppercase tracking-widest">Nome Completo</span>
                                                <span className="text-white text-xl md:text-3xl font-black tracking-wide">{clienteDados.nome}</span>
                                            </div>
                                        </div>
                                        <div className="mb-6 md:mb-8 border-b border-gray-800 pb-6 md:pb-8">
                                            <span className="block text-gray-500 text-xs md:text-sm font-bold mb-3 uppercase tracking-widest flex items-center"><i className="fab fa-whatsapp mr-2 text-[#d79e51] text-base md:text-lg"></i> Celular</span>
                                            <span className="text-white text-lg md:text-xl font-bold tracking-widest bg-[#1a191c] px-5 py-3 md:py-4 rounded-xl md:rounded-2xl inline-block border border-gray-800 shadow-inner">{clienteDados.celular}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 text-xs md:text-sm font-bold mb-3 uppercase tracking-widest flex items-center"><i className="fas fa-map-marker-alt mr-2 text-[#d79e51] text-base md:text-lg"></i> Endereço de Entrega</span>
                                            <div className="bg-[#1a191c] p-5 md:p-6 rounded-2xl border border-gray-800 shadow-inner">
                                                <span className="text-gray-200 text-sm md:text-base block leading-relaxed font-medium">{clienteDados.endereco || <span className="italic text-gray-500">Não cadastrado</span>}</span>
                                                {clienteDados.referencia && <span className="block text-gray-400 text-xs md:text-sm mt-3 border-t border-gray-800 pt-3"><strong className="text-gray-500 uppercase tracking-widest mr-2">Ref:</strong> {clienteDados.referencia}</span>}
                                                {erroCep && erroCep.includes('Não fazemos entrega') && <span className="block text-red-400 text-xs md:text-sm mt-3 font-bold p-3 bg-red-500/10 rounded-xl"><i className="fas fa-exclamation-triangle mr-2"></i> {erroCep}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 md:gap-5 mt-6 md:mt-8">
                                        <button onClick={() => setClienteAuth(false)} className="w-full bg-[#363539] border border-gray-700 text-white py-4 md:py-5 rounded-2xl font-bold text-sm md:text-base uppercase tracking-wider hover:bg-[#d79e51] hover:text-[#1a191c] hover:border-[#d79e51] transition-all shadow-md">Editar Perfil</button>
                                        <button onClick={() => {setClienteAuth(false); setClienteDados({nome:'', celular:'', cep:'', endereco:'', referencia:'', lat:null, lng:null}); setErroCep(''); localStorage.removeItem('cliente_nome'); localStorage.removeItem('cliente_celular'); localStorage.removeItem('cliente_cep'); localStorage.removeItem('cliente_endereco'); localStorage.removeItem('cliente_referencia');}} className="w-full bg-[#1a191c] border border-red-900/50 text-red-400 py-4 md:py-5 rounded-2xl font-bold text-sm md:text-base uppercase tracking-wider hover:bg-red-900/20 hover:text-red-300 transition-all shadow-md">Sair da Conta</button>
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
                        <div className="pt-16 md:pt-24 flex flex-col items-center px-6 min-h-[60vh] max-w-md md:max-w-lg mx-auto">
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
                                <button type="submit" className="w-full bg-[#d79e51] hover:bg-[#e8b776] text-[#1a191c] font-black tracking-widest text-lg md:text-xl py-4 md:py-5 rounded-xl md:rounded-2xl shadow-[0_10px_25px_rgba(215,158,81,0.3)] active:scale-95 transition-all mt-8">
                                    ENTRAR NO PAINEL
                                </button>
                                <button type="button" onClick={() => setView('perfil')} className="w-full bg-transparent text-gray-500 hover:text-white font-bold text-sm md:text-base uppercase tracking-wider py-3 md:py-4 mt-2 rounded-xl transition-colors border border-transparent hover:border-gray-700">Voltar para a Loja</button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Navbar Inferior Responsiva (Dock Flutuante no Desktop) */}
                <div className="fixed bottom-0 md:bottom-8 left-0 right-0 w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto bg-[#1a191c]/95 md:bg-[#242326]/90 backdrop-blur-xl border-t md:border border-gray-800 flex justify-around items-center z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] md:shadow-[0_20px_50px_rgba(0,0,0,0.8)] py-1.5 md:py-3 pb-safe md:pb-3 md:rounded-[2rem]">
                    <button onClick={() => setView('home')} className={`flex flex-col items-center justify-center space-y-1 w-1/5 py-2 md:py-2.5 transition-all duration-300 rounded-2xl md:hover:bg-[#363539] ${view === 'home' ? 'text-[#d79e51] md:bg-[#363539]' : 'text-gray-400 hover:text-white'}`}>
                        <i className={`fas fa-home text-xl md:text-[28px] mb-0.5 md:mb-1 ${view === 'home' ? 'animate-bounce-short' : ''}`}></i>
                        <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Início</span>
                    </button>
                    <button onClick={() => setView('cardapio')} className={`flex flex-col items-center justify-center space-y-1 w-1/5 py-2 md:py-2.5 transition-all duration-300 rounded-2xl md:hover:bg-[#363539] ${view === 'cardapio' ? 'text-[#d79e51] md:bg-[#363539]' : 'text-gray-400 hover:text-white'}`}>
                        <i className={`fas fa-book-open text-xl md:text-[28px] mb-0.5 md:mb-1 ${view === 'cardapio' ? 'animate-bounce-short' : ''}`}></i>
                        <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Cardápio</span>
                    </button>
                    <button onClick={() => setView('pedidos')} className={`flex flex-col items-center justify-center space-y-1 w-1/5 py-2 md:py-2.5 transition-all duration-300 rounded-2xl md:hover:bg-[#363539] ${view === 'pedidos' ? 'text-[#d79e51] md:bg-[#363539]' : 'text-gray-400 hover:text-white'}`}>
                        <i className={`fas fa-receipt text-xl md:text-[28px] mb-0.5 md:mb-1 ${view === 'pedidos' ? 'animate-bounce-short' : ''}`}></i>
                        <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Pedidos</span>
                    </button>
                    <button onClick={() => setView('carrinho')} className={`relative flex flex-col items-center justify-center space-y-1 w-1/5 py-2 md:py-2.5 transition-all duration-300 rounded-2xl md:hover:bg-[#363539] ${view === 'carrinho' ? 'text-[#d79e51] md:bg-[#363539]' : 'text-gray-400 hover:text-white'}`}>
                        <div className="relative">
                            <i className={`fas fa-shopping-bag text-xl md:text-[28px] mb-0.5 md:mb-1 ${view === 'carrinho' ? 'animate-bounce-short' : ''}`}></i>
                            {badgeCount > 0 && <span className="absolute -top-2 -right-3 md:-top-3 md:-right-4 bg-red-500 border-2 border-[#1a191c] md:border-[#242326] text-white text-[10px] md:text-xs font-black min-w-[20px] md:min-w-[24px] h-[20px] md:h-[24px] px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">{badgeCount}</span>}
                        </div>
                        <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest mt-0.5 md:mt-1">Carrinho</span>
                    </button>
                    <button onClick={() => setView('perfil')} className={`flex flex-col items-center justify-center space-y-1 w-1/5 py-2 md:py-2.5 transition-all duration-300 rounded-2xl md:hover:bg-[#363539] ${view === 'perfil' ? 'text-[#d79e51] md:bg-[#363539]' : 'text-gray-400 hover:text-white'}`}>
                        <i className={`fas fa-user text-xl md:text-[28px] mb-0.5 md:mb-1 ${view === 'perfil' ? 'animate-bounce-short' : ''}`}></i>
                        <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Perfil</span>
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
            </div>
        </div>
    );
};

export default App;
