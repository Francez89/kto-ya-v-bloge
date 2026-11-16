/* KTO YA v2: transparent symbolic synthesis + action plan. Not a diagnostic instrument. */
window.KtoLife=(function(){
 const THEMES={
  initiative:['Инициатива','Проверь, нравится ли тебе начинать и вести: возьми небольшую задачу, предложи первый шаг и оцени результат.'],
  creativity:['Творчество','Сделай небольшой авторский проект за один вечер. Отметь, что тебя увлекло: идея, процесс или реакция людей.'],
  learning:['Исследование','Выбери вопрос, найди три разных источника и объясни вывод человеку простыми словами.'],
  structure:['Структура','Попробуй план на неделю из трёх приоритетов и сравни с привычным способом работы.'],
  freedom:['Свобода','Выдели время на новый опыт без обязательства продолжать. Проверь, что тебя действительно заряжает.'],
  care:['Забота','Помоги человеку с конкретной задачей, сохранив свои границы. Отметь, какие форматы поддержки тебе подходят.'],
  connection:['Связи','Проведи один содержательный разговор с человеком, которого давно хотел узнать лучше.'],
  expression:['Самовыражение','Сформулируй свою позицию в трёх предложениях и поделись ею с человеком, которому доверяешь.'],
  impact:['Результат','Поставь измеримую цель на семь дней и сравни затраченное время с полученным результатом.'],
  stability:['Устойчивость','Выбери один небольшой ритуал, который реально можешь повторять ежедневно.'],
  reflection:['Рефлексия','В течение недели записывай, какие решения дали удовлетворение и какие хотелось бы изменить.']
 };
 const AT={innocent:'stability',explorer:'freedom',sage:'learning',hero:'impact',rebel:'freedom',outlaw:'freedom',magician:'creativity',regular:'connection',everyman:'connection',orphan:'connection',lover:'connection',jester:'expression',caregiver:'care',creator:'creativity',ruler:'structure'};
 const NT={1:'initiative',2:'connection',3:'expression',4:'structure',5:'freedom',6:'care',7:'learning',8:'impact',9:'care',11:'reflection',22:'structure',33:'care'};
 const ZT=['initiative','stability','connection','care','expression','structure','connection','reflection','freedom','impact','creativity','reflection'];
 const HT={generator:'stability',mg:'creativity',manifestor:'initiative',projector:'learning',reflector:'reflection'};
 const MT={1:'initiative',2:'reflection',3:'creativity',4:'structure',5:'learning',6:'connection',7:'impact',8:'structure',9:'learning',10:'freedom',11:'impact',12:'reflection',13:'creativity',14:'stability',15:'impact',16:'freedom',17:'expression',18:'reflection',19:'expression',20:'care',21:'connection',22:'freedom'};
 const LT={goal:'impact',family:'care',habits:'stability',self:'expression',money:'impact',talent:'creativity',spirit:'reflection',temper:'expression'};
 const label=k=>THEMES[k]?.[0]||'Самонаблюдение';
 function synth(p){
   const a=window.VektorArchetypes,d=window.VektorData,n=window.VektorNumer,s=window.VektorSystems,e=window.VektorExtras;
   const layers=[];
   const add=(source,title,description,theme)=>{if(theme&&THEMES[theme])layers.push({source,title,description,theme});};
   if(p.arch){const k=p.arch.top[0],ar=a.A[k];if(ar)add('Архетипы',ar.name,ar.essence,AT[k]||'reflection');}
   if(p.chart){const z=p.chart.planets.sun.sign;add('Натальная карта',d.SIGNS[z].name,d.SIGNS[z].core,ZT[z]);}
   if(p.num){const x=s.NUM[p.num.life];add('Нумерология','Путь '+p.num.life,x?.role||'Тема для размышления',NT[p.num.life]||'reflection');}
   if(p.date){const sq=n.square(p.date),line=n.LINES.slice().sort((a,b)=>sq.lines[b.k]-sq.lines[a.k])[0];add('Квадрат Пифагора',line.name,'Наиболее заполненная линия в этой методике: '+sq.lines[line.k]+' цифр. Это символическая трактовка, не измерение способности.',LT[line.k]);const mx=e.matrix(p.date)[4];add('Матрица судьбы',mx.n+' · '+mx.name,mx.content,MT[mx.n]||'reflection');const red=x=>{while(x>9)x=String(x).split('').reduce((a,b)=>a+Number(b),0);return x;};const conscious=red(Number(p.date.slice(8,10))),mission=red(p.date.replace(/-/g,'').split('').reduce((a,b)=>a+Number(b),0));add('Сюцай','Сознание '+conscious+' · миссия '+mission,'Базовые числа; тема для обсуждения: '+label(NT[conscious])+', '+label(NT[mission])+'.',NT[conscious]||'reflection');}
   if(p.hd)add('Дизайн человека',s.HD_TYPES[p.hd.type].name+' '+p.hd.profile,'Тема этой символической модели: '+label(HT[p.hd.type])+'.',HT[p.hd.type]||'reflection');
   const by={};for(const l of layers)(by[l.theme]||(by[l.theme]=[])).push(l.source);
   const themes=Object.entries(by).sort((a,b)=>b[1].length-a[1].length).map(([k,sources])=>({key:k,title:label(k),sources,experiment:THEMES[k][1]}));
   const tensions=[];for(const [a,b] of [['freedom','structure'],['freedom','stability'],['care','impact'],['reflection','initiative']])if(by[a]&&by[b])tensions.push(label(a)+' ↔ '+label(b));
   return {layers,themes,tensions};
 }
 const ROAD={
 self:['Наблюдай за энергией и интересами','Собери примеры сильных качеств из опыта','Проверь один новый интерес','Сформулируй личные ценности','Выбери привычку для эксперимента','Попроси обратную связь у двух людей','Проверь, что изменилось','Откажись от одной лишней нагрузки','Составь карту поддержки','Выбери небольшой творческий проект','Заверши его и оцени опыт','Определи следующий приоритет','Подведи итоги и обнови цели'],
 career:['Инвентаризация навыков и интересов','Выбери три профессиональные гипотезы','Поговори с людьми из двух направлений','Сделай пробную задачу','Выбери один навык для развития','Создай пример работы','Получишь обратную связь: попроси оценить работу','Уточни критерии подходящей работы','Найди пять подходящих возможностей','Сделай один отклик или предложение','Повтори с учётом реакции','Сравни варианты по своим критериям','Выбери следующее направление'],
 business:['Выбери одну проблему клиента','Проведи пять интервью','Сформулируй понятное предложение','Проверь интерес без разработки','Предложи пилот реальным клиентам','Измерь готовность платить','Доработай продукт по обратной связи','Проверь один канал привлечения','Посчитай затраты и выручку','Улучши воронку по данным','Проверь повторные продажи','Стандартизируй одну задачу','Реши, масштабировать или изменить гипотезу'],
 relationships:['Опиши, чего хочешь от общения','Заметь свои реакции в разговорах','Сформулируй одну личную границу','Потренируй просьбу без обвинений','Спроси близкого о его потребностях','Выдели время на содержательный разговор','Проверь, где вы лучше понимаете друг друга','Заметь, что ты можешь менять сам','Обсуди одну общую цель','Попробуй новый совместный формат','Отмечай конструктивные договорённости','Оцени, что работает','Сформулируй следующий шаг'],
 blog:['Выбери аудиторию и одну проблему','Сними три пробных формата','Оцени реакцию и удержание','Сформулируй позиционирование','Настрой профиль и призыв к действию','Подготовь серию из трёх роликов','Проверь два типа хуков','Собери лид-магнит','Запусти простую воронку','Проверь первое платное предложение','Сравни результаты форматов','Повтори лучший формат','Подведи итоги и выбери план роста']
 };
 function route(goal,theme){const arr=ROAD[goal]||ROAD.self;return arr.map((title,i)=>({week:i+1,title,task:i===0&&theme?theme.experiment:'Выдели 30–60 минут, сделай один конкретный шаг и запиши наблюдаемый результат. В конце недели реши: повторить, изменить или отказаться.'}));}
 return {synth,route};
})();