// ═══════════════════════════════════════════════
// Axon v4.4 — Institution Wizard (A5-01)
// Agent 5: FORGE — Multi-step wizard for institution creation
// 3 Steps: Basic Data → Configuration → Review & Confirm
// ═══════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Building2,
  Globe,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { cn } from '../components/ui/utils';
import {
  createInstitution,
  checkSlugAvailability,
} from '../lib/api-client';
import { headingStyle } from '../lib/design-tokens';
import type { InstitutionCreatePayload, Language, AcademicModel } from '../../types/auth';

// ── Types ────────────────────────────────────

interface WizardData {
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  default_language: Language;
  timezone: string;
  academic_model: AcademicModel;
}

interface FieldError {
  [key: string]: string;
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

// ── Constants ────────────────────────────────

const STEPS = [
  { id: 1, label: 'Dados B\u00e1sicos', icon: Building2 },
  { id: 2, label: 'Configura\u00e7\u00e3o', icon: Globe },
  { id: 3, label: 'Revis\u00e3o', icon: CheckCircle2 },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'pt-BR', label: 'Portugu\u00eas (Brasil)' },
  { value: 'es', label: 'Espa\u00f1ol' },
  { value: 'en', label: 'English' },
];

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Recife',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Bahia',
  'America/Buenos_Aires',
  'America/Santiago',
  'America/Bogota',
  'America/Lima',
  'America/Mexico_City',
  'America/New_York',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Lisbon',
];

const ACADEMIC_MODELS: { value: AcademicModel; label: string; desc: string }[] = [
  { value: 'semestral', label: 'Semestral', desc: '2 per\u00edodos por ano' },
  { value: 'trimestral', label: 'Trimestral', desc: '3 per\u00edodos por ano' },
  { value: 'libre', label: 'Livre', desc: 'Sem per\u00edodo fixo' },
];

const INITIAL_DATA: WizardData = {
  name: '',
  slug: '',
  description: '',
  logo_url: '',
  default_language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  academic_model: 'semestral',
};

// ── Helpers ──────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length >= 3;
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

export function InstitutionWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [errors, setErrors] = useState<FieldError>({});
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && data.name) {
      const generated = generateSlug(data.name);
      setData((prev) => ({ ...prev, slug: generated }));
    }
  }, [data.name, slugManuallyEdited]);

  // Debounced slug check
  useEffect(() => {
    if (!data.slug || data.slug.length < 3) {
      setSlugStatus('idle');
      return;
    }
    if (!isValidSlug(data.slug)) {
      setSlugStatus('invalid');
      return;
    }

    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const result = await checkSlugAvailability(data.slug);
        setSlugStatus(result.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [data.slug]);

  const updateField = useCallback(
    <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  // ── Validation ───────────────────────────────

  const validateStep = (step: number): boolean => {
    const newErrors: FieldError = {};

    if (step === 1) {
      if (!data.name.trim()) newErrors.name = 'Nome \u00e9 obrigat\u00f3rio';
      if (!data.slug.trim()) newErrors.slug = 'Slug \u00e9 obrigat\u00f3rio';
      else if (!isValidSlug(data.slug)) newErrors.slug = 'Slug inv\u00e1lido (m\u00edn. 3 caracteres, apenas letras min\u00fasculas, n\u00fameros e h\u00edfens)';
      else if (slugStatus === 'taken') newErrors.slug = 'Este slug j\u00e1 est\u00e1 em uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ───────────────────────────────

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 3));
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setDirection(-1);
      setCurrentStep(step);
    } else if (step === currentStep + 1 && validateStep(currentStep)) {
      setDirection(1);
      setCurrentStep(step);
    }
  };

  // ── Submit ───────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: InstitutionCreatePayload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim() || undefined,
        logo_url: data.logo_url.trim() || undefined,
        default_language: data.default_language,
        timezone: data.timezone,
        academic_model: data.academic_model,
      };

      await createInstitution(payload);
      toast.success('Institui\u00e7\u00e3o criada com sucesso!', {
        description: `${data.name} est\u00e1 pronta para uso.`,
      });
      navigate('/admin');
    } catch (error: any) {
      toast.error('Erro ao criar institui\u00e7\u00e3o', {
        description: error?.message || 'Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════

  return (
    <div className="min-h-full bg-zinc-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Title */}
        <div className="mb-6">
          <h1 style={headingStyle} className="text-zinc-900">
            Criar Institui\u00e7\u00e3o
          </h1>
          <p className="mt-1 text-zinc-500">
            Configure sua institui\u00e7\u00e3o em poucos passos.
          </p>
        </div>

        {/* Steps Indicator */}
        <StepsIndicator
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={goToStep}
        />

        {/* Step Content */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 1 && (
                  <Step1BasicData
                    data={data}
                    errors={errors}
                    slugStatus={slugStatus}
                    slugManuallyEdited={slugManuallyEdited}
                    onUpdate={updateField}
                    onSlugManualEdit={() => setSlugManuallyEdited(true)}
                  />
                )}
                {currentStep === 2 && (
                  <Step2Configuration
                    data={data}
                    onUpdate={updateField}
                  />
                )}
                {currentStep === 3 && (
                  <Step3Review data={data} slugStatus={slugStatus} />
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentStep === 1}
            className="text-zinc-600"
          >
            <ArrowLeft className="size-4 mr-1" />
            Anterior
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={goNext}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              Pr\u00f3ximo
              <ArrowRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || slugStatus === 'taken'}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Check className="size-4 mr-1" />
                  Criar Institui\u00e7\u00e3o
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Steps Indicator
// ═══════════════════════════════════════════════

function StepsIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: typeof STEPS;
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div>
      {/* Desktop horizontal */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onStepClick(step.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2 transition-colors',
                  isActive && 'bg-teal-50',
                  isDone && 'cursor-pointer',
                  !isActive && !isDone && 'opacity-50'
                )}
              >
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-teal-500 text-white',
                    isDone && 'bg-teal-100 text-teal-700',
                    !isActive && !isDone && 'bg-zinc-200 text-zinc-500'
                  )}
                >
                  {isDone ? (
                    <Check className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <div className="text-left">
                  <p
                    className={cn(
                      'text-sm',
                      isActive ? 'text-teal-700' : isDone ? 'text-zinc-700' : 'text-zinc-400'
                    )}
                  >
                    Passo {step.id}
                  </p>
                  <p
                    className={cn(
                      'text-xs',
                      isActive ? 'text-teal-600' : 'text-zinc-400'
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'h-px flex-1 mx-2',
                    step.id < currentStep ? 'bg-teal-300' : 'bg-zinc-200'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="flex sm:hidden flex-col gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;

          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                isActive && 'bg-teal-50 border border-teal-200',
                isDone && 'bg-zinc-50',
                !isActive && !isDone && 'opacity-50'
              )}
            >
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full shrink-0',
                  isActive && 'bg-teal-500 text-white',
                  isDone && 'bg-teal-100 text-teal-700',
                  !isActive && !isDone && 'bg-zinc-200 text-zinc-500'
                )}
              >
                {isDone ? <Check className="size-3" /> : <Icon className="size-3" />}
              </div>
              <span
                className={cn(
                  'text-sm',
                  isActive ? 'text-teal-700' : isDone ? 'text-zinc-600' : 'text-zinc-400'
                )}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Step 1: Basic Data
// ═══════════════════════════════════════════════

function Step1BasicData({
  data,
  errors,
  slugStatus,
  slugManuallyEdited,
  onUpdate,
  onSlugManualEdit,
}: {
  data: WizardData;
  errors: FieldError;
  slugStatus: SlugStatus;
  slugManuallyEdited: boolean;
  onUpdate: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  onSlugManualEdit: () => void;
}) {
  const slugMessage: Record<SlugStatus, React.ReactNode> = {
    idle: null,
    checking: (
      <span className="flex items-center gap-1 text-zinc-400">
        <Loader2 className="size-3 animate-spin" /> Verificando disponibilidade...
      </span>
    ),
    available: (
      <span className="flex items-center gap-1 text-emerald-600">
        <CheckCircle2 className="size-3" /> Slug dispon\u00edvel!
      </span>
    ),
    taken: (
      <span className="flex items-center gap-1 text-red-600">
        <AlertCircle className="size-3" /> Este slug j\u00e1 est\u00e1 em uso.
      </span>
    ),
    invalid: (
      <span className="flex items-center gap-1 text-amber-600">
        <AlertCircle className="size-3" /> Slug inv\u00e1lido (m\u00edn. 3 caracteres, apenas a-z, 0-9 e h\u00edfens).
      </span>
    ),
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 style={headingStyle} className="text-zinc-900">
          Dados B\u00e1sicos
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Informe o nome e identificador da sua institui\u00e7\u00e3o.
        </p>
      </div>

      <Separator />

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nome da Institui\u00e7\u00e3o <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="Ex: Universidade Federal de S\u00e3o Paulo"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="size-3" /> {errors.name}
          </p>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">
          Slug (URL) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="slug"
          value={data.slug}
          onChange={(e) => {
            onSlugManualEdit();
            onUpdate('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
          }}
          placeholder="ex: minha-instituicao"
          aria-invalid={!!errors.slug || slugStatus === 'taken'}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          {data.slug && (
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <ExternalLink className="size-3" />
              Sua p\u00e1gina p\u00fablica: <span className="text-teal-600">axon.edu/i/{data.slug}</span>
            </p>
          )}
          <div className="text-xs">{slugMessage[slugStatus]}</div>
        </div>
        {errors.slug && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="size-3" /> {errors.slug}
          </p>
        )}
        {slugManuallyEdited && data.name && (
          <button
            onClick={() => {
              onUpdate('slug', generateSlug(data.name));
            }}
            className="text-xs text-teal-600 hover:underline"
          >
            Regerar slug a partir do nome
          </button>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descri\u00e7\u00e3o (opcional)</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Uma breve descri\u00e7\u00e3o da sua institui\u00e7\u00e3o..."
          rows={3}
        />
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="logo_url">URL do Logo (opcional)</Label>
        <Input
          id="logo_url"
          value={data.logo_url}
          onChange={(e) => onUpdate('logo_url', e.target.value)}
          placeholder="https://exemplo.com/logo.png"
          type="url"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Step 2: Configuration
// ═══════════════════════════════════════════════

function Step2Configuration({
  data,
  onUpdate,
}: {
  data: WizardData;
  onUpdate: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 style={headingStyle} className="text-zinc-900">
          Configura\u00e7\u00e3o Inicial
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Defina idioma, fuso hor\u00e1rio e modelo acad\u00eamico.
        </p>
      </div>

      <Separator />

      {/* Language */}
      <div className="space-y-2">
        <Label>Idioma Padr\u00e3o</Label>
        <Select
          value={data.default_language}
          onValueChange={(v) => onUpdate('default_language', v as Language)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label>Fuso Hor\u00e1rio</Label>
        <Select
          value={data.timezone}
          onValueChange={(v) => onUpdate('timezone', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Academic Model */}
      <div className="space-y-3">
        <Label>Modelo Acad\u00eamico</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ACADEMIC_MODELS.map((model) => (
            <button
              key={model.value}
              onClick={() => onUpdate('academic_model', model.value)}
              className={cn(
                'rounded-lg border p-4 text-left transition-all',
                data.academic_model === model.value
                  ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-200'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              )}
            >
              <p
                className={cn(
                  'text-sm',
                  data.academic_model === model.value ? 'text-teal-700' : 'text-zinc-700'
                )}
              >
                {model.label}
              </p>
              <p className="text-xs text-zinc-400 mt-1">{model.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-xs text-zinc-500">
          Voc\u00ea pode alterar estas configura\u00e7\u00f5es depois em <strong>Configura\u00e7\u00f5es</strong>.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Step 3: Review & Confirm
// ═══════════════════════════════════════════════

function Step3Review({
  data,
  slugStatus,
}: {
  data: WizardData;
  slugStatus: SlugStatus;
}) {
  const langLabel = LANGUAGES.find((l) => l.value === data.default_language)?.label ?? data.default_language;
  const modelLabel = ACADEMIC_MODELS.find((m) => m.value === data.academic_model)?.label ?? data.academic_model;

  const reviewItems = [
    { label: 'Nome', value: data.name || '\u2014' },
    { label: 'Slug', value: data.slug || '\u2014', extra: `axon.edu/i/${data.slug}` },
    { label: 'Descri\u00e7\u00e3o', value: data.description || '(nenhuma)' },
    { label: 'Logo', value: data.logo_url || '(nenhum)' },
    { label: 'Idioma', value: langLabel },
    { label: 'Fuso Hor\u00e1rio', value: data.timezone.replace(/_/g, ' ') },
    { label: 'Modelo Acad\u00eamico', value: modelLabel },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 style={headingStyle} className="text-zinc-900">
          Revis\u00e3o Final
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Confira os dados antes de criar a institui\u00e7\u00e3o.
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        {reviewItems.map((item) => (
          <div
            key={item.label}
            className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2"
          >
            <span className="text-sm text-zinc-400 sm:w-36 shrink-0">{item.label}</span>
            <div className="flex-1">
              <span className="text-sm text-zinc-800">{item.value}</span>
              {item.extra && (
                <p className="text-xs text-teal-600 mt-0.5 flex items-center gap-1">
                  <ExternalLink className="size-3" /> {item.extra}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {slugStatus === 'taken' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="size-4" />
            O slug \"{data.slug}\" j\u00e1 est\u00e1 em uso. Volte ao passo 1 para alter\u00e1-lo.
          </p>
        </div>
      )}

      {slugStatus === 'available' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Tudo pronto! Clique em \"Criar Institui\u00e7\u00e3o\" para finalizar.
          </p>
        </div>
      )}
    </div>
  );
}
