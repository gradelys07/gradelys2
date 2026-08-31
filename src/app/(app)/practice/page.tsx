"use client";

import { ToolPage } from "@/components/space/tool-page";
import { useTranslation } from "@/i18n/locale-provider";

export default function PracticePage() {
  const { t } = useTranslation();
  return <ToolPage kind="practice" title={t("practice.title")} description={t("practice.description")} />;
}
