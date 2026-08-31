"use client";

import { ToolPage } from "@/components/space/tool-page";
import { useTranslation } from "@/i18n/locale-provider";

export default function StudioPage() {
  const { t } = useTranslation();
  return <ToolPage kind="studio" title={t("studio.title")} description={t("studio.description")} />;
}
