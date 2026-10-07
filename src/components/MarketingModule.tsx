import React from 'react';
import { AdminMarketingManager } from './AdminMarketingManager';
import { CustomerUser } from '../types';

interface MarketingModuleProps {
  customers: CustomerUser[];
  onShowNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const MarketingModule: React.FC<MarketingModuleProps> = ({
  customers,
  onShowNotification
}) => {
  return (
    <AdminMarketingManager
      customers={customers}
      onShowNotification={onShowNotification}
    />
  );
};
