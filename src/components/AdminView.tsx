import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type AdminNavigationItem = {
  section: string;
  label: string;
};

type AdminViewProps = {
  activeSection: string;
  navigationItems: AdminNavigationItem[];
  children: ReactNode;
  onBack: () => void;
  onSelectSection: (section: string) => void;
};

export function AdminView({
  activeSection,
  navigationItems,
  children,
  onBack,
  onSelectSection,
}: Readonly<AdminViewProps>) {
  const { t } = useTranslation();

  return (
    <section className="admin-view" aria-labelledby="admin-view-title">
      <div className="admin-view__header">
        <div>
          <p className="admin-view__eyebrow">{t("admin.eyebrow")}</p>
          <h1 id="admin-view-title">{t("admin.viewTitle")}</h1>
        </div>
        <button className="admin-view__back" type="button" onClick={onBack}>
          {t("admin.backToApp")}
        </button>
      </div>

      <nav
        className="admin-navigation"
        aria-label={t("admin.navigation.label")}
      >
        {navigationItems.map((item) => (
          <button
            className="admin-navigation__button"
            type="button"
            key={item.section}
            aria-current={activeSection === item.section ? "page" : undefined}
            onClick={() => onSelectSection(item.section)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="admin-view__content">{children}</div>
    </section>
  );
}
