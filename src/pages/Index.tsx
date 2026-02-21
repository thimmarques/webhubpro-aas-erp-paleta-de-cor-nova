import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from './Login';
import AppShell from '@/components/AppShell';

const Index = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return <Login />;
  return <AppShell />;
};

export default Index;
