interface Section {
  title: string;
  items: string[];
}

const SECTIONS: Section[] = [
  {
    title: 'Objective',
    items: ['Sink all enemy landmarks before the AI sinks yours.'],
  },
  {
    title: 'Place Your Fleet',
    items: [
      'Drag Austin landmarks onto your 12 × 12 grid.',
      'Rotate ships before placing them.',
      'Ships can be horizontal or vertical.',
    ],
  },
  {
    title: 'Important Rules',
    items: [
      'Ships cannot overlap.',
      'Ships cannot touch — not even diagonally.',
      'You cannot fire at the same coordinate twice.',
    ],
  },
  {
    title: 'Take Turns',
    items: [
      'Click the enemy grid to attack.',
      'Red ✕ means hit.',
      'White dot means miss.',
    ],
  },
  {
    title: 'Win',
    items: ['Sink all enemy landmarks to win the battle.'],
  },
];

export function InstructionsPanel() {
  return (
    <aside className="instructions-panel">
      <header className="instructions-panel__header">
        <span className="panel-eyebrow">Captain's Orders</span>
        <h2 className="panel-title">
          <span className="panel-title__star" aria-hidden>★</span>
          <span>How to Play</span>
          <span className="panel-title__star" aria-hidden>★</span>
        </h2>
      </header>
      <div className="instructions-sections">
        {SECTIONS.map((section) => (
          <section key={section.title} className="instructions-section">
            <h3>{section.title}</h3>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
