#!/usr/bin/env node

/**
 * Generate articles from multiple perspectives on the same news story
 * Each run produces one article per perspective, showing editorial diversity
 *
 * Usage:
 *   ANTHROPIC_API_KEY=xxx node scripts/generate-single-article.js
 *   ANTHROPIC_API_KEY=xxx node scripts/generate-single-article.js --category Technology
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES = ['World', 'Business', 'Technology', 'Politics', 'Science', 'Culture'];

// All perspectives with their editorial voice
const PERSPECTIVES = {
  center: {
    name: 'Centrist',
    prompt: 'Write from a neutral, balanced perspective. Present multiple viewpoints fairly. Use dispassionate, objective language.',
  },
  centerLeft: {
    name: 'Liberal',
    prompt: 'Write from a center-left perspective. Emphasize evidence-based policy, expert consensus, and incremental reform.',
  },
  centerRight: {
    name: 'Conservative',
    prompt: 'Write from a center-right perspective. Emphasize free markets, tradition, fiscal restraint, and individual responsibility.',
  },
  left: {
    name: 'Progressive',
    prompt: 'Write from a progressive perspective. Emphasize social justice, equity, worker rights, and systemic issues. Center affected communities.',
  },
  right: {
    name: 'Populist Right',
    prompt: 'Write from a populist right perspective. Use plain language. Frame as common sense vs elite disconnect. Champion working-class concerns.',
  },
  libertarian: {
    name: 'Libertarian',
    prompt: 'Write from a libertarian perspective. Emphasize individual liberty, skepticism of government, and market solutions.',
  },
  anarchist: {
    name: 'Anarchist',
    prompt: 'Write from an anarchist perspective. Question all hierarchies and authority. Emphasize mutual aid, direct action, and anti-establishment critique. Be provocative but substantive.',
  },
  accelerationist: {
    name: 'Accelerationist',
    prompt: 'Write from an accelerationist perspective. View events through technological determinism and phase transitions. Be detached, analytical, and future-oriented. Treat current events as symptoms of deeper systemic shifts.',
  },
};

// Map perspectives to their primary persona for each category
const PERSONA_MAP = {
  center: {
    default: { id: 'fulcrum', name: 'Fulcrum' },
    World: { id: 'meridian', name: 'Meridian' },
    Politics: { id: 'meridian', name: 'Meridian' },
  },
  centerLeft: {
    default: { id: 'caliber', name: 'Caliber' },
    World: { id: 'horizon', name: 'Horizon' },
    Culture: { id: 'horizon', name: 'Horizon' },
  },
  centerRight: {
    default: { id: 'sterling', name: 'Sterling' },
    Politics: { id: 'sentinel', name: 'Sentinel' },
    World: { id: 'sentinel', name: 'Sentinel' },
  },
  left: {
    default: { id: 'vanguard', name: 'Vanguard' },
    Science: { id: 'ember', name: 'Ember' },
    World: { id: 'ember', name: 'Ember' },
  },
  right: {
    default: { id: 'tribune', name: 'Tribune' },
    World: { id: 'rampart', name: 'Rampart' },
  },
  libertarian: {
    default: { id: 'sovereign', name: 'Sovereign' },
  },
  anarchist: {
    default: { id: 'reckoner', name: 'Reckoner' },
  },
  accelerationist: {
    default: { id: 'vector', name: 'Vector' },
  },
};

function getPersonaForPerspective(perspective, category) {
  const map = PERSONA_MAP[perspective];
  if (!map) return { id: 'dispatch', name: 'Dispatch' };
  return map[category] || map.default;
}

async function callClaude(messages, tools = null) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
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
  const categoryCounts = {};
  const now = Date.now();

  for (const cat of CATEGORIES) {
    categoryCounts[cat] = 0;
  }

  // Count recent articles (last 24 hours) per category
  for (const article of existingArticles) {
    const age = now - new Date(article.publishedAt).getTime();
    if (age < 24 * 60 * 60 * 1000 && article.category) {
      categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
    }
  }

  // Pick category with fewest recent articles
  const sorted = CATEGORIES.sort((a, b) => categoryCounts[a] - categoryCounts[b]);
  return sorted[0];
}

async function searchNews(category) {
  console.log(`Searching for ${category} news...`);

  const searchPrompt = `Find ONE important ${category.toLowerCase()} news story from today. Focus on significant breaking news or major developments that would be interesting to analyze from multiple political perspectives.`;

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

  // Truncate to reasonable size
  const MAX_CONTEXT = 4000;
  if (searchContext.length > MAX_CONTEXT) {
    searchContext = searchContext.substring(0, MAX_CONTEXT) + '\n[truncated]';
  }

  console.log(`News context: ${searchContext.length} chars`);
  return searchContext;
}

async function generateAllPerspectives(category, newsContext) {
  const perspectiveKeys = Object.keys(PERSPECTIVES);

  console.log(`\nGenerating ${perspectiveKeys.length} articles from different perspectives...`);

  // Build the prompt to generate all perspectives at once
  const perspectiveInstructions = perspectiveKeys.map(key => {
    const p = PERSPECTIVES[key];
    const persona = getPersonaForPerspective(key, category);
    return `
### ${key.toUpperCase()} (Byline: ${persona.name})
${p.prompt}`;
  }).join('\n');

  const prompt = `Based on this news story, write ${perspectiveKeys.length} SHORT articles - one from each editorial perspective. Each article should cover the SAME story but with different framing, emphasis, and voice.

CATEGORY: ${category}

NEWS CONTEXT:
${newsContext}

PERSPECTIVES TO WRITE:
${perspectiveInstructions}

Return a JSON array with exactly ${perspectiveKeys.length} articles:
[
  {
    "perspective": "center",
    "headline": "Neutral headline (max 80 chars)",
    "excerpt": "1-2 sentence neutral summary",
    "fullText": "2-3 paragraphs with balanced analysis"
  },
  {
    "perspective": "centerLeft",
    "headline": "Liberal-leaning headline",
    "excerpt": "1-2 sentence summary emphasizing reform",
    "fullText": "2-3 paragraphs from center-left view"
  },
  ... (continue for all ${perspectiveKeys.length} perspectives)
]

IMPORTANT:
- Each article must have a DIFFERENT headline reflecting its perspective
- Same facts, different framing and emphasis
- Keep articles concise (2-3 paragraphs each)
- Return ONLY valid JSON array`;

  const response = await callClaude([{ role: 'user', content: prompt }]);
  const text = response.content?.[0]?.text || '';

  // Parse JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse articles JSON');
  }

  const articlesData = JSON.parse(jsonMatch[0]);

  // Build full article objects
  const now = new Date();
  const articles = articlesData.map((article, index) => {
    const perspectiveKey = article.perspective || perspectiveKeys[index];
    const persona = getPersonaForPerspective(perspectiveKey, category);

    return {
      id: `${Date.now()}-${perspectiveKey}-${Math.random().toString(36).substr(2, 6)}`,
      headline: article.headline,
      excerpt: article.excerpt,
      fullText: article.fullText,
      category,
      persona: persona.id,
      personaName: persona.name,
      perspective: perspectiveKey,
      publishedAt: new Date(now.getTime() - index * 1000).toISOString(), // Stagger by 1 second
    };
  });

  return articles;
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

  // Remove articles older than archive threshold
  const archiveThreshold = config.archiveAge * 60 * 60 * 1000;
  const activeArticles = sorted.filter(a => now - new Date(a.publishedAt).getTime() < archiveThreshold);

  // Build edition - newest first
  const edition = {
    hero: sorted[0] || null,
    secondary: sorted.slice(1, 3),
    sidebar: sorted.slice(3, 7),
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

    // Select category
    const category = targetCategory || selectCategory(pool.articles);
    console.log(`Selected category: ${category}`);

    // Search for news (one API call)
    const newsContext = await searchNews(category);

    // Wait for rate limit
    console.log('Waiting 30 seconds for rate limit...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Generate all perspectives (one API call)
    const articles = await generateAllPerspectives(category, newsContext);

    console.log(`\nGenerated ${articles.length} articles:`);
    articles.forEach(a => {
      console.log(`  - [${a.perspective}] ${a.personaName}: "${a.headline.substring(0, 50)}..."`);
    });

    // Add to pool
    pool.articles.push(...articles);
    pool.lastUpdated = new Date().toISOString();

    // Compose edition and clean old articles
    const { edition, activeArticles } = composeEdition(pool);
    pool.articles = activeArticles;

    // Save
    savePool(pool);
    saveEdition(edition);

    console.log('\nEdition composed:');
    console.log(`  Hero: ${edition.hero?.headline || 'None'}`);
    console.log(`  Secondary: ${edition.secondary?.length || 0} articles`);
    console.log(`  Sidebar: ${edition.sidebar?.length || 0} articles`);
    console.log(`  Total in pool: ${pool.articles.length}`);

  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

main();
