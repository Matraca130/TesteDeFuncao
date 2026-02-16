export function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
      {label}
      {required ? (
        <span className="text-[9px] font-bold text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded normal-case tracking-normal">obrigatorio</span>
      ) : (
        <span className="text-[9px] font-medium text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded normal-case tracking-normal">opcional</span>
      )}
    </label>
  );
}
