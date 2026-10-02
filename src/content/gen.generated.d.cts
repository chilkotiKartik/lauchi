export type RawQuestion = { type: "mcq" | "nat" | "msq"; q: string; o?: string[]; a: number | number[]; why: string };
export const GEN: Record<string, Record<string, Array<() => RawQuestion>>>;
export const strip: (html: string) => string;
