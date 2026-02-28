import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Record Browser | Aerospike Cluster Manager",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
