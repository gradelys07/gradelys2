"use client";

import { ToolPage } from "@/components/space/tool-page";
import { useTranslation } from "@/i18n/locale-provider";

export default function VisualizePage() {
  const { t } = useTranslation();
  return <ToolPage kind="visualize" title={t("visualize.title")} description={t("visualize.description")} />;
}
