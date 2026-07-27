// ── Chantiers ─────────────────────────────────────────────────────────────────

export async function fetchChantiers() {
  const res = await fetch("/api/chantiers");
  return res.json();
}

export async function createChantier(data) {
  const res = await fetch("/api/chantiers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateChantierStatut(id, statut) {
  const res = await fetch(`/api/chantiers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut }),
  });
  return res.json();
}

export async function updateChantier(id, data) {
  const res = await fetch(`/api/chantiers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }
  return res.json();
}

export async function deleteChantier(id) {
  const res = await fetch(`/api/chantiers/${id}`, { method: "DELETE" });
  return res.json();
}

// ── Personnel ─────────────────────────────────────────────────────────────────

export async function fetchPersonnel() {
  const res = await fetch("/api/personnel");
  return res.json();
}

export async function createPersonnel(data) {
  const res = await fetch("/api/personnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updatePersonnel(id, data) {
  const res = await fetch(`/api/personnel/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deletePersonnel(id) {
  const res = await fetch(`/api/personnel/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }
  return res.json();
}

// ── Equipes ───────────────────────────────────────────────────────────────────

export async function fetchEquipes() {
  const res = await fetch("/api/equipes");
  return res.json();
}

export async function createEquipe(nom) {
  const res = await fetch("/api/equipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }
  return res.json();
}

// ── Assignations ──────────────────────────────────────────────────────────────

export async function fetchAssignations(chantierId) {
  const res = await fetch(`/api/chantiers/${chantierId}/assignations`);
  return res.json(); // returns personnelId[]
}

export async function syncAssignations(chantierId, personnelIds) {
  const res = await fetch(`/api/chantiers/${chantierId}/assignations`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personnelIds }),
  });
  return res.json();
}

// ── DIs ───────────────────────────────────────────────────────────────────────

export async function fetchDIs(chantierId) {
  const res = await fetch(`/api/dis?chantierId=${chantierId}`);
  return res.json();
}

export async function fetchAllDIs() {
  const res = await fetch(`/api/dis`);
  return res.json();
}

export async function createDI(data) {
  const res = await fetch("/api/dis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateDI(id, data) {
  const res = await fetch(`/api/dis/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteDI(id) {
  const res = await fetch(`/api/dis/${id}`, { method: "DELETE" });
  return res.json();
}
