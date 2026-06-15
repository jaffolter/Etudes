'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Collapse, Divider, Input, InputNumber, Table, Button, Flex, Spin, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { TypingAnimation } from '../../../../components/ui/typing-animation';
import { SaveButton } from '../../../../components/general/saveButton';
import { generalFetch, generalUpdate } from '../../data';
import { useParams } from 'next/navigation';

const { TextArea } = Input;

/* -------------------- helpers -------------------- */

// immutable update helpers
function updateCell(state, setState, pIndex, section, rIndex, field, value) {
  setState(curr => {
    const next = structuredClone(curr);
    next[pIndex].materiel[section][rIndex] = {
      ...next[pIndex].materiel[section][rIndex],
      [field]: value,
    };
    return next;
  });
}

function addRow(state, setState, pIndex, section) {
  setState(curr => {
    const next = structuredClone(curr);
    next[pIndex].materiel[section] = [...(next[pIndex].materiel[section] || []), { label: '', metres: undefined, section: undefined }];
    return next;
  });
}

function removeRow(state, setState, pIndex, section, rIndex) {
  setState(curr => {
    const next = structuredClone(curr);
    next[pIndex].materiel[section] = (next[pIndex].materiel[section] || []).filter((_, i) => i !== rIndex);
    return next;
  });
}

/* -------------------- Editable table (controlled) -------------------- */

function EditableTable({ rows, onChangeCell, onAdd, onRemove }) {
  const dataSource = (rows || []).map((row, idx) => ({ key: idx, ...row }));

  const columns = [
    {
      dataIndex: 'label',
      title: 'Description',
      render: (_, record, index) => (
        <Input
          value={record.label}
          onChange={e => onChangeCell(index, 'label', e.target.value)}
          placeholder="ex: DP → REMBT + RCCP"
        />
      ),
    },
    {
      dataIndex: 'metres',
      title: 'Nombre de mètres',
      width: 160,
      render: (_, record, index) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={record.metres}
          onChange={v => onChangeCell(index, 'metres', v)}
          placeholder="m"
        />
      ),
    },
    {
      dataIndex: 'section',
      title: 'Section du câble',
      width: 160,
      render: (_, record, index) => (
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          value={record.section}
          onChange={v => onChangeCell(index, 'section', v)}
          placeholder="mm²"
        />
      ),
    },
    {
      dataIndex: 'actions',
      title: 'Actions',
      width: 60,
      render: (_, __, index) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onRemove(index)} />
      ),
    },
  ];

  return (
    <>
      <Table
        size="small"
        pagination={false}
        dataSource={dataSource}
        columns={columns}
        style={{ marginBottom: 8 }}
      />
      <Button icon={<PlusOutlined />} onClick={onAdd}>
        Ajouter une ligne
      </Button>
    </>
  );
}

/* -------------------- Parking panel -------------------- */

function ParkingPanel({ pIndex, nbTravees, parkingsData, setParkingsData }) {
  const p = parkingsData[pIndex];

  return (
    <>
      <Divider orientation="left" plain>
        <span className="text-md font-bold">Description de la solution technique</span>
      </Divider>
      <TextArea
        rows={2}
        value={p.description}
        onChange={e =>
          setParkingsData(curr => {
            const next = structuredClone(curr);
            next[pIndex].description = e.target.value;
            return next;
          })
        }
        placeholder="Ex. Départ poste extérieur au bâtiment…"
      />

      <div className="my-15" />
      <Divider orientation="left" plain>
        <span className="text-md font-bold">Travaux de génie civil et de structure</span>
      </Divider>
      <Flex gap={32} align="flex-end" style={{ marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>Nombre de percements supérieurs à 50 mm</div>
          <InputNumber
            min={0}
            value={p.nb_percements}
            onChange={v =>
              setParkingsData(curr => {
                const next = structuredClone(curr);
                next[pIndex].nb_percements = v ?? 0;
                return next;
              })
            }
          />
        </div>
        <Checkbox
          checked={p.avec_etude_structure}
          onChange={e =>
            setParkingsData(curr => {
              const next = structuredClone(curr);
              next[pIndex].avec_etude_structure = e.target.checked;
              return next;
            })
          }
        >
          Avec étude de structure
        </Checkbox>
      </Flex>

      <div className="my-15" />
      <Divider orientation="left" plain>
        <span className="text-md font-bold">Arrivée Réseau & Panoplie</span>
      </Divider>
      <div className="my-5" />

      <EditableTable
        rows={p.materiel.reseau}
        onChangeCell={(rIdx, field, val) => updateCell(parkingsData, setParkingsData, pIndex, 'reseau', rIdx, field, val)}
        onAdd={() => addRow(parkingsData, setParkingsData, pIndex, 'reseau')}
        onRemove={rIdx => removeRow(parkingsData, setParkingsData, pIndex, 'reseau', rIdx)}
      />

      <div className="my-15" />
      <Divider orientation="left" plain>
        <span className="text-md font-bold">Parking</span>
      </Divider>
      <div className="my-5" />

      <EditableTable
        rows={p.materiel.parking}
        onChangeCell={(rIdx, field, val) => updateCell(parkingsData, setParkingsData, pIndex, 'parking', rIdx, field, val)}
        onAdd={() => addRow(parkingsData, setParkingsData, pIndex, 'parking')}
        onRemove={rIdx => removeRow(parkingsData, setParkingsData, pIndex, 'parking', rIdx)}
      />


      <div className="my-15" />
      <Divider orientation="left" plain>
        <span className="text-md font-bold">Colonne de Terre</span>
      </Divider>
      <div className="my-5" />

      <EditableTable
        rows={p.materiel.terre}
        onChangeCell={(rIdx, field, val) => updateCell(parkingsData, setParkingsData, pIndex, 'terre', rIdx, field, val)}
        onAdd={() => addRow(parkingsData, setParkingsData, pIndex, 'terre')}
        onRemove={rIdx => removeRow(parkingsData, setParkingsData, pIndex, 'terre', rIdx)}
      />

      <div className="my-15" />
      <Divider orientation="left" plain>
        <span className="text-md font-bold">Répartition des phases</span>
      </Divider>
      <div className="my-5" />

      {Array.from({ length: nbTravees }).map((_, idx) => (
        <Flex key={idx} wrap style={{ columnGap: 12, rowGap: 8, marginBottom: 8 }}>
          <span className="text-md font-bold" style={{ width: 90 }}>Travée {idx + 1}</span>
          <div style={{ width: 220 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>N° Place - Début</div>
            <Input
              style={{ width: '100%' }}
              value={p.phases[idx]?.from ?? ''}
              onChange={e =>
                setParkingsData(curr => {
                  const next = structuredClone(curr);
                  next[pIndex].phases[idx] = {
                    ...(next[pIndex].phases[idx] || {}),
                    from: e.target.value,          // <-- the string "112-115"
                  };
                  return next;
                })
              }
              placeholder="ex. 112-115"
            />
          </div>
          <div style={{ width: 220 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>N° Place - Fin</div>
            <Input
              style={{ width: '100%' }}
              value={p.phases[idx]?.to ?? ''}
              onChange={e =>
                setParkingsData(curr => {
                  const next = structuredClone(curr);
                  next[pIndex].phases[idx] = {
                    ...(next[pIndex].phases[idx] || {}),
                    to: e.target.value,            // <-- the string "118-121"
                  };
                  return next;
                })
              }
              placeholder="ex. 118-121"
            />
          </div>
        </Flex>
      ))}
    </>
  );
}

/* -------------------- Page -------------------- */
// DB -> UI mapping for items in materielInfoTechnique.items
const mapItemsDbToUi = (items = []) =>
  (Array.isArray(items) ? items : []).map(row => ({
    label: row?.reseau ?? "",
    metres: row?.metres ?? undefined,
    section: row?.section ?? undefined,
  }));

// Apply a single data_info row to a per-parking accumulator
const applySection = (acc, row) => {
  const { parking_idx, section, items } = row;
  if (!acc[parking_idx]) return acc; // safety
  const uiItems = mapItemsDbToUi(items);
  if (section === "arrivee_reseau") acc[parking_idx].materiel.reseau = uiItems;
  else if (section === "parking") acc[parking_idx].materiel.parking = uiItems;
  else if (section === "colonne_terre") acc[parking_idx].materiel.terre = uiItems;
  return acc;
};

// DB -> UI mapping for meta row
const mapMetaDbToUi = (meta) => ({
  description: meta?.description ?? "",
  nb_percements: meta?.nb_percements ?? 0,
  avec_etude_structure: meta?.avec_etude_structure ?? false,
  phases: Array.isArray(meta?.travees)
    ? meta.travees.map(t => ({
      from: t?.from ?? "",
      to: t?.to ?? "",
    }))
    : [],
});


export default function InfosTechniquesPage() {
  const { id } = useParams();
  const [infosParkings, setInfosParkings] = useState([]); // from infos-generales
  const [parkingsData, setParkingsData] = useState([]);   // editable technical data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // 1) Base structure from infos-generales
      const gen = await generalFetch('/api/infos-generales', id);
      const pd = Array.isArray(gen?.parking_details) ? gen.parking_details : [];

      // empty per-parking UI shape
      const empty = pd.map(p => ({
        description: "",
        nb_percements: 0,
        avec_etude_structure: false,
        materiel: { reseau: [], parking: [], terre: [] },
        phases: Array.from({ length: Number(p?.travees) || 0 }, () => ({ from: '', to: '' })),
      }));

      setInfosParkings(pd);
      setParkingsData(empty); // set something immediately for first render

      // 2) Load technical data
      const tech = await generalFetch('/api/infos-techniques', id);
      const meta = Array.isArray(tech?.metas) ? tech.metas : [];
      const data_info = Array.isArray(tech?.data) ? tech.data : [];

      console.log("Fetched infos-techniques meta", meta);
      console.log("Fetched infos-techniques data_info", data_info);

      // 3) Overlay material sections (arrivee_reseau / parking / colonne_terre)
      const filled = data_info.reduce(applySection, structuredClone(empty));

      // 4) Overlay meta: description + phases (ensure length matches travees)
      for (const m of meta) {
        const idx = m?.parking_idx;
        if (idx == null || !filled[idx]) continue;

        const mapped = mapMetaDbToUi(m);
        filled[idx].description = mapped.description;
        filled[idx].nb_percements = mapped.nb_percements;
        filled[idx].avec_etude_structure = mapped.avec_etude_structure;

        const wanted = Number(pd[idx]?.travees) || 0;
        const normalizedPhases = Array.from({ length: wanted }, (_, i) => mapped.phases[i] ?? { from: "", to: "" });
        filled[idx].phases = normalizedPhases;
      }

      setParkingsData(filled);
      setLoading(false);
    })();
  }, [id]);

  const items = infosParkings.map((p, i) => ({
    key: String(i),
    label: <span className="text-lg font-bold">Parking {i + 1} — {p.interieur ? 'Intérieur' : 'Extérieur'}</span>,
    forceRender: true,
    children: (
      <ParkingPanel
        pIndex={i}
        nbTravees={Number(p?.travees) || 0}
        parkingsData={parkingsData}
        setParkingsData={setParkingsData}
      />
    ),
  }));


  const onSave = async () => {
    try {
      const castRows = (rows) => rows.map((row, idx) => ({
        id: idx,
        reseau: row.label,
        metres: row.metres,
        section: row.section,
      }));

      // Post Data for InfosTechniques (main)
      const mapping_sections = {
        'reseau': 'arrivee_reseau',
        'parking': 'parking',
        'terre': 'colonne_terre',
      }
      for (let p = 0; p < parkingsData.length; p++) {
        const data = parkingsData[p].materiel;
        for (let section of ['reseau', 'parking', 'terre']) {
          const new_data = {
            id: parseInt(id, 10),
            parking_idx: p,
            section: mapping_sections[section],
            items: castRows(data[section]),
          }
          const result = await generalUpdate('/api/infos-techniques', new_data);
          if (!result) throw new Error(`Failed to save infos-techniques section: ${section}`);
        }
      }

      // Post Data for InfosTechniquesMeta 
      for (let p = 0; p < parkingsData.length; p++) {
        const data = parkingsData[p];
        const new_data = {
          id: parseInt(id, 10),
          parking_idx: p,
          description: data.description,
          nb_percements: data.nb_percements ?? 0,
          avec_etude_structure: data.avec_etude_structure ?? false,
          travees: data.phases,
        }
        const result = await generalUpdate('/api/info-techniques-meta', new_data);
        if (!result) throw new Error(`Failed to save infos-techniques-meta for parking ${p}`);
      }

      return true;
    } catch (error) {
      console.error("Error in onSave:", error);
      throw error; // Re-throw for SaveButton to catch
    }
  };

  return (
    <div className="p-12">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-8">
            <TypingAnimation className="text-3xl font-bold text-center">Informations Techniques</TypingAnimation>
          </div>

          <Collapse
            items={items}
            defaultActiveKey={items.length ? [items[0].key] : []}
            destroyOnHidden={false}
          />

          <div className="flex justify-start mt-6">
            <SaveButton onSave={onSave} />
          </div>
        </>
      )}
    </div>
  );
}
