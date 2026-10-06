import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { properties, propertyDocuments } from "@/lib/db/schema";
import { getPublicUrl } from "@/lib/storage/blob";
import { getAuthContext } from "@/lib/auth/user";

/**
 * Authenticated document download.
 * Verifies the document belongs to the signed-in agent, then streams the blob
 * so the underlying storage URL is never exposed to the client.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAuthContext();
  if (!context) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  let doc:
    | { storagePath: string; label: string | null; docType: string }
    | undefined;

  try {
    [doc] = await db
      .select({
        storagePath: propertyDocuments.storagePath,
        label: propertyDocuments.label,
        docType: propertyDocuments.docType,
      })
      .from(propertyDocuments)
      .innerJoin(properties, eq(propertyDocuments.propertyId, properties.id))
      .where(
        and(
          eq(propertyDocuments.id, id),
          eq(properties.agentId, context.workspaceId),
        ),
      )
      .limit(1);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  const upstream = await fetch(getPublicUrl(doc.storagePath));
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("File unavailable", { status: 502 });
  }

  const filename = (doc.label ?? doc.docType ?? "document").replace(/["\r\n]/g, "");

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
