import hljs from 'highlight.js';
import { marked } from 'marked';

// Create a custom renderer for syntax highlighting
const renderer = new marked.Renderer();

// Override the code block renderer
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  let highlightedCode: string;

  // If language is specified and supported, highlight it
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlightedCode = hljs.highlight(text, { language: lang }).value;
    } catch {
      highlightedCode = escapeHtml(text);
    }
  } else {
    // Try to auto-detect the language
    try {
      const result = hljs.highlightAuto(text);
      // Only use auto-detection if confidence is reasonable
      if (result.relevance > 3) {
        highlightedCode = result.value;
        lang = result.language || 'text';
      } else {
        highlightedCode = escapeHtml(text);
      }
    } catch {
      highlightedCode = escapeHtml(text);
    }
  }

  const validLanguage = lang && /^[a-zA-Z0-9_+-]+$/.test(lang) ? lang : 'text';

  return `<pre class="hljs"><code class="language-${validLanguage}">${highlightedCode}</code></pre>`;
};

// Configure marked for better security and performance in Chrome extension
marked.setOptions({
  breaks: true, // Support line breaks
  gfm: true, // GitHub Flavored Markdown
  renderer: renderer
});

/**
 * Parse markdown text to HTML
 */
export function parseMarkdown(text: string): string {
  try {
    return marked.parse(text) as string;
  } catch (error) {
    console.error('Failed to parse markdown:', error);
    // Fallback to plain text with line breaks
    return escapeHtml(text).replace(/\n/g, '<br>');
  }
}

/**
 * Simple HTML escape function
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
