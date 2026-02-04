// Storage Service - Handles persistence via localStorage and JSON files
// Hybrid approach: localStorage for session state, JSON files for archive

const STORAGE_KEYS = {
  CURRENT_EDITION: 'intelligence_current_edition',
  EDITION_HISTORY: 'intelligence_edition_history',
  USER_PREFERENCES: 'intelligence_preferences',
};

const BASE_PATH = '/intelligence-news/data';

// ============ localStorage Operations ============

export function saveEditionToLocal(edition) {
  try {
    const editionWithMeta = {
      ...edition,
      savedAt: new Date().toISOString(),
      perspective: edition.perspective || 'center',
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_EDITION, JSON.stringify(editionWithMeta));

    // Also add to history
    addToHistory(editionWithMeta);

    return true;
  } catch (error) {
    console.error('Failed to save edition to localStorage:', error);
    return false;
  }
}

export function loadEditionFromLocal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_EDITION);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  } catch (error) {
    console.error('Failed to load edition from localStorage:', error);
    return null;
  }
}

export function addToHistory(edition) {
  try {
    const history = getEditionHistory();
    const editionId = edition.savedAt || new Date().toISOString();

    // Don't add duplicates
    if (history.some(e => e.savedAt === editionId)) {
      return;
    }

    // Keep last 50 editions
    const updatedHistory = [
      { ...edition, id: editionId },
      ...history,
    ].slice(0, 50);

    localStorage.setItem(STORAGE_KEYS.EDITION_HISTORY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to add to history:', error);
  }
}

export function getEditionHistory() {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.EDITION_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to load edition history:', error);
    return [];
  }
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEYS.EDITION_HISTORY);
}

// ============ User Preferences ============

export function savePreferences(prefs) {
  try {
    const existing = loadPreferences();
    const updated = { ...existing, ...prefs };
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return false;
  }
}

export function loadPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return saved ? JSON.parse(saved) : { theme: 'classic', perspective: 'center' };
  } catch (error) {
    return { theme: 'classic', perspective: 'center' };
  }
}

// ============ Article Pool Operations ============

export async function loadArticlePool() {
  try {
    const response = await fetch(`${BASE_PATH}/articles/pool.json`);
    if (!response.ok) {
      if (response.status === 404) {
        return { articles: [], config: { heroAge: 6, secondaryAge: 12, sidebarAge: 24, archiveAge: 48 } };
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load article pool:', error);
    return { articles: [], config: { heroAge: 6, secondaryAge: 12, sidebarAge: 24, archiveAge: 48 } };
  }
}

export function composeEditionFromPool(pool) {
  const now = Date.now();
  const config = pool.config || { heroAge: 6, secondaryAge: 12, sidebarAge: 24 };

  // Sort articles by age (newest first)
  const sorted = [...(pool.articles || [])].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  if (sorted.length === 0) {
    return null;
  }

  // Age thresholds in milliseconds
  const heroThreshold = config.heroAge * 60 * 60 * 1000;
  const secondaryThreshold = config.secondaryAge * 60 * 60 * 1000;
  const sidebarThreshold = config.sidebarAge * 60 * 60 * 1000;

  // Pick hero (newest article)
  const hero = sorted[0];

  // Pick secondary (next 2 articles)
  const secondary = sorted.slice(1, 3);

  // Pick sidebar (next 4 articles)
  const sidebar = sorted.slice(3, 7);

  return {
    hero,
    secondary,
    sidebar,
    quote: {
      text: "The news never stops, but wisdom requires perspective.",
      attribution: "Intelligence Editorial Board"
    },
    perspective: 'mixed',
    publishedAt: pool.lastUpdated || new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
  };
}

// ============ JSON File Operations ============

export async function loadCurrentEditionFromServer() {
  try {
    const response = await fetch(`${BASE_PATH}/articles/current-edition.json`);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No current edition yet
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load current edition from server:', error);
    return null;
  }
}

export async function loadArticleIndex() {
  try {
    const response = await fetch(`${BASE_PATH}/articles/index.json`);
    if (!response.ok) {
      if (response.status === 404) {
        return { editions: [], totalArticles: 0 };
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load article index:', error);
    return { editions: [], totalArticles: 0 };
  }
}

export async function loadArchivedEdition(dateString) {
  // dateString format: "2025-01-15"
  const [year, month, day] = dateString.split('-');
  try {
    const response = await fetch(`${BASE_PATH}/articles/archive/${year}/${month}/${day}/edition.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load archived edition for ${dateString}:`, error);
    return null;
  }
}

// ============ Hybrid Loading Strategy ============

export async function loadBestAvailableEdition() {
  // 1. Try localStorage first (fastest)
  const localEdition = loadEditionFromLocal();

  // 2. Try server current edition
  const serverEdition = await loadCurrentEditionFromServer();

  // 3. Decide which to use
  if (localEdition && serverEdition) {
    // Use whichever is newer
    const localDate = new Date(localEdition.savedAt || 0);
    const serverDate = new Date(serverEdition.publishedAt || 0);
    return localDate > serverDate ? localEdition : serverEdition;
  }

  return localEdition || serverEdition || null;
}

// ============ Search Utilities ============

export function searchArticlesInHistory(query, filters = {}) {
  const history = getEditionHistory();
  const results = [];

  const normalizedQuery = query?.toLowerCase() || '';

  for (const edition of history) {
    // Check hero
    if (edition.hero && matchesSearch(edition.hero, normalizedQuery, filters)) {
      results.push({ ...edition.hero, editionDate: edition.savedAt });
    }

    // Check secondary
    if (edition.secondary) {
      for (const article of edition.secondary) {
        if (matchesSearch(article, normalizedQuery, filters)) {
          results.push({ ...article, editionDate: edition.savedAt });
        }
      }
    }
  }

  return results;
}

function matchesSearch(article, query, filters) {
  // Text match
  if (query) {
    const searchText = `${article.headline || ''} ${article.excerpt || ''} ${article.fullText || ''}`.toLowerCase();
    if (!searchText.includes(query)) {
      return false;
    }
  }

  // Category filter
  if (filters.category && article.category !== filters.category) {
    return false;
  }

  // Persona filter
  if (filters.persona && article.persona !== filters.persona) {
    return false;
  }

  return true;
}

// ============ Export for Edition Generation Scripts ============

export function formatEditionForExport(articles, perspective) {
  const now = new Date();
  return {
    publishedAt: now.toISOString(),
    date: now.toISOString().split('T')[0],
    perspective,
    hero: articles.hero,
    secondary: articles.secondary,
    sidebar: articles.sidebar,
    quote: articles.quote,
  };
}

export default {
  saveEditionToLocal,
  loadEditionFromLocal,
  getEditionHistory,
  clearHistory,
  savePreferences,
  loadPreferences,
  loadArticlePool,
  composeEditionFromPool,
  loadCurrentEditionFromServer,
  loadArticleIndex,
  loadArchivedEdition,
  loadBestAvailableEdition,
  searchArticlesInHistory,
  formatEditionForExport,
};
