'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Gantt from 'frappe-gantt';
import { Button, Space, Select } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { updateChantier } from './data';

dayjs.extend(customParseFormat);

const TYPE_LABELS = {
  enedis:              'ENEDIS',
  izi:                 'IZI',
  copros:              'Copros',
  maison_individuelle: 'Maison individuelle',
};

const PALETTE = [
  '#1677ff', '#52c41a', '#fa8c16', '#722ed1',
  '#eb2f96', '#13c2c2', '#faad14', '#f5222d',
  '#2f54eb', '#a0d911',
];
const UNASSIGNED_COLOR = '#999999';

const VIEW_MODES = [
  { key: 'Day',   label: 'Jour' },
  { key: 'Week',  label: 'Semaine' },
  { key: 'Month', label: 'Mois' },
];

function parseDate(str) {
  if (!str) return null;
  const d = dayjs(str, 'DD/MM/YYYY', true);
  return d.isValid() ? d.format('YYYY-MM-DD') : null;
}

export function GanttChart({ chantiers, onRefresh }) {
  const containerRef = useRef(null);
  const [viewMode, setViewMode] = useState('Month');
  const [hoveredChantier, setHoveredChantier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({}); // { [id]: { id, debut, fin } }
  const [refreshKey, setRefreshKey] = useState(0);
  const [equipeFilter, setEquipeFilter] = useState(null); // null = tous, 'unassigned', or equipeId

  // Keep callbacks in refs so they never cause effect re-runs
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  const allValid = useMemo(
    () => chantiers.filter(c => parseDate(c.debut) && parseDate(c.fin)),
    [chantiers]
  );

  const valid = useMemo(() => {
    if (!equipeFilter) return allValid;
    if (equipeFilter === 'unassigned') return allValid.filter(c => !c.equipeId);
    return allValid.filter(c => c.equipeId === equipeFilter);
  }, [allValid, equipeFilter]);

  const equipeColors = useMemo(() => {
    const ids = [...new Set(allValid.map(c => c.equipeId).filter(Boolean))];
    return Object.fromEntries(ids.map((id, i) => [id, PALETTE[i % PALETTE.length]]));
  }, [allValid]);

  const equipeLegend = useMemo(() => {
    const seen = new Map();
    allValid.forEach(c => {
      if (c.equipeId && c.equipe && !seen.has(c.equipeId)) {
        seen.set(c.equipeId, c.equipe.nom);
      }
    });
    return [...seen.entries()].map(([id, name]) => ({ id, name, color: equipeColors[id] }));
  }, [allValid, equipeColors]);

  const filterOptions = useMemo(() => [
    { value: null, label: 'Toutes les équipes' },
    ...equipeLegend.map(({ id, name }) => ({ value: id, label: name })),
    { value: 'unassigned', label: 'Non assigné' },
  ], [equipeLegend]);

  const chantiersById = useMemo(
    () => Object.fromEntries(valid.map(c => [String(c.id), c])),
    [valid]
  );
  const chantiersByIdRef = useRef(chantiersById);
  useEffect(() => { chantiersByIdRef.current = chantiersById; }, [chantiersById]);

  const handleSaveDates = async () => {
    const changes = Object.values(pendingChanges);
    if (!changes.length) return;
    setSaving(true);
    try {
      await Promise.all(changes.map(c => updateChantier(c.id, { debut: c.debut, fin: c.fin })));
      setPendingChanges({});
      await onRefreshRef.current?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDates = () => {
    setPendingChanges({});
    setRefreshKey(k => k + 1);
  };

  // Inject CSS once
  useEffect(() => {
    const id = 'frappe-gantt-css';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet'; link.href = '/frappe-gantt.css';
    document.head.appendChild(link);
  }, []);

  // Rebuild Gantt when data or viewMode changes
  useEffect(() => {
    if (!containerRef.current || valid.length === 0) return;

    const tasks = valid.map(c => {
      return {
        id: String(c.id),
        name: c.adresse,
        start: parseDate(c.debut),
        end: parseDate(c.fin),
        progress: 0,
        custom_class: c.equipeId ? `equipe-${c.equipeId}` : 'equipe-unassigned',
      };
    });

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      new Gantt(containerRef.current, tasks, {
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD',
        popup: false,
        on_date_change: (task, start, end) => {
          const fmt = d => [
            String(d.getDate()).padStart(2, '0'),
            String(d.getMonth() + 1).padStart(2, '0'),
            d.getFullYear(),
          ].join('/');
          const id = Number(task.id);
          setPendingChanges(prev => ({ ...prev, [id]: { id, debut: fmt(start), fin: fmt(end) } }));
        },
      });

      // Use data-id attribute — reliable regardless of render order
      const wrappers = containerRef.current?.querySelectorAll('.bar-wrapper');
      wrappers?.forEach(wrapper => {
        const taskId = wrapper.getAttribute('data-id');
        wrapper.addEventListener('mouseenter', () => {
          setHoveredChantier(chantiersByIdRef.current[taskId] ?? null);
        });
        wrapper.addEventListener('mouseleave', () => {
          setHoveredChantier(null);
        });
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };

  }, [valid, viewMode, refreshKey]);

  if (allValid.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Aucun chantier avec des dates de début et fin renseignées.
      </div>
    );
  }

  return (
    <div>
      {/* Legend + filter + view switcher */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-4 flex-wrap">
          {equipeLegend.map(({ id, name, color }) => (
            <div key={id} className="flex items-center gap-1.5 text-sm">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              {name}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-sm">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: UNASSIGNED_COLOR }} />
            Non assigné
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select
            style={{ width: 220 }}
            value={equipeFilter}
            onChange={setEquipeFilter}
            options={filterOptions}
          />
          <Space.Compact>
            {VIEW_MODES.map(({ key, label }) => (
              <Button key={key} type={viewMode === key ? 'primary' : 'default'} onClick={() => setViewMode(key)}>
                {label}
              </Button>
            ))}
          </Space.Compact>
        </div>
      </div>

      {valid.length === 0 && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          Aucun chantier pour cette équipe.
        </div>
      )}

      <style>{`
        .gantt-container, .gantt-container * {
          font-family: 'Quicksand', sans-serif !important;
        }
        ${Object.entries(equipeColors).map(([id, color]) => `
          .equipe-${id} .bar { fill: ${color} !important; }
          .equipe-${id} .bar-progress { fill: ${color} !important; filter: brightness(0.85); }
        `).join('')}
        .equipe-unassigned .bar { fill: ${UNASSIGNED_COLOR} !important; }
        .equipe-unassigned .bar-progress { fill: ${UNASSIGNED_COLOR} !important; filter: brightness(0.85); }
        .gantt .bar-label { font-size: 11px; }
        .gantt .bar-label.big { fill: #333 !important; }
        .bar-wrapper { cursor: pointer; }
      `}</style>

      {/* Pending save banner */}
      {Object.keys(pendingChanges).length > 0 && (
        <div className="mb-3 flex items-start justify-between gap-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
          <div className="flex flex-col gap-1 text-orange-800">
            {Object.values(pendingChanges).map(change => {
              const c = chantiersByIdRef.current[String(change.id)];
              return (
                <span key={change.id}>
                  <b>{c?.adresse}</b> — <b>{change.debut}</b> → <b>{change.fin}</b>
                </span>
              );
            })}
            <span className="text-orange-600 mt-1">Voulez-vous sauvegarder ces modifications ?</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="small" onClick={handleCancelDates}>Annuler</Button>
            <Button size="small" type="primary" loading={saving} onClick={handleSaveDates}>Sauvegarder</Button>
          </div>
        </div>
      )}

      <div ref={containerRef} />

      {/* Hover info card */}
      <div
        style={{
          marginTop: 16,
          minHeight: 72,
          transition: 'opacity 0.15s',
          opacity: hoveredChantier ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        {hoveredChantier && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex gap-6 flex-wrap text-sm">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Adresse</div>
              <div className="font-semibold">{hoveredChantier.adresse}</div>
              <div className="text-gray-500">{hoveredChantier.code_postal} {hoveredChantier.ville}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Type</div>
              <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs font-medium">
                {TYPE_LABELS[hoveredChantier.type] ?? hoveredChantier.type}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Equipe</div>
              <span
                className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                style={{ backgroundColor: hoveredChantier.equipeId ? equipeColors[hoveredChantier.equipeId] : UNASSIGNED_COLOR }}
              >
                {hoveredChantier.equipe?.nom ?? 'Non assigné'}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Période</div>
              <div>{hoveredChantier.debut} → {hoveredChantier.fin}</div>
            </div>
            {hoveredChantier.telephone && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Téléphone</div>
                <div>{hoveredChantier.telephone}</div>
              </div>
            )}
            {hoveredChantier.numero_affaire && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">N° affaire</div>
                <div>{hoveredChantier.numero_affaire}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
