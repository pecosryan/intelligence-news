import React, { useState, useEffect } from 'react';
import { PERSPECTIVES, PERSPECTIVE_COLORS, CATEGORIES } from './data/perspectives';
import { THEMES, THEME_FONTS, FONT_LINKS } from './data/themes';
import { PERSONAS, getPersonaForArticle } from './data/personas';
import {
  loadBestAvailableEdition,
  loadArticlePool,
  composeEditionFromPool,
  savePreferences,
  loadPreferences,
  getEditionHistory,
  searchArticlesInHistory,
} from './services/storageService';

// Inject fonts
if (typeof document !== 'undefined' && !document.getElementById('intelligence-fonts')) {
  const div = document.createElement('div');
  div.id = 'intelligence-fonts';
  div.innerHTML = FONT_LINKS;
  document.head.appendChild(div.firstElementChild);
  document.head.appendChild(div.firstElementChild);
}

export default function Intelligence() {
  // Load initial preferences from localStorage
  const initialPrefs = loadPreferences();

  const [theme, setTheme] = useState(initialPrefs.theme || 'classic');
  const [perspective, setPerspective] = useState(initialPrefs.perspective || 'center');
  const [articles, setArticles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [error, setError] = useState(null);
  const [showPerspectiveMenu, setShowPerspectiveMenu] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveHistory, setArchiveHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const colors = THEMES[theme];
  const fonts = THEME_FONTS[theme];
  const currentPerspective = PERSPECTIVES[perspective];

  // Helper to get persona name from article
  const getByline = (article) => {
    if (article.persona && PERSONAS[article.persona]) {
      return PERSONAS[article.persona].name;
    }
    // Fallback for old format
    return article.byline || 'Intelligence Staff';
  };
  
  // Override accent color based on perspective (except for center which uses theme default)
  const accentColor = perspective === 'center' ? colors.accent : PERSPECTIVE_COLORS[perspective];

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Store pool for filtering by perspective
  const [articlePool, setArticlePool] = useState(null);

  // Load article pool on mount
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      setLoadingMessage('Loading latest articles...');

      try {
        // Try loading from article pool first (incremental system)
        const pool = await loadArticlePool();
        if (pool.articles && pool.articles.length > 0) {
          setArticlePool(pool);
          // Compose edition filtered by current perspective
          const poolEdition = composeEditionFromPool(pool, perspective);
          if (poolEdition) {
            setArticles(poolEdition);
            setLoading(false);
            setLoadingMessage('');
            return;
          }
        }

        // Fall back to current-edition.json or localStorage
        const savedEdition = await loadBestAvailableEdition();
        if (savedEdition) {
          setArticles(savedEdition);
          setLoading(false);
          setLoadingMessage('');
        } else {
          // No saved edition, show empty state
          setLoading(false);
          setLoadingMessage('');
        }
      } catch (err) {
        console.error('Failed to load saved edition:', err);
        setLoading(false);
        setLoadingMessage('');
      }
    };

    loadInitial();
  }, []);

  // Re-compose edition when perspective changes
  useEffect(() => {
    if (articlePool && articlePool.articles && articlePool.articles.length > 0) {
      const filteredEdition = composeEditionFromPool(articlePool, perspective);
      if (filteredEdition) {
        setArticles(filteredEdition);
      }
    }
  }, [perspective, articlePool]);

  // Save preferences when theme or perspective changes
  useEffect(() => {
    savePreferences({ theme, perspective });
  }, [theme, perspective]);

  // Load archive history when archive view is opened
  useEffect(() => {
    if (showArchive) {
      setArchiveHistory(getEditionHistory());
    }
  }, [showArchive]);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.bg,
      color: colors.text,
      fontFamily: fonts.body,
      fontSize: '0.95rem',
      lineHeight: 1.6,
      transition: 'all 0.4s ease',
    },
    themeSwitcher: {
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 1000,
      display: 'flex',
      gap: '0.5rem',
      backgroundColor: colors.bgSecondary,
      padding: '0.5rem',
      border: `1px solid ${colors.rule}`,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    themeBtn: (isActive) => ({
      padding: '0.4rem 0.8rem',
      border: `1px solid ${colors.rule}`,
      background: isActive ? colors.text : 'transparent',
      color: isActive ? colors.bg : colors.text,
      fontFamily: fonts.meta,
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }),
    newspaper: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1rem',
    },
    masthead: {
      textAlign: 'center',
      padding: '1.5rem 0',
      borderBottom: `3px double ${colors.rule}`,
      marginBottom: '0.5rem',
    },
    mastheadTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: fonts.meta,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '0.5rem',
      color: colors.textSecondary,
    },
    mastheadTitle: {
      fontFamily: fonts.masthead,
      fontSize: theme === 'modern' ? '2.5rem' : theme === 'tabloid' ? '3.5rem' : '4.5rem',
      fontWeight: theme === 'classic' ? 400 : 700,
      letterSpacing: theme === 'modern' ? '-0.02em' : '0.02em',
      lineHeight: 1.1,
      color: theme === 'tabloid' ? colors.accent : colors.text,
      textTransform: theme === 'tabloid' ? 'uppercase' : 'none',
    },
    tagline: {
      fontFamily: fonts.meta,
      fontSize: '0.75rem',
      fontStyle: theme === 'tabloid' ? 'normal' : 'italic',
      color: colors.textSecondary,
      marginTop: '0.3rem',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      fontWeight: theme === 'tabloid' ? 700 : 400,
    },
    navBar: {
      display: 'flex',
      justifyContent: 'center',
      gap: '2rem',
      padding: '0.75rem 0',
      borderBottom: `1px solid ${colors.rule}`,
      marginBottom: '1.5rem',
      fontFamily: fonts.meta,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      flexWrap: 'wrap',
    },
    navLink: {
      color: colors.text,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'color 0.2s',
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1px 1fr 1px 1fr',
      gap: '1.5rem',
    },
    columnRule: {
      backgroundColor: colors.ruleLight,
      width: '1px',
    },
    category: {
      fontFamily: fonts.meta,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      color: accentColor,
      marginBottom: '0.3rem',
      fontWeight: 500,
    },
    headlineHero: {
      fontFamily: fonts.headline,
      fontSize: theme === 'tabloid' ? '3.5rem' : '3rem',
      fontWeight: 700,
      lineHeight: 1.1,
      marginBottom: '0.5rem',
      cursor: 'pointer',
      textTransform: theme === 'tabloid' ? 'uppercase' : 'none',
      transition: 'color 0.2s',
    },
    headlineMedium: {
      fontFamily: fonts.headline,
      fontSize: theme === 'tabloid' ? '1.4rem' : '1.3rem',
      fontWeight: 600,
      lineHeight: 1.15,
      marginBottom: '0.5rem',
      cursor: 'pointer',
      textTransform: theme === 'tabloid' ? 'uppercase' : 'none',
      transition: 'color 0.2s',
    },
    headlineSmall: {
      fontFamily: fonts.headline,
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.2,
      marginBottom: '0.25rem',
      cursor: 'pointer',
      textTransform: theme === 'tabloid' ? 'uppercase' : 'none',
    },
    meta: {
      fontFamily: fonts.meta,
      fontSize: '0.75rem',
      color: colors.textSecondary,
      marginBottom: '0.75rem',
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    byline: {
      fontStyle: 'italic',
    },
    articleBody: {
      textAlign: theme === 'modern' ? 'left' : 'justify',
      hyphens: theme === 'modern' ? 'none' : 'auto',
    },
    imagePlaceholder: {
      width: '100%',
      height: '280px',
      background: `linear-gradient(135deg, ${colors.bgSecondary} 0%, ${colors.ruleLight} 100%)`,
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${colors.ruleLight}`,
    },
    sidebarTitle: {
      fontFamily: fonts.headline,
      fontSize: '0.9rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      borderBottom: `2px solid ${colors.rule}`,
      paddingBottom: '0.5rem',
      marginBottom: '1rem',
    },
    sidebarItem: {
      padding: '0.75rem 0',
      borderBottom: `1px solid ${colors.ruleLight}`,
    },
    quoteBlock: {
      borderLeft: `3px solid ${accentColor}`,
      paddingLeft: '1rem',
      margin: '1.5rem 0',
      fontFamily: fonts.headline,
      fontSize: '1.1rem',
      fontStyle: 'italic',
      lineHeight: 1.4,
    },
    quoteAttribution: {
      fontFamily: fonts.meta,
      fontSize: '0.75rem',
      fontStyle: 'normal',
      color: colors.textSecondary,
      marginTop: '0.5rem',
    },
    footer: {
      borderTop: `3px double ${colors.rule}`,
      marginTop: '3rem',
      padding: '1.5rem 0',
      textAlign: 'center',
      fontFamily: fonts.meta,
      fontSize: '0.75rem',
      color: colors.textSecondary,
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '1.5rem',
      gridColumn: '1 / -1',
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: `3px solid ${colors.ruleLight}`,
      borderTopColor: accentColor,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    loadingText: {
      fontFamily: fonts.meta,
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    },
    modalContent: {
      backgroundColor: colors.bg,
      maxWidth: '700px',
      maxHeight: '90vh',
      overflowY: 'auto',
      padding: '3rem',
      position: 'relative',
    },
    modalClose: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      width: '2rem',
      height: '2rem',
      border: `1px solid ${colors.rule}`,
      background: 'transparent',
      cursor: 'pointer',
      fontSize: '1.2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.text,
    },
    errorBox: {
      gridColumn: '1 / -1',
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: colors.bgSecondary,
      border: `1px solid ${accentColor}`,
    },
    perspectiveSelector: {
      position: 'fixed',
      top: '1rem',
      left: '1rem',
      zIndex: 1000,
    },
    perspectiveButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      backgroundColor: colors.bgSecondary,
      border: `1px solid ${colors.rule}`,
      fontFamily: fonts.meta,
      fontSize: '0.75rem',
      cursor: 'pointer',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    perspectiveIndicator: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: PERSPECTIVE_COLORS[perspective],
      border: perspective === 'anarchist' ? '1px solid #666' : 'none',
    },
    perspectiveMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: '0.5rem',
      backgroundColor: colors.bgSecondary,
      border: `1px solid ${colors.rule}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      minWidth: '220px',
      maxHeight: '70vh',
      overflowY: 'auto',
    },
    perspectiveOption: (isActive, key) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      backgroundColor: isActive ? colors.ruleLight : 'transparent',
      borderLeft: `3px solid ${isActive ? PERSPECTIVE_COLORS[key] : 'transparent'}`,
      transition: 'all 0.15s',
    }),
    perspectiveOptionDot: (key) => ({
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: PERSPECTIVE_COLORS[key],
      border: key === 'anarchist' ? '1px solid #666' : 'none',
      flexShrink: 0,
    }),
    perspectiveOptionText: {
      flex: 1,
    },
    perspectiveOptionName: {
      fontFamily: fonts.meta,
      fontSize: '0.8rem',
      fontWeight: 600,
    },
    perspectiveOptionDesc: {
      fontFamily: fonts.meta,
      fontSize: '0.65rem',
      color: colors.textSecondary,
      marginTop: '0.1rem',
    },
  };

  // Add keyframes for spinner
  useEffect(() => {
    const styleId = 'intelligence-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const DropCap = ({ children }) => {
    if (theme === 'modern' || !children) return <p style={{ marginBottom: '1rem' }}>{children}</p>;
    
    const text = String(children);
    const firstLetter = text.charAt(0);
    const rest = text.slice(1);
    
    return (
      <p style={{ marginBottom: '1rem' }}>
        <span
          style={{
            float: 'left',
            fontFamily: fonts.headline,
            fontSize: '3.5rem',
            lineHeight: 0.8,
            paddingRight: '0.5rem',
            paddingTop: '0.1rem',
            fontWeight: 700,
            color: theme === 'tabloid' ? accentColor : colors.text,
          }}
        >
          {firstLetter}
        </span>
        {rest}
      </p>
    );
  };

  return (
    <div style={styles.container}>
      {/* Perspective Selector */}
      <div style={styles.perspectiveSelector}>
        <button 
          style={styles.perspectiveButton}
          onClick={() => setShowPerspectiveMenu(!showPerspectiveMenu)}
        >
          <div style={styles.perspectiveIndicator} />
          <span>{currentPerspective.name}</span>
          <span style={{ fontSize: '0.6rem' }}>{showPerspectiveMenu ? '▲' : '▼'}</span>
        </button>
        
        {showPerspectiveMenu && (
          <div style={styles.perspectiveMenu}>
            {Object.entries(PERSPECTIVES).map(([key, value]) => (
              <div
                key={key}
                style={styles.perspectiveOption(perspective === key, key)}
                onClick={() => {
                  setPerspective(key);
                  setShowPerspectiveMenu(false);
                }}
                onMouseEnter={(e) => {
                  if (perspective !== key) {
                    e.currentTarget.style.backgroundColor = colors.ruleLight;
                  }
                }}
                onMouseLeave={(e) => {
                  if (perspective !== key) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={styles.perspectiveOptionDot(key)} />
                <div style={styles.perspectiveOptionText}>
                  <div style={styles.perspectiveOptionName}>
                    {value.icon} {value.name}
                  </div>
                  <div style={styles.perspectiveOptionDesc}>{value.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme Switcher */}
      <div style={styles.themeSwitcher}>
        {Object.entries(THEMES).map(([key, value]) => (
          <button
            key={key}
            style={styles.themeBtn(theme === key)}
            onClick={() => setTheme(key)}
          >
            {value.name}
          </button>
        ))}
      </div>

      <div style={styles.newspaper}>
        {/* Masthead */}
        <header style={styles.masthead}>
          <div style={styles.mastheadTop}>
            <span>Morning Edition</span>
            <span>{formatDate()}</span>
            <span>Est. 2025</span>
          </div>
          <h1 style={styles.mastheadTitle}>Intelligence</h1>
          <p style={styles.tagline}>{currentPerspective.tagline}</p>
        </header>

        {/* Navigation */}
        <nav style={styles.navBar}>
          {CATEGORIES.map((cat) => (
            <span key={cat} style={styles.navLink}>
              {cat}
            </span>
          ))}
          <span style={{ color: colors.ruleLight }}>|</span>
          <span
            style={{ ...styles.navLink, cursor: 'pointer', fontWeight: showArchive ? 600 : 400 }}
            onClick={() => setShowArchive(!showArchive)}
          >
            Archive
          </span>
          <span
            style={{ ...styles.navLink, cursor: 'pointer' }}
            onClick={() => {
              setShowArchive(true);
              setTimeout(() => document.querySelector('input[placeholder="Search articles..."]')?.focus(), 100);
            }}
          >
            🔍 Search
          </span>
        </nav>

        {/* Main Content */}
        <main style={showArchive ? { ...styles.mainGrid, display: 'block' } : styles.mainGrid}>
          {showArchive ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ ...styles.headlineMedium, marginBottom: 0 }}>Archive</h2>
                <button
                  style={{
                    background: 'none',
                    border: `1px solid ${colors.rule}`,
                    padding: '0.5rem 1rem',
                    fontFamily: fonts.meta,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowArchive(false)}
                >
                  Back to Current Edition
                </button>
              </div>

              {/* Search */}
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '0.75rem 1rem',
                    fontFamily: fonts.body,
                    fontSize: '0.9rem',
                    border: `1px solid ${colors.rule}`,
                    backgroundColor: colors.bgSecondary,
                    color: colors.text,
                  }}
                />
              </div>

              {/* Archive List */}
              {archiveHistory.length === 0 ? (
                <p style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                  No archived editions yet. Generate some editions to build your archive.
                </p>
              ) : (
                <div>
                  {archiveHistory
                    .filter(edition => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      const allText = [
                        edition.hero?.headline,
                        edition.hero?.excerpt,
                        ...(edition.secondary || []).map(a => a.headline),
                        ...(edition.secondary || []).map(a => a.excerpt),
                      ].join(' ').toLowerCase();
                      return allText.includes(query);
                    })
                    .map((edition, i) => (
                      <div
                        key={edition.savedAt || i}
                        style={{
                          padding: '1.5rem',
                          marginBottom: '1rem',
                          backgroundColor: colors.bgSecondary,
                          border: `1px solid ${colors.ruleLight}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <p style={{ ...styles.category, marginBottom: '0.25rem' }}>
                              {new Date(edition.savedAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                              {PERSPECTIVES[edition.perspective]?.name || 'Unknown'} perspective
                            </p>
                          </div>
                          <button
                            style={{
                              background: accentColor,
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              fontFamily: fonts.meta,
                              fontSize: '0.7rem',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setArticles(edition);
                              setPerspective(edition.perspective || 'center');
                              setShowArchive(false);
                            }}
                          >
                            View
                          </button>
                        </div>
                        {edition.hero && (
                          <div>
                            <h3
                              style={{ ...styles.headlineMedium, cursor: 'pointer' }}
                              onClick={() => {
                                setSelectedArticle(edition.hero);
                              }}
                            >
                              {edition.hero.headline}
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                              {edition.hero.excerpt}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>{loadingMessage || 'Gathering Intelligence...'}</p>
            </div>
          ) : error ? (
            <div style={styles.errorBox}>
              <p style={{ color: accentColor }}>{error}</p>
            </div>
          ) : !articles ? (
            <div style={styles.errorBox}>
              <p style={{ color: colors.textMuted }}>No articles yet. New content is generated automatically throughout the day.</p>
            </div>
          ) : articles ? (
            <>
              {/* Hero Article */}
              <article>
                {articles.hero.imageUrl ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <img
                      src={articles.hero.imageUrl}
                      alt={articles.hero.headline}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '400px',
                        objectFit: 'cover',
                        border: `1px solid ${colors.ruleLight}`,
                      }}
                    />
                  </div>
                ) : (
                  <div style={styles.imagePlaceholder}>
                    <span
                      style={{
                        fontFamily: fonts.meta,
                        fontSize: '0.75rem',
                        color: colors.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {articles.hero.category}
                    </span>
                  </div>
                )}
                <p style={styles.category}>{articles.hero.category}</p>
                <h2
                  style={styles.headlineHero}
                  onClick={() => setSelectedArticle(articles.hero)}
                  onMouseEnter={(e) => (e.target.style.color = accentColor)}
                  onMouseLeave={(e) => (e.target.style.color = colors.text)}
                >
                  {articles.hero.headline}
                </h2>
                <div style={styles.meta}>
                  <span style={styles.byline}>By {getByline(articles.hero)}</span>
                  <span>Today</span>
                </div>
                <div style={styles.articleBody}>
                  <DropCap>{articles.hero.excerpt}</DropCap>
                </div>
              </article>

              <div style={styles.columnRule} />

              {/* Secondary Column */}
              <div>
                {articles.secondary?.map((article, i) => (
                  <article
                    key={i}
                    style={{
                      paddingBottom: '1.5rem',
                      borderBottom: i < articles.secondary.length - 1 ? `1px solid ${colors.ruleLight}` : 'none',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <p style={styles.category}>{article.category}</p>
                    <h3
                      style={styles.headlineMedium}
                      onClick={() => setSelectedArticle(article)}
                      onMouseEnter={(e) => (e.target.style.color = accentColor)}
                      onMouseLeave={(e) => (e.target.style.color = colors.text)}
                    >
                      {article.headline}
                    </h3>
                    <div style={styles.meta}>
                      <span style={styles.byline}>By {getByline(article)}</span>
                    </div>
                    <div style={styles.articleBody}>
                      <p>{article.excerpt}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div style={styles.columnRule} />

              {/* Sidebar */}
              <div>
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={styles.sidebarTitle}>Latest Headlines</h4>
                  <div>
                    {articles.sidebar?.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          ...styles.sidebarItem,
                          borderBottom: i < articles.sidebar.length - 1 ? `1px solid ${colors.ruleLight}` : 'none',
                        }}
                      >
                        <p style={styles.category}>{item.category}</p>
                        <h5 style={styles.headlineSmall}>{item.headline}</h5>
                      </div>
                    ))}
                  </div>
                </div>

                {articles.quote && (
                  <div>
                    <h4 style={styles.sidebarTitle}>Quote of the Day</h4>
                    <blockquote style={styles.quoteBlock}>
                      "{articles.quote.text}"
                      <p style={styles.quoteAttribution}>— {articles.quote.attribution}</p>
                    </blockquote>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </main>

        {/* Footer */}
        <footer style={styles.footer}>
          <p>© 2025 Intelligence · An AI-Generated Publication</p>
          <p style={{ fontStyle: 'italic', marginTop: '0.5rem' }}>
            Articles generated by artificial intelligence based on current events. Verify important information with primary sources.
          </p>
        </footer>
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div style={styles.modalOverlay} onClick={() => setSelectedArticle(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedArticle(null)}>
              ×
            </button>
            {selectedArticle.imageUrl && (
              <div style={{ marginBottom: '1.5rem', marginTop: '-1rem' }}>
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.headline}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '300px',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
            <p style={styles.category}>{selectedArticle.category}</p>
            <h2
              style={{
                fontFamily: fonts.headline,
                fontSize: '1.8rem',
                fontWeight: 700,
                lineHeight: 1.15,
                marginBottom: '0.5rem',
                textTransform: theme === 'tabloid' ? 'uppercase' : 'none',
              }}
            >
              {selectedArticle.headline}
            </h2>
            <div style={styles.meta}>
              <span style={styles.byline}>By {getByline(selectedArticle)}</span>
              <span>Today</span>
            </div>
            <div style={styles.articleBody}>
              {selectedArticle.fullText?.split('\n\n').map((para, i) =>
                i === 0 ? (
                  <DropCap key={i}>{para}</DropCap>
                ) : (
                  <p key={i} style={{ marginBottom: '1rem' }}>
                    {para}
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
