/* 2027 astrological reflection calendar. Not evidence-based prediction; no health or financial advice. */
window.KtoForecast2027=(function(){
  'use strict';
  const X=window.VektorAstro;
  const transitKeys=['jupiter','saturn','uranus','neptune','pluto'];
  const planetNames={jupiter:'Юпитер',saturn:'Сатурн',uranus:'Уран',neptune:'Нептун',pluto:'Плутон'};
  const natalNames={sun:'Солнцу',moon:'Луне',mercury:'Меркурию',venus:'Венере',mars:'Марсу',jupiter:'Юпитеру',saturn:'Сатурну',asc:'Асценденту',mc:'MC'};
  const aspects=[{a:0,n:'соединение',what:'новый акцент'},{a:60,n:'секстиль',what:'возможность попробовать'},{a:90,n:'квадрат',what:'необходимость пересмотра'},{a:120,n:'трин',what:'более лёгкое проявление'},{a:180,n:'оппозиция',what:'поиск баланса'}];
  const months=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
  const areas=[
    {id:'self',title:'Личная сфера',desc:'Самоопределение, ценности, новый опыт',houses:[1,4,9],targets:['sun','asc','moon','jupiter'],task:'Проверь, какие цели действительно твои, а какие ты продолжаешь по инерции.'},
    {id:'money',title:'Деньги',desc:'Ресурсы, привычки обращения с деньгами',houses:[2,8],targets:['venus','jupiter','saturn'],task:'Пересмотри бюджет и критерии крупных решений. Астрологические трактовки — не основание для инвестиций.'},
    {id:'career',title:'Карьера',desc:'Работа, статус, профессиональная роль',houses:[10,6],targets:['mc','sun','saturn','mercury'],task:'Проверь спрос на навык или проект реальным разговором и измеримым действием.'},
    {id:'wellbeing',title:'Самочувствие',desc:'Ритм, нагрузка, восстановление',houses:[6,12],targets:['moon','mars','sun'],task:'Наблюдай за нагрузкой, сном и восстановлением. Медицинские вопросы решай со специалистом.'},
    {id:'love',title:'Любовь',desc:'Романтика, привязанность, близость',houses:[5,7],targets:['venus','moon','mars'],task:'Заметь, какие поступки помогают чувствовать близость, и обсуди это с партнёром.'},
    {id:'relationships',title:'Отношения',desc:'Партнёрство, договорённости, сотрудничество',houses:[7,3,11],targets:['venus','mercury','moon','asc'],task:'Выбери один важный разговор и сформулируй свою потребность без догадок о другом человеке.'}
  ];
  const round=x=>Math.round(x*10)/10;
  const pos=(lon)=>({sign:Math.floor(((lon%360)+360)%360/30),deg:round((((lon%360)+360)%360)%30)});
  const separation=(a,b)=>{let d=Math.abs(((a-b+540)%360)-180);return d};
  function forecast(chart){
    if(!chart||!chart.planets||!chart.planets.sun)return null;
    const natal={};
    for(const k of ['sun','moon','mercury','venus','mars','jupiter','saturn'])if(chart.planets[k]&&Number.isFinite(chart.planets[k].lon))natal[k]=chart.planets[k].lon;
    if(chart.asc&&Number.isFinite(chart.asc.lon))natal.asc=chart.asc.lon;
    if(chart.mc&&Number.isFinite(chart.mc.lon))natal.mc=chart.mc.lon;
    const events=new Map(),trends=[];
    for(let day=0;day<365;day+=7){
      const date=new Date(Date.UTC(2027,0,1+day,12));
      for(const tk of transitKeys){
        const lon=X.longitude(tk,date),house=chart.cusps?X.houseOf(lon,chart.cusps):null;
        const current=pos(lon);
        if(day%28===0)trends.push({date:date.toISOString(),planet:tk,lon,house,sign:current.sign});
        for(const [nk,nlon] of Object.entries(natal)){
          const diff=separation(lon,nlon);
          for(const aspect of aspects){
            const orb=Math.abs(diff-aspect.a);
            if(orb>3)continue;
            const key=tk+'/'+nk+'/'+aspect.a;
            if(!events.has(key)||events.get(key).orb>orb){
              events.set(key,{key,planet:tk,target:nk,aspect:aspect.n,tone:aspect.what,orb:round(orb),month:date.getUTCMonth(),date:date.toISOString(),transitSign:current.sign,natalSign:pos(nlon).sign,house});
            }
          }
        }
      }
    }
    const all=[...events.values()];
    const sector=areas.map(area=>{
      const scored=all.map(e=>{
        const targetMatch=area.targets.includes(e.target);
        const houseMatch=e.house!=null&&area.houses.includes(e.house);
        const matches=(targetMatch?2.5:0)+(houseMatch?2.8:0);
        return {...e,score:matches+(3-e.orb)*.3+(e.planet==='jupiter'||e.planet==='saturn'?.4:0)};
      }).filter(e=>e.score>=2.4).sort((a,b)=>b.score-a.score);
      const selected=[], used=new Set();
      for(const e of scored)if(!used.has(e.planet)&&selected.length<3){selected.push(e);used.add(e.planet)}
      if(selected.length<2)for(const e of scored)if(!selected.some(x=>x.key===e.key)&&selected.length<3)selected.push(e);
      if(!selected.length)for(const e of all.sort((a,b)=>a.orb-b.orb).slice(0,2))selected.push({...e,notSectorSpecific:true});
      selected.sort((a,b)=>a.month-b.month);
      return {...area,events:selected};
    });
    return {year:2027,hasHouses:!!chart.cusps,areas:sector,trendCount:trends.length,notes:['Расчёт положения транзитных планет выполнен астрономической библиотекой.','Аспекты найдены с недельным шагом: месяцы приблизительны.','Интерпретации астрологические, не научные прогнозы конкретных событий.']};
  }
  return {forecast,months,planetNames,natalNames,aspects};
})();
