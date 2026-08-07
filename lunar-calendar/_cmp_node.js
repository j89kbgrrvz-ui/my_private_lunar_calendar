const {Lunar, LunarMonth} = require('lunar-javascript');
function lunarToSolar(year, month, day, leap){
  const m = leap ? -month : month;
  const lm = LunarMonth.fromYm(year, m);
  if(!lm) return null;
  if(day > lm.getDayCount()) return null;
  const l = Lunar.fromYmd(year, m, day);
  const s = l.getSolar();
  return s.getYear()+'-'+String(s.getMonth()).padStart(2,'0')+'-'+String(s.getDay()).padStart(2,'0');
}
const evs = [['yuanxiao',1,15,false],['sanyue',3,3,false],['liuyue',6,6,false]];
const out = [];
for(const [id,m,d,leap] of evs){
  for(let y=2024;y<=2074;y++){
    const v = lunarToSolar(y,m,d,leap);
    out.push(id+'|'+y+'|'+(v||'NULL'));
  }
}
// leap test
out.push('leaptest|2023|'+(lunarToSolar(2023,2,15,true)||'NULL'));
out.push('leaptest|2024|'+(lunarToSolar(2024,2,15,true)||'NULL')); // should be NULL (no leap 2 in 2024)
require('fs').writeFileSync('_node.csv', out.join('\n'));
