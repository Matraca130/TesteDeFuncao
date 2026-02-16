import React from 'react';
// @refresh reset
import { AppProvider } from '@/app/context/AppContext';
import { StudentDataProvider } from '@/app/context/StudentDataContext';
import { Layout } from '@/app/components/layout/Layout';

export default function App() {
  return (
    <AppProvider>
      <StudentDataProvider>
        <Layout />
      </StudentDataProvider>
    </AppProvider>
  );
}