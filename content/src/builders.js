function mcq(q,ans,distract,why){const set=[String(ans)];for(const d of distract){const s=String(d);if(!set.includes(s)&&set.length<4)set.push(s)}let k=1;while(set.length<4){const s=String((typeof ans==="number"?ans:0)+k*7+1);if(!set.includes(s))set.push(s);k++}const o=shuffle(set);return {type:"mcq",q,o,a:o.indexOf(String(ans)),why}}
function nat(q,ans,why){return {type:"nat",q,a:ans,why}}
function msq(q,right,wrong,why){const it=shuffle([...right.map(t=>({t,r:1})),...wrong.map(t=>({t,r:0}))]);return {type:"msq",q,o:it.map(x=>x.t),a:it.map((x,i)=>x.r?i:-1).filter(i=>i>=0),why}}
const either=(p,a,b)=>coin(p)?a():b();
