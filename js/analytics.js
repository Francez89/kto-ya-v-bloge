/* Anonymous product telemetry. Never send birth data, names, free text, raw Telegram identity or test answers. */
(function(){
 const endpoint=window.VektorConfig?.analyticsEndpoint;
 const key='ktoya:analytics-consent';
 const read=(k)=>{try{return localStorage.getItem(k)}catch{return null}};
 const write=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
 const make=()=>crypto.randomUUID();
 let visitor=read('ktoya:visitor')||make(), session=make(), last='', entered=Date.now();
 const params=new URLSearchParams(location.search);
 const clean=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,60);
 const rawSource=clean(params.get('utm_source')||window.Telegram?.WebApp?.initDataUnsafe?.start_param||'direct');
 const incomingCampaign=clean(params.get('utm_campaign'));
 const source=read('ktoya:firstSource')||rawSource||'direct';
 const campaign=read('ktoya:firstCampaign')||incomingCampaign;
 function attribution(){write('ktoya:firstSource',source);write('ktoya:firstCampaign',campaign);}
 const enabled=()=>read(key)==='yes'&&!!endpoint;
 function event(type,section='',detail='',duration=0){
   if(!enabled())return;
   const data={id:make(),visitor,session,type:clean(type),section:clean(section),detail:clean(detail),source,campaign,duration:Math.max(0,Math.min(1800,Math.round(duration)))};
   fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),keepalive:true}).catch(()=>{});
 }
 function screen(name){if(name===last)return;if(last)event('screen_time',last,'',(Date.now()-entered)/1000);last=name;entered=Date.now();event('screen_view',name);}
 function action(name,section,value){const allowed=['go','tab','buy','archStart','share','shareRare','copyCode','openUniq','lifeGoal','lifeDone','finishDemo','lifeWeek','shareCompat','copyCard','askChip','ask','generate','hookGenerate','analyze','analyzeVideo'];if(allowed.includes(name))event('action',section,name+(value?'_'+clean(value):''));}
 function consent(on){const was=read(key)==='yes';write(key,on?'yes':'no');if(on&&!was){write('ktoya:visitor',visitor);attribution();event('session_start');if(last)event('screen_view',last);}}
 window.KtoAnalytics={event,screen,action,consent,enabled:()=>read(key)==='yes'};
 if(enabled()){write('ktoya:visitor',visitor);event('session_start');}
 document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(el)action(el.dataset.a,last,['go','tab','buy','lifeGoal'].includes(el.dataset.a)?el.dataset.v:'');},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&last){event('screen_time',last,'',(Date.now()-entered)/1000);entered=Date.now();}else entered=Date.now();});
})();