// Memakai database Supabase (lewat fungsi RPC cb_*) bila VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY diisi
// dan server terjangkau; jika tidak -> localStorage di perangkat ini.
const SB_URL=(import.meta.env.VITE_SUPABASE_URL||'').replace(/\/+$/,''),SB_KEY=import.meta.env.VITE_SUPABASE_ANON_KEY||'';
const API=`${SB_URL}/rest/v1/rpc`; // alamat dasar fungsi (dipakai untuk pesan bantuan di dashboard admin)
export const DEFAULTS={pack:0,bgm:0,sfxVol:.8,bgmVol:.5,bgmOn:true,speed:700,coords:true,theme:'auto'};
let mode=null;
const rd=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const tok=()=>{try{return localStorage.getItem('cb-token')}catch{return null}};
const adm=()=>sessionStorage.getItem('cb-admin');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,16);
// Memanggil fungsi database. Kunci "publishable/anon" memang boleh publik; tabel dikunci, hanya fungsi cb_* yang bisa dipanggil.
async function rpc(fn,args){
  const h={'Content-Type':'application/json',apikey:SB_KEY};
  if(SB_KEY.startsWith('eyJ'))h.Authorization='Bearer '+SB_KEY; // kunci lama (JWT); kunci baru sb_publishable_ cukup lewat apikey
  let r;try{r=await fetch(`${API}/${fn}`,{method:'POST',headers:h,body:JSON.stringify(args||{})})}
  catch{throw new Error('Tidak bisa terhubung ke server.')}
  const d=await r.json().catch(()=>null);
  if(!r.ok)throw Object.assign(new Error(d?.message||'Terjadi kesalahan'),{status:r.status});
  if(d&&!Array.isArray(d)&&d.error)throw Object.assign(new Error(d.error),{status:d.status||400});
  return d;
}
async function api(){
  if(mode)return mode==='api';
  if(!SB_URL||!SB_KEY){mode='local';return false}
  try{const c=new AbortController();setTimeout(()=>c.abort(),5000);
    const r=await fetch(`${API}/cb_ping`,{method:'POST',headers:{'Content-Type':'application/json',apikey:SB_KEY,...(SB_KEY.startsWith('eyJ')?{Authorization:'Bearer '+SB_KEY}:{})},body:'{}',signal:c.signal});
    mode=(await r.json()).ok?'api':'local'}catch{mode='local'}
  return mode==='api';
}
// Rekor waktu lama yang dulu tersimpan di perangkat ini (localStorage) dipindahkan sekali ke database, lalu dihapus dari perangkat.
async function syncOld(st){
  try{const t=rd('cb-time:'+st.id);if(t&&Object.keys(t).length){const d=await rpc('cb_sync_times',{p_tk:tok(),p_times:t});try{localStorage.removeItem('cb-time:'+st.id)}catch{};return d}}catch{}
  return st;
}
const total=s=>({...s,total:Object.values(s.stars).reduce((a,b)=>a+b,0)});
export const storage={
  isApi:()=>mode==='api',
  async login(name,pin){
    if(await api()){const d=await rpc('cb_login',{p_name:name,p_pin:pin});try{localStorage.setItem('cb-token',d.token)}catch{};return syncOld(d.student)}
    const id=slug(name),s=rd('cb:'+id);
    if(!s)throw new Error('Nama belum terdaftar. Daftar dulu ya! 📝');
    if(s.pin!==pin)throw new Error('PIN salah. Coba ingat lagi! 🤔');
    wr('cb-last',id);return s;
  },
  async register(name,pin,av){
    if(await api()){const d=await rpc('cb_register',{p_name:name,p_pin:pin,p_av:av});try{localStorage.setItem('cb-token',d.token)}catch{};return d.student}
    const id=slug(name);if(rd('cb:'+id))throw new Error('Nama itu sudah dipakai. Coba nama lain atau masuk.');
    const n={id,name,pin,av,stars:{},best:{},total:0,settings:{}};wr('cb:'+id,n);wr('cb-last',id);return n;
  },
  async restore(){
    if(await api()){if(!tok())return null;try{return await syncOld(await rpc('cb_me',{p_tk:tok()}))}catch{return null}}
    const id=rd('cb-last');return id?rd('cb:'+id):null;
  },
  async logout(){try{localStorage.removeItem('cb-token');localStorage.removeItem('cb-last')}catch{}},
  async play(me,level,cards,result,stars,secs){
    if(await api())return rpc('cb_play',{p_tk:tok(),p_level:level,p_cards:cards,p_result:result,p_stars:stars,p_secs:result==='win'&&secs!=null?secs:null});
    const s={...me,stars:{...me.stars},best:{...me.best}};
    if(result==='win'){s.stars[level]=Math.max(stars,s.stars[level]||0);s.best[level]=Math.min(cards,s.best[level]||99);if(secs!=null)this.saveTime(me,level,secs)}
    const t=total(s);wr('cb:'+t.id,t);return t;
  },
  async saveSettings(me,settings){
    if(await api())return rpc('cb_settings',{p_tk:tok(),p_settings:settings});
    const s={...me,settings};wr('cb:'+s.id,s);return s;
  },
  async board(){
    if(await api()){try{return await rpc('cb_board')}catch{return[]}}
    const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('cb:')){const v=rd(k);if(v?.name)out.push({id:v.id,name:v.name,av:v.av,total:v.total||0})}}}catch{}
    return out.sort((a,b)=>b.total-a.total).slice(0,10);
  },
  // Waktu tercepat per level: mode database -> dari server (me.times); mode lokal -> localStorage perangkat ini.
  times(me){return mode==='api'?(me?.times||{}):(rd('cb-time:'+(me?.id||me?.name))||{})},
  saveTime(me,level,secs){const t=rd('cb-time:'+(me?.id||me?.name))||{},prev=t[level];
    if(prev==null||secs<prev){t[level]=secs;wr('cb-time:'+(me?.id||me?.name),t)}return prev},
  tutSeen:me=>!!rd('cb-tut:'+(me?.id||me?.name)),
  setTutSeen:me=>wr('cb-tut:'+(me?.id||me?.name),1),
  apiUrl:`${API}/cb_ping`,
  adminToken:()=>adm(),
  async adminLogin(user,pass){
    if(!await api())throw new Error('Admin butuh database Supabase (tidak terhubung). Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diisi, lalu jalankan ulang npm run dev.');
    const d=await rpc('cb_admin_login',{p_user:user,p_pass:pass});sessionStorage.setItem('cb-admin',d.token);sessionStorage.setItem('cb-admin-user',d.user||user);
  },
  adminData:()=>rpc('cb_admin_data',{p_tk:adm()}),
  adminReset:(id,pin)=>rpc('cb_admin_reset',{p_tk:adm(),p_id:id,p_pin:pin}),
  adminPin:id=>rpc('cb_admin_pin',{p_tk:adm(),p_id:id}),
  adminDelete:id=>rpc('cb_admin_delete',{p_tk:adm(),p_id:id}),
  async adminRecover(user,code,pass){
    if(!await api())throw new Error('Butuh database Supabase (tidak terhubung).');
    return rpc('cb_admin_recover',{p_user:user,p_code:code,p_pass:pass});
  },
  adminUser:()=>sessionStorage.getItem('cb-admin-user')||'',
  adminList:()=>rpc('cb_admin_list',{p_tk:adm()}),
  adminAdd:(user,pass)=>rpc('cb_admin_add',{p_tk:adm(),p_user:user,p_pass:pass}),
  adminPass:(id,pass)=>rpc('cb_admin_pass',{p_tk:adm(),p_id:id,p_pass:pass}),
  adminEdit:(id,user,pass)=>rpc('cb_admin_edit',{p_tk:adm(),p_id:id,p_user:user,p_pass:pass}),
  adminReveal:id=>rpc('cb_admin_reveal',{p_tk:adm(),p_id:id}),
  adminRemove:id=>rpc('cb_admin_remove',{p_tk:adm(),p_id:id}),
  adminLogout(){sessionStorage.removeItem('cb-admin');sessionStorage.removeItem('cb-admin-user')},
};
