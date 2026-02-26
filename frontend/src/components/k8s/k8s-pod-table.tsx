import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { K8sPodStatus } from "@/lib/api/types";

interface K8sPodTableProps {
  pods: K8sPodStatus[];
}

export function K8sPodTable({ pods }: K8sPodTableProps) {
  if (pods.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">No pods found</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th scope="col" className="px-4 py-2 text-left font-medium">
              Name
            </th>
            <th scope="col" className="px-4 py-2 text-left font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-2 text-left font-medium">
              Pod IP
            </th>
            <th scope="col" className="px-4 py-2 text-left font-medium">
              Host IP
            </th>
            <th scope="col" className="px-4 py-2 text-left font-medium">
              Image
            </th>
          </tr>
        </thead>
        <tbody>
          {pods.map((pod) => (
            <tr key={pod.name} className="border-b last:border-0">
              <td className="px-4 py-2 font-mono text-xs">{pod.name}</td>
              <td className="px-4 py-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px]",
                    pod.isReady
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-warning/10 text-warning border-warning/20",
                  )}
                >
                  {pod.isReady ? "Ready" : pod.phase}
                </Badge>
              </td>
              <td className="px-4 py-2 font-mono text-xs">{pod.podIP || "-"}</td>
              <td className="px-4 py-2 font-mono text-xs">{pod.hostIP || "-"}</td>
              <td className="px-4 py-2 font-mono text-xs">{pod.image || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
