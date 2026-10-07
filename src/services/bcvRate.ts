/**
 * Service to fetch and manage the official Banco Central de Venezuela (BCV) exchange rate
 */

export interface BcvRateResult {
  rate: number;
  lastUpdated: string;
  source: string;
}

const DEFAULT_BCV_RATE = 36.85;

export async function fetchLiveBcvRate(): Promise<BcvRateResult> {
  // Try Provider 1: dolarapi oficial
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      const rate = typeof data.promedio === 'number' ? data.promedio : parseFloat(data.promedio);
      if (rate > 0) {
        return {
          rate: Number(rate.toFixed(2)),
          lastUpdated: data.fechaActualizacion || new Date().toISOString(),
          source: 'BCV Oficial (ve.dolarapi.com)'
        };
      }
    }
  } catch (e) {
    console.warn('Provider 1 failed for BCV, trying provider 2:', e);
  }

  // Try Provider 2: pydolarvenezuela
  try {
    const res = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv', {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      const rate = data.monitors?.usd?.price;
      if (typeof rate === 'number' && rate > 0) {
        return {
          rate: Number(rate.toFixed(2)),
          lastUpdated: data.monitors?.usd?.last_update || new Date().toISOString(),
          source: 'BCV Oficial (pydolarvenezuela)'
        };
      }
    }
  } catch (e) {
    console.warn('Provider 2 failed for BCV:', e);
  }

  // Fallback
  return {
    rate: DEFAULT_BCV_RATE,
    lastUpdated: new Date().toISOString(),
    source: 'BCV Tasa Base Referencial'
  };
}
