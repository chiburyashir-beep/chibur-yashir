// Cookie consent. To add trackers, list their script URLs here (and allow the host in the CSP in server.js).
// They load ONLY after the matching consent. Currently none are used.
const TRACKERS={analytics:[],marketing:[]};
(()=>{const K='cy_consent',d=document;let c=null;try{c=JSON.parse(localStorage.getItem(K))}catch{}
const css=d.createElement('style');css.textContent='#cb{position:fixed;bottom:16px;right:50%;transform:translateX(50%);width:min(560px,calc(100% - 32px));background:#fff;color:#0a0a0a;border:1px solid #e6e6e0;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.2);padding:20px;z-index:90;font-size:16px;line-height:1.6}#cb h2{font-size:1.1rem;margin:0 0 6px}#cb p{margin:0 0 12px}#cb .r{display:flex;gap:8px;flex-wrap:wrap}#cb .b{padding:10px 16px;border-radius:10px;border:2px solid #0a0a0a;background:#fff;color:#0a0a0a;font:inherit;font-weight:600;cursor:pointer}#cb .b.p{background:#0a0a0a;color:#fff}#cb label{display:flex;gap:10px;margin:8px 0;align-items:flex-start}#cb input{width:22px;height:22px;margin-top:3px}#cb :focus-visible{outline:3px solid #00b8d4;outline-offset:2px}';d.head.append(css);
const load=k=>{for(const s of TRACKERS[k]||[]){if(d.querySelector('script[src="'+s+'"]'))continue;const e=d.createElement('script');e.src=s;e.async=true;d.head.append(e)}};
if(c){if(c.analytics)load('analytics');if(c.marketing)load('marketing')}
function save(a,m){const was=c&&(c.analytics||c.marketing);c={analytics:a,marketing:m,ts:new Date().toISOString()};try{localStorage.setItem(K,JSON.stringify(c))}catch{}close();if(was&&!a&&!m)location.reload();else{if(a)load('analytics');if(m)load('marketing')}}
function close(){const b=d.getElementById('cb');if(b)b.remove();const f=d.querySelector('.fl');if(f)f.style.bottom=''}
function open(prefs){close();const b=d.createElement('div');b.id='cb';b.setAttribute('role','dialog');b.setAttribute('aria-labelledby','cbt');
b.innerHTML='<h2 id="cbt">הגדרות Cookies</h2><p>האתר משתמש בטכנולוגיות הכרחיות לתפקודו. בהסכמתכם נוכל להשתמש גם בכלי אנליטיקה ושיווק. אפשר לשנות את הבחירה בכל עת דרך "הגדרות Cookies" בתחתית האתר. <a href="/privacy.html">מדיניות פרטיות</a></p>'+(prefs?'<label><input type="checkbox" checked disabled><span>הכרחיים (תמיד פעילים)</span></label><label><input type="checkbox" id="ca"'+(c&&c.analytics?' checked':'')+'><span>אנליטיקה</span></label><label><input type="checkbox" id="cm"'+(c&&c.marketing?' checked':'')+'><span>שיווק</span></label>':'')+'<div class="r">'+(prefs?'<button class="b p" id="cs">שמירת העדפות</button>':'<button class="b" id="cp">ניהול העדפות</button>')+'<button class="b" id="cr">דחיית הלא-הכרחיים</button><button class="b p" id="ck">אישור הכל</button></div>';
d.body.append(b);const f=d.querySelector('.fl');if(f)f.style.bottom=(b.offsetHeight+28)+'px';
b.querySelector('#ck').onclick=()=>save(true,true);b.querySelector('#cr').onclick=()=>save(false,false);
if(prefs)b.querySelector('#cs').onclick=()=>save(b.querySelector('#ca').checked,b.querySelector('#cm').checked);else b.querySelector('#cp').onclick=()=>{open(true);d.querySelector('#cb input:not([disabled])').focus()};
b.addEventListener('keydown',e=>{if(e.key==='Escape'&&c)close()});if(c||prefs)b.querySelector('button,input:not([disabled])').focus()}
d.addEventListener('click',e=>{if(e.target.closest('[data-cookie-settings]')){e.preventDefault();open(true)}});
if(!c)open(false);})();
