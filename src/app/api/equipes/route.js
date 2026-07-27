import { prisma } from "../../../lib/prisma";

export const GET = async () => {
  const equipes = await prisma.equipe.findMany({
    orderBy: { nom: "asc" },
  });

  return new Response(JSON.stringify(equipes), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();
  const nom = data?.nom?.trim();

  if (!nom) {
    return new Response(JSON.stringify({ error: "nom est requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const created = await prisma.equipe.create({ data: { nom } });
    return new Response(JSON.stringify(created), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err.code === "P2002") {
      return new Response(JSON.stringify({ error: "Cette équipe existe déjà" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("Error in POST /api/equipes:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la création" }), { status: 500 });
  }
};
