import { DOMAIN_OFFICIAL } from './messageTemplates';

export const DEFAULT_FRANCHISE_MONTHLY_FEE = 25.00;

export const DEFAULT_FRANCHISE_CONTRACT_TEMPLATE = `ACUERDO DE CONCESIÓN TECNOLÓGICA Y SUSCRIPCIÓN DE PLATAFORMA STREAMING (FRANQUICIA / SAAS)

Conste por el presente documento el Acuerdo de Suscripción Tecnológica y Explotación Comercial suscrito entre:

DE UNA PARTE:
{TITULAR_MASTER}, mayor de edad, en su condición de Propietario y Administrador Central de la Plataforma de Distribución Digital y Pasarela Operativa ({DOMINIO_MASTER}), en lo sucesivo denominado "EL PROVEEDOR TECNOLÓGICO CENTRAL".

Y DE OTRA PARTE:
{TITULAR_FRANQUICIA}, C.I./ID: {CEDULA_FRANQUICIA}, con número telefónico comercial {TELEFONO_FRANQUICIA}, actuando en representación del negocio comercial {NOMBRE_FRANQUICIA}, en lo sucesivo denominado "EL FRANQUICIADO / OPERADOR INDEPENDIENTE".

Ambas partes convienen de mutuo acuerdo en estipular las siguientes cláusulas y condiciones:

CLÁUSULA PRIMERA — OBJETO DE LA CONCESIÓN
EL PROVEEDOR TECNOLÓGICO concede al FRANQUICIADO el uso exclusivo y habilitación de una instancia comercial operativa de la plataforma de streaming ({DOMINIO_MASTER}), configurada con su identidad comercial, catálogo de entretenimiento, conectividad a Google Sheets y sistema de gestión de clientes.

CLÁUSULA SEGUNDA — TARIFA MENSUAL DE LA FRANQUICIA (CANON DE MANTENIMIENTO)
1. EL FRANQUICIADO conviene en abonar al PROVEEDOR TECNOLÓGICO un canon fijo mensual de:
   💵 \${PRECIO_MENSUAL_USD} USD (o su equivalente en Bolívares a Tasa Oficial BCV: Bs. {MONTO_BS} a {TASA_BCV} Bs/USD).
2. Dicho canon cubre: derecho de uso de la infraestructura en la nube, actualizaciones del software, mantenimiento de base de datos sincronizada y soporte técnico prioritario.
3. La periodicidad de cobro es de 30 días calendario contados a partir del {FECHA_INICIO}.
4. Modalidad de pago de la mensualidad: Puede pactarse como "Pagado" por adelantado o "A Crédito" con plazo máximo convenido.

CLÁUSULA TERCERA — INDEPENDENCIA DE GANANCIAS EN VENTAS
El 100% del margen de beneficio generado por la venta directa de pantallas, perfiles y combos a los clientes finales del FRANQUICIADO pertenece única y exclusivamente a este. EL PROVEEDOR TECNOLÓGICO no retiene porcentajes ni comisiones sobre las pantallas comercializadas por el FRANQUICIADO.

CLÁUSULA CUARTA — BILLETERA PRIVADA Y RECAUDACIÓN DE FONDOS
1. EL FRANQUICIADO dispondrá de su propia billetera comercial bajo el nombre personalizado "{BILLETERA_NOMBRE}" para comercializar saldos a sus clientes finales.
2. Los fondos recargados por los clientes o por el franquiciado son abonados directamente a las cuentas maestras bancarias / Binance del PROVEEDOR TECNOLÓGICO.
3. Tras registrar el reporte de abono (con captura de comprobante y número de referencia), EL PROVEEDOR TECNOLÓGICO verifica y acredita el saldo manual al pool de la franquicia en un lapso no mayor a 30 minutos.
4. Una vez acreditado en su pool, EL FRANQUICIADO tiene plena facultad para asignar el saldo al cliente correspondiente y confirmarle vía WhatsApp o Telegram.

CLÁUSULA QUINTA — POLÍTICA DE PAUSA O SUSPENSIÓN POR MORA
En caso de que el canon mensual convenido no sea cancelado al término del periodo de gracia acordado, EL PROVEEDOR TECNOLÓGICO se reserva la potestad de "Pausar la Franquicia", restringiendo temporalmente el acceso al panel administrativo y mostrando el aviso de mantenimiento/regularización de cuenta hasta su solventación.

CLÁUSULA SEXTA — GARANTÍA Y SOPORTE
EL PROVEEDOR TECNOLÓGICO garantiza la disponibilidad operativa del 99.5% de la plataforma web y la inmediata respuesta técnica ante cualquier incidencia reportada en el canal administrativo.

Firmado en señal de mutua conformidad:

________________________________________
{TITULAR_MASTER}
Proveedor Tecnológico Central
{DOMINIO_MASTER}

________________________________________
{TITULAR_FRANQUICIA}
{NOMBRE_FRANQUICIA}
Tel: {TELEFONO_FRANQUICIA}`;

export const renderContractText = (
  template: string,
  vars: {
    nombreFranquicia?: string;
    titularFranquicia?: string;
    cedulaFranquicia?: string;
    telefonoFranquicia?: string;
    precioMensualUsd?: number | string;
    bcvRate?: number;
    titularMaster?: string;
    dominioMaster?: string;
    fechaInicio?: string;
    billeteraNombre?: string;
  }
): string => {
  const precio = Number(vars.precioMensualUsd || DEFAULT_FRANCHISE_MONTHLY_FEE).toFixed(2);
  const tasa = Number(vars.bcvRate || 36.5).toFixed(2);
  const montoBs = (Number(precio) * Number(tasa)).toFixed(2);

  const replacements: Record<string, string> = {
    '{NOMBRE_FRANQUICIA}': vars.nombreFranquicia || 'Franquicia Streaming',
    '{TITULAR_FRANQUICIA}': vars.titularFranquicia || 'Operador Franquiciado',
    '{CEDULA_FRANQUICIA}': vars.cedulaFranquicia || 'V-XXXXXXXX',
    '{TELEFONO_FRANQUICIA}': vars.telefonoFranquicia || '+58 414-XXXXXXX',
    '{PRECIO_MENSUAL_USD}': precio,
    '{MONTO_BS}': montoBs,
    '{TASA_BCV}': tasa,
    '{TITULAR_MASTER}': vars.titularMaster || 'Gregori Izquierdo',
    '{DOMINIO_MASTER}': vars.dominioMaster || DOMAIN_OFFICIAL,
    '{FECHA_INICIO}': vars.fechaInicio || new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' }),
    '{BILLETERA_NOMBRE}': vars.billeteraNombre || 'StreamPay'
  };

  let result = template;
  for (const [key, val] of Object.entries(replacements)) {
    result = result.split(key).join(val);
  }
  return result;
};
