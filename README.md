# Intelligence

An AI-generated newspaper that fetches real news and writes articles from multiple editorial perspectives.

![Intelligence Screenshot](https://via.placeholder.com/800x400?text=Intelligence+Newspaper)

## Features

### 🗞️ Real-Time News Generation
- Fetches current events via web search
- AI writes full journalistic articles with proper structure
- Inverted pyramid style, quotes, and compelling headlines

### 🎨 Three Visual Themes
| Theme | Style |
|-------|-------|
| **Classic** | 1920s broadsheet with blackletter masthead, Playfair headlines, drop caps |
| **Modern** | Clean IBM Plex typography, minimal ornamentation |
| **Tabloid** | Bold Oswald headlines, red accents, punchy layout |

### 📐 Eight Editorial Perspectives

| Perspective | Tagline | Focus |
|-------------|---------|-------|
| ← Progressive | "Afflicting the Comfortable Since 2025" | Social justice, labor, climate |
| ↙ Liberal | "Thoughtful Analysis for a Better Tomorrow" | Evidence-based reform |
| ↔ Centrist | "All the News That's Fit to Compute" | Balanced, nonpartisan |
| ↘ Conservative | "Defending What Works" | Markets, tradition, restraint |
| → Populist Right | "The Voice They Don't Want You to Hear" | Anti-elite, nationalist |
| ⊙ Libertarian | "Free Minds, Free Markets" | Individual liberty |
| Ⓐ Anarchist | "No Gods, No Masters, No Algorithms" | Anti-hierarchy |
| ⚡ Accelerationist | "The Future Is Already Here" | Tech-forward, post-political |

Each perspective shapes:
- Which stories get emphasized
- How headlines are framed
- Word choice and tone
- Which quotes are selected

## Getting Started

### Prerequisites
- Node.js 18+
- An Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/pecosryan/intelligence-news.git
cd intelligence-news

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

The app uses the Anthropic API for news search and article generation. The API key is handled through the Claude.ai artifact environment.

For standalone deployment, you'll need to:
1. Add your Anthropic API key
2. Configure CORS or use a backend proxy

## Architecture

```
intelligence-news/
├── index.html          # Entry point with fonts
├── src/
│   ├── main.jsx        # React mount
│   └── Intelligence.jsx # Main component
├── package.json
└── vite.config.js
```

### How It Works

1. **Search Phase**: Uses Claude's `web_search` tool to find current news across categories
2. **Generation Phase**: Claude writes articles based on search results, applying the selected editorial perspective
3. **Rendering**: React component displays articles in the selected visual theme

## Usage

1. Select an **editorial perspective** from the dropdown (top-left)
2. Choose a **visual theme** (top-right): Classic, Modern, or Tabloid
3. Click **Generate New Edition** to fetch fresh news and generate new articles
4. Click any **headline** to read the full article

## Contributing

Contributions welcome! Ideas for improvement:
- [ ] Add more visual themes (Art Deco, Brutalist, etc.)
- [ ] Section filtering (show only Business, Tech, etc.)
- [ ] Breaking news ticker
- [ ] AI-generated article illustrations
- [ ] Save/share editions
- [ ] RSS feed output

## License

MIT

## Acknowledgments

- Typography: Google Fonts (Playfair Display, Libre Baskerville, UnifrakturMaguntia, Oswald, IBM Plex)
- AI: Anthropic Claude API
- Inspiration: Classic newspaper design from NYT, WSJ, The Guardian
