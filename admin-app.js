const q=document.getElementById('q'),s=document.getElementById('s'),b=document.getElementById('b');let ST={};
async function load(){const r=await fetch('/admin/api/leads?q='+encodeURIComponent(q.value)+'&status='+s.value),d=await r.json();ST=d.statuses;
if(s.options.length===1)for(const k in ST)s.add(new Option(ST[k],k));b.textContent='';
for(const l of d.rows){const tr=b.insertRow();for(const v of [l.first_name+' '+l.last_name,l.phone,l.email||'',l.service,new Date(l.created_at).toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'})])tr.insertCell().textContent=v;
const sel=document.createElement('select');sel.setAttribute('aria-label','סטטוס ליד '+l.id);for(const k in ST)sel.add(new Option(ST[k],k,0,k===l.status));
sel.onchange=()=>fetch('/admin/api/leads/'+l.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:sel.value})});tr.insertCell().append(sel)}}
let t;q.oninput=()=>{clearTimeout(t);t=setTimeout(load,250)};s.onchange=load;load();
