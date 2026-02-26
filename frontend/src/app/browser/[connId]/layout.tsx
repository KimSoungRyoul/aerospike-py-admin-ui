import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Record Browser | Aerospike Admin",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
