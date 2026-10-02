export const Flame = ({ size = 24, off = false }: { size?: number; off?: boolean }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className={off ? "" : "flame"}>
    <path fill={off ? "#c9c9c9" : "#FF9A1F"} d="M12 1.5c1.2 4.2 6 5.8 6 11.7a6 6 0 0 1-12 0c0-2.9 1.4-4.6 2.9-5.8.2 2.3 1.2 3.4 2.3 4C10.8 8.3 10.9 4.9 12 1.5z" />
    {!off && <path fill="#FFC83D" d="M12 12.6c1.8 1.7 3 2.7 3 4.6a3 3 0 0 1-6 0c0-1.6 1.1-2.9 3-4.6z" />}
  </svg>
);
export const Bolt = ({ size = 24 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden><path fill="#FFC83D" stroke="#E0A300" strokeWidth="1.2" strokeLinejoin="round" d="M13.5 1.5 4 14h7l-1.5 8.5L20 10h-7z" /></svg>
);
export const Target = ({ size = 24 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden><circle cx="12" cy="12" r="10.5" fill="#FF5A5F" /><circle cx="12" cy="12" r="7" fill="#fff" /><circle cx="12" cy="12" r="3.6" fill="#FF5A5F" /></svg>
);
const nav = (d: React.ReactNode) => function NavIcon({ size = 26 }: { size?: number }) {
  return <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
};
export const IconHome = nav(<path d="M5 15 16 5l11 10v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM13 27v-8h6v8" />);
export const IconPractice = nav(<><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="5" /></>);
export const IconLabs = nav(<path d="M12 4h8M14 4v8L6 25a2 2 0 0 0 1.8 3h16.4A2 2 0 0 0 26 25l-8-13V4" />);
export const IconLochi = nav(<path d="M6 7h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H14l-6 5v-5H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />);
export const IconProfile = nav(<><circle cx="16" cy="11" r="5" /><path d="M6 27c1-6 5-9 10-9s9 3 10 9" /></>);
export const IconLearn = nav(<path d="M5 6a2 2 0 0 1 2-2h18v20H7a2 2 0 0 0-2 2zM5 26a2 2 0 0 0 2 2h18M11 10h9M11 15h9" />);
