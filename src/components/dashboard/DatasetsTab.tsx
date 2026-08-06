"use client";

import { useState } from "react";
import { FilesTable } from "@/components/files/FilesTable";
import { FileViewerDrawer } from "@/components/files/FileViewerDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function DatasetsTab() {
  const [viewing, setViewing] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stored weather archives</CardTitle>
        <span className="text-xs text-slate-500">Sortable · searchable · paginated</span>
      </CardHeader>
      <CardContent>
        <FilesTable onView={setViewing} />
      </CardContent>
      <FileViewerDrawer filename={viewing} onClose={() => setViewing(null)} />
    </Card>
  );
}
