import { prisma } from "../../../../lib/prisma";

export const PUT = async (req, { params }) => {
  const { id } = params;
  const data = await req.json();

  const updateData = {};
  if (data.nom_client !== undefined) updateData.nom_client = data.nom_client.trim();
  if (data.numero_box !== undefined) updateData.numero_box = data.numero_box?.trim() || null;
  if (data.date !== undefined) updateData.date = data.date?.trim() || null;
  if (data.heure !== undefined) updateData.heure = data.heure?.trim() || null;
  if (data.telephone !== undefined) updateData.telephone = data.telephone?.trim() || null;
  if (data.personnelId !== undefined) updateData.personnelId = data.personnelId ? Number(data.personnelId) : null;
  if (data.planifie !== undefined) updateData.planifie = Boolean(data.planifie);

  try {
    const updated = await prisma.dI.update({
      where: { id: Number(id) },
      data: updateData,
      include: { personnel: true },
    });
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in PUT /api/dis/[id]:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour" }), { status: 500 });
  }
};

export const DELETE = async (req, { params }) => {
  const { id } = params;

  try {
    await prisma.dI.delete({ where: { id: Number(id) } });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in DELETE /api/dis/[id]:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la suppression" }), { status: 500 });
  }
};
