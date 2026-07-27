'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Gantt from 'frappe-gantt';
import { Button, Space } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

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

export function DIGanttChart({ dis }) {
  const containerRef = useRef(null);
  const [viewMode, setViewMode] = useState('Month');
  const [hoveredDI, setHoveredDI] = useState(null);

  const valid = useMemo(() => dis.filter(d => parseDate(d.date)), [dis]);

  const disById = useMemo(
    () => Object.fromEntries(valid.map(d => [String(d.id), d])),
    [valid]
  );
  const disByIdRef = useRef(disById);
  useEffect(() => { disByIdRef.current = disById; }, [disById]);

  const personnelColors = useMemo(() => {
    const ids = [...new Set(valid.map(d => d.personnelId).filter(Boolean))];
    return Object.fromEntries(ids.map((id, i) => [id, PALETTE[i % PALETTE.length]]));
  }, [valid]);

  const personnelLegend = useMemo(() => {
    const seen = new Map();
    valid.forEach(d => {
      if (d.personnelId && d.personnel && !seen.has(d.personnelId)) {
        seen.set(d.personnelId, `${d.personnel.prenom} ${d.personnel.nom}`);
      }
    });
    return [...seen.entries()].map(([id, name]) => ({ id, name, color: personnelColors[id] }));
  }, [valid, personnelColors]);

  useEffect(() => {
    const id = 'frappe-gantt-css';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet'; link.href = '/frappe-gantt.css';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!containerRef.current || valid.length === 0) return;

    const tasks = valid.map(d => {
      const start = parseDate(d.date);
      return {
        id: String(d.id),
        name: `${d.chantier?.adresse ?? '—'} - ${d.nom_client}`,
        start,
        end: start,
        progress: 0,
        custom_class: d.personnelId ? `personnel-${d.personnelId}` : 'personnel-unassigned',
      };
    });

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      new Gantt(containerRef.current, tasks, {
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD',
        popup: false,
        readonly: true,
      });

      const wrappers = containerRef.current?.querySelectorAll('.bar-wrapper');
      wrappers?.forEach(wrapper => {
        const taskId = wrapper.getAttribute('data-id');
        wrapper.addEventListener('mouseenter', () => {
          setHoveredDI(disByIdRef.current[taskId] ?? null);
        });
        wrapper.addEventListener('mouseleave', () => {
          setHoveredDI(null);
        });
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [valid, viewMode]);

  if (valid.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Aucune DI avec une date renseignée.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-4 flex-wrap">
          {personnelLegend.map(({ id, name, color }) => (
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
        <Space.Compact>
          {VIEW_MODES.map(({ key, label }) => (
            <Button key={key} type={viewMode === key ? 'primary' : 'default'} onClick={() => setViewMode(key)}>
              {label}
            </Button>
          ))}
        </Space.Compact>
      </div>

      <style>{`
        .gantt-container, .gantt-container * {
          font-family: 'Quicksand', sans-serif !important;
        }
        ${Object.entries(personnelColors).map(([id, color]) => `
          .personnel-${id} .bar { fill: ${color} !important; }
          .personnel-${id} .bar-progress { fill: ${color} !important; filter: brightness(0.85); }
        `).join('')}
        .personnel-unassigned .bar { fill: ${UNASSIGNED_COLOR} !important; }
        .personnel-unassigned .bar-progress { fill: ${UNASSIGNED_COLOR} !important; filter: brightness(0.85); }
        .gantt .bar-label { font-size: 11px; }
        .gantt .bar-label.big { fill: #333 !important; }
      `}</style>

      <div ref={containerRef} />

      <div
        style={{
          marginTop: 16,
          minHeight: 72,
          transition: 'opacity 0.15s',
          opacity: hoveredDI ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        {hoveredDI && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex gap-6 flex-wrap text-sm">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Chantier</div>
              <div className="font-semibold">{hoveredDI.chantier?.adresse}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Client</div>
              <div className="font-semibold">{hoveredDI.nom_client}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Date</div>
              <div>
                {hoveredDI.date}
                {hoveredDI.heure_debut ? ` de ${hoveredDI.heure_debut}` : ''}
                {hoveredDI.heure_fin ? ` à ${hoveredDI.heure_fin}` : ''}
              </div>
            </div>
            {hoveredDI.telephone && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Téléphone</div>
                <div>{hoveredDI.telephone}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Membre assigné</div>
              <div>{hoveredDI.personnel ? `${hoveredDI.personnel.prenom} ${hoveredDI.personnel.nom}` : '—'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
