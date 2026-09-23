import type { Metadata } from "next";
import HomeContent from "../components/HomeContent";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AutoBrothers | Premium Car Parts & Accessories",
  description:
    "Pakistan's trusted auto parts store — engines, catalytic converters, transmissions, ignition coils. Japan imported, tested & all Pakistan delivery.",
};

export default function ShopHome() {
  return <HomeContent />;
}