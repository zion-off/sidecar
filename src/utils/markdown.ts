import { marked } from 'marked';

// Configure marked for better security and performance in Chrome extension
marked.setOptions({
  breaks: true, // Support line breaks
  gfm: true // GitHub Flavored Markdown
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

/**
 * Check if text contains markdown syntax
 */
export function hasMarkdownSyntax(text: string): boolean {
  const markdownPatterns = [
    /\*\*.*?\*\*/, // Bold
    /\*.*?\*/, // Italic
    /`.*?`/, // Inline code
    /```[\s\S]*?```/, // Code blocks
    /^#+\s+/m, // Headers
    /^\s*[-*+]\s+/m, // Unordered lists
    /^\s*\d+\.\s+/m, // Ordered lists
    /\[.*?\]\(.*?\)/, // Links
    /^>\s+/m // Blockquotes
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
}
