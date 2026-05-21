import { Metadata } from "next";

export default function RobotsTxt() {
  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: {
      index: true,
      follow: true,
    },
  };
}
