import { prisma } from "../../../../lib/prisma";

export const PUT = async (req, { params }) => {
  const { id } = params;
  const data = await req.json();
  const prenom = data?.prenom?.trim();
  const nom = data?.nom?.trim();
  const equipeIds = Array.isArray(data?.equipeIds) ? data.equipeIds.map(Number) : null;

  try {
    const updated = await prisma.personnel.update({
      where: { id: Number(id) },
      data: {
        ...(prenom && { prenom }),
        ...(nom && { nom }),
        ...(equipeIds !== null && { equipes: { set: equipeIds.map(id => ({ id })) } }),
      },
      include: { equipes: true },
    });
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in PUT /api/personnel/[id]:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour" }), { status: 500 });
  }
};

export const DELETE = async (req, { params }) => {
  const { id } = params;
  const personnelId = Number(id);

  try {
    await prisma.$transaction([
      prisma.assignation.deleteMany({ where: { personnelId } }),
      prisma.dI.updateMany({ where: { personnelId }, data: { personnelId: null } }),
      prisma.personnel.delete({ where: { id: personnelId } }),
    ]);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in DELETE /api/personnel/[id]:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la suppression" }), { status: 500 });
  }
};
