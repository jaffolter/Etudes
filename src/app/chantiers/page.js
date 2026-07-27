'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Menu, Flex, Button, Space } from 'antd';
import { HomeOutlined, BuildOutlined, BarChartOutlined, TeamOutlined } from "@ant-design/icons";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

import { Accueil, EnCours, PersonnelScreen, DrawerNew, DrawerEdit } from './components';
import { GanttChart } from './GanttChart';
import { DIGanttChart } from './DIGanttChart';
import { fetchChantiers, createChantier, updateChantierStatut, updateChantier, syncAssignations, fetchAssignations, fetchAllDIs } from './data';

const { Header, Content, Sider, Footer } = Layout;

function getItem(label, key, icon) {
  return { key, icon, label };
}

const items = [
  getItem('Accueil',   'accueil',   <HomeOutlined />),
  getItem('En Cours',  'en-cours',  <BuildOutlined />),
  getItem('Planning',  'planning',  <BarChartOutlined />),
  getItem('Personnel', 'personnel', <TeamOutlined />),
];

export default function ChantiersPage() {
  const router = useRouter();
  const [selected, setSelected] = useState('accueil');
  const [chantiers, setChantiers] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [planningView, setPlanningView] = useState('chantiers'); // 'chantiers' | 'dis'
  const [dis, setDis] = useState([]);

  const load = useCallback(async () => {
    const data = await fetchChantiers();
    setChantiers(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selected === 'planning' && planningView === 'dis') {
      fetchAllDIs().then(setDis);
    }
  }, [selected, planningView]);

  const handleAction = useCallback(async (record, action) => {
    await updateChantierStatut(record.id, action);
    await load();
  }, [load]);

  const handleCreate = useCallback(async (values) => {
    const { personnelIds, ...chantierData } = values;
    const newChantier = await createChantier(chantierData);
    if (personnelIds?.length) {
      await syncAssignations(newChantier.id, personnelIds);
    }
    await load();
    setSelected('en-cours');
  }, [load]);

  const handleUpdate = useCallback(async (id, values) => {
    const { personnelIds, ...chantierData } = values;
    await updateChantier(id, chantierData);
    await syncAssignations(id, personnelIds ?? []);
    await load();
  }, [load]);

  // Open edit drawer: fetch current assignations and attach to record
  const handleOpenEdit = useCallback(async (record) => {
    const personnelIds = await fetchAssignations(record.id);
    setEditingRecord({ ...record, personnelIds });
  }, []);

  const enCours = chantiers.filter(c => c.statut === 'en-cours');

  const renderScreen = () => {
    switch (selected) {
      case 'en-cours': return (
        <EnCours
          data={enCours}
          onAction={handleAction}
          onEdit={handleOpenEdit}
          onView={(record) => router.push(`/chantiers/${record.id}`)}
        />
      );
      case 'planning': return (
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold m-0">Planning</h2>
            <Space.Compact>
              <Button
                type={planningView === 'chantiers' ? 'primary' : 'default'}
                onClick={() => setPlanningView('chantiers')}
              >
                Par chantier
              </Button>
              <Button
                type={planningView === 'dis' ? 'primary' : 'default'}
                onClick={() => setPlanningView('dis')}
              >
                Par DIs
              </Button>
            </Space.Compact>
          </div>
          {planningView === 'chantiers' ? (
            <GanttChart chantiers={chantiers
              .filter(c => c.statut !== 'archive')
              .sort((a, b) => {
                const parse = s => s ? dayjs(s, 'DD/MM/YYYY') : null;
                const da = parse(a.debut), db = parse(b.debut);
                if (!da && !db) return 0;
                if (!da) return 1;
                if (!db) return -1;
                return da.valueOf() - db.valueOf();
              })} onRefresh={load} />
          ) : (
            <DIGanttChart dis={dis} />
          )}
        </div>
      );
      case 'personnel': return <PersonnelScreen onRefresh={load} />;
      default: return <Accueil />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header style={{ padding: '0 24px', backgroundColor: 'var(--color-primary)' }}>
        <Flex justify="space-between" align="center">
          <Image src="/logo.png" alt="Logo" width={50} height={50} style={{ padding: 0, margin: 0 }} />
          <h1 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Chantiers</h1>
          <DrawerNew onAction={handleCreate} />
        </Flex>
      </Header>

      <Layout style={{ flex: 1, minHeight: 0, backgroundColor: 'var(--color-background)' }}>
        <Sider breakpoint="lg" collapsedWidth="0">
          <Menu
            selectedKeys={[selected]}
            onClick={({ key }) => setSelected(key)}
            mode="inline"
            items={items}
            style={{ padding: '30px 0', height: '100%' }}
          />
        </Sider>

        <Layout>
          <Content className="m-0 overflow-auto h-full">
            <div className="bg-white m-12 rounded-lg relative">
              {renderScreen()}
            </div>
          </Content>
          <Footer style={{ textAlign: 'center', backgroundColor: 'var(--color-secondary)' }}>
            Reve Apps ©{new Date().getFullYear()} Created by J. Affolter
          </Footer>
        </Layout>
      </Layout>

      <DrawerEdit
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleUpdate}
      />
    </Layout>
  );
}
