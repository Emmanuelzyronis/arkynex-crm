
import { getLeads } from "@/lib/db/queries/leads";
import { getDeals } from "@/lib/db/queries/deals";
import { getAuthContext } from "@/lib/auth/user";

type Cell = string | number | boolean | null | undefined;

function toCsv(rows: Cell[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? "" : String(cell);
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    )
    .join("\n");
}

function csvResponse(rows: Cell[][], filename: string): Response {
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  const context = await getAuthContext();
  if (!context) return new Response("Unauthorized", { status: 401 });
  const workspaceId = context.workspaceId;

  const { entity } = await params;
  const stamp = new Date().toISOString().slice(0, 10);

  if (entity === "leads") {
    const leads = await getLeads(workspaceId);
    const rows: Cell[][] = [
      ["Name", "Phone", "Email", "Stage", "Score", "Source", "Property type", "Bedrooms", "Budget min", "Budget max", "Created"],
      ...leads.map((lead) => [
        lead.fullName,
        lead.phone,
        lead.email,
        lead.stage,
        lead.score,
        lead.source,
        lead.propertyType,
        lead.bedrooms,
        lead.budgetMin,
        lead.budgetMax,
        lead.createdAt instanceof Date ? lead.createdAt.toISOString() : lead.createdAt,
      ]),
    ];
    return csvResponse(rows, `arkynex-leads-${stamp}.csv`);
  }

  if (entity === "deals") {
    const deals = await getDeals(workspaceId);
    const rows: Cell[][] = [
      ["Lead", "Property", "Status", "Asking price", "Agreed price", "Commission amount", "Closing probability", "Expected close", "Created"],
      ...deals.map((deal) => [
        deal.lead?.fullName ?? "",
        deal.property?.title ?? "",
        deal.status,
        deal.askingPrice,
        deal.agreedPrice,
        deal.commissionAmount,
        deal.closingProbability,
        deal.expectedCloseDate,
        deal.createdAt instanceof Date ? deal.createdAt.toISOString() : deal.createdAt,
      ]),
    ];
    return csvResponse(rows, `arkynex-deals-${stamp}.csv`);
  }

  return new Response("Not found", { status: 404 });
}
