import {useState,useEffect,Fragment} from 'react';
import {storage} from './storage.js';
import {fmtTime} from './game.js';
const RES={win:'🏆 Menang',bug:'💥 Bug',out:'🚧 Keluar papan',short:'🤔 Belum sampai'};
const toGame=e=>{e.preventDefault();location.hash='#/';location.reload()};
const pct=(a,b)=>b?Math.round(100*a/b)+'%':'-';
const num=(a,b)=>b?Math.round(100*a/b):0;
const tm=v=>v==null||v===''?'-':fmtTime(+v);
function Ring({v,children,c='#6EA8FF'}){const R=22,C=2*Math.PI*R,f=Math.max(0,Math.min(1,v));
  return(<span className="ring"><svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r={R} className="rg-bg"/><circle cx="28" cy="28" r={R} className="rg-fg" style={{stroke:c,strokeDasharray:`${C*f} ${C}`}} transform="rotate(-90 28 28)"/></svg><i>{children}</i></span>)}
function Spark({pts}){const W=170,H=56,m=Math.max(...pts,1),st=pts.length>1?W/(pts.length-1):W;
  const d=pts.map((y,i)=>`${i?'L':'M'}${(i*st).toFixed(1)},${(H-6-(y/m)*(H-14)).toFixed(1)}`).join(' ');
  return(<svg viewBox={`0 0 ${W} ${H}`} className="spark" aria-hidden="true"><path d={d} fill="none" stroke="#7DB4FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx={(pts.length-1)*st} cy={H-6-(pts.at(-1)/m)*(H-14)} r="3.4" fill="#A9CDFF"/></svg>)}
const Trend=({a,b,up})=>{if(a==null||b==null||a===b)return null;const rise=a>b,good=up?rise:!rise;return<em className={'tr '+(good?'good':'badv')}>{rise?'▲':'▼'}</em>};

export default function Admin(){
  const [ok,setOk]=useState(!!storage.adminToken()),[d,setD]=useState(null),[err,setErr]=useState(''),[u,setU]=useState('admin'),[p,setP]=useState(''),[tab,setTab]=useState('ring'),[sel,setSel]=useState(-1),[adms,setAdms]=useState(null),[nu,setNu]=useState(''),[np,setNp]=useState(''),[amsg,setAmsg]=useState(''),[rev,setRev]=useState({}),[ed,setEd]=useState(null),[fl,setFl]=useState({lv:-1,res:''}),[pv,setPv]=useState({}),[lupa,setLupa]=useState(false),[rc,setRc]=useState(''),[n1,setN1]=useState(''),[n2,setN2]=useState(''),[info,setInfo]=useState(''),[ex,setEx]=useState(null);
  const load=async()=>{try{setD(await storage.adminData());setErr('')}catch(e){setErr(e.message);if(e.status===401){storage.adminLogout();setOk(false)}}};
  useEffect(()=>{if(ok)load()},[ok]);
  const login=async()=>{try{await storage.adminLogin(u,p);setOk(true);setErr('')}catch(e){setErr(e.message)}};
  const recover=async()=>{if(!u.trim())return setErr('Isi username admin.');if(!rc)return setErr('Isi kode pemulihan.');if(n1.length<6)return setErr('Password baru minimal 6 karakter.');if(n1!==n2)return setErr('Ulangi password baru dengan sama persis.');
    try{await storage.adminRecover(u.trim(),rc,n1);setLupa(false);setRc('');setN1('');setN2('');setP('');setErr('');setInfo('Password berhasil diganti. Silakan masuk dengan password baru.')}catch(e){setErr(e.message)}};
  const loadAdm=async()=>{try{setAdms((await storage.adminList()).admins);setAmsg('')}catch(e){setAdms([]);setAmsg(e.message)}};
  useEffect(()=>{if(ok&&tab==='adm')loadAdm()},[ok,tab]);
  const addAdm=async()=>{if(!/^[a-zA-Z0-9_.-]{3,30}$/.test(nu))return setAmsg('Username 3-30 karakter (huruf, angka, _ . -).');if(np.length<6)return setAmsg('Password minimal 6 karakter.');
    try{await storage.adminAdd(nu,np);setNu('');setNp('');loadAdm()}catch(e){setAmsg(e.message)}};
  const toggleRev=async x=>{if(rev[x.id]){setRev(r=>{const n={...r};delete n[x.id];return n});return}
    try{const r=await storage.adminReveal(x.id);setRev(v=>({...v,[x.id]:{pw:r.pass}}))}catch(e){setAmsg(e.message)}};
  const saveEd=async()=>{if(!/^[a-zA-Z0-9_.-]{3,30}$/.test(ed.user))return setAmsg('Username 3-30 karakter (huruf, angka, _ . -).');if(ed.pass&&ed.pass.length<6)return setAmsg('Password minimal 6 karakter.');
    try{await storage.adminEdit(ed.id,ed.user,ed.pass);setRev(r=>{const n={...r};delete n[ed.id];return n});setEd(null);loadAdm()}catch(e){setAmsg(e.message)}};
  const goLog=f=>{setFl({lv:-1,res:'',...f});setTab('log')};
  const rmAdm=async x=>{if(confirm(`Hapus admin ${x.username}?`)){try{await storage.adminRemove(x.id);loadAdm()}catch(e){alert(e.message)}}};
  const reset=async s=>{const pin=prompt(`PIN baru untuk ${s.name} (4 angka):`);if(pin){try{await storage.adminReset(s.id,pin);setPv(v=>({...v,[s.id]:{pin}}));alert('PIN diganti.')}catch(e){alert(e.message)}}};
  const togglePin=async s=>{if(pv[s.id]){setPv(v=>{const n={...v};delete n[s.id];return n});return}
    try{const r=await storage.adminPin(s.id);setPv(v=>({...v,[s.id]:{pin:r.pin}}))}catch(e){alert(e.message)}};
  const del=async s=>{if(confirm(`Hapus akun ${s.name} beserta semua skornya?`)){await storage.adminDelete(s.id);load()}};
  const csv=()=>{const r=[['Nama','Total bintang','Level selesai','Percobaan','Total waktu terbaik (detik)',...Array.from({length:15},(_,i)=>'Waktu terbaik Level '+(i+1)+' (detik)'),'Terakhir main','Dibuat'],...d.students.map(s=>[s.name,s.total,s.done,s.attempts,s.timed?s.total_secs:'',...Array.from({length:15},(_,i)=>s.times?.[i]??''),s.last_login||'',s.created_at])];
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+r.map(x=>x.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')],{type:'text/csv'}));a.download='rekap-coderbot.csv';a.click()};

  if(!ok)return(<div className="adm"><section className="panel"><h2 style={{marginTop:0}}>{lupa?'🔓 Lupa Password Admin':'🔧 Login Admin'}</h2>
    {lupa?<>
      <p style={{margin:'0 0 6px',opacity:.85}}>Masukkan kode pemulihan (tersimpan di Supabase: Table Editor, tabel <code>cb_config</code>, baris <code>recovery_code</code>). Atau, lihat/ubah langsung kolom <code>password</code> di tabel <code>cb_admins</code> lewat Table Editor Supabase.</p>
      <label>Username admin<input value={u} onChange={e=>setU(e.target.value)}/></label>
      <label>Kode pemulihan<input type="password" value={rc} onChange={e=>setRc(e.target.value)} autoComplete="off"/></label>
      <label>Password baru (min. 6 karakter)<input type="password" value={n1} onChange={e=>setN1(e.target.value)} autoComplete="new-password"/></label>
      <label>Ulangi password baru<input type="password" value={n2} onChange={e=>setN2(e.target.value)} onKeyDown={e=>e.key==='Enter'&&recover()} autoComplete="new-password"/></label>
      <div className="err">{err}</div><div className="row"><button className="btn pri" onClick={recover}>Reset password</button><button className="btn" onClick={()=>{setLupa(false);setErr('')}}>← Kembali ke login</button></div>
    </>:<>
      <label>Username<input value={u} onChange={e=>setU(e.target.value)}/></label>
      <label>Password<input type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/></label>
      {info&&<div className="okmsg">{info}</div>}
      <div className="err">{err}</div><div className="row"><button className="btn pri" onClick={login}>Masuk</button><a className="btn" href="#/" onClick={toGame}>⬅ Ke game</a><button className="btn lnk" onClick={()=>{setLupa(true);setErr('');setInfo('')}}>Lupa password?</button></div>
    </>}
  </section></div>);
  if(!d)return<div className="adm"><section className="panel">{!err?'Memuat data...':<>
    <h3 style={{margin:'0 0 6px'}}>⚠️ Dasbor belum bisa dimuat</h3><p style={{margin:'0 0 8px'}}>{err}</p>
    {/terhubung/i.test(err)&&<p style={{margin:'0 0 10px',opacity:.85}}>Cek: koneksi internet, isi <code>.env</code> (<code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>), dan pastikan project Supabase tidak sedang dijeda (paused). Alamat yang dipakai: <code>{storage.apiUrl}</code>.</p>}
    <div className="row"><button className="btn pri" onClick={()=>{setErr('');load()}}>🔄 Coba lagi</button><button className="btn" onClick={()=>{storage.adminLogout();setOk(false);setErr('')}}>Ke halaman login</button><a className="btn" href="#/" onClick={toGame}>⬅ Ke game</a></div></>}</section></div>;
  const byL={};d.levels.forEach(l=>byL[+l.level]=l);
  const rows=Array.from({length:15},(_,i)=>{const l=byL[i]||{};return{i,plays:+l.plays||0,wins:+l.wins||0,bugs:+l.bugs||0,best:l.best_secs==null?null:+l.best_secs,bestName:l.best_name,avg:l.avg_secs==null?null:+l.avg_secs}});
  const plays=rows.reduce((a,l)=>a+l.plays,0),wins=rows.reduce((a,l)=>a+l.wins,0);
  const withP=rows.filter(r=>r.plays>0),hard=withP.length?[...withP].sort((a,b)=>b.bugs/b.plays-a.bugs/a.plays)[0]:null;
  const avg=d.students.length?d.students.reduce((a,s)=>a+ +s.total,0)/d.students.length:0;
  const days={};(d.plays||[]).forEach(x=>{const k=x.created_at.slice(0,10);days[k]=(days[k]||0)+1});
  const dk=Object.keys(days).sort();let pts=dk.length>1?dk.slice(-8).map(k=>days[k]):[];
  if(!pts.length){const n=Math.min((d.plays||[]).length,12);pts=Array.from({length:n},(_,i)=>i+1)}
  if(pts.length<2)pts=[0,plays||0];
  const cur=rows[sel>=0?sel:(hard?hard.i:0)];
  return(<div className="adm">
    <section className="panel top"><b>🔧 Dashboard Admin</b><div className="row">
      <button className="btn glow" data-tip="Klik untuk memuat ulang data" onClick={load}>🔄 Muat ulang</button>
      <button className="btn" onClick={()=>{storage.adminLogout();setOk(false)}}>Keluar</button>
      <a className="btn" href="#/" onClick={toGame}>⬅ Ke game</a></div></section>
    <div className="tabs2">{[['ring','📊 Ringkasan'],['siswa','👧 Siswa'],['log','🕒 Riwayat'],['adm','🔑 Admin']].map(([k,t])=><button key={k} className={'tab2'+(tab===k?' on':'')} onClick={()=>setTab(k)}>{t}</button>)}</div>
    {tab==='ring'&&<div className="amain"><section className="panel">
      <div className="acards">
        <button type="button" className="stat2" title="Lihat daftar siswa" onClick={()=>setTab('siswa')}><Ring v={1}>👧</Ring><span className="stt"><b>{d.students.length}</b><small>Siswa</small></span></button>
        <button type="button" className="stat2 hov" title="Lihat semua riwayat main" onClick={()=>goLog({})}><Ring v={1} c="#7DB4FF">{plays}</Ring><span className="stt"><b>{plays}</b><small>Percobaan main</small></span><span className="spkpop"><Spark pts={pts}/></span></button>
        <button type="button" className="stat2" title="Lihat riwayat yang menang" onClick={()=>goLog({res:'win'})}><Ring v={plays?wins/plays:0} c="#E2C089">{pct(wins,plays)}</Ring><span className="stt"><b>{pct(wins,plays)}</b><small>Tingkat menang</small></span></button>
        <button type="button" className="stat2" title="Lihat peringkat bintang siswa" onClick={()=>setTab('siswa')}><Ring v={avg/45} c="#E2C089">⭐</Ring><span className="stt"><b>{avg.toFixed(1)}</b><small>Rata² bintang</small></span></button>
      </div>
      {hard&&<button type="button" className="warn" title="Lihat riwayat bug level ini" onClick={()=>goLog({lv:hard.i,res:'bug'})}>🐞 Level paling sering bug: <b>Level {hard.i+1}</b> ({pct(hard.bugs,hard.plays)} percobaan gagal). Bisa dibahas di kelas! <u>Lihat riwayat →</u></button>}
      <div className="tw"><table className="tbl2"><thead><tr><th>Level</th><th>Main</th><th>Menang</th><th>Bug</th><th>⏱️ Tercepat</th><th>⏱️ Rata²</th></tr></thead>
        <tbody>{rows.map(r=>{const pv=rows[r.i-1],w=num(r.wins,r.plays),b=num(r.bugs,r.plays);
          return(<tr key={r.i} className={'clk'+(r.i===cur.i?' cur':'')} tabIndex={0} title={`Lihat riwayat Level ${r.i+1}`} onMouseEnter={()=>setSel(r.i)} onFocus={()=>setSel(r.i)} onClick={()=>goLog({lv:r.i})} onKeyDown={e=>e.key==='Enter'&&goLog({lv:r.i})}>
            <td>{r.i+1}</td><td>{r.plays}</td>
            <td><span className="pc">{pct(r.wins,r.plays)}</span>{pv&&r.plays>0&&pv.plays>0&&<Trend a={w} b={num(pv.wins,pv.plays)} up/>}<span className="bar"><i style={{width:w+'%'}}/></span></td>
            <td><span className="pc">{pct(r.bugs,r.plays)}</span>{pv&&r.plays>0&&pv.plays>0&&<Trend a={b} b={num(pv.bugs,pv.plays)}/>}<span className="bar"><i style={{width:b+'%'}}/></span></td>
            <td title={r.bestName?'Oleh '+r.bestName:''}>{tm(r.best)}</td><td>{tm(r.avg)}</td></tr>)})}</tbody></table></div></section>
      <aside className="detail"><h4>Level {cur.i+1} Detail</h4>
        <div className="dl"><span>▷ Total main</span><b>{cur.plays}</b></div>
        <div className="dl"><span>🏆 Menang</span><b>{cur.wins}</b></div>
        <div className="dl"><span>🐞 Bug</span><b>{cur.bugs}</b></div>
        <div className="dl"><span>⏱️ Waktu tercepat</span><b>{tm(cur.best)}</b></div>
        {cur.bestName&&<small className="dh">Rekor level ini: {cur.bestName}</small>}
        <div className="dl"><span>⏱️ Rata² waktu menang</span><b>{tm(cur.avg)}</b></div>
        <h4>Gagal lainnya</h4>
        <div className="dl"><span>🚧 Keluar papan / belum sampai</span><b>{Math.max(0,cur.plays-cur.wins-cur.bugs)}</b></div>
        <button type="button" className="btn dlink" onClick={()=>goLog({lv:cur.i})}>Lihat riwayat Level {cur.i+1} →</button>
        {hard&&hard.i!==cur.i&&<small className="dh">Level tersulit: Level {hard.i+1} ({pct(hard.bugs,hard.plays)} bug)</small>}
      </aside></div>}
    {tab==='siswa'&&<section className="panel"><button className="btn" onClick={csv}>⬇ Unduh CSV</button>
      <div className="tw"><table className="tbl2"><thead><tr><th>Siswa</th><th>⭐</th><th>Level</th><th>Main</th><th>⏱️ Total rekor</th><th>Terakhir</th><th>Aksi</th></tr></thead>
        <tbody>{d.students.map(s=><Fragment key={s.id}><tr><td>{s.av} {s.name}</td><td>{s.total}</td><td>{s.done}/15</td><td>{s.attempts}</td>
          <td>{s.timed?<><b>{tm(s.total_secs)}</b> <small>({s.timed} level)</small> <button type="button" className="btn tiny" onClick={()=>setEx(ex===s.id?null:s.id)} aria-expanded={ex===s.id} aria-label={'Rincian waktu '+s.name}>{ex===s.id?'▲':'▼'}</button></>:'-'}</td>
          <td>{s.last_login?.slice(0,16)||'-'}</td>
          <td>{pv[s.id]&&<><code className="pw" title={pv[s.id].pin?'':'PIN tersimpan otomatis saat siswa login berikutnya, atau atur ulang dengan tombol Reset PIN.'}>{pv[s.id].pin??'belum tersimpan'}</code> </>}<button className="btn" onClick={()=>togglePin(s)}>{pv[s.id]?'🙈 Sembunyikan':'👁 Lihat PIN'}</button> <button className="btn" onClick={()=>reset(s)}>🔄 Reset PIN</button> <button className="btn" onClick={()=>del(s)}>🗑</button></td></tr>
          {ex===s.id&&<tr><td colSpan="7" style={{whiteSpace:'normal'}}><b>Waktu tercepat per level:</b> {Array.from({length:15},(_,i)=>s.times?.[i]!=null?<span key={i} className="pw" style={{marginRight:6,display:'inline-block'}}>L{i+1} {tm(s.times[i])}</span>:null)}</td></tr>}
        </Fragment>)}</tbody></table></div></section>}
    {tab==='adm'&&<section className="panel"><h3 style={{margin:'0 0 8px'}}>Akun admin</h3>
      <div className="tw"><table className="tbl2"><thead><tr><th>Username</th><th>Password</th><th>Dibuat</th><th>Aksi</th></tr></thead>
        <tbody>{(adms||[]).map(x=>{const e=ed&&ed.id===x.id,r=rev[x.id];return(<tr key={x.id}>
          <td>{e?<input className="ein" value={ed.user} onChange={ev=>setEd({...ed,user:ev.target.value})} aria-label="Username"/>:<>🔑 {x.username}{x.me&&' (kamu)'}</>}</td>
          <td>{e?<input className="ein" placeholder="Kosongkan = tidak diubah" value={ed.pass} onChange={ev=>setEd({...ed,pass:ev.target.value})} aria-label="Password baru"/>
            :!x.has_pass?<small title="Password lama hanya tersimpan sebagai hash. Edit & isi password sekali agar bisa ditampilkan.">belum tersimpan</small>
            :<><code className="pw">{r?(r.pw??'(tidak terbaca)'):'••••••••'}</code> <button type="button" className="btn tiny" onClick={()=>toggleRev(x)} aria-label={r?'Sembunyikan password':'Tampilkan password'}>{r?'🙈':'👁'}</button></>}</td>
          <td>{(x.created_at||'').slice(0,16)||'-'}</td>
          <td>{e?<><button className="btn pri" onClick={saveEd}>💾 Simpan</button> <button className="btn" onClick={()=>{setEd(null);setAmsg('')}}>Batal</button></>
            :<><button className="btn" onClick={()=>{setEd({id:x.id,user:x.username,pass:''});setAmsg('')}}>✏️ Edit</button> <button className="btn" disabled={x.me||(adms||[]).length<2} onClick={()=>rmAdm(x)}>🗑</button></>}</td></tr>)})}
          {adms&&!adms.length&&<tr><td colSpan="4">Belum ada data admin.</td></tr>}</tbody></table></div>
      <h3 style={{margin:'16px 0 4px'}}>Tambah admin baru</h3>
      <div className="row"><input style={{flex:1,minWidth:140}} placeholder="Username" value={nu} onChange={e=>setNu(e.target.value)}/><input style={{flex:1,minWidth:140}} type="password" placeholder="Password (min. 6)" value={np} onChange={e=>setNp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addAdm()}/><button className="btn pri" onClick={addAdm}>➕ Tambah</button></div>
      <div className="err">{amsg}</div></section>}
    {tab==='log'&&(()=>{const L=d.plays.filter(x=>(fl.lv<0||+x.level===fl.lv)&&(!fl.res||(fl.res==='bug'?(x.result==='bug'||x.result==='out'):x.result===fl.res)));
      return<section className="panel"><div className="row fbar">
        <label>Level <select value={fl.lv} onChange={e=>setFl({...fl,lv:+e.target.value})}><option value={-1}>Semua</option>{Array.from({length:15},(_,i)=><option key={i} value={i}>Level {i+1}</option>)}</select></label>
        <label>Hasil <select value={fl.res} onChange={e=>setFl({...fl,res:e.target.value})}><option value="">Semua</option><option value="win">🏆 Menang</option><option value="bug">💥 Bug / keluar papan</option><option value="short">🤔 Belum sampai</option></select></label>
        {(fl.lv>=0||fl.res)&&<button className="btn" onClick={()=>setFl({lv:-1,res:''})}>✖ Hapus filter</button>}
        <small>{L.length} dari {d.plays.length} riwayat terbaru (maks. 300)</small></div>
      <div className="tw"><table className="tbl2"><thead><tr><th>Waktu</th><th>Siswa</th><th>Level</th><th>Kartu</th><th>⏱️ Waktu</th><th>Hasil</th></tr></thead>
      <tbody>{L.map((x,i)=><tr key={i}><td>{x.created_at.slice(5,16)}</td><td>{x.name}</td><td>{+x.level+1}</td><td>{x.cards}</td><td>{tm(x.secs)}</td><td>{RES[x.result]}</td></tr>)}
        {!L.length&&<tr><td colSpan="6">Tidak ada riwayat yang cocok.</td></tr>}</tbody></table></div></section>})()}
  </div>);
}
