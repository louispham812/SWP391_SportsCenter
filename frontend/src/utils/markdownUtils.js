/**
 * Utility functions for cleaning and normalizing Markdown text.
 */

/**
 * Removes raw Markdown syntax (**, ##, ###, ---, *, etc.)
 * leaving clean, well-spaced plain text suitable for textareas or plain-text inputs.
 *
 * @param {string} text
 * @returns {string}
 */
export function cleanMarkdownText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    // Remove headers (# Heading -> Heading)
    .replace(/^#{1,6}\s*(.+)$/gm, '$1')
    // Remove horizontal rules (--- or *** or ___)
    .replace(/^([-*]{3,}|_{3,})$/gm, '')
    // Remove bold and bold-italic
    .replace(/\*\*\*([^*]+?)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    .replace(/___([^_]+?)___/g, '$1')
    .replace(/__([^_]+?)__/g, '$1')
    // Remove italics (only if wrapped without outer spaces)
    .replace(/(^|\s)\*([^*\s][^*]*?)\*($|\s)/g, '$1$2$3')
    .replace(/(^|\s)_([^_\\s][^_]*?)_($|\s)/g, '$1$2$3')
    // Remove inline code
    .replace(/`([^`]+?)`/g, '$1')
    // Convert * or + bullet points to clean dash -
    .replace(/^[*+]\s+/gm, '- ')
    // Normalize excessive blank lines (max 2 newlines)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
