import { prisma } from "../../../../lib/prisma";

export const GET = async (req, { params }) => {
  const { id } = params;
  try {
    const chantier = await prisma.chantier.findUnique({
      where: { id: Number(id) },
      include: { assignations: { include: { personnel: true } }, equipe: true },
    });
    if (!chantier) return new Response(JSON.stringify({ error: "Introuvable" }), { status: 404 });
    const { assignations, ...rest } = chantier;
    return new Response(JSON.stringify({ ...rest, personnel: assignations.map(a => a.personnel) }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erreur" }), { status: 500 });
  }
};

export const PUT = async (req, { params }) => {
  const { id } = params;
  const data = await req.json();

  // Statut-only update (archiver/restaurer)
  if (Object.keys(data).length === 1 && data.statut !== undefined) {
    try {
      const updated = await prisma.chantier.update({
        where: { id: Number(id) },
        data: { statut: data.statut },
      });
      return new Response(JSON.stringify(updated), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error in PUT /api/chantiers/[id]:", err);
      return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour" }), { status: 500 });
    }
  }

  // Full update
  const updateData = {};
  if (data.adresse !== undefined)        updateData.adresse = data.adresse.trim();
  if (data.code_postal !== undefined)    updateData.code_postal = data.code_postal.trim();
  if (data.ville !== undefined)          updateData.ville = data.ville.trim();
  if (data.type !== undefined)           updateData.type = data.type.trim();
  if (data.telephone !== undefined)      updateData.telephone = data.telephone.trim();
  if (data.numero_affaire !== undefined) updateData.numero_affaire = data.numero_affaire?.trim() || null;
  if (data.debut !== undefined)          updateData.debut = data.debut?.trim() || null;
  if (data.fin !== undefined)            updateData.fin = data.fin?.trim() || null;
  if (data.equipeId !== undefined)       updateData.equipeId = data.equipeId ? Number(data.equipeId) : null;

  try {
    const updated = await prisma.chantier.update({
      where: { id: Number(id) },
      data: updateData,
      include: { equipe: true },
    });
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in PUT /api/chantiers/[id]:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour" }), { status: 500 });
  }
};

export const DELETE = async (req, { params }) => {
  const { id } = params;

  try {
    await prisma.chantier.delete({ where: { id: Number(id) } });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in DELETE /api/chantiers/[id]:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la suppression" }), { status: 500 });
  }
};
