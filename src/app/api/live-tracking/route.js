import { NextResponse } from "next/server";

if (!global.sseClients) {
  global.sseClients = new Set();
}

if (!global.lastTruckPositions) {
  global.lastTruckPositions = {};
}

export async function GET(req) {
  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Envoi standardisé compatible avec source.onmessage et les eventListeners
  const sendEvent = (clientWriter, eventName, data) => {
    try {
      const payload = { streamType: eventName, ...data };
      clientWriter.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    } catch (err) {
      console.error("Erreur d'écriture SSE, déconnexion.");
    }
  };

  const clientObj = { writer, sendEvent };
  global.sseClients.add(clientObj);

  // Événement d'initialisation des positions camions
  if (Object.keys(global.lastTruckPositions).length > 0) {
    sendEvent(writer, "init-trucks", { trucks: global.lastTruckPositions });
  }

  const responseHeaders = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });

  req.signal.addEventListener("abort", () => {
    global.sseClients.delete(clientObj);
    writer.close();
  });

  return new NextResponse(responseStream.readable, {
    headers: responseHeaders,
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { streamType, ...payload } = body;

    if (!streamType) {
      return NextResponse.json({ success: false, error: "streamType manquant" }, { status: 400 });
    }

    if (streamType === "truck-move" && payload.truckId) {
      global.lastTruckPositions[payload.truckId] = {
        pos: payload.currentPos,
        planningId: payload.planningId,
        updatedAt: new Date()
      };
    }

    // On re-transmet l'événement à tous les écouteurs connectés (Users, Videurs, Admins)
    global.sseClients.forEach((client) => {
      client.sendEvent(client.writer, streamType, payload);
    });

    return NextResponse.json({ success: true, listenersCount: global.sseClients.size });

  } catch (error) {
    console.error("Erreur dans le diffuseur de flux SSE:", error);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}