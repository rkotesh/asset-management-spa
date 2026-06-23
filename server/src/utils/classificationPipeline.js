import fs from 'fs';

const KEYWORDS = {
  'Finance': ['finance', 'financial', 'revenue', 'budget', 'profit', 'fiscal', 'accounting', 'tax', 'invoice', 'ledger'],
  'Branding': ['brand', 'logo', 'identity', 'guidelines', 'typography', 'palette', 'style', 'vector', 'design', 'assets'],
  'HR & Culture': ['employee', 'handbook', 'culture', 'onboarding', 'policy', 'benefits', 'recruiting', 'conduct', 'holidays'],
  'Engineering': ['engineering', 'architecture', 'diagram', 'database', 'container', 'cloud', 'aws', 'system', 'api', 'code', 'deploy', 'roadmap', 'technical', 'specs'],
  'Legal': ['legal', 'sla', 'agreement', 'compliance', 'regulation', 'contract', 'privacy', 'copyright', 'trademark', 'policies']
};

/**
 * Extracts printable ASCII characters from a file buffer.
 * Processes up to 2MB of buffer to avoid performance issues on large files.
 * @param {Buffer} buffer 
 * @returns {string}
 */
export function extractAscii(buffer) {
  const maxBytes = 2 * 1024 * 1024;
  const scanBuffer = buffer.length > maxBytes ? buffer.slice(0, maxBytes) : buffer;
  const rawString = scanBuffer.toString('utf8');
  // Keep only readable ASCII (excluding binary control characters, keeping tabs, newlines, carriage returns, spaces and basic ASCII)
  return rawString.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');
}

/**
 * Classifies an asset by scanning its title, description, and file contents.
 * @param {string} filePath - Path to the uploaded file on disk
 * @param {string} title - Title of the asset
 * @param {string} description - Description of the asset
 * @returns {string[]} Array of matching categories, defaults to ['General']
 */
export function classifyAsset(filePath, title, description) {
  let fileText = '';
  
  try {
    if (filePath && fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      fileText = extractAscii(buffer);
    }
  } catch (error) {
    console.error('[Classification Pipeline] Failed to read file for classification:', error.message);
  }

  const combinedText = `${title || ''} ${description || ''} ${fileText}`.toLowerCase();
  const categories = [];

  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    const matches = keywords.some(keyword => {
      let regexStr;
      // Use strict word boundary for short abbreviations to prevent false positives (e.g. "api" in "rapid")
      if (keyword.length <= 3) {
        regexStr = `\\b${keyword}(s)?\\b`;
      } else {
        // Use word prefix match for longer keywords (e.g. "finance" matches "finances" and "financial")
        regexStr = `\\b${keyword}`;
      }
      const regex = new RegExp(regexStr, 'i');
      return regex.test(combinedText);
    });

    if (matches) {
      categories.push(category);
    }
  }

  return categories.length > 0 ? categories : ['General'];
}
