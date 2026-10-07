# Cómo utilizar el Estado Centralizado (Zustand)

La centralización permite que cualquier componente acceda a los datos financieros o realice acciones sin necesidad de pasar *props* a través de toda la jerarquía de componentes.

## 1. Lectura de Datos
Para obtener los saldos bancarios o las listas de CxC/CxP, simplemente utiliza el hook `useAppStore` en cualquier componente:

```tsx
import { useAppStore } from '../store/appStore';

export const MiComponente = () => {
  // Extraemos solo lo que necesitamos
  const bankBalances = useAppStore((state) => state.bankBalances);
  const cxc = useAppStore((state) => state.accountsReceivable);

  return (
    <div>
      <h1>Saldo en Binance: ${bankBalances['Binance Pay (USDT)']?.balanceUsd}</h1>
      <p>Total de cuentas por cobrar: {cxc.length}</p>
    </div>
  );
};
```

## 2. Realización de Acciones
Para actualizar saldos, registrar cuentas o realizar compras (ejecutando acciones atómicas), utiliza las funciones expuestas por el store:

```tsx
import { useAppStore } from '../store/appStore';

export const FormularioRegistro = () => {
  // Extraemos las funciones de acción
  const setCxC = useAppStore((state) => state.setAccountsReceivable);
  const accountsReceivable = useAppStore((state) => state.accountsReceivable);

  const registrarNuevaCuenta = (nuevaCuenta: any) => {
    // Actualizamos el estado global de forma sencilla
    setCxC([...accountsReceivable, nuevaCuenta]);
  };

  return <button onClick={() => registrarNuevaCuenta({...})}>Registrar</button>;
};
```

## 3. Ejemplo de Acción Atómica (Registro de Compra)
Esta es la ventaja principal. Al usar `addPurchase`, el sistema actualiza automáticamente 3 cosas en una sola llamada:

```tsx
import { useAppStore } from '../store/appStore';

const registrarCompra = () => {
  const addPurchase = useAppStore((state) => state.addPurchase);
  
  const compra = { ... }; // Objeto de compra
  const cuentaPago = 'Binance Pay (USDT)'; // ID del banco

  // Esto dispara la actualización del historial de compras,
  // el asiento contable y resta el saldo bancario automáticamente.
  addPurchase(compra, cuentaPago);
};
```

### ¿Por qué esto garantiza coherencia?
Si intentaras hacer esto sin el store, tendrías que llamar a `setPurchases()`, luego `setAccountingEntries()` y luego `setBalances()` en cada componente, lo cual es propenso a errores y duplicidad. Con Zustand, la lógica está **encapsulada** en `addPurchase`, garantizando que nunca se olvide un paso.
