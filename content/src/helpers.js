"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const coin=p=>Math.random()<p;
const strip=h=>String(h).replace(/<sup>(.*?)<\/sup>/g,"^$1").replace(/<sub>(.*?)<\/sub>/g,"_$1").replace(/<[^>]+>/g,"");
const neg=n=>n<0?"−"+Math.abs(n):String(n);
const r2=x=>Math.round(x*100)/100;

/* ---------- UTU facts (sources: uktech.ac.in syllabus + ordinances, checked 29 Sep 2026) ---------- */
