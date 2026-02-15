"use client";

import { use, useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Eye,
  Play,
  Upload,
  FileCode,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { CodeEditor } from "@/components/common/code-editor";
import { api } from "@/lib/api/client";
import type { UDFModule } from "@/lib/api/types";
import { truncateMiddle } from "@/lib/formatters";
import { toast } from "sonner";

export default function UDFsPage({
  params,
}: {
  params: Promise<{ connId: string }>;
}) {
  const { connId } = use(params);
  const [udfs, setUdfs] = useState<UDFModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFilename, setUploadFilename] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploading, setUploading] = useState(false);

  // View source dialog
  const [viewSource, setViewSource] = useState<UDFModule | null>(null);

  // Apply UDF dialog
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyModule, setApplyModule] = useState("");
  const [applyNs, setApplyNs] = useState("");
  const [applySet, setApplySet] = useState("");
  const [applyPK, setApplyPK] = useState("");
  const [applyFunction, setApplyFunction] = useState("");
  const [applyArgs, setApplyArgs] = useState("[]");
  const [applying, setApplying] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<UDFModule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUDFs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUDFs(connId);
      setUdfs(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [connId]);

  useEffect(() => {
    fetchUDFs();
  }, [fetchUDFs]);

  const handleUpload = async () => {
    if (!uploadFilename.trim() || !uploadContent.trim()) {
      toast.error("Filename and content are required");
      return;
    }
    setUploading(true);
    try {
      await api.uploadUDF(connId, {
        filename: uploadFilename.trim(),
        content: uploadContent,
        type: "LUA",
      });
      toast.success("UDF uploaded");
      setUploadOpen(false);
      setUploadFilename("");
      setUploadContent("");
      await fetchUDFs();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".lua";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      setUploadFilename(file.name);
      setUploadContent(text);
      setUploadOpen(true);
    };
    input.click();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteUDF(connId, deleteTarget.filename);
      toast.success("UDF deleted");
      setDeleteTarget(null);
      await fetchUDFs();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleApply = async () => {
    if (!applyNs.trim() || !applyPK.trim() || !applyFunction.trim()) {
      toast.error("Namespace, PK, and function name are required");
      return;
    }
    setApplying(true);
    try {
      let args;
      try {
        args = JSON.parse(applyArgs);
      } catch {
        toast.error("Invalid JSON for arguments");
        setApplying(false);
        return;
      }
      // Use the terminal API to apply the UDF since there's no direct apply endpoint
      const command = `execute ${applyModule}.${applyFunction}(${JSON.stringify(args)}) on ${applyNs}.${applySet || ""} where PK = '${applyPK}'`;
      await api.executeCommand(connId, command);
      toast.success("UDF applied successfully");
      setApplyOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setApplying(false);
    }
  };

  const openApplyDialog = useCallback((udf: UDFModule) => {
    setApplyModule(udf.filename.replace(/\.lua$/, ""));
    setApplyNs("");
    setApplySet("");
    setApplyPK("");
    setApplyFunction("");
    setApplyArgs("[]");
    setApplyOpen(true);
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            UDF Modules
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage User-Defined Functions (Lua scripts)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUDFs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleFileInput}>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
          <Button
            onClick={() => {
              setUploadFilename("");
              setUploadContent("");
              setUploadOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New UDF
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive animate-fade-in">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : udfs.length === 0 ? (
        <EmptyState
          icon={FileCode}
          title="No UDF modules"
          description="Upload a Lua script to register a User-Defined Function."
          action={
            <Button onClick={handleFileInput}>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead className="w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {udfs.map((udf) => (
                <TableRow key={udf.filename}>
                  <TableCell className="font-mono font-medium">
                    {udf.filename}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{udf.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {truncateMiddle(udf.hash, 24)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewSource(udf)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openApplyDialog(udf)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => setDeleteTarget(udf)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Upload / Paste Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Upload UDF Module</DialogTitle>
            <DialogDescription>
              Provide a Lua script filename and content.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 flex-1 overflow-hidden">
            <div className="grid gap-2">
              <Label>Filename</Label>
              <Input
                placeholder="my_module.lua"
                value={uploadFilename}
                onChange={(e) => setUploadFilename(e.target.value)}
              />
            </div>
            <div className="grid gap-2 flex-1 min-h-0">
              <Label>Source Code</Label>
              <div className="h-[300px] rounded-md border overflow-hidden">
                <CodeEditor
                  value={uploadContent}
                  onChange={(v) => setUploadContent(v)}
                  language="lua"
                  height="300px"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                uploading ||
                !uploadFilename.trim() ||
                !uploadContent.trim()
              }
            >
              {uploading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Source Dialog */}
      <Dialog
        open={!!viewSource}
        onOpenChange={(open) => !open && setViewSource(null)}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewSource?.filename}</DialogTitle>
            <DialogDescription>
              Read-only view of the UDF source code.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-md border overflow-hidden">
            <CodeEditor
              value={viewSource?.content ?? "-- Source not available"}
              readOnly
              language="lua"
              height="400px"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Apply UDF Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Apply UDF</DialogTitle>
            <DialogDescription>
              Execute {applyModule} on a specific record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Namespace</Label>
              <Input
                placeholder="test"
                value={applyNs}
                onChange={(e) => setApplyNs(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Set</Label>
              <Input
                placeholder="demo"
                value={applySet}
                onChange={(e) => setApplySet(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Primary Key</Label>
              <Input
                placeholder="key1"
                value={applyPK}
                onChange={(e) => setApplyPK(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Function Name</Label>
              <Input
                placeholder="my_function"
                value={applyFunction}
                onChange={(e) => setApplyFunction(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Arguments (JSON array)</Label>
              <Textarea
                placeholder='["arg1", 42]'
                value={applyArgs}
                onChange={(e) => setApplyArgs(e.target.value)}
                rows={3}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApplyOpen(false)}
              disabled={applying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={
                applying ||
                !applyNs.trim() ||
                !applyPK.trim() ||
                !applyFunction.trim()
              }
            >
              {applying && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete UDF"
        description={`Are you sure you want to delete "${deleteTarget?.filename}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
