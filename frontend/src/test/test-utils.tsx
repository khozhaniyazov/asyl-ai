import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "../app/AuthContext";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "../i18n/locales/ru.json";
import type { ReactElement, ReactNode } from "react";

// Initialize i18n for tests
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  resources: { ru: { translation: ru } },
  lng: "ru",
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

interface WrapperOptions {
  route?: string;
  withAuth?: boolean;
}

function createWrapper(options: WrapperOptions = {}) {
  const { route = "/", withAuth = true } = options;

  return function Wrapper({ children }: { children: ReactNode }) {
    const content = (
      <I18nextProvider i18n={testI18n}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </I18nextProvider>
    );

    if (withAuth) {
      return <AuthProvider>{content}</AuthProvider>;
    }
    return content;
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options: WrapperOptions & RenderOptions = {}
) {
  const { route, withAuth, ...renderOptions } = options;
  return render(ui, {
    wrapper: createWrapper({ route, withAuth }),
    ...renderOptions,
  });
}

export { testI18n };
