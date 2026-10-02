/* ---------- official syllabus data layer (VMSB UTU B.Tech 2022-23 onwards, Sem I & II) ---------- */
const SYL={};            // code -> course record, filled by syl_*.js files
function sylAdd(code,o){SYL[code]=o}
function genAdd(code,units){GEN[code]=GEN[code]||{};Object.keys(units).forEach(u=>{GEN[code][u]=(GEN[code][u]||[]).concat(units[u])})}
function genReplace(code,units){delete GEN[code];genAdd(code,units)}
