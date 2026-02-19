// ============================================================
// EJEMPLO — Como construir una pagina en Axon
// ============================================================
// ESTE ARCHIVO ES UNA REFERENCIA. Copiar el patron para nuevas paginas.
// La pagina va DENTRO del AppShell (que ya provee sidebar + topbar).
// Tu SOLO construyes el contenido.
//
// Reglas:
// 1. Importar componentes compartidos de ../components/layout/
// 2. NUNCA crear tu propio sidebar, topbar, o layout wrapper
// 3. NUNCA hardcodear colores — usar los CSS variables de axon-tokens.css
// 4. SIEMPRE empezar con <PageHeader>
// 5. Usar las clases del design system: rounded-2xl, gap-4/6, etc.
// ============================================================

import React, { useState } from 'react';
import { BookOpen, Layers, HelpCircle, Eye } from 'lucide-react';

// Componentes compartidos (BLOQUEADOS — no modificar estos archivos)
import PageHeader from '../components/layout/PageHeader';
import QuickAccessCard from '../components/layout/QuickAccessCard';
import CourseCard from '../components/layout/CourseCard';
import SectionHeader from '../components/layout/SectionHeader';
import TimeFilter from '../components/layout/TimeFilter';
import PerformanceWidget from '../components/layout/PerformanceWidget';

export default function StudentHomePage() {
  const [timeFilter, setTimeFilter] = useState('Hoje');

  // Estos datos vendran de useApi() en la implementacion real
  const courses = [
    { id: '1', name: 'Microbiologia', module: 'Modulo IV', emoji: '🦠', color: 'bg-teal-100', progress: 0, completed: 0, total: 0 },
    { id: '2', name: 'Biologia Celular', module: 'Modulo Final', emoji: '🌿', color: 'bg-emerald-100', progress: 0, completed: 0, total: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page Header — SIEMPRE primero */}
      <PageHeader
        title="Bem-vindo, Dr. Reed"
        subtitle={`"A excelencia nao e um ato, mas um habito." — Aristoteles`}
      >
        <TimeFilter
          options={['Hoje', 'Semana', 'Mes']}
          value={timeFilter}
          onChange={setTimeFilter}
        />
      </PageHeader>

      {/* 2. Quick Access Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAccessCard icon={BookOpen}  title="Resumos"      subtitle="Acessar resumos"     iconColor="text-teal-500"   iconBg="bg-teal-50" />
        <QuickAccessCard icon={Layers}    title="Flashcards"   subtitle="Revisar cartoes"      iconColor="text-emerald-500" iconBg="bg-emerald-50" />
        <QuickAccessCard icon={HelpCircle} title="Quiz"        subtitle="Testar conhecimento"  iconColor="text-blue-500"   iconBg="bg-blue-50" />
        <QuickAccessCard icon={Eye}       title="Atlas Visual" subtitle="Explorar modelos"     iconColor="text-violet-500" iconBg="bg-violet-50" />
      </div>

      {/* 3. Two-column layout: Courses + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses — 2/3 width */}
        <div className="lg:col-span-2">
          <SectionHeader
            title="DISCIPLINAS EM CURSO"
            actionLabel="Ver Todas"
            onAction={() => {/* navigate */}}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map(c => (
              <CourseCard
                key={c.id}
                name={c.name}
                module={c.module}
                iconEmoji={c.emoji}
                iconColor={c.color}
                progressPercent={c.progress}
                completedLessons={c.completed}
                totalLessons={c.total}
              />
            ))}
          </div>
        </div>

        {/* Performance — 1/3 width */}
        <div>
          <PerformanceWidget percent={0} />
        </div>
      </div>
    </div>
  );
}
