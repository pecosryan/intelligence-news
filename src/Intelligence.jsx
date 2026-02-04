import React, { useState, useEffect, useCallback } from 'react';

const CATEGORIES = ['World', 'Business', 'Technology', 'Politics', 'Science', 'Culture'];

const PERSPECTIVES = {
  left: {
    name: 'Progressive',
    icon: '←',
    description: 'Social justice & equity focus',
    tagline: 'Afflicting the Comfortable Since 2025',
    prompt: `Write from a progressive/left-leaning editorial perspective. Emphasize:
- Social and economic inequality, systemic issues
- Worker rights, union perspectives, labor conditions
- Environmental justice and climate urgency
- Corporate accountability and critique of concentrated wealth
- Marginalized communities and civil rights
- Government as a potential force for good
- Skepticism of market-based solutions
Use language that centers affected communities. Frame issues through power dynamics and structural analysis.`,
  },
  centerLeft: {
    name: 'Liberal',
    icon: '↙',
    description: 'Reform-minded establishment',
    tagline: 'Thoughtful Analysis for a Better Tomorrow',
    prompt: `Write from a center-left/liberal editorial perspective. Emphasize:
- Evidence-based policy and expert consensus
- Incremental reform within existing institutions
- Balance between market efficiency and social safety nets
- International cooperation and multilateralism
- Civil liberties and democratic norms
- Regulated capitalism with strong consumer protections
- Diversity and inclusion as institutional values
Use measured, professional language. Acknowledge complexity while advocating for progressive reforms through proper channels.`,
  },
  center: {
    name: 'Centrist',
    icon: '↔',
    description: 'Balanced & nonpartisan',
    tagline: 'All the News That\'s Fit to Compute',
    prompt: `Write from a strictly neutral, nonpartisan editorial perspective. Emphasize:
- Multiple viewpoints presented fairly
- Facts and data over interpretation
- Acknowledgment of legitimate concerns on all sides
- Institutional processes and procedural fairness
- Expert analysis without ideological framing
- Complexity and nuance over simple narratives
Use dispassionate, objective language. Present competing interpretations. Avoid loaded terms. Let readers draw their own conclusions.`,
  },
  centerRight: {
    name: 'Conservative',
    icon: '↘',
    description: 'Traditional values & markets',
    tagline: 'Defending What Works',
    prompt: `Write from a center-right/conservative editorial perspective. Emphasize:
- Free market solutions and economic growth
- Individual responsibility and merit
- Traditional institutions (family, religion, community)
- Limited government and fiscal restraint
- National security and strong defense
- Rule of law and property rights
- Skepticism of rapid social change
Use language that emphasizes personal agency, tradition, and proven approaches. Frame issues through individual choice and consequences.`,
  },
  right: {
    name: 'Populist Right',
    icon: '→',
    description: 'Anti-establishment nationalist',
    tagline: 'The Voice They Don\'t Want You to Hear',
    prompt: `Write from a populist right-wing editorial perspective. Emphasize:
- Elite vs. ordinary people framing
- National sovereignty and border security
- Skepticism of mainstream media and institutions
- Traditional cultural values under threat
- Government overreach and bureaucratic excess
- Working class concerns dismissed by elites
- Pride in national identity and heritage
Use direct, plain-spoken language. Frame issues as common sense vs. out-of-touch elites. Express frustration with status quo.`,
  },
  libertarian: {
    name: 'Libertarian',
    icon: '⊙',
    description: 'Maximum individual freedom',
    tagline: 'Free Minds, Free Markets',
    prompt: `Write from a libertarian editorial perspective. Emphasize:
- Individual liberty as the highest value
- Government as the primary threat to freedom
- Free markets as the solution to most problems
- Civil liberties across the board (speech, guns, drugs, lifestyle)
- Skepticism of both left and right statism
- Voluntary association over coercion
- Unintended consequences of regulation
Use language that emphasizes choice, consent, and skepticism of authority. Question government solutions regardless of which party proposes them.`,
  },
  anarchist: {
    name: 'Anarchist',
    icon: 'Ⓐ',
    description: 'Abolish all hierarchies',
    tagline: 'No Gods, No Masters, No Algorithms',
    prompt: `Write from an anarchist editorial perspective. Emphasize:
- Critique of all hierarchical power structures (state, capital, etc.)
- Mutual aid and horizontal organizing
- Direct action over electoral politics
- Solidarity across borders, rejection of nationalism
- Prefigurative politics - building the new world in the shell of the old
- Skepticism of reformism and "working within the system"
- Historical examples of anarchist organizing
Use language that questions legitimacy of authority. Frame issues through lens of liberation and self-determination. Be irreverent toward power.`,
  },
  accelerationist: {
    name: 'Accelerationist',
    icon: '⚡',
    description: 'Embrace the chaos',
    tagline: 'The Future Is Already Here',
    prompt: `Write from an accelerationist editorial perspective. Emphasize:
- Technology as an unstoppable transformative force
- Contradictions in current systems that will lead to their transcendence
- Post-human possibilities and technological singularity
- Critique of both conservative nostalgia and progressive reformism as inadequate
- Acceleration of existing trends rather than resistance
- Cybernetic and systems thinking
- Ironic detachment from conventional political categories
Use language that is provocative, future-oriented, and somewhat detached. Treat current events as symptoms of deeper phase transitions.`,
  },
};

const PERSPECTIVE_COLORS = {
  left: '#c41e3a',
  centerLeft: '#3a7ca5',
  center: '#666666',
  centerRight: '#1e4d8c',
  right: '#8b0000',
  libertarian: '#ffd700',
  anarchist: '#000000',
  accelerationist: '#ff00ff',
};

const THEMES = {
  classic: {
    name: 'Classic',
    bg: '#f5f1e8',
    bgSecondary: '#ebe7dc',
    text: '#1a1a1a',
    textSecondary: '#4a4a4a',
    accent: '#8b0000',
    rule: '#1a1a1a',
    ruleLight: '#c4bfb3',
  },
  modern: {
    name: 'Modern',
    bg: '#fafafa',
    bgSecondary: '#ffffff',
    text: '#111111',
    textSecondary: '#555555',
    accent: '#0066cc',
    rule: '#e0e0e0',
    ruleLight: '#f0f0f0',
  },
  tabloid: {
    name: 'Tabloid',
    bg: '#ffffff',
    bgSecondary: '#f8f8f8',
    text: '#000000',
    textSecondary: '#333333',
    accent: '#d40000',
    rule: '#000000',
    ruleLight: '#cccccc',
  },
};

// Fonts loaded via Google Fonts
const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=UnifrakturMaguntia&family=Oswald:wght@400;500;600;700&family=Roboto+Condensed:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
`;

// Inject fonts
if (typeof document !== 'undefined' && !document.getElementById('intelligence-fonts')) {
  const div = document.createElement('div');
  div.id = 'intelligence-fonts';
  div.innerHTML = FONT_LINKS;
  document.head.appendChild(div.firstElementChild);
  document.head.appendChild(div.firstElementChild);
}

const themeFonts = {
  classic: {
    masthead: "'UnifrakturMaguntia', serif",
    headline: "'Playfair Display', serif",
    body: "'Libre Baskerville', serif",
    meta: "'Libre Baskerville', serif",
  },
  modern: {
    masthead: "'IBM Plex Sans', sans-serif",
    headline: "'IBM Plex Serif', serif",
    body: "'IBM Plex Sans', sans-serif",
    meta: "'IBM Plex Sans', sans-serif",
  },
  tabloid: {
    masthead: "'Oswald', sans-serif",
    headline: "'Oswald', sans-serif",
    body: "'Roboto Condensed', sans-serif",
    meta: "'Roboto Condensed', sans-serif",
  },
};

export default function Intelligence() {
  const [theme, setTheme] = useState('classic');
  const [perspective, setPerspective] = useState('center');
  const [articles, setArticles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [error, setError] = useState(null);
  const [showPerspectiveMenu, setShowPerspectiveMenu] = useState(false);

  const colors = THEMES[theme];
  const fonts = themeFonts[theme];
  const currentPerspective = PERSPECTIVES[perspective];
  
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

  const generateEdition = useCallback(async () => {
    setLoading(true);
    setError(null);
    setArticles(null);

    const loadingMessages = [
      'Scanning global news wires...',
      'Analyzing current events...',
      'Interviewing sources...',
      'Writing headlines...',
      'Crafting the lede...',
      'Fact-checking claims...',
      'Setting the type...',
      'Reviewing editorial standards...',
      'Preparing for print...',
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
      messageIndex++;
    }, 2500);

    try {
      // First, search for current news across categories
      const searchPrompt = `Search for the most important and interesting news stories from today across these categories: World, Business, Technology, Politics, Science, and Culture. Focus on significant developments, breaking news, and stories with broad impact.`;

      const searchResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [
            {
              role: 'user',
              content: searchPrompt,
            },
          ],
        }),
      });

      const searchData = await searchResponse.json();
      
      // Extract text content from search results
      const searchContext = searchData.content
        ?.filter((block) => block.type === 'text')
        ?.map((block) => block.text)
        ?.join('\n\n') || '';

      if (!searchContext) {
        throw new Error('No news results found');
      }

      // Now generate the newspaper articles based on the search results
      const perspectiveInstructions = PERSPECTIVES[perspective].prompt;
      
      const articlePrompt = `Based on the following current news information, generate a newspaper edition in JSON format.

EDITORIAL PERSPECTIVE:
${perspectiveInstructions}

NEWS CONTEXT:
${searchContext}

Generate articles in this exact JSON structure:
{
  "hero": {
    "category": "Category name",
    "headline": "Compelling headline for the main story - should reflect the editorial perspective",
    "byline": "Intelligence Staff",
    "excerpt": "2-3 sentence excerpt that hooks the reader, framed through the editorial lens",
    "fullText": "Full article text, 4-5 paragraphs. Write in proper journalistic style but with clear editorial voice matching the perspective. Paragraphs separated by \\n\\n"
  },
  "secondary": [
    {
      "category": "Category",
      "headline": "Secondary story headline reflecting editorial angle",
      "byline": "Intelligence Correspondent",
      "excerpt": "1-2 sentence excerpt",
      "fullText": "Full article, 3-4 paragraphs separated by \\n\\n"
    },
    {
      "category": "Category",
      "headline": "Another secondary headline",
      "byline": "Intelligence Staff",
      "excerpt": "1-2 sentence excerpt",
      "fullText": "Full article, 3-4 paragraphs separated by \\n\\n"
    }
  ],
  "sidebar": [
    {"category": "Category", "headline": "Brief headline 1"},
    {"category": "Category", "headline": "Brief headline 2"},
    {"category": "Category", "headline": "Brief headline 3"},
    {"category": "Category", "headline": "Brief headline 4"}
  ],
  "quote": {
    "text": "A quote that reflects the publication's editorial perspective - could be from a thinker, activist, or figure aligned with this worldview",
    "attribution": "Person's name and title"
  }
}

IMPORTANT GUIDELINES:
- Use REAL news from the context provided
- Write with the specified editorial voice and framing
- Headlines should reflect the perspective's priorities and language
- Choose which stories to emphasize based on what this perspective would find most important
- The editorial angle should be clear but not cartoonish - write like a real publication with this viewpoint
- All factual claims must be grounded in the search results, but framing and emphasis reflect the perspective

Return ONLY valid JSON, no other text.`;

      const articleResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [
            {
              role: 'user',
              content: articlePrompt,
            },
          ],
        }),
      });

      const articleData = await articleResponse.json();
      const articleText = articleData.content?.[0]?.text || '';

      // Parse JSON from response
      const jsonMatch = articleText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse article data');
      }

      const parsedArticles = JSON.parse(jsonMatch[0]);
      setArticles(parsedArticles);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate edition');
    } finally {
      clearInterval(messageInterval);
      setLoading(false);
      setLoadingMessage('');
    }
  }, [perspective]);

  // Generate on mount
  useEffect(() => {
    generateEdition();
  }, []);

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
    generateBtn: {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      padding: '1rem 1.5rem',
      backgroundColor: accentColor,
      color: 'white',
      border: 'none',
      fontFamily: fonts.meta,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      transition: 'all 0.3s',
      zIndex: 1000,
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
        </nav>

        {/* Main Content */}
        <main style={styles.mainGrid}>
          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>{loadingMessage || 'Gathering Intelligence...'}</p>
            </div>
          ) : error ? (
            <div style={styles.errorBox}>
              <p style={{ marginBottom: '1rem', color: accentColor }}>{error}</p>
              <button
                style={{ ...styles.generateBtn, position: 'static' }}
                onClick={generateEdition}
              >
                Try Again
              </button>
            </div>
          ) : articles ? (
            <>
              {/* Hero Article */}
              <article>
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
                  <span style={styles.byline}>By {articles.hero.byline}</span>
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
                      <span style={styles.byline}>By {article.byline}</span>
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

      {/* Generate Button */}
      <button
        style={{
          ...styles.generateBtn,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
        onClick={generateEdition}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate New Edition'}
      </button>

      {/* Article Modal */}
      {selectedArticle && (
        <div style={styles.modalOverlay} onClick={() => setSelectedArticle(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedArticle(null)}>
              ×
            </button>
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
              <span style={styles.byline}>By {selectedArticle.byline}</span>
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
