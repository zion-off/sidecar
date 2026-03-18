export type PageData = {
  title: string;
  description: string;
  editorContent: string;
  language: string;
  timestamp: number;
  selectedText?: string;
};

export type Suggestion = {
  originalCode: string;
  suggestedCode: string;
};

export type InjectionStatus = {
  success?: boolean;
  message?: string;
  timestamp?: number;
};
