export type Command = {
    id: string;
    title: string;
    subtitle?: string;
    shortcut?: string;
    group: "Navigate" | "Actions";
    keywords?: string[];
    run: () => void;
  };