import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AQL Terminal | Aerospike Cluster Manager",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
