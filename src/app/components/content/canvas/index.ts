// ════════════════════════════════════════════════════════════════
// CANVAS MODULE — barrel export
// ════════════════════════════════════════════════════════════════
export * from './types';
export * from './helpers';
export { useBlockOperations } from './useBlockOperations';
export { useCanvasFormatting } from './useCanvasFormatting';
export { useCanvasPersistence } from './useCanvasPersistence';
export { useCanvasAI } from './useCanvasAI';
export { useCanvasExport } from './useCanvasExport';
export { useSmartPaste } from './useSmartPaste';
export { CanvasTopBar } from './CanvasTopBar';
export { FormattingToolbar } from './FormattingToolbar';
export { MetaPanel } from './MetaPanel';
export { ToolBtn, AddBlockMenu, BlockTypeSelector } from './ToolbarComponents';
export { QuickDeleteButton, DragHandle, BlockActions } from './BlockActions';
export { PreviewBlock } from './PreviewBlock';
export { PdfBlocksRenderer, pdfKeywordHtml } from './PdfRenderer';
export { ImagePickerModal, ImageResizeHandle, ColumnResizeHandle } from './ImageComponents';
export { KeywordPicker } from './KeywordPicker';
export { KeywordPopover, KeywordPopoverProvider } from './KeywordPopover';
export { AnnotationPanel } from './AnnotationPanel';
export { ReorderBlockWrapper } from './ReorderBlockWrapper';
// Added by Agent 6 — PRISM — P4: sub-component exports
export { StudentNotesTab } from './StudentNotesTab';
export type { StudentNotesTabProps } from './StudentNotesTab';
export { ProfessorNotesTab } from './ProfessorNotesTab';
export type { ProfessorNotesTabProps } from './ProfessorNotesTab';
export { DiagnosticoTab } from './DiagnosticoTab';
export type { DiagnosticoTabProps } from './DiagnosticoTab';
