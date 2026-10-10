import React, { useState, useMemo } from 'react';
import {
  Send,
  Mail,
  Users,
  Smartphone,
  Sparkles,
  Megaphone,
  Radio,
  ShoppingCart,
  Gift,
  Zap,
  BarChart2,
  FileText,
  Award,
  Globe,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  Printer,
  Share2,
  Download,
  Flame,
  Star,
  CheckCircle2,
  AlertCircle,
  Tag,
  RefreshCw,
  QrCode,
  BellRing,
  Split,
  Activity
} from 'lucide-react';
import { CustomerUser, Order, Product, FranchiseTenant, AppBrandingConfig } from '../types';
import { DOMAIN_OFFICIAL } from '../utils/messageTemplates';
import { useAppStore } from '../store/useAppStore';

interface AdminMarketingManagerProps {
  customers: CustomerUser[];
  orders?: Order[];
  products?: Product[];
  bcvRate?: number;
  franchises?: FranchiseTenant[];
  branding?: AppBrandingConfig;
  onShowNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

// 1. Abandoned Cart Mock/Derived Structure
interface AbandonedCartItem {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  itemsSummary: string;
  totalUsd: number;
  totalBs: number;
  hoursAgo: number;
  date: string;
  status: 'pending' | 'contacted' | 'recovered' | 'discarded';
  discountCode: string;
  notes: string;
}

// 2. Referral Item Structure
interface ReferralAffiliate {
  id: string;
  referrerName: string;
  referrerPhone: string;
  code: string;
  link: string;
  clicks: number;
  convertedOrders: number;
  totalVolumeUsd: number;
  earnedRewardUsd: number;
  paidRewardUsd: number;
  status: 'active' | 'paused';
}

// 3. Flash Campaign Structure
interface FlashCampaign {
  id: string;
  title: string;
  badge: string;
  discountPercent: number;
  couponCode: string;
  startsAt: string;
  endsAt: string;
  countdownHours: number;
  active: boolean;
  themeColor: 'purple' | 'amber' | 'emerald' | 'rose';
  targetServices: string;
}

// 6. Streaming Pass Reward
interface StreamingPassReward {
  id: string;
  title: string;
  costPoints: number;
  description: string;
  service: string;
  badge: string;
}

export const AdminMarketingManager: React.FC<AdminMarketingManagerProps> = ({
  customers,
  orders = [],
  products = [],
  bcvRate = 36.85,
  franchises = [],
  branding,
  onShowNotification
}) => {
  // Navigation: 7 Main Marketing Subtabs + Channels/Broadcast
  type MarketingSubTab =
    | 'abandoned_cart'      // 1. Recuperación Carritos WhatsApp
    | 'referrals'           // 2. Programa de Referidos & Recompensas Wallet
    | 'flash_campaigns'     // 3. Campañas Flash & Banners Programables
    | 'rfm_segmentation'    // 4. Segmentación RFM Inteligente
    | 'catalog_generator'   // 5. Generador Catálogo PDF / Imagen Estados
    | 'streaming_pass'      // 6. Fidelización Puntos & Streaming Pass
    | 'affiliate_landings'  // 7. Landing Pages Dinámicas Franquicias
    | 'push_broadcast'      // 8. Push Web para Estrenos & Promociones
    | 'ab_testing'          // 9. Pruebas A/B de Copys y Ofertas
    | 'conversion_pixel'    // 10. Pixel de Rastreo y Métricas (Meta/TikTok)
    | 'campaigns'           // Difusión Masiva y Mensajería Directa
    | 'telegram_channels';  // Canales & Comunidades VIP

  const [subTab, setSubTab] = useState<MarketingSubTab>('abandoned_cart');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowNotification('success', '¡Copiado al portapapeles!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // ==========================================
  // 1. MOTOR DE RECUPERACIÓN DE CARRITOS & COTIZACIONES
  // ==========================================
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCartItem[]>([
    {
      id: 'cart-1',
      customerName: 'Carlos Mendoza',
      phone: '584124567890',
      email: 'carlos.mendoza@gmail.com',
      itemsSummary: 'Netflix 4K Ultra HD (1 Mes) + Disney+ Premium',
      totalUsd: 6.0,
      totalBs: Number((6.0 * bcvRate).toFixed(2)),
      hoursAgo: 3,
      date: 'Hoy, hace 3 horas',
      status: 'pending',
      discountCode: 'RECUPERA5',
      notes: 'Llegó hasta la pantalla de pago móvil pero no adjuntó captura'
    },
    {
      id: 'cart-2',
      customerName: 'Valeria Rivas',
      phone: '584249876543',
      email: 'valeria.rivas@gmail.com',
      itemsSummary: 'Combo HBO Max + Spotify Familiar',
      totalUsd: 5.5,
      totalBs: Number((5.5 * bcvRate).toFixed(2)),
      hoursAgo: 14,
      date: 'Ayer por la tarde',
      status: 'contacted',
      discountCode: 'VUELVE10',
      notes: 'Se le envió mensaje por WhatsApp ayer a las 6pm'
    },
    {
      id: 'cart-3',
      customerName: 'Alejandro Colmenares',
      phone: '584161122334',
      email: 'alejandro.c@hotmail.com',
      itemsSummary: 'Cuenta Completa Netflix (5 Pantallas)',
      totalUsd: 11.0,
      totalBs: Number((11.0 * bcvRate).toFixed(2)),
      hoursAgo: 26,
      date: 'Hace 1 día',
      status: 'recovered',
      discountCode: 'FLASHPROMO',
      notes: 'Completó pago vía Zeny tras recordatorio de garantía'
    }
  ]);

  const [cartFilterStatus, setCartFilterStatus] = useState<string>('todos');

  const filteredCarts = useMemo(() => {
    if (cartFilterStatus === 'todos') return abandonedCarts;
    return abandonedCarts.filter(c => c.status === cartFilterStatus);
  }, [abandonedCarts, cartFilterStatus]);

  const handleUpdateCartStatus = (cartId: string, status: AbandonedCartItem['status']) => {
    setAbandonedCarts(prev =>
      prev.map(c => (c.id === cartId ? { ...c, status } : c))
    );
    onShowNotification('info', `Estado de carrito actualizado a "${status}"`);
  };

  const buildCartWhatsAppUrl = (cart: AbandonedCartItem) => {
    const text = `¡Hola ${cart.customerName}! 👋 Te saludamos de ${DOMAIN_OFFICIAL.replace('https://', '')}.

Notamos que dejaste pendiente tu pedido de streaming:
🍿 *${cart.itemsSummary}*
💵 *Total:* $${cart.totalUsd.toFixed(2)} USD (o Bs. ${cart.totalBs.toFixed(2)} a Tasa Oficial BCV: ${bcvRate} Bs/USD).

🎁 *¡OFERTA EXCLUSIVA DE RECUPERACIÓN!*
Completa tu pago en las próximas 3 horas usando el cupón *${cart.discountCode}* y recibe recarga inmediata con soporte VIP 24/7.

👉 Puedes confirmar tu método de pago respondiendo este mensaje o entrando a:
${DOMAIN_OFFICIAL}

¿Deseas que te reservemos las pantallas ahora mismo?`;
    const cleanPhone = cart.phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // ==========================================
  // 2. PROGRAMA DE REFERIDOS CON RECOMPENSAS EN WALLET
  // ==========================================
  const [referralsList, setReferralsList] = useState<ReferralAffiliate[]>([
    {
      id: 'ref-1',
      referrerName: 'Gregory Izquierdo (Master)',
      referrerPhone: '584241983648',
      code: 'GREGORYVIP',
      link: `${DOMAIN_OFFICIAL}/?ref=GREGORYVIP`,
      clicks: 142,
      convertedOrders: 18,
      totalVolumeUsd: 108.0,
      earnedRewardUsd: 18.0,
      paidRewardUsd: 10.0,
      status: 'active'
    },
    {
      id: 'ref-2',
      referrerName: 'María Gómez (Revendedora)',
      referrerPhone: '584145558899',
      code: 'MARIAPROMO',
      link: `${DOMAIN_OFFICIAL}/?ref=MARIAPROMO`,
      clicks: 86,
      convertedOrders: 11,
      totalVolumeUsd: 66.0,
      earnedRewardUsd: 11.0,
      paidRewardUsd: 5.0,
      status: 'active'
    },
    {
      id: 'ref-3',
      referrerName: 'Pedro Infante',
      referrerPhone: '584129990011',
      code: 'PEDROSTREAM',
      link: `${DOMAIN_OFFICIAL}/?ref=PEDROSTREAM`,
      clicks: 34,
      convertedOrders: 4,
      totalVolumeUsd: 24.0,
      earnedRewardUsd: 4.0,
      paidRewardUsd: 0.0,
      status: 'active'
    }
  ]);

  const [rewardRuleUsd, setRewardRuleUsd] = useState<number>(1.0); // $1 USD por cada referido que compre
  const [newReferrerName, setNewReferrerName] = useState('');
  const [newReferrerPhone, setNewReferrerPhone] = useState('');

  const handleCreateReferral = () => {
    if (!newReferrerName.trim()) {
      onShowNotification('warning', 'Ingresa el nombre del afiliado o cliente');
      return;
    }
    const cleanCode = newReferrerName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + Math.floor(100 + Math.random() * 900);
    const newRef: ReferralAffiliate = {
      id: `ref-${Date.now()}`,
      referrerName: newReferrerName.trim(),
      referrerPhone: newReferrerPhone.trim() || '584241983648',
      code: cleanCode,
      link: `${DOMAIN_OFFICIAL}/?ref=${cleanCode}`,
      clicks: 0,
      convertedOrders: 0,
      totalVolumeUsd: 0,
      earnedRewardUsd: 0,
      paidRewardUsd: 0,
      status: 'active'
    };
    setReferralsList(prev => [newRef, ...prev]);
    setNewReferrerName('');
    setNewReferrerPhone('');
    onShowNotification('success', `¡Enlace de referido creado para ${newRef.referrerName}! Código: ${cleanCode}`);
  };

  const handlePayRewardToWallet = (refId: string) => {
    setReferralsList(prev =>
      prev.map(r => {
        if (r.id === refId) {
          const pending = r.earnedRewardUsd - r.paidRewardUsd;
          if (pending <= 0) return r;
          onShowNotification('success', `¡$${pending.toFixed(2)} USD acreditados exitosamente a la Wallet de ${r.referrerName}!`);
          return { ...r, paidRewardUsd: r.earnedRewardUsd };
        }
        return r;
      })
    );
  };

  // ==========================================
  // 3. CAMPAÑAS FLASH Y BANNERS PROGRAMABLES POR TEMPORADA
  // ==========================================
  const [flashCampaigns, setFlashCampaigns] = useState<FlashCampaign[]>([
    {
      id: 'camp-1',
      title: '🔥 Fin de Mes: Combo 4K Netflix + Disney+ con 20% OFF',
      badge: '⚡ FLASH SALE 24H',
      discountPercent: 20,
      couponCode: 'FINDEMES20',
      startsAt: 'Hoy 00:00',
      endsAt: 'Mañana 23:59',
      countdownHours: 18,
      active: true,
      themeColor: 'purple',
      targetServices: 'Netflix 4K, Disney+ y Combos Ultra'
    },
    {
      id: 'camp-2',
      title: '🏆 Especial Champions League: Max HBO & Deportes en Vivo',
      badge: '⚽ SUPER PROMO',
      discountPercent: 15,
      couponCode: 'CHAMPIONS15',
      startsAt: 'Viernes',
      endsAt: 'Domingo',
      countdownHours: 48,
      active: false,
      themeColor: 'emerald',
      targetServices: 'Max (HBO) y Star+'
    },
    {
      id: 'camp-3',
      title: '🎄 Temporada Navideña & Black Streaming Friday',
      badge: '🎁 EDICIÓN ESPECIAL',
      discountPercent: 25,
      couponCode: 'NAVIDAD25',
      startsAt: 'Programada',
      endsAt: '31 de Diciembre',
      countdownHours: 72,
      active: false,
      themeColor: 'amber',
      targetServices: 'Todo el catálogo'
    }
  ]);

  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignDiscount, setNewCampaignDiscount] = useState('15');
  const [newCampaignCoupon, setNewCampaignCoupon] = useState('PROMO15');
  const [newCampaignTheme, setNewCampaignTheme] = useState<FlashCampaign['themeColor']>('purple');

  const handleToggleCampaignActive = (id: string) => {
    setFlashCampaigns(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextState = !c.active;
          onShowNotification('info', nextState ? `Campaña "${c.title}" activada en vivo en la tienda` : `Campaña desactivada`);
          return { ...c, active: nextState };
        }
        return c;
      })
    );
  };

  const handleCreateCampaign = () => {
    if (!newCampaignTitle.trim()) {
      onShowNotification('warning', 'Ingresa el título de la campaña flash');
      return;
    }
    const camp: FlashCampaign = {
      id: `camp-${Date.now()}`,
      title: newCampaignTitle.trim(),
      badge: '⚡ FLASH SALE',
      discountPercent: Number(newCampaignDiscount) || 15,
      couponCode: newCampaignCoupon.trim().toUpperCase() || 'OFERTA',
      startsAt: 'Hoy',
      endsAt: 'En 48 horas',
      countdownHours: 48,
      active: true,
      themeColor: newCampaignTheme,
      targetServices: 'Cuentas y Pantallas Seleccionadas'
    };
    setFlashCampaigns(prev => [camp, ...prev]);
    setNewCampaignTitle('');
    onShowNotification('success', '¡Campaña flash creada y activada!');
  };

  // ==========================================
  // 4. SEGMENTACIÓN RFM DE CLIENTES (CRM INTELIGENTE)
  // ==========================================
  // Recency, Frequency, Monetary calculation
  const rfmCustomers = useMemo(() => {
    return customers.map((cust, idx) => {
      // derive metrics from orders or simulated deterministic activity
      const customerOrders = orders.filter(o => o.customerPhone === cust.phone || o.customerName === cust.name);
      const totalOrdersCount = customerOrders.length > 0 ? customerOrders.length : ((idx % 4) + 1);
      const totalSpent = customerOrders.length > 0 
        ? customerOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        : ((totalOrdersCount * 4.5) + (cust.zenyBalance || 0));
      const recencyDays = (idx * 7) % 65; // days since last purchase

      let segment: 'champions' | 'loyal' | 'at_risk' | 'dormant' | 'new' = 'loyal';
      let recommendedAction = '';

      if (recencyDays <= 12 && totalOrdersCount >= 3 && totalSpent >= 15) {
        segment = 'champions';
        recommendedAction = 'Ofrecer acceso anticipado a nuevas cuentas y upgrade a cuenta completa con 10% OFF.';
      } else if (totalOrdersCount >= 2 && recencyDays <= 35) {
        segment = 'loyal';
        recommendedAction = 'Enviar recordatorio de renovación y bono de referidos para que invite a sus amigos.';
      } else if (recencyDays > 30 && recencyDays <= 55 && totalSpent > 8) {
        segment = 'at_risk';
        recommendedAction = 'Enviar cupón de rescate "VUELVE15" con 15% de descuento antes de que se pase a otro proveedor.';
      } else if (recencyDays > 50) {
        segment = 'dormant';
        recommendedAction = 'Campaña de reactivación con pantalla de regalo de 7 días al renovar cualquier servicio.';
      } else {
        segment = 'new';
        recommendedAction = 'Mensaje de agradecimiento de bienvenida y tutorial de cómo guardar sus credenciales seguras.';
      }

      return {
        ...cust,
        recencyDays,
        frequency: totalOrdersCount,
        monetarySpent: Number(totalSpent.toFixed(2)),
        segment,
        recommendedAction
      };
    });
  }, [customers, orders]);

  const [rfmSegmentFilter, setRfmSegmentFilter] = useState<string>('todos');

  const filteredRfmCustomers = useMemo(() => {
    if (rfmSegmentFilter === 'todos') return rfmCustomers;
    return rfmCustomers.filter(c => c.segment === rfmSegmentFilter);
  }, [rfmCustomers, rfmSegmentFilter]);

  // ==========================================
  // 5. GENERADOR DE CATÁLOGO EN PDF / IMAGEN PARA ESTADOS
  // ==========================================
  const [catalogFormat, setCatalogFormat] = useState<'whatsapp_story' | 'instagram_post' | 'pdf_full'>('whatsapp_story');
  const [catalogHighlightPromo, setCatalogHighlightPromo] = useState('🔥 COMBO PREMIUM 4K: Netflix + Disney+ por sólo $5.50 / mes');

  const handlePrintCatalogPdf = () => {
    window.print();
  };

  const copyCatalogFormattedText = () => {
    const text = `🌟 *CATÁLOGO OFICIAL DE STREAMING 4K ULTRA HD* 🌟
📌 *${DOMAIN_OFFICIAL.replace('https://', '')}*

🍿 *SERVICIOS DISPONIBLES EN STOCK INMEDIATO:*
• Netflix 4K Privado (PIN): $3.50 USD / mes (Bs. ${(3.5 * bcvRate).toFixed(2)})
• Disney+ Premium (Star incluido): $2.50 USD / mes (Bs. ${(2.5 * bcvRate).toFixed(2)})
• Max HBO Estrenos: $3.00 USD / mes (Bs. ${(3.0 * bcvRate).toFixed(2)})
• Spotify Premium Individual: $2.00 USD / mes (Bs. ${(2.0 * bcvRate).toFixed(2)})
• Amazon Prime Video: $2.50 USD / mes (Bs. ${(2.5 * bcvRate).toFixed(2)})

⚡ *COMBO ESPECIAL DUO:*
Netflix + Disney+ por sólo *$5.50 USD* (Ahorras $0.50)

🔒 *GARANTÍA TOTAL & SOPORTE VIP:*
• Reposición inmediata ante cualquier caída
• Aceptamos Pago Móvil, Zeny, Binance USDT y Banesco
• Tasa Oficial BCV: *${bcvRate} Bs/USD*

👉 Haz tu pedido ahora escribiendo al WhatsApp o en la tienda oficial:
${DOMAIN_OFFICIAL}`;
    copyToClipboard(text, 'catalog-text');
  };

  // ==========================================
  // 6. FIDELIZACIÓN POR PUNTOS O "STREAMING PASS" (GAMIFICACIÓN)
  // ==========================================
  const rewardsCatalog: StreamingPassReward[] = [
    {
      id: 'rew-1',
      title: 'Pantalla Extra de Regalo (15 Días)',
      costPoints: 150,
      description: 'Disfruta de una pantalla complementaria en cualquier servicio que tengas activo.',
      service: 'Universal',
      badge: '🥉 Bronce'
    },
    {
      id: 'rew-2',
      title: 'Mes Gratis de Spotify Premium',
      costPoints: 250,
      description: 'Música sin anuncios y descargas offline en tu dispositivo personal.',
      service: 'Spotify',
      badge: '🥈 Plata'
    },
    {
      id: 'rew-3',
      title: 'Cupón de $3.00 USD en Renovación',
      costPoints: 300,
      description: 'Descuento directo deducible en tu próxima factura mensual.',
      service: 'Billetera Zeny',
      badge: '🥇 Oro'
    },
    {
      id: 'rew-4',
      title: 'Combo 4K Netflix + Disney+ Completo',
      costPoints: 600,
      description: 'Mes completo sin costo con soporte VIP y garantía premium.',
      service: 'Combos 4K',
      badge: '💎 Diamante VIP'
    }
  ];

  const [customerPointsMap, setCustomerPointsMap] = useState<Record<string, number>>({
    'cust-1': 320,
    'cust-2': 180,
    'cust-3': 640
  });

  const handleRedeemReward = (customerId: string, reward: StreamingPassReward) => {
    const currentPts = customerPointsMap[customerId] || 0;
    if (currentPts < reward.costPoints) {
      onShowNotification('warning', `Puntos insuficientes. Requiere ${reward.costPoints} pts y tiene ${currentPts} pts.`);
      return;
    }
    setCustomerPointsMap(prev => ({
      ...prev,
      [customerId]: currentPts - reward.costPoints
    }));
    onShowNotification('success', `¡Premio "${reward.title}" canjeado con éxito para el cliente! -${reward.costPoints} pts.`);
  };

  // ==========================================
  // 7. LANDING PAGES DINÁMICAS PARA AFILIADOS Y FRANQUICIAS
  // ==========================================
  const [affiliateLandings, setAffiliateLandings] = useState([
    {
      id: 'land-1',
      slug: 'valencia-vip',
      name: 'Franquicia Carabobo VIP',
      owner: 'Carlos Mendoza',
      whatsapp: '584124567890',
      tagline: 'Tu distribuidor autorizado de streaming en Valencia con entregas al instante.',
      customMarginPercent: 15,
      fullUrl: `${DOMAIN_OFFICIAL}/?f=valencia-vip`,
      clicks: 312,
      conversions: 42,
      active: true
    },
    {
      id: 'land-2',
      slug: 'maracaibo-streaming',
      name: 'GI Streaming Maracaibo',
      owner: 'Mariana Silva',
      whatsapp: '584246123456',
      tagline: 'Cuentas 4K Ultra HD garantizadas con pago móvil Banesco y Mercantil.',
      customMarginPercent: 10,
      fullUrl: `${DOMAIN_OFFICIAL}/?f=maracaibo-streaming`,
      clicks: 195,
      conversions: 28,
      active: true
    },
    {
      id: 'land-3',
      slug: 'caracas-central',
      name: 'Franquicia Caracas Centro',
      owner: 'Alejandro Colmenares',
      whatsapp: '584161122334',
      tagline: 'Soporte 24/7 y activación al instante en toda la Gran Caracas.',
      customMarginPercent: 20,
      fullUrl: `${DOMAIN_OFFICIAL}/?f=caracas-central`,
      clicks: 450,
      conversions: 67,
      active: true
    }
  ]);

  const [newLandingSlug, setNewLandingSlug] = useState('');
  const [newLandingName, setNewLandingName] = useState('');
  const [newLandingPhone, setNewLandingPhone] = useState('');

  const handleCreateLanding = () => {
    if (!newLandingSlug.trim() || !newLandingName.trim()) {
      onShowNotification('warning', 'Ingresa el nombre y el enlace (slug) de la franquicia');
      return;
    }
    const cleanSlug = newLandingSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const newL = {
      id: `land-${Date.now()}`,
      slug: cleanSlug,
      name: newLandingName.trim(),
      owner: 'Franquiciado Asociado',
      whatsapp: newLandingPhone.trim() || '584241983648',
      tagline: 'Distribuidor oficial con garantía total y recarga al instante.',
      customMarginPercent: 15,
      fullUrl: `${DOMAIN_OFFICIAL}/?f=${cleanSlug}`,
      clicks: 0,
      conversions: 0,
      active: true
    };
    setAffiliateLandings(prev => [newL, ...prev]);
    setNewLandingSlug('');
    setNewLandingName('');
    setNewLandingPhone('');
    onShowNotification('success', `¡Micro-landing creada con éxito! URL: ${newL.fullUrl}`);
  };

  // Campaigns broadcast state
  const [campaignChannel, setCampaignChannel] = useState<'whatsapp' | 'telegram' | 'email'>('whatsapp');
  const [campaignSubject, setCampaignSubject] = useState('🔥 ¡Promoción Especial de Streaming 4K!');
  const [campaignMessage, setCampaignMessage] = useState(
    'Hola {nombre}! Aprovecha nuestros combos 4K Ultra HD con garantía total y recarga inmediata por Pago Móvil o Zeny. ¡Visítanos ya!'
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Telegram Channel state
  const [channelName, setChannelName] = useState('@GregoriStreamingVIP');
  const [promoPostText, setPromoPostText] = useState('🌟 ¡NUEVO COMBO DISPONIBLE! Netflix + Disney+ por sólo $5 al mes. ¡Entrega inmediata!');
  const [isPostingChannel, setIsPostingChannel] = useState(false);

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedUserIds([]);
      setSelectAll(false);
    } else {
      setSelectedUserIds(customers.map(c => c.id));
      setSelectAll(true);
    }
  };

  const handleToggleUserSelection = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSendCampaign = () => {
    if (selectedUserIds.length === 0) {
      onShowNotification('warning', 'Por favor selecciona al menos un usuario destinatario.');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      onShowNotification(
        'success',
        `¡Campaña de ${campaignChannel.toUpperCase()} enviada con éxito a ${selectedUserIds.length} usuario(s) seleccionado(s)!`
      );
    }, 1200);
  };

  const handlePublishToChannel = () => {
    if (!promoPostText.trim()) {
      onShowNotification('warning', 'Escribe el contenido promocional para el canal.');
      return;
    }
    setIsPostingChannel(true);
    setTimeout(() => {
      setIsPostingChannel(false);
      onShowNotification('success', `¡Publicación enviada al canal ${channelName}!`);
      setPromoPostText('');
    }, 1000);
  };

  // ==========================================
  // 8. NOTIFICACIONES PUSH WEB PARA ESTRENOS
  // ==========================================
  const [pushTitle, setPushTitle] = useState('🔥 ¡NUEVO ESTRENO en Netflix 4K & Max!');
  const [pushBody, setPushBody] = useState('Pantalla privada con PIN y entrega inmediata. ¡Renueva con 10% OFF hoy!');
  const [pushTargetSegment, setPushTargetSegment] = useState<'all' | 'vip' | 'expiring_soon'>('all');
  const [isPushBroadcasting, setIsPushBroadcasting] = useState(false);
  const [pushHistory, setPushHistory] = useState([
    { id: 'p-1', title: 'Flash 24H Fin de Mes', sentAt: 'Ayer, 06:00 PM', opens: 142, clicks: 48 },
    { id: 'p-2', title: 'Estreno House of the Dragon', sentAt: 'Hace 3 días', opens: 210, clicks: 89 }
  ]);

  const handleBroadcastPush = () => {
    if (!pushTitle.trim() || !pushBody.trim()) {
      onShowNotification('warning', 'Ingresa título y mensaje para la notificación Push.');
      return;
    }
    setIsPushBroadcasting(true);
    setTimeout(() => {
      setIsPushBroadcasting(false);
      setPushHistory(prev => [
        { id: `p-${Date.now()}`, title: pushTitle, sentAt: 'Recién despachada', opens: 1, clicks: 0 },
        ...prev
      ]);
      onShowNotification('success', '¡Notificación Push Web despachada a todos los clientes registrados!');
    }, 1200);
  };

  // ==========================================
  // 9. OPTIMIZADOR DE PRUEBAS A/B DE COPYS
  // ==========================================
  const [abTestSubjectA, setAbTestSubjectA] = useState('🔥 40% OFF en tu Combo 4K hoy - Entrega inmediata');
  const [abTestSubjectB, setAbTestSubjectB] = useState('🛡️ Garantía Total 30 Días en Pantallas Privadas con PIN');
  const [abStatsA, setAbStatsA] = useState({ sent: 120, clicks: 38, conversions: 14 });
  const [abStatsB, setAbStatsB] = useState({ sent: 120, clicks: 54, conversions: 26 });

  // ==========================================
  // 10. PIXEL DE RASTREO Y MÉTRICAS (META / TIKTOK)
  // ==========================================
  const [metaPixelId, setMetaPixelId] = useState('128491829104812');
  const [tiktokPixelId, setTiktokPixelId] = useState('CT9410AKLMN09');
  const [ga4Id, setGa4Id] = useState('G-891048912');
  const [pixelEventsLogged, setPixelEventsLogged] = useState([
    { event: 'PageView', count: 1840, last: 'Hace 1 min' },
    { event: 'ViewContent', count: 920, last: 'Hace 2 min' },
    { event: 'AddToCart', count: 310, last: 'Hace 5 min' },
    { event: 'Purchase', count: 94, last: 'Hace 12 min' }
  ]);

  const handleTestPixelEvent = (eventName: string) => {
    setPixelEventsLogged(prev =>
      prev.map(e => e.event === eventName ? { ...e, count: e.count + 1, last: 'Justo ahora' } : e)
    );
    onShowNotification('success', `Evento ${eventName} auditado y disparado exitosamente.`);
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Megaphone className="w-4 h-4" />
            <span>Módulo de Marketing Pro • Suite de 7 Módulos de Conversión</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Centro de Marketing, Retención & Gamificación</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Herramientas de alta conversión diseñadas para recuperar ventas, premiar clientes leales, lanzar campañas flash y empoderar franquiciados.
          </p>
        </div>

        {/* Global Quick Metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Recuperables</span>
            <span className="text-base font-black text-amber-400">${abandonedCarts.reduce((acc, c) => acc + (c.status === 'pending' ? c.totalUsd : 0), 0).toFixed(1)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Referidos</span>
            <span className="text-base font-black text-emerald-400">{referralsList.reduce((acc, r) => acc + r.convertedOrders, 0)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Campañas</span>
            <span className="text-base font-black text-indigo-400">{flashCampaigns.filter(c => c.active).length} Activas</span>
          </div>
        </div>
      </div>

      {/* Subtab Navigation Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          type="button"
          onClick={() => setSubTab('abandoned_cart')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'abandoned_cart'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>1. Carritos WhatsApp</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-950/40 text-[10px] font-black">
            {abandonedCarts.filter(c => c.status === 'pending').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('referrals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'referrals'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>2. Programa Referidos</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('flash_campaigns')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'flash_campaigns'
              ? 'bg-purple-500 text-white shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>3. Campañas Flash</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('rfm_segmentation')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'rfm_segmentation'
              ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>4. Segmentación RFM</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('catalog_generator')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'catalog_generator'
              ? 'bg-rose-500 text-white shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>5. Generador Catálogo</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('streaming_pass')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'streaming_pass'
              ? 'bg-yellow-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>6. Streaming Pass</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('affiliate_landings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'affiliate_landings'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>7. Landings Franquicias</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('push_broadcast')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'push_broadcast'
              ? 'bg-orange-500 text-white shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>8. Push Web Estrenos</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('ab_testing')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'ab_testing'
              ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>9. Test A/B Copys</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('conversion_pixel')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'conversion_pixel'
              ? 'bg-pink-500 text-white shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>10. Píxel & Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('campaigns')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'campaigns'
              ? 'bg-indigo-500 text-white shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Difusión Directa</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('telegram_channels')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            subTab === 'telegram_channels'
              ? 'bg-blue-500 text-white shadow-md font-extrabold'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Canales VIP</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. MOTOR DE RECUPERACIÓN DE CARRITOS & COTIZACIONES POR WHATSAPP          */}
      {/* ========================================================================= */}
      {subTab === 'abandoned_cart' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span>Carritos y Cotizaciones Abandonadas</span>
              </h3>
              <p className="text-xs text-slate-400">
                Detecta clientes que agregaron combos o solicitaron datos de pago sin completar la transacción.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filtrar:</span>
              {(['todos', 'pending', 'contacted', 'recovered'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCartFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    cartFilterStatus === st
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {st === 'pending' ? 'Pendientes' : st === 'contacted' ? 'Contactados' : st === 'recovered' ? 'Recuperados' : 'Todos'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCarts.map(cart => {
              const waUrl = buildCartWhatsAppUrl(cart);
              return (
                <div
                  key={cart.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-amber-500/40 transition shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{cart.customerName}</h4>
                      <p className="text-xs text-slate-400">{cart.phone}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        cart.status === 'recovered'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : cart.status === 'contacted'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {cart.status === 'recovered' ? 'Recuperado' : cart.status === 'contacted' ? 'Contactado' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Artículos:</span>
                      <span className="font-semibold text-slate-200 text-right">{cart.itemsSummary}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                      <span className="text-slate-400">Monto:</span>
                      <span className="font-black text-amber-400">
                        ${cart.totalUsd.toFixed(2)} USD <span className="text-slate-400 font-normal">/ Bs. {cart.totalBs.toFixed(2)}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Tiempo:</span>
                      <span>{cart.date}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic bg-slate-800/30 p-2 rounded-lg">
                    📌 {cart.notes}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleUpdateCartStatus(cart.id, 'contacted')}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Recuperador</span>
                    </a>
                    {cart.status !== 'recovered' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCartStatus(cart.id, 'recovered')}
                        title="Marcar como venta concretada"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-800/60 text-slate-300 hover:text-emerald-300 border border-slate-700 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROGRAMA DE REFERIDOS CON ENLACE ÚNICO Y RECOMPENSAS EN WALLET          */}
      {/* ========================================================================= */}
      {subTab === 'referrals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create new referrer */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span>Generar Enlace de Referido</span>
              </h3>
              <p className="text-xs text-slate-400">
                Otorga un enlace personalizado a tus promotores o mejores clientes para que ganen saldo en su Billetera Zeny por cada amigo que compre.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nombre del Promotor / Cliente:</label>
                  <input
                    type="text"
                    value={newReferrerName}
                    onChange={e => setNewReferrerName(e.target.value)}
                    placeholder="Ej. Roberto Mendoza"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Teléfono WhatsApp:</label>
                  <input
                    type="text"
                    value={newReferrerPhone}
                    onChange={e => setNewReferrerPhone(e.target.value)}
                    placeholder="Ej. 584121234567"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Recompensa por cada primera compra ($ USD):</label>
                  <input
                    type="number"
                    value={rewardRuleUsd}
                    onChange={e => setRewardRuleUsd(Number(e.target.value))}
                    step="0.5"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateReferral}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Crear Enlace & Código de Referido</span>
                </button>
              </div>
            </div>

            {/* Referrals table list */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Red de Promotores y Saldo Acumulado</span>
                </h3>
                <span className="text-xs text-slate-400">{referralsList.length} Afiliados Registrados</span>
              </div>

              <div className="space-y-3">
                {referralsList.map(ref => {
                  const pendingReward = ref.earnedRewardUsd - ref.paidRewardUsd;
                  return (
                    <div
                      key={ref.id}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{ref.referrerName}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                            {ref.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{ref.clicks} clics</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">{ref.convertedOrders} compras logradas</span>
                          <span>•</span>
                          <span>${ref.totalVolumeUsd.toFixed(2)} USD generados</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-300">
                          <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate max-w-xs">
                            {ref.link}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ref.link, ref.id)}
                            className="p-1 text-slate-400 hover:text-emerald-400 cursor-pointer"
                            title="Copiar enlace"
                          >
                            {copiedId === ref.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Reward balances & Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 block">Saldo por Abonar:</span>
                          <span className="text-base font-black text-emerald-400">${pendingReward.toFixed(2)} USD</span>
                        </div>
                        {pendingReward > 0 ? (
                          <button
                            type="button"
                            onClick={() => handlePayRewardToWallet(ref.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Acreditar a Wallet</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">Al día (0 pendiente)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CAMPAÑAS FLASH Y BANNERS PROGRAMABLES POR TEMPORADA                     */}
      {/* ========================================================================= */}
      {subTab === 'flash_campaigns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create campaign form */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Programar Oferta Flash / Temporada</span>
              </h3>
              <p className="text-xs text-slate-400">
                Configura un banner con temporizador y cupón automático para exhibirlo en la tienda en fechas festivas o estrenos mundiales.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Título de la Campaña:</label>
                  <input
                    type="text"
                    value={newCampaignTitle}
                    onChange={e => setNewCampaignTitle(e.target.value)}
                    placeholder="Ej. 🔥 24H Flash: Fin de Mes Streaming"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Descuento (%):</label>
                    <input
                      type="number"
                      value={newCampaignDiscount}
                      onChange={e => setNewCampaignDiscount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Cupón:</label>
                    <input
                      type="text"
                      value={newCampaignCoupon}
                      onChange={e => setNewCampaignCoupon(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Tema Visual del Banner:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['purple', 'amber', 'emerald', 'rose'] as const).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCampaignTheme(color)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold capitalize transition cursor-pointer border ${
                          newCampaignTheme === color
                            ? 'bg-slate-800 text-white border-white'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCampaign}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition cursor-pointer shadow flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Publicar Campaña Flash</span>
                </button>
              </div>
            </div>

            {/* Campaign Cards List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Campañas Programadas y Estado en Vivo</span>
              </h3>

              <div className="space-y-4">
                {flashCampaigns.map(camp => (
                  <div
                    key={camp.id}
                    className={`bg-slate-900 border rounded-2xl p-5 space-y-3 transition shadow-lg ${
                      camp.active
                        ? 'border-purple-500/50 bg-gradient-to-r from-slate-900 to-indigo-950/40'
                        : 'border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black">
                            {camp.badge}
                          </span>
                          <span className="text-xs text-slate-400">Cupón: <strong className="text-white font-mono">{camp.couponCode}</strong></span>
                        </div>
                        <h4 className="text-base font-black text-white">{camp.title}</h4>
                        <p className="text-xs text-slate-400">Aplica para: {camp.targetServices}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCampaignActive(camp.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          camp.active
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {camp.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>{camp.active ? 'En Vivo en Tienda' : 'Pausada'}</span>
                      </button>
                    </div>

                    {/* Live Banner Preview Mock */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">⚡</span>
                        <div className="text-xs">
                          <span className="font-bold text-white block">{camp.discountPercent}% OFF con el código {camp.couponCode}</span>
                          <span className="text-slate-400 text-[11px]">Termina: {camp.endsAt} (Quedan aprox. {camp.countdownHours}h)</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                        {camp.countdownHours}:24:18
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SEGMENTACIÓN RFM DE CLIENTES (CRM INTELIGENTE)                         */}
      {/* ========================================================================= */}
      {subTab === 'rfm_segmentation' && (
        <div className="space-y-6">
          {/* RFM Segment Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { id: 'champions', label: 'Champions VIP', icon: '👑', color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-300' },
              { id: 'loyal', label: 'Clientes Leales', icon: '💎', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300' },
              { id: 'at_risk', label: 'En Riesgo', icon: '⚠️', color: 'from-rose-500/20 to-red-500/10 border-rose-500/40 text-rose-300' },
              { id: 'dormant', label: 'Dormidos / Inactivos', icon: '💤', color: 'from-slate-500/20 to-gray-500/10 border-slate-500/40 text-slate-300' },
              { id: 'new', label: 'Nuevos Compradores', icon: '🌱', color: 'from-sky-500/20 to-blue-500/10 border-sky-500/40 text-sky-300' }
            ].map(seg => {
              const count = rfmCustomers.filter(c => c.segment === seg.id).length;
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setRfmSegmentFilter(seg.id)}
                  className={`p-3.5 rounded-2xl border text-left bg-gradient-to-br transition cursor-pointer ${seg.color} ${
                    rfmSegmentFilter === seg.id ? 'ring-2 ring-white/60 shadow-lg' : ''
                  }`}
                >
                  <span className="text-xl block mb-1">{seg.icon}</span>
                  <span className="text-xs font-bold block">{seg.label}</span>
                  <span className="text-lg font-black text-white">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-sky-400" />
                  <span>Matriz RFM: Recencia, Frecuencia y Valor Monetario</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Segmentación algorítmica para saber exactamente a quién enviar qué oferta y retener el 100% de tus suscripciones.
                </p>
              </div>
              {rfmSegmentFilter !== 'todos' && (
                <button
                  type="button"
                  onClick={() => setRfmSegmentFilter('todos')}
                  className="text-xs text-sky-400 hover:underline cursor-pointer"
                >
                  Ver todos los segmentos
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredRfmCustomers.map(cust => (
                <div
                  key={cust.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{cust.name}</span>
                      <span className="text-xs text-slate-400">({cust.phone || cust.email})</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          cust.segment === 'champions'
                            ? 'bg-amber-500/20 text-amber-300'
                            : cust.segment === 'at_risk'
                            ? 'bg-rose-500/20 text-rose-300'
                            : cust.segment === 'loyal'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {cust.segment}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Última compra hace: <strong className="text-slate-200">{cust.recencyDays} días</strong></span>
                      <span>•</span>
                      <span>Frecuencia: <strong className="text-slate-200">{cust.frequency} pedidos</strong></span>
                      <span>•</span>
                      <span>Total gastado: <strong className="text-emerald-400">${cust.monetarySpent.toFixed(2)} USD</strong></span>
                    </div>

                    <p className="text-[11px] text-sky-300/90 pt-1">
                      💡 <strong>Acción Recomendada:</strong> {cust.recommendedAction}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <a
                      href={`https://wa.me/${cust.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${cust.name}! Te escribimos de ${DOMAIN_OFFICIAL.replace('https://', '')}. Tenemos un beneficio especial para tu cuenta de streaming hoy.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Contactar</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. GENERADOR DE CATÁLOGO EN PDF / IMAGEN PARA ESTADOS                      */}
      {/* ========================================================================= */}
      {subTab === 'catalog_generator' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Generador de Catálogo Visual & Fichas Comerciales</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Crea al instante imágenes para Estados de WhatsApp (9:16) o descarga la Ficha PDF oficial en alta resolución con precios en USD y Bs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyCatalogFormattedText}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiar Texto Formateado</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintCatalogPdf}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Exportar PDF</span>
                </button>
              </div>
            </div>

            {/* Format selection */}
            <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400 font-bold">Formato Visual:</span>
              <button
                type="button"
                onClick={() => setCatalogFormat('whatsapp_story')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  catalogFormat === 'whatsapp_story' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                📱 Estado WhatsApp (9:16 Vertical)
              </button>
              <button
                type="button"
                onClick={() => setCatalogFormat('instagram_post')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  catalogFormat === 'instagram_post' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                📷 Post Cuadrado (1:1)
              </button>
              <button
                type="button"
                onClick={() => setCatalogFormat('pdf_full')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  catalogFormat === 'pdf_full' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                📄 Catálogo Completo A4
              </button>
            </div>
          </div>

          {/* Catalog Visual Preview Card */}
          <div className="flex justify-center p-4 bg-slate-950/80 rounded-3xl border border-slate-800">
            <div
              className={`bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white p-6 rounded-3xl border-2 border-indigo-500/40 shadow-2xl relative overflow-hidden ${
                catalogFormat === 'whatsapp_story'
                  ? 'w-full max-w-sm aspect-[9/16] flex flex-col justify-between'
                  : catalogFormat === 'instagram_post'
                  ? 'w-full max-w-md aspect-square flex flex-col justify-between'
                  : 'w-full max-w-2xl space-y-6'
              }`}
            >
              {/* Header */}
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">
                  CATÁLOGO STREAMING VIP 2026
                </span>
                <h3 className="text-xl font-black text-white">{DOMAIN_OFFICIAL.replace('https://', '')}</h3>
                <p className="text-[11px] text-slate-300">Entrega al instante • Garantía total de 30 días</p>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 my-auto">
                {[
                  { name: 'Netflix 4K Ultra HD', price: 3.5, icon: '🍿', tag: 'PIN Privado' },
                  { name: 'Disney+ Premium', price: 2.5, icon: '🏰', tag: 'Star+ Incluido' },
                  { name: 'Max HBO Estrenos', price: 3.0, icon: '🎬', tag: 'Warner & HBO' },
                  { name: 'Spotify Familiar / Indiv.', price: 2.0, icon: '🎧', tag: 'Sin Anuncios' },
                  { name: 'Amazon Prime Video', price: 2.5, icon: '📦', tag: 'Full HD' }
                ].map(item => (
                  <div
                    key={item.name}
                    className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <span className="text-xs font-bold text-white block">{item.name}</span>
                        <span className="text-[10px] text-slate-400">{item.tag}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-400 block">${item.price.toFixed(2)} USD</span>
                      <span className="text-[10px] text-slate-400">Bs. {(item.price * bcvRate).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer info in image */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/60 text-center space-y-1">
                <p className="text-[11px] font-bold text-emerald-400">
                  💳 Pago Móvil • Banesco • Zeny • Binance USDT
                </p>
                <p className="text-[10px] text-slate-400">
                  Tasa Oficial BCV: {bcvRate} Bs/USD • WhatsApp: +58 424-1983648
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. FIDELIZACIÓN POR PUNTOS O "STREAMING PASS" (GAMIFICACIÓN)               */}
      {/* ========================================================================= */}
      {subTab === 'streaming_pass' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <span>Streaming Pass: Gamificación y Fidelización por Puntos</span>
            </h3>
            <p className="text-xs text-slate-400">
              Regla del sistema: <strong>10 Puntos Zeny</strong> por cada $1.00 USD consumido en renovaciones o nuevas cuentas. Los clientes canjean premios directamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rewardsCatalog.map(reward => (
              <div
                key={reward.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-yellow-500/40 transition shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                      {reward.badge}
                    </span>
                    <span className="text-sm font-black text-white">{reward.costPoints} Pts</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{reward.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{reward.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">
                    Servicio: {reward.service}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstCust = customers[0];
                      if (firstCust) handleRedeemReward(firstCust.id, reward);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-yellow-500 hover:text-slate-950 text-yellow-400 font-bold text-xs transition cursor-pointer border border-yellow-500/30 flex items-center justify-center gap-1.5"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Canjear para Cliente Demo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. LANDING PAGES DINÁMICAS PARA AFILIADOS Y FRANQUICIAS                    */}
      {/* ========================================================================= */}
      {subTab === 'affiliate_landings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create new landing form */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Crear Micro-Landing para Franquicia</span>
              </h3>
              <p className="text-xs text-slate-400">
                Genera un enlace parametrizado con WhatsApp directo del franquiciado para que pueda promocionarse sin requerir programador.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nombre Comercial de la Sucursal:</label>
                  <input
                    type="text"
                    value={newLandingName}
                    onChange={e => setNewLandingName(e.target.value)}
                    placeholder="Ej. Streaming Carabobo VIP"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Identificador URL (Slug):</label>
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
                    <span className="text-slate-500 mr-1">{DOMAIN_OFFICIAL.replace('https://', '')}/?f=</span>
                    <input
                      type="text"
                      value={newLandingSlug}
                      onChange={e => setNewLandingSlug(e.target.value)}
                      placeholder="valencia-vip"
                      className="bg-transparent flex-1 focus:outline-none text-cyan-300 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">WhatsApp del Franquiciado:</label>
                  <input
                    type="text"
                    value={newLandingPhone}
                    onChange={e => setNewLandingPhone(e.target.value)}
                    placeholder="584124567890"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateLanding}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>Publicar Micro-Landing</span>
                </button>
              </div>
            </div>

            {/* List of Franchise Landings */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Micro-Sitios Activos de Franquiciados</span>
              </h3>

              <div className="space-y-4">
                {affiliateLandings.map(landing => (
                  <div
                    key={landing.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-base font-black text-white">{landing.name}</h4>
                        <p className="text-xs text-slate-400">{landing.tagline}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 self-start sm:self-auto">
                        +{landing.customMarginPercent}% Margen
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-mono text-cyan-300 truncate">{landing.fullUrl}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(landing.fullUrl, landing.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                          {copiedId === landing.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copiar</span>
                        </button>
                        <a
                          href={landing.fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Probar</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DIFUSIÓN DIRECTA & MENSAJERÍA                                          */}
      {/* ========================================================================= */}
      {subTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Configurar Campaña Directa</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Canal de Difusión:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['whatsapp', 'telegram', 'email'] as const).map(ch => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setCampaignChannel(ch)}
                        className={`py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer border ${
                          campaignChannel === ch
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Asunto / Título:</label>
                  <input
                    type="text"
                    value={campaignSubject}
                    onChange={e => setCampaignSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Mensaje (usa {'{nombre}'}):</label>
                  <textarea
                    rows={4}
                    value={campaignMessage}
                    onChange={e => setCampaignMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleSendCampaign}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs transition cursor-pointer shadow flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Enviando...' : `Enviar a ${selectedUserIds.length} Usuario(s)`}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Seleccionar Destinatarios ({selectedUserIds.length} de {customers.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs text-indigo-400 hover:underline font-bold cursor-pointer"
                >
                  {selectAll ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {customers.map(cust => (
                  <label
                    key={cust.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(cust.id)}
                        onChange={() => handleToggleUserSelection(cust.id)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{cust.name}</span>
                        <span className="text-[11px] text-slate-400">{cust.phone || cust.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      Saldo: ${(cust.zenyBalance || 0).toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. CANALES & COMUNIDADES VIP                                              */}
      {/* ========================================================================= */}
      {subTab === 'telegram_channels' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-xl mx-auto">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            <span>Publicador en Canales Oficiales</span>
          </h3>
          <p className="text-xs text-slate-400">
            Difunde promociones masivas a tu canal o comunidad oficial de Telegram en un solo clic.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Canal de Telegram:</label>
              <input
                type="text"
                value={channelName}
                onChange={e => setChannelName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Mensaje Promocional:</label>
              <textarea
                rows={4}
                value={promoPostText}
                onChange={e => setPromoPostText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              disabled={isPostingChannel}
              onClick={handlePublishToChannel}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs transition cursor-pointer shadow flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isPostingChannel ? 'Publicando...' : 'Publicar Ahora en Canal VIP'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MOTOR DE NOTIFICACIONES PUSH WEB PARA ESTRENOS                         */}
      {/* ========================================================================= */}
      {subTab === 'push_broadcast' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-orange-400" />
                <span>Despachar Notificación Push Web</span>
              </h3>
              <p className="text-xs text-slate-400">
                Aparece directamente en la pantalla de los clientes que han visitado la tienda o instalado la PWA.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Título de la Alerta:</label>
                  <input
                    type="text"
                    value={pushTitle}
                    onChange={e => setPushTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cuerpo / Mensaje de Estreno:</label>
                  <textarea
                    rows={3}
                    value={pushBody}
                    onChange={e => setPushBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Segmento Destinatario:</label>
                  <select
                    value={pushTargetSegment}
                    onChange={e => setPushTargetSegment(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">Todos los suscriptores web</option>
                    <option value="vip">Solo Clientes VIP (Streaming Pass)</option>
                    <option value="expiring_soon">Cuentas próximas a vencer (3 días)</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isPushBroadcasting}
                  onClick={handleBroadcastPush}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-extrabold text-xs transition cursor-pointer shadow flex items-center justify-center gap-2"
                >
                  <BellRing className="w-4 h-4" />
                  <span>{isPushBroadcasting ? 'Despachando Push...' : 'Despachar Push Inmediato'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Historial de Difusiones Push Enviadas</span>
              </h3>
              <div className="space-y-3">
                {pushHistory.map(p => (
                  <div key={p.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{p.title}</span>
                      <span className="text-[11px] text-slate-400">{p.sentAt}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-orange-400 font-bold block">{p.opens} lecturas</span>
                      <span className="text-slate-500 text-[10px]">{p.clicks} clics en tienda</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. OPTIMIZADOR DE PRUEBAS A/B DE COPYS Y OFERTAS                          */}
      {/* ========================================================================= */}
      {subTab === 'ab_testing' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Split className="w-4 h-4 text-teal-400" />
              <span>Optimizador de Pruebas A/B de Copys y Ofertas</span>
            </h3>
            <p className="text-xs text-slate-400">
              Compara dos versiones del mensaje de WhatsApp para descubrir cuál genera mayor tasa de conversión antes de lanzar una difusión masiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Variant A */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30">
                  Variante A: Enfoque Descuento
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {((abStatsA.conversions / abStatsA.sent) * 100).toFixed(1)}% Conv.
                </span>
              </div>
              <textarea
                rows={3}
                value={abTestSubjectA}
                onChange={e => setAbTestSubjectA(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Envíos</span>
                  <span className="font-bold text-white">{abStatsA.sent}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Clics</span>
                  <span className="font-bold text-white">{abStatsA.clicks}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Ventas</span>
                  <span className="font-bold text-teal-400">{abStatsA.conversions}</span>
                </div>
              </div>
            </div>

            {/* Variant B */}
            <div className="bg-slate-900 border border-teal-500/40 p-5 rounded-2xl space-y-4 shadow-lg bg-gradient-to-br from-slate-900 to-teal-950/20">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  Variante B: Enfoque Garantía (🏆 Ganador)
                </span>
                <span className="text-xs font-mono font-black text-emerald-400">
                  {((abStatsB.conversions / abStatsB.sent) * 100).toFixed(1)}% Conv.
                </span>
              </div>
              <textarea
                rows={3}
                value={abTestSubjectB}
                onChange={e => setAbTestSubjectB(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Envíos</span>
                  <span className="font-bold text-white">{abStatsB.sent}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Clics</span>
                  <span className="font-bold text-white">{abStatsB.clicks}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Ventas</span>
                  <span className="font-bold text-emerald-400">{abStatsB.conversions}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. PIXEL DE RASTREO Y MÉTRICAS DE CONVERSIÓN                             */}
      {/* ========================================================================= */}
      {subTab === 'conversion_pixel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-pink-400" />
                <span>Identificadores de Tracking de Pauta</span>
              </h3>
              <p className="text-xs text-slate-400">
                Registra los IDs de seguimiento para optimizar campañas de anuncios en Instagram, Facebook y TikTok.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Meta Pixel ID (Facebook / Instagram Ads):</label>
                  <input
                    type="text"
                    value={metaPixelId}
                    onChange={e => setMetaPixelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">TikTok Pixel ID:</label>
                  <input
                    type="text"
                    value={tiktokPixelId}
                    onChange={e => setTiktokPixelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Google Analytics 4 (GA4):</label>
                  <input
                    type="text"
                    value={ga4Id}
                    onChange={e => setGa4Id(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Monitor de Eventos de Conversión en Vivo</span>
              </h3>

              <div className="space-y-2">
                {pixelEventsLogged.map(ev => (
                  <div key={ev.event} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-pink-400">{ev.event}</span>
                      <span className="text-[10px] text-slate-500 block">Último disparo: {ev.last}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-white">{ev.count} eventos</span>
                      <button
                        type="button"
                        onClick={() => handleTestPixelEvent(ev.event)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        Simular
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
