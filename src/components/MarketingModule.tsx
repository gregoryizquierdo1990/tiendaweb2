import React from 'react';
import { AdminMarketingManager } from './AdminMarketingManager';
import { CustomerUser, Order, Product, FranchiseTenant, AppBrandingConfig } from '../types';

interface MarketingModuleProps {
  customers: CustomerUser[];
  orders?: Order[];
  products?: Product[];
  bcvRate?: number;
  franchises?: FranchiseTenant[];
  branding?: AppBrandingConfig;
  onShowNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const MarketingModule: React.FC<MarketingModuleProps> = ({
  customers,
  orders = [],
  products = [],
  bcvRate = 36.85,
  franchises = [],
  branding,
  onShowNotification
}) => {
  return (
    <AdminMarketingManager
      customers={customers}
      orders={orders}
      products={products}
      bcvRate={bcvRate}
      franchises={franchises}
      branding={branding}
      onShowNotification={onShowNotification}
    />
  );
};
