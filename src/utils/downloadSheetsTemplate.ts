/**
 * Utility to generate and download a pre-formatted Excel/Google Sheets template
 * with all the sheets and 1 guide example per sheet.
 */

export function downloadGoogleSheetsTemplate() {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4338CA" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="ExampleRow">
   <Font ss:Color="#1E293B"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <!-- 1. PEDIDOS -->
 <Worksheet ss:Name="Pedidos">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">ID Pedido</Data></Cell>
    <Cell><Data ss:Type="String">Fecha / Hora</Data></Cell>
    <Cell><Data ss:Type="String">Cliente Nombre</Data></Cell>
    <Cell><Data ss:Type="String">Email</Data></Cell>
    <Cell><Data ss:Type="String">WhatsApp / Teléfono</Data></Cell>
    <Cell><Data ss:Type="String">Producto</Data></Cell>
    <Cell><Data ss:Type="String">Tipo de Cuenta</Data></Cell>
    <Cell><Data ss:Type="String">Duración</Data></Cell>
    <Cell><Data ss:Type="String">Total</Data></Cell>
    <Cell><Data ss:Type="String">Moneda</Data></Cell>
    <Cell><Data ss:Type="String">Método de Pago</Data></Cell>
    <Cell><Data ss:Type="String">Ref. Comprobante</Data></Cell>
    <Cell><Data ss:Type="String">Estado Conciliación</Data></Cell>
    <Cell><Data ss:Type="String">Credenciales &amp; Vencimiento</Data></Cell>
    <Cell><Data ss:Type="String">Vendedor Asignado</Data></Cell>
    <Cell><Data ss:Type="String">Notas del Cliente</Data></Cell>
   </Row>
   <Row ss:StyleID="ExampleRow">
    <Cell><Data ss:Type="String">ORD-2026-001</Data></Cell>
    <Cell><Data ss:Type="String">2026-09-30 10:00</Data></Cell>
    <Cell><Data ss:Type="String">Carlos Rodríguez</Data></Cell>
    <Cell><Data ss:Type="String">carlos@ejemplo.com</Data></Cell>
    <Cell><Data ss:Type="String">+58 412 1234567</Data></Cell>
    <Cell><Data ss:Type="String">Netflix Premium 4K</Data></Cell>
    <Cell><Data ss:Type="String">Perfil Privado con PIN</Data></Cell>
    <Cell><Data ss:Type="String">1 mes</Data></Cell>
    <Cell><Data ss:Type="Number">3.50</Data></Cell>
    <Cell><Data ss:Type="String">USD</Data></Cell>
    <Cell><Data ss:Type="String">Pago Móvil</Data></Cell>
    <Cell><Data ss:Type="String">REF-987654</Data></Cell>
    <Cell><Data ss:Type="String">confirmado</Data></Cell>
    <Cell><Data ss:Type="String">Usuario: netflix1@gregoryizquierdo.xyz | PIN: 1234 | Perfil 1 | Vence: 2026-10-30</Data></Cell>
    <Cell><Data ss:Type="String">Gregori Izquierdo (Principal)</Data></Cell>
    <Cell><Data ss:Type="String">Ejemplo guía: cliente solicitó activación inmediata</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- 2. CLIENTES -->
 <Worksheet ss:Name="Clientes">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">ID Usuario</Data></Cell>
    <Cell><Data ss:Type="String">Nombre Completo</Data></Cell>
    <Cell><Data ss:Type="String">Correo Electrónico</Data></Cell>
    <Cell><Data ss:Type="String">WhatsApp / Teléfono</Data></Cell>
    <Cell><Data ss:Type="String">Rol (Cliente / Vendedor)</Data></Cell>
    <Cell><Data ss:Type="String">Código Vendedor</Data></Cell>
    <Cell><Data ss:Type="String">Saldo Wallet Zeny</Data></Cell>
    <Cell><Data ss:Type="String">Fecha de Registro</Data></Cell>
    <Cell><Data ss:Type="String">Estado</Data></Cell>
   </Row>
   <Row ss:StyleID="ExampleRow">
    <Cell><Data ss:Type="String">USR-001</Data></Cell>
    <Cell><Data ss:Type="String">María González</Data></Cell>
    <Cell><Data ss:Type="String">maria@ejemplo.com</Data></Cell>
    <Cell><Data ss:Type="String">+58 414 7654321</Data></Cell>
    <Cell><Data ss:Type="String">cliente</Data></Cell>
    <Cell><Data ss:Type="String">N/A</Data></Cell>
    <Cell><Data ss:Type="Number">15.00</Data></Cell>
    <Cell><Data ss:Type="String">2026-09-30</Data></Cell>
    <Cell><Data ss:Type="String">activo</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- 3. INCIDENCIAS -->
 <Worksheet ss:Name="Incidencias">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">ID Incidencia</Data></Cell>
    <Cell><Data ss:Type="String">Fecha Reporte</Data></Cell>
    <Cell><Data ss:Type="String">Cliente</Data></Cell>
    <Cell><Data ss:Type="String">Email</Data></Cell>
    <Cell><Data ss:Type="String">WhatsApp</Data></Cell>
    <Cell><Data ss:Type="String">Servicio</Data></Cell>
    <Cell><Data ss:Type="String">Tipo de Falla</Data></Cell>
    <Cell><Data ss:Type="String">Descripción Detallada</Data></Cell>
    <Cell><Data ss:Type="String">Estado</Data></Cell>
    <Cell><Data ss:Type="String">Solución Brindada</Data></Cell>
   </Row>
   <Row ss:StyleID="ExampleRow">
    <Cell><Data ss:Type="String">INC-001</Data></Cell>
    <Cell><Data ss:Type="String">2026-09-30 11:30</Data></Cell>
    <Cell><Data ss:Type="String">Pedro Pérez</Data></Cell>
    <Cell><Data ss:Type="String">pedro@ejemplo.com</Data></Cell>
    <Cell><Data ss:Type="String">+58 416 9876543</Data></Cell>
    <Cell><Data ss:Type="String">Max (HBO Max)</Data></Cell>
    <Cell><Data ss:Type="String">pantalla_en_uso</Data></Cell>
    <Cell><Data ss:Type="String">Aparece mensaje de demasiados dispositivos conectados</Data></Cell>
    <Cell><Data ss:Type="String">resuelto</Data></Cell>
    <Cell><Data ss:Type="String">Reinicio de sesiones y actualización de PIN privado</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- 4. COMPRAS A PROVEEDORES -->
 <Worksheet ss:Name="ComprasProveedores">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">ID Compra</Data></Cell>
    <Cell><Data ss:Type="String">Proveedor</Data></Cell>
    <Cell><Data ss:Type="String">Plataforma</Data></Cell>
    <Cell><Data ss:Type="String">Servicio / Plan</Data></Cell>
    <Cell><Data ss:Type="String">Modo Venta</Data></Cell>
    <Cell><Data ss:Type="String">Moneda Pago</Data></Cell>
    <Cell><Data ss:Type="String">Monto Pagado</Data></Cell>
    <Cell><Data ss:Type="String">Costo USD</Data></Cell>
    <Cell><Data ss:Type="String">Fecha Inicio</Data></Cell>
    <Cell><Data ss:Type="String">Fecha Vencimiento</Data></Cell>
    <Cell><Data ss:Type="String">Correo Cuenta Madre</Data></Cell>
    <Cell><Data ss:Type="String">Clave Cuenta Madre</Data></Cell>
    <Cell><Data ss:Type="String">Slots / Perfiles</Data></Cell>
    <Cell><Data ss:Type="String">Estado</Data></Cell>
   </Row>
   <Row ss:StyleID="ExampleRow">
    <Cell><Data ss:Type="String">PUR-001</Data></Cell>
    <Cell><Data ss:Type="String">Distribuidor VIP Latino</Data></Cell>
    <Cell><Data ss:Type="String">NETFLIX</Data></Cell>
    <Cell><Data ss:Type="String">Netflix Ultra HD 4K (5 Pantallas)</Data></Cell>
    <Cell><Data ss:Type="String">Venta por Perfiles</Data></Cell>
    <Cell><Data ss:Type="String">USDT</Data></Cell>
    <Cell><Data ss:Type="Number">8.00</Data></Cell>
    <Cell><Data ss:Type="Number">8.00</Data></Cell>
    <Cell><Data ss:Type="String">2026-09-30</Data></Cell>
    <Cell><Data ss:Type="String">2026-10-30</Data></Cell>
    <Cell><Data ss:Type="String">netflix_madre1@proveedor.com</Data></Cell>
    <Cell><Data ss:Type="String">ClaveSegura2026*</Data></Cell>
    <Cell><Data ss:Type="String">Perfil 1 (PIN 1234), Perfil 2 (PIN 2341), Perfil 3 (PIN 3412)</Data></Cell>
    <Cell><Data ss:Type="String">activo</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- 5. PRODUCTOS -->
 <Worksheet ss:Name="Productos">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">ID</Data></Cell>
    <Cell><Data ss:Type="String">Nombre</Data></Cell>
    <Cell><Data ss:Type="String">Marca</Data></Cell>
    <Cell><Data ss:Type="String">Categoría</Data></Cell>
    <Cell><Data ss:Type="String">Tipo</Data></Cell>
    <Cell><Data ss:Type="String">Precio USD (1m)</Data></Cell>
    <Cell><Data ss:Type="String">Pantallas</Data></Cell>
    <Cell><Data ss:Type="String">Stock</Data></Cell>
    <Cell><Data ss:Type="String">Descripción</Data></Cell>
   </Row>
   <Row ss:StyleID="ExampleRow">
    <Cell><Data ss:Type="String">netflix</Data></Cell>
    <Cell><Data ss:Type="String">Netflix Premium 4K UHD</Data></Cell>
    <Cell><Data ss:Type="String">Netflix</Data></Cell>
    <Cell><Data ss:Type="String">streaming</Data></Cell>
    <Cell><Data ss:Type="String">perfil_pantalla</Data></Cell>
    <Cell><Data ss:Type="Number">3.50</Data></Cell>
    <Cell><Data ss:Type="Number">1</Data></Cell>
    <Cell><Data ss:Type="String">disponible</Data></Cell>
    <Cell><Data ss:Type="String">Perfil privado con PIN exclusivo en cuenta Ultra HD</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- 6. METODOS DE PAGO -->
 <Worksheet ss:Name="MetodosPago">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">ID</Data></Cell>
    <Cell><Data ss:Type="String">Nombre</Data></Cell>
    <Cell><Data ss:Type="String">Tipo</Data></Cell>
    <Cell><Data ss:Type="String">Moneda</Data></Cell>
    <Cell><Data ss:Type="String">Titular / Cuenta</Data></Cell>
    <Cell><Data ss:Type="String">Teléfono / Cédula / Red</Data></Cell>
    <Cell><Data ss:Type="String">Instrucciones</Data></Cell>
   </Row>
   <Row ss:StyleID="ExampleRow">
    <Cell><Data ss:Type="String">pago_movil</Data></Cell>
    <Cell><Data ss:Type="String">Pago Móvil Banesco</Data></Cell>
    <Cell><Data ss:Type="String">banco_nacional</Data></Cell>
    <Cell><Data ss:Type="String">BS</Data></Cell>
    <Cell><Data ss:Type="String">Gregori Izquierdo - C.I. 12.345.678</Data></Cell>
    <Cell><Data ss:Type="String">0414-1234567 - Banco Banesco (0134)</Data></Cell>
    <Cell><Data ss:Type="String">Enviar comprobante con número de referencia tras la transferencia</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Plantilla_Control_Maestro_GoogleSheets_GregoriIzquierdo.xls';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a simplified CSV version for single-table import
 */
export function downloadOrdersCsvTemplate() {
  const csvContent = `ID Pedido,Fecha / Hora,Cliente Nombre,Email,WhatsApp / Telefono,Producto,Tipo de Cuenta,Duracion,Total,Moneda,Metodo de Pago,Ref. Comprobante,Estado Conciliacion,Credenciales & Vencimiento,Vendedor Asignado,Notas del Cliente
ORD-2026-001,2026-09-30 10:00,Carlos Rodriguez,carlos@ejemplo.com,+58 412 1234567,Netflix Premium 4K,Perfil Privado con PIN,1 mes,3.50,USD,Pago Movil,REF-987654,confirmado,Usuario: netflix1@gregoryizquierdo.xyz | PIN: 1234 | Perfil 1 | Vence: 2026-10-30,Gregori Izquierdo (Principal),Ejemplo guia: activacion inmediata solicitada`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Plantilla_Pedidos_GoogleSheets_Ejemplo.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
