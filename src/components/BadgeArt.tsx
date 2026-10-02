import { ArtBolt, ArtBrain, ArtFlame, ArtMedal, ArtRocket, ArtStar, ArtTarget, ArtTrophy } from "@/components/art";
import type { Badge } from "@/lib/insights";

const MAP = { star: ArtStar, trophy: ArtTrophy, medal: ArtMedal, bolt: ArtBolt, flame: ArtFlame, rocket: ArtRocket, brain: ArtBrain, target: ArtTarget } as const;
export const BadgeArt = ({ art, size }: { art: Badge["art"]; size?: number }) => { const A = MAP[art]; return <A size={size} />; };
