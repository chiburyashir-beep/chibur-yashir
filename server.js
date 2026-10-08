// Zero-dependency server. Node 22.13+. Run: node --env-file=.env server.js
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {DatabaseSync}=require('node:sqlite');
const E=process.env,PORT=+E.PORT||3000,PUB=path.join(__dirname,'public');
const db=new DatabaseSync(path.join(__dirname,'data','leads.db'));
db.exec(`CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY AUTOINCREMENT,created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),first_name TEXT NOT NULL,last_name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT,service TEXT NOT NULL,contact_consent INTEGER NOT NULL,marketing_consent INTEGER NOT NULL DEFAULT 0,consent_timestamp TEXT NOT NULL,source TEXT NOT NULL DEFAULT 'website',status TEXT NOT NULL DEFAULT 'new',submission_id TEXT UNIQUE,sheets_done INTEGER DEFAULT 0,email_done INTEGER DEFAULT 0);`);
const SERV=['סלולר','אינטרנט / פייבר','טלוויזיה','אחר'],STAT={new:'חדש',in_progress:'בטיפול',contacted:'חזרנו ללקוח',closed:'נסגר',irrelevant:'לא רלוונטי'};
const log=(...a)=>console.error(new Date().toISOString(),...a);
const clean=(s,n)=>String(s??'').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const il=d=>new Date(d).toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'});
const hits=new Map();
const limited=ip=>{const n=Date.now(),a=(hits.get(ip)||[]).filter(t=>n-t<6e5);a.push(n);hits.set(ip,a);return a.length>5};
setInterval(()=>hits.clear(),36e5).unref();
const normPhone=p=>{let d=p.replace(/[\s\-()]/g,'');if(d.startsWith('+972'))d='0'+d.slice(4);return /^0(5\d{8}|[2-489]\d{7})$/.test(d)?d:null};
// ---- Integrations ----
async function sheets(l){
  if(!E.GOOGLE_SERVICE_ACCOUNT_EMAIL||!E.GOOGLE_PRIVATE_KEY||!E.GOOGLE_SHEET_ID)return 'skipped';
  const b=o=>Buffer.from(JSON.stringify(o)).toString('base64url'),now=Math.floor(Date.now()/1e3);
  const u=b({alg:'RS256',typ:'JWT'})+'.'+b({iss:E.GOOGLE_SERVICE_ACCOUNT_EMAIL,scope:'https://www.googleapis.com/auth/spreadsheets',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
  const sig=crypto.sign('RSA-SHA256',Buffer.from(u),E.GOOGLE_PRIVATE_KEY.replace(/\\n/g,'\n')).toString('base64url');
  const t=await(await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion='+u+'.'+sig})).json();
  if(!t.access_token)throw new Error('google auth failed');
  const yn=v=>v?'כן':'לא',row=[il(l.created_at),l.id,l.first_name,l.last_name,"'"+l.phone,l.email||'',l.service,yn(l.contact_consent),yn(l.marketing_consent),l.source,STAT[l.status]];
  const r=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${E.GOOGLE_SHEET_ID}/values/${encodeURIComponent((E.GOOGLE_SHEET_TAB||'Leads')+'!A1')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,{method:'POST',headers:{Authorization:'Bearer '+t.access_token,'Content-Type':'application/json'},body:JSON.stringify({values:[row]})});
  if(!r.ok)throw new Error('sheets '+r.status);return 'ok';
}
async function mail(l){
  if(!E.RESEND_API_KEY||!E.EMAIL_FROM)return 'skipped';
  const to=E.NOTIFY_EMAIL||'chiburyashir@gmail.com',yn=v=>v?'כן':'לא',ph=l.phone.replace(/^0/,'972'),n=esc(l.first_name+' '+l.last_name);
  const f=(k,v)=>`<p style="margin:8px 0"><b>${k}:</b><br>${esc(v)}</p>`;
  const html=`<div dir="rtl" style="font-family:Arial,sans-serif;text-align:right"><h2>ליד חדש התקבל באתר חיבור ישיר</h2>${f('שם',l.first_name+' '+l.last_name)}${f('טלפון',l.phone)}${f('אימייל',l.email||'לא הוזן')}${f('שירות',l.service)}${f('אישור יצירת קשר',yn(l.contact_consent))}${f('אישור שיווק',yn(l.marketing_consent))}${f('תאריך',il(l.created_at))}${f('Lead ID',l.id)}${f('מקור','אתר חיבור ישיר')}<p><a href="tel:${esc(l.phone)}" style="background:#0a0a0a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">התקשר ללקוח</a> <a href="https://wa.me/${ph}" style="background:#25D366;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">פתח WhatsApp</a></p></div>`;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+E.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:E.EMAIL_FROM,to:[to],subject:`ליד חדש מהאתר | חיבור ישיר | ${l.first_name} ${l.last_name}`.replace(/[\r\n]/g,' '),html})});
  if(!r.ok)throw new Error('email '+r.status);return 'ok';
}
async function integrate(id){
  const l=db.prepare('SELECT * FROM leads WHERE id=?').get(id);if(!l)return;
  for(const [fn,col] of [[sheets,'sheets_done'],[mail,'email_done']]){
    if(l[col])continue;
    try{const r=await fn(l);if(r==='ok')db.prepare(`UPDATE leads SET ${col}=1 WHERE id=?`).run(id)}catch(e){log('integration failed',col,'lead',id,e.message)}
  }
}
const retry=()=>{for(const r of db.prepare('SELECT id FROM leads WHERE (sheets_done=0 OR email_done=0) AND created_at>datetime(\'now\',\'-2 days\')').all())integrate(r.id)};
setInterval(retry,5*6e4).unref();
// ---- HTTP ----
const J=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(o))};
const body=req=>new Promise((ok,no)=>{let s='';req.on('data',c=>{s+=c;if(s.length>1e4){no(new Error('big'));req.destroy()}});req.on('end',()=>{try{ok(JSON.parse(s||'{}'))}catch(e){no(e)}})});
const admin=(req,res)=>{
  const [u,p]=Buffer.from((req.headers.authorization||'').slice(6),'base64').toString().split(/:(.*)/s);
  const h=x=>crypto.createHash('sha256').update(String(x)).digest();
  if(E.ADMIN_PASSWORD&&E.ADMIN_PASSWORD!=='change-me-long-random'&&crypto.timingSafeEqual(h(u),h(E.ADMIN_USER||'admin'))&&crypto.timingSafeEqual(h(p),h(E.ADMIN_PASSWORD)))return true;
  res.writeHead(401,{'WWW-Authenticate':'Basic realm="admin"'});res.end('Unauthorized');return false};
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.txt':'text/plain','.xml':'application/xml','.ico':'image/x-icon'};
http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'");
  try{
    const url=new URL(req.url,'http://x'),p=url.pathname,ip=req.socket.remoteAddress;
    if(p==='/api/leads'&&req.method==='POST'){
      if(limited(ip))return J(res,429,{error:'יותר מדי ניסיונות. נסו שוב מאוחר יותר.'});
      let d;try{d=await body(req)}catch{return J(res,400,{error:'בקשה לא תקינה.'})}
      if(d.website)return J(res,200,{ok:true,id:0}); // honeypot: silently drop
      const v={first_name:clean(d.first_name,60),last_name:clean(d.last_name,60),email:clean(d.email,120),service:clean(d.service,40)},err={};
      if(!v.first_name)err.first_name='נא להזין שם פרטי';if(!v.last_name)err.last_name='נא להזין שם משפחה';
      const ph=normPhone(clean(d.phone,25));if(!ph)err.phone='נא להזין מספר טלפון ישראלי תקין';
      if(v.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email))err.email='כתובת האימייל אינה תקינה';
      if(!SERV.includes(v.service))err.service='נא לבחור שירות';
      if(d.contact_consent!==true)err.contact_consent='יש לאשר יצירת קשר כדי לשלוח את הפנייה';
      if(Object.keys(err).length)return J(res,422,{error:'נא לתקן את השדות המסומנים.',fields:err});
      const sid=clean(d.submission_id,64)||null,dup=sid&&db.prepare('SELECT id FROM leads WHERE submission_id=?').get(sid);
      if(dup)return J(res,200,{ok:true,id:dup.id});
      const recent=db.prepare("SELECT id FROM leads WHERE phone=? AND created_at>datetime('now','-60 seconds')").get(ph);
      if(recent)return J(res,200,{ok:true,id:recent.id});
      const ts=new Date().toISOString(),r=db.prepare('INSERT INTO leads(first_name,last_name,phone,email,service,contact_consent,marketing_consent,consent_timestamp,submission_id) VALUES(?,?,?,?,?,1,?,?,?)').run(v.first_name,v.last_name,ph,v.email||null,v.service,d.marketing_consent===true?1:0,ts,sid);
      const id=Number(r.lastInsertRowid);J(res,201,{ok:true,id});integrate(id);return;
    }
    if(p==='/api/testimonials')return J(res,200,JSON.parse(fs.readFileSync(path.join(__dirname,'data','testimonials.json'),'utf8')));
    if(p.startsWith('/admin')){
      if(!admin(req,res))return;
      if(p==='/admin/api/leads'&&req.method==='GET'){
        const q=clean(url.searchParams.get('q'),60),s=url.searchParams.get('status');
        const rows=db.prepare('SELECT id,created_at,first_name,last_name,phone,email,service,status FROM leads WHERE (?1="" OR first_name||" "||last_name LIKE "%"||?1||"%" OR phone LIKE "%"||?1||"%") AND (?2 IS NULL OR status=?2) ORDER BY id DESC LIMIT 500').all(q,STAT[s]?s:null);
        return J(res,200,{rows,statuses:STAT});}
      const m=p.match(/^\/admin\/api\/leads\/(\d+)$/);
      if(m&&req.method==='PATCH'){const d=await body(req);if(!STAT[d.status])return J(res,400,{error:'bad status'});db.prepare('UPDATE leads SET status=? WHERE id=?').run(d.status,+m[1]);return J(res,200,{ok:true})}
      res.writeHead(200,{'Content-Type':MIME['.html'],'Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(PUB,'admin.html')));
    }
    let f=path.normalize(path.join(PUB,p==='/'?'index.html':p));
    if(!f.startsWith(PUB)||f.endsWith('admin.html')||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('Not found')}
    res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'public, max-age=3600'});fs.createReadStream(f).pipe(res);
  }catch(e){log('error',e.message);if(!res.headersSent)J(res,500,{error:'אירעה שגיאה. נסו שוב מאוחר יותר.'})}
}).listen(PORT,()=>log('listening',PORT));
