"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";

import { uploadPropertyDocument, deletePropertyDocument } from "@/lib/db/mutations/properties";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { PropertyDocument } from "@/lib/db/queries/properties";

const docTypeOptions = [
  { value: "title_doc", label: "Title Document" },
  { value: "survey_plan", label: "Survey Plan" },
  { value: "deed", label: "Deed" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "other", label: "Other" },
];

export function DocumentUploadPanel({
  propertyId,
  documents,
}: {
  propertyId: string;
  documents: PropertyDocument[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("other");
  const [label, setLabel] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.set("propertyId", propertyId);
    formData.set("document", file);
    formData.set("docType", docType);
    formData.set("label", label);

    await uploadPropertyDocument(formData);
    setUploading(false);
    setLabel("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDownload(docId: string, docLabel: string | null) {
    const a = document.createElement("a");
    a.href = `/api/documents/${docId}`;
    a.download = docLabel ?? "document";
    a.click();
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-ink">Documents</h2>
      <p className="mt-1 text-xs text-ink-muted">
        Private — only visible to you. Title deeds, survey plans, offer letters.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="h-9 text-sm"
        >
          {docTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="h-9 text-sm"
        />
        <div>
          <input
            ref={inputRef}
            id="doc-upload"
            type="file"
            accept=".pdf,image/jpeg,image/png"
            className="sr-only"
            onChange={handleFile}
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading…" : "Upload document"}
          </Button>
        </div>
      </div>

      {documents.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="h-4 w-4 shrink-0 text-ink-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {doc.label ?? docTypeOptions.find((o) => o.value === doc.docType)?.label ?? doc.docType}
                </p>
                <p className="text-xs text-ink-muted capitalize">{doc.docType.replace(/_/g, " ")}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(doc.id, doc.label)}
                  className="text-xs font-medium text-primary hover:text-primary-hover"
                >
                  Download
                </button>
                <form>
                  <input type="hidden" name="docId" value={doc.id} />
                  <input type="hidden" name="storagePath" value={doc.storagePath} />
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <button
                    type="submit"
                    formAction={deletePropertyDocument}
                    className="text-status-lost hover:text-status-lost/80"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {documents.length === 0 && (
        <p className="mt-3 text-sm text-ink-muted">No documents uploaded yet.</p>
      )}
    </div>
  );
}
