import { prisma } from "../../../lib/prisma";

export const GET = async () => {
  const personnel = await prisma.personnel.findMany({
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    include: { equipes: true },
  });

  return new Response(JSON.stringify(personnel), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();
  const prenom = data?.prenom?.trim();
  const nom = data?.nom?.trim();
  const equipeIds = Array.isArray(data?.equipeIds) ? data.equipeIds.map(Number) : [];

  if (!prenom || !nom) {
    return new Response(JSON.stringify({ error: "prenom et nom sont requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const created = await prisma.personnel.create({
      data: {
        prenom,
        nom,
        equipes: { connect: equipeIds.map(id => ({ id })) },
      },
      include: { equipes: true },
    });
    return new Response(JSON.stringify(created), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in POST /api/personnel:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la création" }), { status: 500 });
  }
};
