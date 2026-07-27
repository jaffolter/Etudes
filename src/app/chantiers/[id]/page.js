'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Layout, Button, Tag, Drawer, Form, Input, DatePicker, TimePicker,
  Switch, Space, Popconfirm, Spin, Select
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { TableTemplate } from '../../../components/general/table';
import Image from 'next/image';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { Header, Content, Footer } = Layout;

const TYPE_COLORS = {
  enedis:              'blue',
  izi:                 'green',
  copros:              'orange',
  maison_individuelle: 'purple',
};
const TYPE_LABELS = {
  enedis:              'ENEDIS',
  izi:                 'IZI',
  copros:              'Copros',
  maison_individuelle: 'Maison individuelle',
};

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchChantier(id) {
  const res = await fetch(`/api/chantiers/${id}`);
  return res.json();
}
async function fetchDIs(chantierId) {
  const res = await fetch(`/api/dis?chantierId=${chantierId}`);
  return res.json();
}
async function fetchPersonnel() {
  const res = await fetch('/api/personnel');
  return res.json();
}
async function createDI(data) {
  const res = await fetch('/api/dis', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
async function updateDI(id, data) {
  const res = await fetch(`/api/dis/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
async function deleteDI(id) {
  const res = await fetch(`/api/dis/${id}`, { method: 'DELETE' });
  return res.json();
}

// ── DI Drawer ─────────────────────────────────────────────────────────────────

function DIDrawer({ chantierId, record, personnel, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        ...record,
        date: record.date ? dayjs(record.date, 'DD/MM/YYYY') : null,
        heure_debut: record.heure_debut ? dayjs(record.heure_debut, 'HH:mm') : null,
        heure_fin: record.heure_fin ? dayjs(record.heure_fin, 'HH:mm') : null,
      });
    } else {
      form.resetFields();
    }
  }, [record, form]);

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        ...values,
        date: values.date ? values.date.format('DD/MM/YYYY') : '',
        heure_debut: values.heure_debut ? values.heure_debut.format('HH:mm') : '',
        heure_fin: values.heure_fin ? values.heure_fin.format('HH:mm') : '',
        planifie: values.planifie ?? false,
        chantierId,
      };
      if (record) {
        await updateDI(record.id, payload);
      } else {
        await createDI(payload);
      }
      await onSaved();
      onClose();
    } catch {
      // validation
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={record ? 'Modifier la DI' : 'Nouvelle DI'}
      width={480}
      open={true}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="primary" onClick={onSave} loading={submitting}>Sauvegarder</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="nom_client" label="Nom client"
          rules={[{ required: true, message: 'Requis' }]}>
          <Input placeholder="Dupont Jean" />
        </Form.Item>
        <Form.Item name="numero_box" label="Numéro box (optionnel)">
          <Input placeholder="Box 42" />
        </Form.Item>
        <Form.Item name="date" label="Date (optionnel)">
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="jj/mm/aaaa" />
        </Form.Item>
        <Form.Item name="heure_debut" label="Heure début (optionnel)">
          <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder="hh:mm" />
        </Form.Item>
        <Form.Item name="heure_fin" label="Heure fin (optionnel)">
          <TimePicker style={{ width: '100%' }} format="HH:mm" placeholder="hh:mm" />
        </Form.Item>
        <Form.Item name="telephone" label="Téléphone (optionnel)">
          <Input placeholder="06 12 34 56 78" />
        </Form.Item>
        <Form.Item name="personnelId" label="Membre assigné (optionnel)">
          <Select
            allowClear
            placeholder="Sélectionner un membre"
            options={personnel.map(p => ({ value: p.id, label: `${p.prenom} ${p.nom}` }))}
          />
        </Form.Item>
        <Form.Item name="planifie" label="Planifié" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChantierDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [chantier, setChantier] = useState(null);
  const [dis, setDis] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diDrawer, setDiDrawer] = useState(null); // null | 'new' | record
  const [diSearch, setDiSearch] = useState('');

  const load = useCallback(async () => {
    const [c, d, p] = await Promise.all([fetchChantier(id), fetchDIs(id), fetchPersonnel()]);
    setChantier(c);
    setDis(d);
    setPersonnel(p);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const diColumns = [
    { title: 'Nom client',   dataIndex: 'nom_client',  key: 'nom_client' },
    { title: 'N° box',       dataIndex: 'numero_box',  key: 'numero_box', render: v => v ?? '—' },
    { title: 'Date',         dataIndex: 'date',        key: 'date' },
    { title: 'Heure début',  dataIndex: 'heure_debut', key: 'heure_debut', render: v => v ?? '—' },
    { title: 'Heure fin',    dataIndex: 'heure_fin',   key: 'heure_fin',   render: v => v ?? '—' },
    { title: 'Téléphone',    dataIndex: 'telephone',   key: 'telephone',   render: v => v ?? '—' },
    {
      title: 'Membre assigné', dataIndex: 'personnel', key: 'personnel',
      render: p => p ? `${p.prenom} ${p.nom}` : '—',
    },
    {
      title: 'Planifié', dataIndex: 'planifie', key: 'planifie',
      render: v => <Tag color={v ? 'green' : 'default'}>{v ? 'Oui' : 'Non'}</Tag>
    },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => setDiDrawer(record)}>Modifier</Button>
          <Popconfirm
            title="Supprimer cette DI ?"
            onConfirm={async () => { await deleteDI(record.id); load(); }}
            okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Spin size="large" />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: '0 24px', backgroundColor: 'var(--color-primary)' }}>
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Logo" width={50} height={50} />
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/chantiers')}
              style={{ color: 'white', borderColor: 'white', background: 'transparent' }}
            >
              Retour
            </Button>
          </div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
            {chantier?.adresse}, {chantier?.ville}
          </h1>
          <div style={{ width: 120 }} />
        </div>
      </Header>

      <Content style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="m-10 flex flex-col gap-6">

          {/* Infos générales */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Informations générales</h2>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm md:grid-cols-3">
              <InfoRow label="Adresse"      value={chantier?.adresse} />
              <InfoRow label="Code postal"  value={chantier?.code_postal} />
              <InfoRow label="Ville"        value={chantier?.ville} />
              <InfoRow label="Téléphone"    value={chantier?.telephone} />
              <InfoRow label="Type"
                value={<Tag color={TYPE_COLORS[chantier?.type]}>{TYPE_LABELS[chantier?.type] ?? chantier?.type}</Tag>}
              />
              <InfoRow label="N° affaire"   value={chantier?.numero_affaire ?? '—'} />
              <InfoRow label="Début"        value={chantier?.debut ?? '—'} />
              <InfoRow label="Fin"          value={chantier?.fin ?? '—'} />
              <InfoRow label="Personnel"
                value={chantier?.personnel?.length
                  ? chantier.personnel.map(p => `${p.prenom} ${p.nom}`).join(', ')
                  : '—'}
              />
            </div>
          </div>

          {/* DIs */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">DIs</h2>
              <div className="flex items-center gap-3">
                <Input.Search
                  placeholder="Rechercher par nom client"
                  allowClear
                  value={diSearch}
                  onChange={e => setDiSearch(e.target.value)}
                  style={{ width: 260 }}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setDiDrawer('new')}
                  className="!bg-[var(--color-secondary)] !text-[var(--color-black)] !border-0">
                  Nouvelle DI
                </Button>
              </div>
            </div>
            <TableTemplate columns={diColumns} data={dis.filter(d =>
              !diSearch || (d.nom_client ?? '').toLowerCase().includes(diSearch.toLowerCase())
            )} />
          </div>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', backgroundColor: 'var(--color-secondary)' }}>
        Reve Apps ©{new Date().getFullYear()} Created by J. Affolter
      </Footer>

      {diDrawer && (
        <DIDrawer
          chantierId={Number(id)}
          record={diDrawer === 'new' ? null : diDrawer}
          personnel={personnel}
          onClose={() => setDiDrawer(null)}
          onSaved={load}
        />
      )}
    </Layout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
