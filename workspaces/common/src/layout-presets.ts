import { LayoutDefinition, LayoutLink, LayoutPlace, LayoutState } from "./layout";

const link = (id: string, labelKey: string, extra: Partial<LayoutLink> = {}): LayoutLink => ({
  id,
  labelKey,
  ...extra,
});

const CORE_NAVBAR: LayoutLink[] = [
  link("servers", "header.servers", { to: "/servers", icon: "bx bx-server" }),
  link("forum", "header.forum", { configLink: "public_link_forum", icon: "bx bx-chat" }),
  link("rules", "header.rules", { to: "/page/rules", icon: "bx bx-paperclip" }),
  link("donate", "header.donate", { to: "/donate", icon: "bx bx-donate-heart" }),
];

const CORE_FOOTER: LayoutLink[] = [
  link("home", "header.home", { to: "/", icon: "bx bx-home" }),
  link("servers", "header.servers", { to: "/servers", icon: "bx bx-server" }),
  link("forum", "header.forum", { configLink: "public_link_forum", icon: "bx bx-chat" }),
  link("rules", "header.rules", { to: "/page/rules", icon: "bx bx-paperclip" }),
  link("donate", "header.donate", { to: "/donate", icon: "bx bx-donate-heart" }),
  link("start", "header.start", { to: "/start", icon: "bx bx-play" }),
  link("download", "header.download", { to: "/start", icon: "bx bxl-windows" }),
];

const builder = (rows: LayoutDefinition["rows"]): LayoutDefinition => ({ mode: "builder", rows, html: "" });

export const DEFAULT_HEADER: LayoutDefinition = builder([
  {
    id: "main",
    align: "between",
    blocks: [
      { id: "logo", type: "logo", size: 64 },
      { id: "nav", type: "nav", links: CORE_NAVBAR, hideOn: ["mobile"] },
      { id: "spacer", type: "spacer", grow: true },
      { id: "login", type: "login" },
      { id: "launcher", type: "launcher" },
      { id: "locale", type: "locale", hideOn: ["mobile"] },
      { id: "theme", type: "theme", hideOn: ["mobile"] },
    ],
  },
]);

const ABOUT_TEXT = {
  ru: "<h3>© {{year}} {{sitename}}</h3><p>Все права защищены. Копирование материалов сайта запрещено. Мы предоставляем ознакомительный и бесплатный вариант игры <a href=\"https://www.minecraft.net\" target=\"_blank\">Minecraft</a>.</p>",
  en: "<h3>© {{year}} {{sitename}}</h3><p>All rights reserved. Copying site materials is prohibited. We provide a free trial version of <a href=\"https://www.minecraft.net\" target=\"_blank\">Minecraft</a>.</p>",
};

const NAV_TITLE = { ru: "Навигация", en: "Navigation" };

const DOCS_TITLE = { ru: "Документы", en: "Documents" };

const SOCIALS_TITLE = { ru: "Мы в соцсетях", en: "Follow us" };

const NOTICE_TEXT = {
  ru: "<p>Здесь можно разместить объявление: акцию, новость или ссылку на важную страницу.</p>",
  en: "<p>Use this strip for an announcement: a sale, a news item or a link to an important page.</p>",
};

export const DEFAULT_FOOTER: LayoutDefinition = builder([
  {
    id: "main",
    align: "start",
    blocks: [
      { id: "logo", type: "image", image: "/icon.png", size: 100, href: "/" },
      { id: "about", type: "text", grow: true, text: ABOUT_TEXT },
      { id: "nav", type: "nav", grow: true, columns: 2, links: CORE_FOOTER, title: NAV_TITLE },
    ],
  },
]);

export const DEFAULT_LAYOUT: LayoutState = { header: DEFAULT_HEADER, footer: DEFAULT_FOOTER };

export interface LayoutPreset {
  id: string;
  place: LayoutPlace;
  name: string;
  definition: LayoutDefinition;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { id: "header.classic", place: "header", name: "layout.preset_header_classic", definition: DEFAULT_HEADER },
  {
    id: "header.centered",
    place: "header",
    name: "layout.preset_header_centered",
    definition: builder([
      {
        id: "main",
        align: "between",
        blocks: [
          { id: "logo", type: "logo", size: 56 },
          { id: "spacer-left", type: "spacer", grow: true },
          { id: "nav", type: "nav", links: CORE_NAVBAR, hideOn: ["mobile"] },
          { id: "spacer-right", type: "spacer", grow: true },
          { id: "login", type: "login" },
          { id: "locale", type: "locale", hideOn: ["mobile"] },
          { id: "theme", type: "theme", hideOn: ["mobile"] },
        ],
      },
    ]),
  },
  {
    id: "header.compact",
    place: "header",
    name: "layout.preset_header_compact",
    definition: builder([
      {
        id: "main",
        align: "between",
        blocks: [
          { id: "logo", type: "logo", size: 48 },
          { id: "spacer", type: "spacer", grow: true },
          { id: "launcher", type: "launcher" },
          { id: "login", type: "login" },
        ],
      },
    ]),
  },
  {
    id: "header.promo",
    place: "header",
    name: "layout.preset_header_promo",
    definition: builder([
      {
        id: "top",
        align: "center",
        blocks: [{ id: "notice", type: "text", text: NOTICE_TEXT }],
      },
      {
        id: "main",
        align: "between",
        blocks: [
          { id: "logo", type: "logo", size: 64 },
          { id: "nav", type: "nav", links: CORE_NAVBAR, hideOn: ["mobile"] },
          { id: "spacer", type: "spacer", grow: true },
          { id: "online", type: "online", hideOn: ["mobile"] },
          { id: "login", type: "login" },
          { id: "launcher", type: "launcher" },
          { id: "locale", type: "locale", hideOn: ["mobile"] },
          { id: "theme", type: "theme", hideOn: ["mobile"] },
        ],
      },
    ]),
  },
  { id: "footer.classic", place: "footer", name: "layout.preset_footer_classic", definition: DEFAULT_FOOTER },
  {
    id: "footer.columns",
    place: "footer",
    name: "layout.preset_footer_columns",
    definition: builder([
      {
        id: "main",
        align: "start",
        blocks: [
          { id: "about", type: "text", grow: true, text: ABOUT_TEXT },
          { id: "nav", type: "nav", grow: true, links: CORE_FOOTER.slice(0, 4), title: NAV_TITLE },
          { id: "docs", type: "nav", grow: true, links: [], title: DOCS_TITLE },
          { id: "socials", type: "icons", grow: true, links: [], title: SOCIALS_TITLE },
        ],
      },
      {
        id: "bottom",
        align: "between",
        blocks: [
          { id: "copyright", type: "text", text: { ru: "© {{year}} {{sitename}}", en: "© {{year}} {{sitename}}" } },
          { id: "banners", type: "icons", links: [] },
        ],
      },
    ]),
  },
  {
    id: "footer.minimal",
    place: "footer",
    name: "layout.preset_footer_minimal",
    definition: builder([
      {
        id: "main",
        align: "between",
        blocks: [
          { id: "copyright", type: "text", text: { ru: "© {{year}} {{sitename}}", en: "© {{year}} {{sitename}}" } },
          { id: "nav", type: "nav", links: CORE_FOOTER.slice(0, 4) },
        ],
      },
    ]),
  },
  {
    id: "footer.payments",
    place: "footer",
    name: "layout.preset_footer_payments",
    definition: builder([
      {
        id: "main",
        align: "start",
        blocks: [
          { id: "logo", type: "image", image: "/icon.png", size: 90, href: "/" },
          { id: "about", type: "text", grow: true, text: ABOUT_TEXT },
          { id: "nav", type: "nav", grow: true, columns: 2, links: CORE_FOOTER, title: NAV_TITLE },
        ],
      },
      {
        id: "legal",
        align: "between",
        blocks: [
          { id: "docs", type: "nav", links: [] },
          { id: "payments", type: "icons", links: [] },
        ],
      },
    ]),
  },
];

export const layoutPresets = (place: LayoutPlace): LayoutPreset[] => LAYOUT_PRESETS.filter((preset) => preset.place === place);
