import { prisma } from "../../../lib/prisma";

// GET /api/dis?chantierId=X
export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const chantierId = Number(searchParams.get("chantierId"));

  if (!chantierId) {
    return new Response(JSON.stringify({ error: "chantierId est requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const dis = await prisma.dI.findMany({
    where: { chantierId },
    orderBy: { date: "asc" },
    include: { personnel: true },
  });

  return new Response(JSON.stringify(dis), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();
  const nom_client = data?.nom_client?.trim();
  const date = data?.date?.trim() || null;
  const chantierId = Number(data?.chantierId);
  const numero_box = data?.numero_box?.trim() || null;
  const heure = data?.heure?.trim() || null;
  const telephone = data?.telephone?.trim() || null;
  const personnelId = data?.personnelId ? Number(data.personnelId) : null;
  const planifie = Boolean(data?.planifie ?? false);

  if (!nom_client || !chantierId) {
    return new Response(JSON.stringify({ error: "nom_client et chantierId sont requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const created = await prisma.dI.create({
      data: { nom_client, date, chantierId, numero_box, heure, telephone, personnelId, planifie },
      include: { personnel: true },
    });
    return new Response(JSON.stringify(created), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in POST /api/dis:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la création" }), { status: 500 });
  }
};
