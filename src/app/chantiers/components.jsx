import React, { useState, useEffect } from 'react';
import { RetroGrid } from "../../components/ui/retro-grid";
import { TableTemplate } from "../../components/general/table";
import { Space, Popconfirm, Button, Popover, Drawer, Form, Input, Select, DatePicker, message, Tag, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { fetchPersonnel, createPersonnel, updatePersonnel, deletePersonnel, fetchEquipes, createEquipe } from './data';

dayjs.extend(customParseFormat);

export const TYPE_OPTIONS = [
  { value: "enedis",              label: "ENEDIS" },
  { value: "izi",                 label: "IZI" },
  { value: "copros",              label: "Copros" },
  { value: "maison_individuelle", label: "Maison individuelle" },
];

function serializeDates(values) {
  return {
    ...values,
    debut: values.debut ? values.debut.format('DD/MM/YYYY') : null,
    fin:   values.fin   ? values.fin.format('DD/MM/YYYY')   : null,
  };
}

function formatDayMonth(val) {
  if (!val) return '—';
  const d = dayjs(val, 'DD/MM/YYYY', true);
  return d.isValid() ? d.format('DD/MM') : '—';
}

// ── Shared chantier form fields ───────────────────────────────────────────────

function ChantierFormFields({ equipeOptions }) {
  return (
    <>
      <Form.Item name="adresse" label="Nom / Adresse"
        rules={[{ required: true, message: "Veuillez entrer le nom / l'adresse" }]}>
        <Input placeholder="10 rue de la Paix" />
      </Form.Item>

      <Space.Compact style={{ width: '100%', gap: 8, display: 'flex' }}>
        <Form.Item name="code_postal" label="Code postal" style={{ flex: 1 }}
          rules={[{ required: true, message: "Requis" }]}>
          <Input placeholder="75001" />
        </Form.Item>
        <Form.Item name="ville" label="Ville" style={{ flex: 2 }}
          rules={[{ required: true, message: "Requis" }]}>
          <Input placeholder="Paris" />
        </Form.Item>
      </Space.Compact>

      <Form.Item name="type" label="Type"
        rules={[{ required: true, message: "Veuillez sélectionner un type" }]}>
        <Select placeholder="Sélectionner un type" options={TYPE_OPTIONS} />
      </Form.Item>

      <Form.Item name="telephone" label="Téléphone"
        rules={[{ required: true, message: "Veuillez entrer le téléphone" }]}>
        <Input placeholder="06 00 00 00 00" />
      </Form.Item>

      <Form.Item name="numero_affaire" label="Numéro d'affaire (optionnel)">
        <Input placeholder="ex: AFF-2024-001" />
      </Form.Item>

      <Space.Compact style={{ width: '100%', gap: 8, display: 'flex' }}>
        <Form.Item name="debut" label="Date de début" style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="jj/mm/aaaa" />
        </Form.Item>
        <Form.Item name="fin" label="Date de fin" style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="jj/mm/aaaa" />
        </Form.Item>
      </Space.Compact>

      <Form.Item name="equipeId" label="Equipe (optionnel)">
        <Select
          placeholder="Sélectionner une équipe"
          options={equipeOptions}
          allowClear
        />
      </Form.Item>
    </>
  );
}

// ── Chantiers columns ─────────────────────────────────────────────────────────

function getColumns(onAction, onEdit, onView) {
  return [
    { title: 'Adresse',  dataIndex: 'adresse', key: 'adresse' },
    {
      title: 'Ville',
      dataIndex: 'ville',
      key: 'ville',
      width: 140,
      sorter: (a, b) => (a.ville ?? '').localeCompare(b.ville ?? '', 'fr', { sensitivity: 'base' }),
      sortDirections: ['ascend', 'descend'],
    },
    { title: 'Type',     dataIndex: 'type',    key: 'type',
      render: (val) => TYPE_OPTIONS.find(o => o.value === val)?.label ?? val },
    { title: 'Début',    dataIndex: 'debut',   key: 'debut', render: (val) => formatDayMonth(val) },
    { title: 'Fin',      dataIndex: 'fin',     key: 'fin',   render: (val) => formatDayMonth(val) },
    { title: 'Equipe', dataIndex: 'equipe', key: 'equipe',
      render: (equipe) => equipe ? <Tag>{equipe.nom}</Tag> : '—' },
    { title: 'DIs', key: 'dis',
      render: (_, record) => {
        const total = record.dis_total ?? 0;
        const planifiees = record.dis_planifiees ?? 0;
        if (total === 0) return <span className="text-gray-400">—</span>;
        return <span>{planifiees} / {total}</span>;
      }
    },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} onClick={() => onView(record)}></Button>
          <Button icon={<EditOutlined />} onClick={() => onEdit(record)}></Button>
          <Popconfirm
            title="Archiver ce chantier ?"
            onConfirm={() => onAction(record, "archive")}
            okText="Archiver" cancelText="Annuler"
          >
            <Button icon={<DeleteOutlined />}></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
}

// ── Screens ───────────────────────────────────────────────────────────────────

export function Accueil() {
  return (
    <div className="flex flex-col gap-6 h-full w-fill items-center justify-center py-20">
      <RetroGrid />
      <span className="pointer-events-none z-10 whitespace-pre-wrap bg-clip-text text-center text-6xl font-bold leading-none tracking-tighter">
        Bienvenue 👋🏻
      </span>
      <p className="text-lg">dans votre application pour gérer et planifier efficacement vos chantiers</p>
      <img className="pt-20" src="/plan-enedis.jpg" alt="Illustration" width={400} height={400} />
    </div>
  );
}

export function EnCours({ data, onAction, onEdit, onView }) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState();
  const [selectedEquipe, setSelectedEquipe] = useState();
  const [equipes, setEquipes] = useState([]);

  useEffect(() => {
    fetchEquipes().then(setEquipes);
  }, []);

  const columns = React.useMemo(
    () => getColumns(onAction, onEdit, onView),
    [onAction, onEdit, onView]
  );
  const filteredData = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((item) => {
      const matchesSearch = !q || (item.adresse ?? '').toLowerCase().includes(q);
      const matchesType = !selectedType || item.type === selectedType;
      const matchesEquipe = !selectedEquipe || item.equipeId === selectedEquipe;
      return matchesSearch && matchesType && matchesEquipe;
    });
  }, [data, search, selectedType, selectedEquipe]);

  return (
    <div className="flex flex-col gap-6 h-full w-full items-center justify-center py-10">
      <span className="pointer-events-none z-10 whitespace-pre-wrap bg-clip-text text-4xl font-bold leading-none tracking-tighter">
        Chantiers en Cours
      </span>
      <div className="pt-15 px-10 w-full">
        <div className="flex justify-end gap-3 mb-4">
          <Select
            placeholder="Filtrer par type"
            allowClear
            value={selectedType}
            onChange={setSelectedType}
            options={TYPE_OPTIONS}
            style={{ width: 220 }}
          />
          <Select
            placeholder="Filtrer par équipe"
            allowClear
            value={selectedEquipe}
            onChange={setSelectedEquipe}
            options={equipes.map(e => ({ value: e.id, label: e.nom }))}
            style={{ width: 220 }}
          />
          <Input.Search
            placeholder="Rechercher par nom / adresse"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
        </div>
        <TableTemplate columns={columns} data={filteredData} size="small" />
      </div>
    </div>
  );
}

// ── Personnel screen ──────────────────────────────────────────────────────────

export function PersonnelScreen({ onRefresh }) {
  const [data, setData] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [newEquipeName, setNewEquipeName] = useState('');
  const [creatingEquipe, setCreatingEquipe] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const res = await fetchPersonnel();
    setData(res);
  };

  const loadEquipes = async () => {
    const res = await fetchEquipes();
    setEquipes(res);
  };

  useEffect(() => { load(); loadEquipes(); }, []);

  const openCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({ ...record, equipeIds: record.equipes?.map(e => e.id) ?? [] });
    setDrawerOpen(true);
  };

  const handleCreateEquipe = async () => {
    const nom = newEquipeName.trim();
    if (!nom) return;
    setCreatingEquipe(true);
    try {
      const created = await createEquipe(nom);
      setEquipes(prev => [...prev, created]);
      form.setFieldValue('equipeIds', [...(form.getFieldValue('equipeIds') ?? []), created.id]);
      setNewEquipeName('');
    } catch (err) {
      message.error(err.message ?? "Erreur lors de la création de l'équipe");
    } finally {
      setCreatingEquipe(false);
    }
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingRecord) {
        await updatePersonnel(editingRecord.id, values);
      } else {
        await createPersonnel(values);
      }
      await load();
      onRefresh?.();
      form.resetFields();
      setDrawerOpen(false);
    } catch {
      // validation
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (record) => {
    try {
      await deletePersonnel(record.id);
      await load();
      onRefresh?.();
    } catch (err) {
      message.error(err.message ?? 'Erreur lors de la suppression');
    }
  };

  const columns = [
    { title: 'Prénom', dataIndex: 'prenom', key: 'prenom' },
    { title: 'Nom',    dataIndex: 'nom',    key: 'nom' },
    {
      title: 'Equipe', dataIndex: 'equipes', key: 'equipes',
      render: (list) => list?.length
        ? <Space size={[0, 4]} wrap>{list.map(e => <Tag key={e.id}>{e.nom}</Tag>)}</Space>
        : '—',
    },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>Modifier</Button>
          <Popconfirm
            title="Supprimer ce membre ?"
            onConfirm={() => onDelete(record)}
            okText="Supprimer" cancelText="Annuler"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 h-full w-full py-10">
      <div className="flex items-center justify-between px-10">
        <span className="text-4xl font-bold">Personnel</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          className="!bg-[var(--color-secondary)] !text-[var(--color-black)] !border-0">
          Nouveau
        </Button>
      </div>
      <div className="px-10 w-full">
        <TableTemplate columns={columns} data={data} />
      </div>

      <Drawer
        title={editingRecord ? "Modifier le membre" : "Nouveau membre"}
        width={400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Annuler</Button>
            <Button type="primary" onClick={onSave} loading={submitting}>Sauvegarder</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="prenom" label="Prénom"
            rules={[{ required: true, message: "Requis" }]}>
            <Input placeholder="Jean" />
          </Form.Item>
          <Form.Item name="nom" label="Nom"
            rules={[{ required: true, message: "Requis" }]}>
            <Input placeholder="Dupont" />
          </Form.Item>
          <Form.Item name="equipeIds" label="Equipe">
            <Select
              mode="multiple"
              placeholder="Sélectionner une ou plusieurs équipes"
              options={equipes.map(e => ({ value: e.id, label: e.nom }))}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Space style={{ padding: '0 8px 8px' }}>
                    <Input
                      placeholder="Nouvelle équipe"
                      value={newEquipeName}
                      onChange={(e) => setNewEquipeName(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onPressEnter={handleCreateEquipe}
                    />
                    <Button type="text" icon={<PlusOutlined />} loading={creatingEquipe} onClick={handleCreateEquipe}>
                      Ajouter
                    </Button>
                  </Space>
                </>
              )}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

// ── Drawer Nouveau chantier ───────────────────────────────────────────────────

export function DrawerNew({ onAction }) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [equipeOptions, setEquipeOptions] = useState([]);

  const openDrawer = () => {
    form.resetFields();
    form.setFieldsValue({ telephone: '06' });
    setOpen(true);
  };

  useEffect(() => {
    fetchEquipes().then(list =>
      setEquipeOptions(list.map(e => ({ value: e.id, label: e.nom })))
    );
  }, [open]); // refresh list each time drawer opens

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onAction?.(serializeDates(values));
      form.resetFields();
      setOpen(false);
    } catch {
      // validation
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Popover content="Créer un nouveau chantier">
        <Button type="primary" onClick={openDrawer} icon={<PlusOutlined />}
          className="!bg-[var(--color-secondary)] !text-[var(--color-black)] !border-0 hover:!bg-[var(--color-secondary)]">
          Nouveau
        </Button>
      </Popover>

      <Drawer title="Créer un nouveau chantier" width={560}
        onClose={() => setOpen(false)} open={open}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="primary" onClick={onSave} loading={submitting}>Sauvegarder</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <ChantierFormFields equipeOptions={equipeOptions} />
        </Form>
      </Drawer>
    </>
  );
}

// ── Drawer Modifier chantier ──────────────────────────────────────────────────

export function DrawerEdit({ record, onClose, onSave }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [equipeOptions, setEquipeOptions] = useState([]);

  useEffect(() => {
    if (!record) return;
    fetchEquipes().then(list =>
      setEquipeOptions(list.map(e => ({ value: e.id, label: e.nom })))
    );
  }, [record]);

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        ...record,
        debut: record.debut ? dayjs(record.debut, 'DD/MM/YYYY') : null,
        fin:   record.fin   ? dayjs(record.fin,   'DD/MM/YYYY') : null,
        equipeId: record.equipeId ?? record.equipe?.id ?? null,
      });
    }
  }, [record, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSave?.(record.id, serializeDates(values));
      onClose();
    } catch {
      // validation
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer title="Modifier le chantier" width={560}
      onClose={onClose} open={!!record}
      extra={
        <Space>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="primary" onClick={handleSave} loading={submitting}>Sauvegarder</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <ChantierFormFields equipeOptions={equipeOptions} />
      </Form>
    </Drawer>
  );
}
