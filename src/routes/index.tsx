import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/features/meta-dashboard/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InstallPulse | Dashboard de App Install" },
      { name: "description", content: "Monitoramento de campanhas de instalação de aplicativo e seus principais resultados." },
      { property: "og:title", content: "InstallPulse | Dashboard de App Install" },
      { property: "og:description", content: "Monitoramento de campanhas de instalação de aplicativo e seus principais resultados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});
