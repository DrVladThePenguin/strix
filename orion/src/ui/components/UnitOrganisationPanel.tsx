import { useGameStore } from '../../store/gameStore';
import { GameBridge } from '../../game/GameBridge';
import type { FormationMeta } from '../../types/game';

function buildTree(formations: FormationMeta[]): FormationMeta[] {
  const roots = formations.filter((f) => f.parentId === null);
  const result: FormationMeta[] = [];
  const walk = (parentId: string, depth: number) => {
    const children = formations.filter((f) => f.parentId === parentId);
    for (const c of children) {
      result.push({ ...c, name: `${'  '.repeat(depth)}${c.name}` });
      walk(c.id, depth + 1);
    }
  };
  for (const r of roots) {
    result.push(r);
    walk(r.id, 1);
  }
  return result;
}

export function UnitOrganisationPanel() {
  const formations = useGameStore((s) => s.formations);
  const status = useGameStore((s) => s.formationStatus);
  const selected = useGameStore((s) => s.selectedFormationIds);
  const selectFormations = useGameStore((s) => s.selectFormations);

  const tree = buildTree(formations);

  return (
    <aside className="panel left-panel">
      <h2>Unit Organisation</h2>
      <p className="panel-hint">Company Headquarters</p>
      <ul className="org-list">
        {tree.map((f) => {
          if (f.soldierCount === 0 && f.kind !== 'company_hq') {
            return (
              <li key={f.id} className="org-header">
                {f.name.trim()}
              </li>
            );
          }
          if (f.soldierCount === 0) return null;
          const st = status[f.id];
          const isSelected = selected.includes(f.id);
          return (
            <li key={f.id}>
              <button
                type="button"
                className={isSelected ? 'org-item selected' : 'org-item'}
                onClick={() => {
                  selectFormations([f.id]);
                  GameBridge.focusFormation(f.id);
                }}
              >
                <span className="org-name">{f.name.trim()}</span>
                <span className="org-meta">
                  STR {st?.strength ?? f.soldierCount} · {st?.currentOrder ?? '—'}
                </span>
                <span className="org-bars">
                  HP {st?.healthPct ?? 100}% · AMMO {st?.ammoPct ?? 100}% · MOR {st?.moralePct ?? 85}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
