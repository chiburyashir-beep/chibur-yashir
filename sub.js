const mb=document.getElementById('mb'),nv=document.getElementById('nv');
mb.onclick=()=>{const o=nv.classList.toggle('o');mb.setAttribute('aria-expanded',o)};
addEventListener('keydown',e=>{if(e.key==='Escape'&&nv.classList.contains('o')){nv.classList.remove('o');mb.setAttribute('aria-expanded',false);mb.focus()}});
