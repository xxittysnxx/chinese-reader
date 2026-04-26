import * as OpenCC from 'opencc-js';

// Initialize the converter (Simplified to Traditional Taiwan with phrase substitution)
// This is synchronous and loads the dictionary once
let converterInstance = null;

export function getConverter() {
  if (!converterInstance) {
    converterInstance = OpenCC.Converter({ from: 'cn', to: 'twp' });
  }
  return converterInstance;
}

let segmenter = null;

/**
 * Applies custom exact string replacements.
 * @param {string} text - The original text.
 * @param {Array<{from: string, to: string, isWord?: boolean}>} replacements - Array of replacement rules.
 * @returns {string} The text after replacements.
 */
export function applyReplacements(text, replacements = []) {
  if (!text) return text;
  let result = text;
  
  for (const rule of replacements) {
    if (!rule.from) continue;
    
    if (rule.isWord) {
      // Use Intl.Segmenter to match independent words/characters
      if (!segmenter) {
        segmenter = new Intl.Segmenter('zh-TW', { granularity: 'word' });
      }
      const segments = segmenter.segment(result);
      let newText = '';
      for (const seg of segments) {
        if (seg.segment === rule.from) {
          newText += rule.to;
        } else {
          newText += seg.segment;
        }
      }
      result = newText;
    } else {
      // Standard exact string replacement
      result = result.split(rule.from).join(rule.to || '');
    }
  }
  return result;
}

/**
 * Parses HTML, translates text nodes, applies replacements, and returns updated HTML string.
 * @param {string} htmlString - The raw HTML string
 * @param {Array<{from: string, to: string}>} replacements - Custom replacements
 * @param {boolean} shouldTranslate - Whether to apply OpenCC translation
 * @returns {string} Processed HTML string
 */
export function processArticleHtml(htmlString, replacements = [], shouldTranslate = true) {
  const converter = shouldTranslate ? getConverter() : null;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  
  const walkNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent;
      if (shouldTranslate && converter) {
        text = converter(text);
      }
      text = applyReplacements(text, replacements);
      node.textContent = text;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of node.childNodes) {
        walkNode(child);
      }
    }
  };
  
  walkNode(tempDiv);
  return tempDiv.innerHTML;
}
