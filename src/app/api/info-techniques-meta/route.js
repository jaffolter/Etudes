import { prisma } from "../../../lib/prisma";


export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id"), 10);

  const contacts = await prisma.infosTechniquesMeta.findMany({
      where: { id },
  });

  return new Response(JSON.stringify(contacts), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();

  // Validate required fields
  if (!data.id || data.parking_idx === undefined || typeof data.id !== 'number') {
    return new Response(JSON.stringify({ error: "ID and parking_idx are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const updated = await prisma.infosTechniquesMeta.upsert({
      where: {
        id_parking_idx: {
          id: data.id,
          parking_idx: data.parking_idx,
        },
      },
      update: data, // Update all fields
      create: {
        id: data.id,
        parking_idx: data.parking_idx,
        description: data.description,
        travees: data.travees,
        nb_percements: data.nb_percements ?? 0,
        avec_etude_structure: data.avec_etude_structure ?? false,
      },
    });
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in POST api/infos-techniques-meta:", err);
    return new Response(JSON.stringify({ error: "Failed to save infos-techniques-meta", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
