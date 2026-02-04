// Editorial Perspectives - Political/ideological viewpoints for article generation

export const CATEGORIES = ['World', 'Business', 'Technology', 'Politics', 'Science', 'Culture'];

export const PERSPECTIVES = {
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

export const PERSPECTIVE_COLORS = {
  left: '#c41e3a',
  centerLeft: '#3a7ca5',
  center: '#666666',
  centerRight: '#1e4d8c',
  right: '#8b0000',
  libertarian: '#ffd700',
  anarchist: '#000000',
  accelerationist: '#ff00ff',
};

export default PERSPECTIVES;
