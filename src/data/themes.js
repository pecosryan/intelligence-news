// Visual Themes for the newspaper

export const THEMES = {
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

export const THEME_FONTS = {
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

// Fonts loaded via Google Fonts
export const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=UnifrakturMaguntia&family=Oswald:wght@400;500;600;700&family=Roboto+Condensed:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
`;

export default THEMES;
