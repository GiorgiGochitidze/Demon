interface CodePanelProps {
  charge: number;
  chargeMax: number;
}

/** The VS Code mock from the exam screen — live-tied to the game charge. */
export function CodePanel({ charge, chargeMax }: CodePanelProps) {
  const ready = charge >= chargeMax;
  return (
    <div className="code">
      <div className="code__chrome">
        <span className="dot dot--r" />
        <span className="dot dot--y" />
        <span className="dot dot--g" />
        <span className="code__file">boss.ts</span>
      </div>
      <pre className="code__body">
        <Line c="cm">{`// Corrected TypeScript — no more 'any'`}</Line>
        <Line>
          <K>interface</K> <T>BossAttack</T> {"{"}
        </Line>
        <Line indent={1}>
          type: <S>'magic'</S> | <S>'bug'</S>;
        </Line>
        <Line indent={1}>
          damage: <T>number</T>;
        </Line>
        <Line>{"}"}</Line>
        <Line> </Line>
        <Line>
          <K>function</K> <F>attackBoss</F>(energy: <T>EnergyProps</T>) {"{"}
        </Line>
        <Line indent={1} className={ready ? "code__hot" : ""}>
          attack.trigger(<S>final attack</S>);
        </Line>
        <Line>{"}"}</Line>
      </pre>
      <div className={`code__status ${ready ? "code__status--ready" : ""}`}>
        {ready ? "▶ FINAL ATTACK READY" : `compiling… ${Math.round((charge / chargeMax) * 100)}%`}
      </div>
    </div>
  );
}

function Line({
  children,
  indent = 0,
  c,
  className = "",
}: {
  children: React.ReactNode;
  indent?: number;
  c?: string;
  className?: string;
}) {
  return (
    <div className={`code__line ${c ?? ""} ${className}`}>
      {indent > 0 && <span className="code__indent">{"  ".repeat(indent)}</span>}
      {children}
    </div>
  );
}

const K = ({ children }: { children: React.ReactNode }) => (
  <span className="tok-key">{children}</span>
);
const T = ({ children }: { children: React.ReactNode }) => (
  <span className="tok-type">{children}</span>
);
const S = ({ children }: { children: React.ReactNode }) => (
  <span className="tok-str">{children}</span>
);
const F = ({ children }: { children: React.ReactNode }) => (
  <span className="tok-fn">{children}</span>
);
