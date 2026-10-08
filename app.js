const $=i=>document.getElementById(i),h=$('h'),nv=$('nv'),mb=$('mb');
const sc=()=>h.classList.toggle('s',scrollY>10);sc();addEventListener('scroll',sc,{passive:true});
mb.onclick=()=>{const o=nv.classList.toggle('o');mb.setAttribute('aria-expanded',o)};
addEventListener('keydown',e=>{if(e.key==='Escape'&&nv.classList.contains('o')){nv.classList.remove('o');mb.setAttribute('aria-expanded',false);mb.focus()}});
nv.addEventListener('click',()=>{nv.classList.remove('o');mb.setAttribute('aria-expanded',false)});
fetch('/api/testimonials').then(r=>r.json()).then(a=>{for(const t of a){const c=document.createElement('figure');c.className='c';c.style.margin=0;
const s=document.createElement('div');s.className='st';s.textContent='★'.repeat(t.stars)+'☆'.repeat(5-t.stars);s.setAttribute('role','img');s.setAttribute('aria-label',t.stars+' מתוך 5 כוכבים');
const q=document.createElement('blockquote');q.style.margin='8px 0';q.textContent='"'+t.text+'"';const n=document.createElement('figcaption');n.innerHTML='<b></b><br><small>✓ לקוח חיבור ישיר</small>';n.firstChild.textContent=t.name;c.append(s,q,n);$('rv').append(c)}}).catch(()=>{});
const f=$('f'),msg=$('msg'),sid=crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random();let busy=false;
const F=['first_name','last_name','phone','email','service','contact_consent'];
function show(er){for(const k of F){const e=$('e_'+k),i=$(k);e.textContent=er[k]||'';i.setAttribute('aria-invalid',!!er[k]);if(er[k])i.setAttribute('aria-describedby','e_'+k);else i.removeAttribute('aria-describedby')}}
f.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;
const d={submission_id:sid,website:f.website.value,contact_consent:$('contact_consent').checked,marketing_consent:$('marketing_consent').checked};for(const k of ['first_name','last_name','phone','email','service'])d[k]=$(k).value.trim();
const er={};if(!d.first_name)er.first_name='נא להזין שם פרטי';if(!d.last_name)er.last_name='נא להזין שם משפחה';if(!d.phone)er.phone='נא להזין טלפון';if(!d.service)er.service='נא לבחור שירות';if(!d.contact_consent)er.contact_consent='יש לאשר יצירת קשר כדי לשלוח את הפנייה';
show(er);if(Object.keys(er).length){msg.className='bad';msg.textContent='נא לתקן את השדות המסומנים.';$(Object.keys(er)[0]).focus();return}
busy=true;$('sb').disabled=true;msg.className='';msg.textContent='שולח…';
try{const r=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}),j=await r.json();
if(r.ok){f.reset();show({});msg.className='ok';msg.textContent='תודה! הפרטים התקבלו. נציג חיבור ישיר יחזור אליכם בהקדם.';msg.focus();return}
show(j.fields||{});msg.className='bad';msg.textContent=j.error||'אירעה שגיאה.';const k=Object.keys(j.fields||{})[0];if(k)$(k).focus()}
catch{msg.className='bad';msg.textContent='אירעה שגיאת תקשורת. נסו שוב או התקשרו אלינו.'}finally{busy=false;$('sb').disabled=false}});
