import { prisma } from "../../../lib/prisma";

export const GET = async () => {
  const chantiers = await prisma.chantier.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      assignations: { include: { personnel: true } },
      dis: { select: { planifie: true } },
      equipe: true,
    },
  });

  const result = chantiers.map(({ assignations, dis, ...c }) => ({
    ...c,
    personnel: assignations.map(a => a.personnel),
    dis_total: dis.length,
    dis_planifiees: dis.filter(d => d.planifie).length,
  }));

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();
  const adresse = data?.adresse?.trim();
  const code_postal = data?.code_postal?.trim();
  const ville = data?.ville?.trim();
  const type = data?.type?.trim();
  const telephone = data?.telephone?.trim();
  const statut = "en-cours";
  const numero_affaire = data?.numero_affaire?.trim() || null;
  const debut = data?.debut?.trim() || null;
  const fin = data?.fin?.trim() || null;
  const equipeId = data?.equipeId ? Number(data.equipeId) : null;

  if (!adresse || !code_postal || !ville || !type || !telephone) {
    return new Response(JSON.stringify({ error: "adresse, code_postal, ville, type et telephone sont requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const chantier = await prisma.chantier.create({
      data: { adresse, code_postal, ville, type, telephone, statut, numero_affaire, debut, fin, equipeId },
      include: { equipe: true },
    });

    return new Response(JSON.stringify(chantier), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in POST /api/chantiers:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la création du chantier" }), {
      status: 500,
    });
  }
};
