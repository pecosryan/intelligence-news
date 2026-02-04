#!/usr/bin/env node

/**
 * Generate a new Intelligence News edition
 * This script is run by GitHub Actions to create automated daily editions
 *
 * Usage:
 *   ANTHROPIC_API_KEY=xxx node scripts/generate-edition.js
 *   ANTHROPIC_API_KEY=xxx node scripts/generate-edition.js --perspective center
 */

const fs = require('fs');
const path = require('path');

// Import perspectives and personas (as CommonJS)
const PERSPECTIVES = {
  left: {
    name: 'Progressive',
    prompt: `Write from a progressive/left-leaning editorial perspective. Emphasize:
- Social and economic inequality, systemic issues
- Worker rights, union perspectives, labor conditions
- Environmental justice and climate urgency
- Corporate accountability and critique of concentrated wealth
- Marginalized communities and civil rights
Use language that centers affected communities. Frame issues through power dynamics and structural analysis.`,
  },
  centerLeft: {
    name: 'Liberal',
    prompt: `Write from a center-left/liberal editorial perspective. Emphasize:
- Evidence-based policy and expert consensus
- Incremental reform within existing institutions
- Balance between market efficiency and social safety nets
- International cooperation and multilateralism
Use measured, professional language. Acknowledge complexity while advocating for progressive reforms.`,
  },
  center: {
    name: 'Centrist',
    prompt: `Write from a strictly neutral, nonpartisan editorial perspective. Emphasize:
- Multiple viewpoints presented fairly
- Facts and data over interpretation
- Acknowledgment of legitimate concerns on all sides
Use dispassionate, objective language. Present competing interpretations. Avoid loaded terms.`,
  },
  centerRight: {
    name: 'Conservative',
    prompt: `Write from a center-right/conservative editorial perspective. Emphasize:
- Free market solutions and economic growth
- Individual responsibility and merit
- Traditional institutions (family, religion, community)
- Limited government and fiscal restraint
Use language that emphasizes personal agency, tradition, and proven approaches.`,
  },
  right: {
    name: 'Populist Right',
    prompt: `Write from a populist right-wing editorial perspective. Emphasize:
- Elite vs. ordinary people framing
- National sovereignty and border security
- Skepticism of mainstream media and institutions
Use direct, plain-spoken language. Frame issues as common sense vs. out-of-touch elites.`,
  },
  libertarian: {
    name: 'Libertarian',
    prompt: `Write from a libertarian editorial perspective. Emphasize:
- Individual liberty as the highest value
- Government as the primary threat to freedom
- Free markets as the solution to most problems
Use language that emphasizes choice, consent, and skepticism of authority.`,
  },
};

const PERSONAS = {
  meridian: { id: 'meridian', name: 'Meridian', perspective: 'center', categories: ['World', 'Politics'], bio: 'International affairs correspondent' },
  fulcrum: { id: 'fulcrum', name: 'Fulcrum', perspective: 'center', categories: ['Business', 'Technology'], bio: 'Data-driven analysis' },
  caliber: { id: 'caliber', name: 'Caliber', perspective: 'centerLeft', categories: ['Science', 'Technology'], bio: 'Science and innovation' },
  sterling: { id: 'sterling', name: 'Sterling', perspective: 'centerRight', categories: ['Business', 'World'], bio: 'Market analysis' },
  sentinel: { id: 'sentinel', name: 'Sentinel', perspective: 'centerRight', categories: ['Politics', 'World'], bio: 'Traditional values defender' },
  vanguard: { id: 'vanguard', name: 'Vanguard', perspective: 'left', categories: ['Politics', 'Culture'], bio: 'Social justice champion' },
  tribune: { id: 'tribune', name: 'Tribune', perspective: 'right', categories: ['Politics', 'Culture'], bio: 'Voice of the people' },
  sovereign: { id: 'sovereign', name: 'Sovereign', perspective: 'libertarian', categories: ['Business', 'Politics'], bio: 'Liberty advocate' },
  dispatch: { id: 'dispatch', name: 'Dispatch', perspective: null, categories: ['World', 'Politics', 'Business', 'Technology', 'Science', 'Culture'], bio: 'Breaking news' },
};

async function callClaude(messages, tools = null) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages,
  };

  if (tools) {
    body.tools = tools;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function generateEdition(perspectiveKey = 'center') {
  console.log(`Generating edition with ${perspectiveKey} perspective...`);

  // Step 1: Search for current news
  console.log('Searching for current news...');
  const searchPrompt = `Search for the most important and interesting news stories from today across these categories: World, Business, Technology, Politics, Science, and Culture. Focus on significant developments, breaking news, and stories with broad impact.`;

  const searchResponse = await callClaude(
    [{ role: 'user', content: searchPrompt }],
    [{ type: 'web_search_20250305', name: 'web_search' }]
  );

  let searchContext = searchResponse.content
    ?.filter(block => block.type === 'text')
    ?.map(block => block.text)
    ?.join('\n\n') || '';

  if (!searchContext) {
    throw new Error('No news results found');
  }

  // Truncate to stay under rate limits (~8k chars ≈ 2k tokens, leaving room for prompt)
  // New accounts have 30k token/min limit, need to be conservative
  const MAX_CONTEXT_CHARS = 8000;
  if (searchContext.length > MAX_CONTEXT_CHARS) {
    console.log(`Truncating search context from ${searchContext.length} to ${MAX_CONTEXT_CHARS} chars`);
    searchContext = searchContext.substring(0, MAX_CONTEXT_CHARS) + '\n\n[Context truncated for length]';
  }

  console.log(`News context gathered (${searchContext.length} chars), generating articles...`);

  // Wait 60 seconds between API calls to respect rate limits on new accounts
  console.log('Waiting 60 seconds for rate limit reset...');
  await new Promise(resolve => setTimeout(resolve, 60000));

  // Step 2: Generate articles
  const perspectiveInstructions = PERSPECTIVES[perspectiveKey]?.prompt || PERSPECTIVES.center.prompt;

  const availablePersonas = Object.values(PERSONAS)
    .filter(p => p.perspective === perspectiveKey || p.perspective === null)
    .map(p => `- ${p.name} (${p.id}): ${p.bio}`)
    .join('\n');

  const articlePrompt = `Based on the following current news information, generate a newspaper edition in JSON format.

EDITORIAL PERSPECTIVE:
${perspectiveInstructions}

EDITORIAL PERSONAS (assign the most appropriate persona to each article):
${availablePersonas}

NEWS CONTEXT:
${searchContext}

Generate articles in this exact JSON structure:
{
  "hero": {
    "category": "Category name (World, Business, Technology, Politics, Science, or Culture)",
    "headline": "Compelling headline for the main story",
    "persona": "persona_id",
    "excerpt": "2-3 sentence excerpt",
    "fullText": "Full article text, 4-5 paragraphs separated by \\n\\n"
  },
  "secondary": [
    {
      "category": "Category",
      "headline": "Secondary story headline",
      "persona": "persona_id",
      "excerpt": "1-2 sentence excerpt",
      "fullText": "Full article, 3-4 paragraphs separated by \\n\\n"
    },
    {
      "category": "Category",
      "headline": "Another secondary headline",
      "persona": "persona_id",
      "excerpt": "1-2 sentence excerpt",
      "fullText": "Full article, 3-4 paragraphs separated by \\n\\n"
    }
  ],
  "sidebar": [
    {"category": "Category", "headline": "Brief headline 1", "persona": "persona_id"},
    {"category": "Category", "headline": "Brief headline 2", "persona": "persona_id"},
    {"category": "Category", "headline": "Brief headline 3", "persona": "persona_id"},
    {"category": "Category", "headline": "Brief headline 4", "persona": "persona_id"}
  ],
  "quote": {
    "text": "A quote that reflects the editorial perspective",
    "attribution": "Person's name and title"
  }
}

IMPORTANT:
- Use REAL news from the context provided
- Write with the specified editorial voice
- All facts must be grounded in search results
- Assign personas based on category expertise

Return ONLY valid JSON, no other text.`;

  const articleResponse = await callClaude([{ role: 'user', content: articlePrompt }]);
  const articleText = articleResponse.content?.[0]?.text || '';

  // Parse JSON from response
  const jsonMatch = articleText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse article data');
  }

  const articles = JSON.parse(jsonMatch[0]);

  // Add metadata
  const now = new Date();
  const edition = {
    ...articles,
    perspective: perspectiveKey,
    publishedAt: now.toISOString(),
    date: now.toISOString().split('T')[0],
  };

  return edition;
}

function saveEdition(edition) {
  const dataDir = path.join(__dirname, '..', 'public', 'data', 'articles');
  const archiveDir = path.join(dataDir, 'archive', edition.date.split('-')[0], edition.date.split('-')[1], edition.date.split('-')[2]);

  // Ensure directories exist
  fs.mkdirSync(archiveDir, { recursive: true });

  // Save as current edition
  const currentPath = path.join(dataDir, 'current-edition.json');
  fs.writeFileSync(currentPath, JSON.stringify(edition, null, 2));
  console.log(`Saved current edition to ${currentPath}`);

  // Save to archive
  const archivePath = path.join(archiveDir, 'edition.json');
  fs.writeFileSync(archivePath, JSON.stringify(edition, null, 2));
  console.log(`Saved to archive: ${archivePath}`);

  // Update index
  updateIndex(edition, dataDir);
}

function updateIndex(edition, dataDir) {
  const indexPath = path.join(dataDir, 'index.json');
  let index = { editions: [], totalArticles: 0, categories: {} };

  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch (e) {
      console.warn('Could not parse existing index, creating new one');
    }
  }

  // Add edition to index
  const editionEntry = {
    date: edition.date,
    publishedAt: edition.publishedAt,
    perspective: edition.perspective,
    heroHeadline: edition.hero?.headline,
    articleCount: 1 + (edition.secondary?.length || 0) + (edition.sidebar?.length || 0),
    path: `/data/articles/archive/${edition.date.split('-').join('/')}/edition.json`,
  };

  // Check if this date already exists
  const existingIndex = index.editions.findIndex(e => e.date === edition.date);
  if (existingIndex >= 0) {
    index.editions[existingIndex] = editionEntry;
  } else {
    index.editions.unshift(editionEntry);
  }

  // Keep only last 100 editions in index
  index.editions = index.editions.slice(0, 100);

  // Update totals
  index.totalArticles = index.editions.reduce((sum, e) => sum + (e.articleCount || 0), 0);
  index.lastUpdated = edition.publishedAt;

  // Update category counts
  const categories = { World: 0, Business: 0, Technology: 0, Politics: 0, Science: 0, Culture: 0 };
  if (edition.hero?.category) categories[edition.hero.category] = (categories[edition.hero.category] || 0) + 1;
  edition.secondary?.forEach(a => {
    if (a.category) categories[a.category] = (categories[a.category] || 0) + 1;
  });
  edition.sidebar?.forEach(a => {
    if (a.category) categories[a.category] = (categories[a.category] || 0) + 1;
  });
  index.categories = categories;

  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log('Updated index.json');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  let perspective = 'center';

  // Parse arguments
  const perspectiveArg = args.find(a => a.startsWith('--perspective'));
  if (perspectiveArg) {
    const index = args.indexOf(perspectiveArg);
    if (args[index + 1]) {
      perspective = args[index + 1];
    }
  }

  // Validate perspective
  if (!PERSPECTIVES[perspective]) {
    console.error(`Invalid perspective: ${perspective}`);
    console.error(`Valid options: ${Object.keys(PERSPECTIVES).join(', ')}`);
    process.exit(1);
  }

  try {
    const edition = await generateEdition(perspective);
    saveEdition(edition);
    console.log('Edition generated successfully!');
    console.log(`Hero: ${edition.hero?.headline}`);
  } catch (error) {
    console.error('Failed to generate edition:', error.message);
    process.exit(1);
  }
}

main();
