import type { ReactNode } from "react";
import { I18nProvider } from "../ui/i18n";
import { AppToastProvider } from "../ui/toast";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AppToastProvider>{children}</AppToastProvider>
    </I18nProvider>
  );
}
