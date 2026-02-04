#!/usr/bin/env node

/**
 * Generate a single article for Intelligence News
 * Designed to run frequently (every 2-3 hours) with minimal API usage
 *
 * Usage:
 *   ANTHROPIC_API_KEY=xxx node scripts/generate-single-article.js
 *   ANTHROPIC_API_KEY=xxx node scripts/generate-single-article.js --category Technology
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES = ['World', 'Business', 'Technology', 'Politics', 'Science', 'Culture'];

const PERSPECTIVES = {
  left: { name: 'Progressive', prompt: 'Write from a progressive perspective emphasizing social justice and equity.' },
  centerLeft: { name: 'Liberal', prompt: 'Write from a center-left perspective emphasizing evidence-based policy.' },
  center: { name: 'Centrist', prompt: 'Write from a neutral, balanced perspective presenting multiple viewpoints.' },
  centerRight: { name: 'Conservative', prompt: 'Write from a center-right perspective emphasizing free markets and tradition.' },
  right: { name: 'Populist Right', prompt: 'Write from a populist right perspective emphasizing common sense values.' },
  libertarian: { name: 'Libertarian', prompt: 'Write from a libertarian perspective emphasizing individual liberty.' },
};

const PERSONAS = {
  World: [
    { id: 'meridian', name: 'Meridian', perspective: 'center' },
    { id: 'sentinel', name: 'Sentinel', perspective: 'centerRight' },
  ],
  Business: [
    { id: 'sterling', name: 'Sterling', perspective: 'centerRight' },
    { id: 'fulcrum', name: 'Fulcrum', perspective: 'center' },
    { id: 'sovereign', name: 'Sovereign', perspective: 'libertarian' },
  ],
  Technology: [
    { id: 'caliber', name: 'Caliber', perspective: 'centerLeft' },
    { id: 'fulcrum', name: 'Fulcrum', perspective: 'center' },
  ],
  Politics: [
    { id: 'meridian', name: 'Meridian', perspective: 'center' },
    { id: 'vanguard', name: 'Vanguard', perspective: 'left' },
    { id: 'tribune', name: 'Tribune', perspective: 'right' },
    { id: 'sentinel', name: 'Sentinel', perspective: 'centerRight' },
  ],
  Science: [
    { id: 'caliber', name: 'Caliber', perspective: 'centerLeft' },
  ],
  Culture: [
    { id: 'vanguard', name: 'Vanguard', perspective: 'left' },
    { id: 'tribune', name: 'Tribune', perspective: 'right' },
  ],
};

async function callClaude(messages, tools = null) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000, // Reduced for single article
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

function selectCategory(existingArticles) {
  // Pick category with oldest/fewest articles
  const categoryCounts = {};
  const categoryAges = {};
  const now = Date.now();

  for (const cat of CATEGORIES) {
    categoryCounts[cat] = 0;
    categoryAges[cat] = Infinity;
  }

  for (const article of existingArticles) {
    if (article.category && CATEGORIES.includes(article.category)) {
      categoryCounts[article.category]++;
      const age = now - new Date(article.publishedAt).getTime();
      categoryAges[article.category] = Math.min(categoryAges[article.category], age);
    }
  }

  // Prioritize categories with fewer recent articles
  const sorted = CATEGORIES.sort((a, b) => {
    // First by count (fewer is better)
    if (categoryCounts[a] !== categoryCounts[b]) {
      return categoryCounts[a] - categoryCounts[b];
    }
    // Then by age (older is better - needs refresh)
    return categoryAges[b] - categoryAges[a];
  });

  return sorted[0];
}

function selectPersona(category) {
  const options = PERSONAS[category] || PERSONAS.World;
  return options[Math.floor(Math.random() * options.length)];
}

async function generateArticle(category, persona) {
  console.log(`Generating ${category} article by ${persona.name}...`);

  const perspective = PERSPECTIVES[persona.perspective] || PERSPECTIVES.center;

  // Step 1: Quick news search (very focused)
  const searchPrompt = `Find ONE important ${category.toLowerCase()} news story from today. Focus on significant breaking news or major developments.`;

  console.log('Searching for news...');
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

  // Heavily truncate - we only need enough for 1 article
  const MAX_CONTEXT = 3000;
  if (searchContext.length > MAX_CONTEXT) {
    searchContext = searchContext.substring(0, MAX_CONTEXT) + '\n[truncated]';
  }

  console.log(`Context: ${searchContext.length} chars`);

  // Wait to respect rate limits
  console.log('Waiting 30 seconds for rate limit...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Step 2: Generate single article
  const articlePrompt = `Based on this news, write ONE article.

CATEGORY: ${category}
BYLINE: ${persona.name}
PERSPECTIVE: ${perspective.prompt}

NEWS:
${searchContext}

Return JSON only:
{
  "headline": "Compelling headline (max 100 chars)",
  "excerpt": "2-3 sentence summary",
  "fullText": "Full article, 3-4 paragraphs separated by \\n\\n"
}

Write with the specified editorial voice. Facts must come from the news provided.
Return ONLY valid JSON.`;

  const articleResponse = await callClaude([{ role: 'user', content: articlePrompt }]);
  const articleText = articleResponse.content?.[0]?.text || '';

  const jsonMatch = articleText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse article JSON');
  }

  const articleData = JSON.parse(jsonMatch[0]);

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...articleData,
    category,
    persona: persona.id,
    personaName: persona.name,
    perspective: persona.perspective,
    publishedAt: new Date().toISOString(),
  };
}

function loadPool() {
  const poolPath = path.join(__dirname, '..', 'public', 'data', 'articles', 'pool.json');
  if (fs.existsSync(poolPath)) {
    return JSON.parse(fs.readFileSync(poolPath, 'utf-8'));
  }
  return { articles: [], lastUpdated: null, config: { heroAge: 6, secondaryAge: 12, sidebarAge: 24, archiveAge: 48 } };
}

function savePool(pool) {
  const poolPath = path.join(__dirname, '..', 'public', 'data', 'articles', 'pool.json');
  fs.writeFileSync(poolPath, JSON.stringify(pool, null, 2));
  console.log(`Pool saved with ${pool.articles.length} articles`);
}

function composeEdition(pool) {
  const now = Date.now();
  const config = pool.config;

  // Sort articles by age (newest first)
  const sorted = [...pool.articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Age thresholds in milliseconds
  const heroThreshold = config.heroAge * 60 * 60 * 1000;
  const secondaryThreshold = config.secondaryAge * 60 * 60 * 1000;
  const sidebarThreshold = config.sidebarAge * 60 * 60 * 1000;
  const archiveThreshold = config.archiveAge * 60 * 60 * 1000;

  // Categorize by age
  const hero = sorted.find(a => now - new Date(a.publishedAt).getTime() < heroThreshold);
  const secondary = sorted
    .filter(a => {
      const age = now - new Date(a.publishedAt).getTime();
      return age >= heroThreshold && age < secondaryThreshold && a !== hero;
    })
    .slice(0, 2);
  const sidebar = sorted
    .filter(a => {
      const age = now - new Date(a.publishedAt).getTime();
      return age >= secondaryThreshold && age < sidebarThreshold && !secondary.includes(a) && a !== hero;
    })
    .slice(0, 4);

  // Remove articles older than archive threshold from pool
  const activeArticles = sorted.filter(a => now - new Date(a.publishedAt).getTime() < archiveThreshold);

  // Build edition
  const edition = {
    hero: hero || sorted[0] || null,
    secondary: secondary.length ? secondary : sorted.slice(1, 3),
    sidebar: sidebar.length ? sidebar : sorted.slice(3, 7),
    quote: {
      text: "The news never stops, but wisdom requires perspective.",
      attribution: "Intelligence Editorial Board"
    },
    perspective: 'mixed',
    publishedAt: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
  };

  return { edition, activeArticles };
}

function saveEdition(edition) {
  const dataDir = path.join(__dirname, '..', 'public', 'data', 'articles');
  const currentPath = path.join(dataDir, 'current-edition.json');
  fs.writeFileSync(currentPath, JSON.stringify(edition, null, 2));
  console.log(`Current edition saved`);
}

async function main() {
  const args = process.argv.slice(2);

  // Parse optional category argument
  let targetCategory = null;
  const categoryArg = args.find(a => a.startsWith('--category'));
  if (categoryArg) {
    const index = args.indexOf(categoryArg);
    if (args[index + 1] && CATEGORIES.includes(args[index + 1])) {
      targetCategory = args[index + 1];
    }
  }

  try {
    // Load existing pool
    const pool = loadPool();
    console.log(`Pool has ${pool.articles.length} existing articles`);

    // Select category (either specified or auto-selected)
    const category = targetCategory || selectCategory(pool.articles);
    console.log(`Selected category: ${category}`);

    // Select persona for this category
    const persona = selectPersona(category);
    console.log(`Selected persona: ${persona.name} (${persona.perspective})`);

    // Generate article
    const article = await generateArticle(category, persona);
    console.log(`Generated: "${article.headline}"`);

    // Add to pool
    pool.articles.push(article);
    pool.lastUpdated = new Date().toISOString();

    // Compose edition from pool and clean old articles
    const { edition, activeArticles } = composeEdition(pool);
    pool.articles = activeArticles;

    // Save
    savePool(pool);
    saveEdition(edition);

    console.log('\nEdition composed:');
    console.log(`  Hero: ${edition.hero?.headline || 'None'}`);
    console.log(`  Secondary: ${edition.secondary?.length || 0} articles`);
    console.log(`  Sidebar: ${edition.sidebar?.length || 0} articles`);

  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

main();
