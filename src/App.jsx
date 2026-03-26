import { useState, useEffect, useRef } from "react";

const JSON_URL = null;
const STREAM_URL = "https://star-sport-1-hindi-sayan.pages.dev/";

// ─── IST Time Helpers ─────────────────────────────────────────────────────────
function getIST() {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + 5.5 * 60 * 60 * 1000);
}
function getISTClock() {
  const ist = getIST();
  const h = ist.getHours(), m = ist.getMinutes(), s = ist.getSeconds();
  const pad = n => String(n).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${pad(h % 12 || 12)}:${pad(m)}:${pad(s)} ${ampm} IST`;
}
function isToday(dateStr) {
  const ist = getIST();
  const [d, mo, y] = dateStr.split("/").map(Number);
  return ist.getDate() === d && (ist.getMonth() + 1) === mo && (ist.getFullYear() % 100) === y;
}
function getMatchStatus(match) {
  const ist = getIST();
  const [d, mo, y] = match.date.split("/").map(Number);
  const matchDate = new Date(2000 + y, mo - 1, d);
  const todayDate = new Date(ist.getFullYear(), ist.getMonth(), ist.getDate());
  if (matchDate < todayDate) return "completed";
  if (!isToday(match.date)) return "upcoming";
  const totalMin = ist.getHours() * 60 + ist.getMinutes();
  const startMin = match.matchType === "day" ? 14 * 60 : 18 * 60;
  const endMin = 2 * 60;
  if (totalMin >= startMin || totalMin <= endMin) return "live";
  return "upcoming";
}

// ─── TEAM LOGOS as SVG components ────────────────────────────────────────────
const TeamLogo = ({ team, size = 52 }) => {
  const s = size;
  const [imgError, setImgError] = useState(false);
  const logoUrl = `/teams/${team.toLowerCase()}.png`;

  const configs = {
    CSK: {
      bg: ["#F9CD05", "#E8B800"],
      border: "#c8960a",
      content: (
        <>
          <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#cskG)"/>
          {/* Lion head simplified */}
          <ellipse cx={s/2} cy={s*0.42} rx={s*0.22} ry={s*0.2} fill="#1a4fa0"/>
          <ellipse cx={s/2} cy={s*0.36} rx={s*0.16} ry={s*0.13} fill="#c8960a"/>
          {/* Mane rays */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i)=>(
            <line key={i} x1={s/2} y1={s*0.42}
              x2={s/2 + Math.cos(deg*Math.PI/180)*s*0.22}
              y2={s*0.42 + Math.sin(deg*Math.PI/180)*s*0.22}
              stroke="#c8960a" strokeWidth="1.2"/>
          ))}
          <text x={s/2} y={s*0.72} textAnchor="middle" fontSize={s*0.13} fontWeight="900" fill="#1a4fa0" fontFamily="Arial Black">CSK</text>
          <defs><linearGradient id="cskG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFD700"/><stop offset="100%" stopColor="#E8B800"/></linearGradient></defs>
        </>
      )
    },
    MI: {
      bg: ["#004BA0","#003580"],
      border: "#1565c0",
      content: (
        <>
          <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#miG)"/>
          {/* Wave/spiral MI logo */}
          <path d={`M${s*0.2},${s*0.55} Q${s*0.35},${s*0.25} ${s*0.5},${s*0.45} Q${s*0.65},${s*0.65} ${s*0.8},${s*0.38}`} stroke="#91d5ff" strokeWidth={s*0.06} fill="none" strokeLinecap="round"/>
          <path d={`M${s*0.2},${s*0.65} Q${s*0.35},${s*0.35} ${s*0.5},${s*0.55} Q${s*0.65},${s*0.72} ${s*0.8},${s*0.48}`} stroke="#4db8ff" strokeWidth={s*0.04} fill="none" strokeLinecap="round"/>
          <text x={s/2} y={s*0.82} textAnchor="middle" fontSize={s*0.14} fontWeight="900" fill="#91d5ff" fontFamily="Arial Black">MI</text>
          <defs><linearGradient id="miG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#004BA0"/><stop offset="100%" stopColor="#002a6e"/></linearGradient></defs>
        </>
      )
    },
    RCB: {
      bg: ["#EC1C24","#a00008"],
      border: "#cc0000",
      content: (
        <>
          <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#rcbG)"/>
          {/* Shield */}
          <path d={`M${s/2},${s*0.15} L${s*0.78},${s*0.3} L${s*0.78},${s*0.6} Q${s/2},${s*0.85} ${s/2},${s*0.85} Q${s*0.22},${s*0.85} ${s*0.22},${s*0.6} L${s*0.22},${s*0.3} Z`} fill="#1a0000" stroke="#c8960a" strokeWidth="1.5"/>
          <text x={s/2} y={s*0.52} textAnchor="middle" fontSize={s*0.18} fontWeight="900" fill="#c8960a" fontFamily="Arial Black">RCB</text>
          <text x={s/2} y={s*0.66} textAnchor="middle" fontSize={s*0.08} fontWeight="700" fill="#ff4444" fontFamily="Arial">#PLAYBOLD</text>
          <defs><linearGradient id="rcbG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#EC1C24"/><stop offset="100%" stopColor="#7a0005"/></linearGradient></defs>
        </>
      )
    },
    SRH: {
      bg: ["#F26522","#d04a00"],
      border: "#e05010",
      content: (
        <>
          <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#srhG)"/>
          {/* Sunburst / Phoenix wings */}
          {[-50,-30,-10,10,30,50].map((deg,i)=>(
            <path key={i}
              d={`M${s/2},${s*0.55} L${s/2+Math.cos((deg-90)*Math.PI/180)*s*0.35},${s*0.55+Math.sin((deg-90)*Math.PI/180)*s*0.35} L${s/2+Math.cos((deg-90)*Math.PI/180)*s*0.2},${s*0.55+Math.sin((deg-90)*Math.PI/180)*s*0.2}`}
              fill={i%2===0?"#FFD700":"#FF8C00"} opacity="0.9"/>
          ))}
          <circle cx={s/2} cy={s*0.52} r={s*0.12} fill="#FFD700"/>
          <text x={s/2} y={s*0.82} textAnchor="middle" fontSize={s*0.13} fontWeight="900" fill="#fff" fontFamily="Arial Black">SRH</text>
          <defs><linearGradient id="srhG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FF7F00"/><stop offset="100%" stopColor="#c04000"/></linearGradient></defs>
        </>
      )
    },
    KKR: {
      bg: ["#3A225D","#1e0f36"],
      border: "#6a35a0",
      content: (
        <>
          <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#kkrG)"/>
          {/* Crown */}
          <path d={`M${s*0.2},${s*0.62} L${s*0.2},${s*0.38} L${s*0.32},${s*0.5} L${s/2},${s*0.28} L${s*0.68},${s*0.5} L${s*0.8},${s*0.38} L${s*0.8},${s*0.62} Z`} fill="#c8960a" stroke="#FFD700" strokeWidth="1"/>
          <circle cx={s*0.2} cy={s*0.36} r={s*0.04} fill="#FFD700"/>
          <circle cx={s/2} cy={s*0.26} r={s*0.04} fill="#FFD700"/>
          <circle cx={s*0.8} cy={s*0.36} r={s*0.04} fill="#FFD700"/>
          <text x={s/2} y={s*0.8} textAnchor="middle" fontSize={s*0.14} fontWeight="900" fill="#c8960a" fontFamily="Arial Black">KKR</text>
          <defs><linearGradient id="kkrG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#3A225D"/><stop offset="100%" stopColor="#0d0520"/></linearGradient></defs>
        </>
      )
    },
    DC: {
      bg: ["#0078BC","#004a80"],
      border: "#0060a0",
      content: (
        <>
          <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#dcG)"/>
          {/* Shield with tiger */}
          <path d={`M${s/2},${s*0.18} L${s*0.76},${s*0.32} L${s*0.76},${s*0.58} Q${s/2},${s*0.82} ${s/2},${s*0.82} Q${s*0.24},${s*0.82} ${s*0.24},${s*0.58} L${s*0.24},${s*0.32} Z`} fill="#001a40" stroke="#e8e8e8" strokeWidth="1.5"/>
          {/* Tiger face */}
          <ellipse cx={s/2} cy={s*0.5} rx={s*0.14} ry={s*0.12} fill="#f97316"/>
          <circle cx={s*0.44} cy={s*0.47} r={s*0.025} fill="#001a40"/>
          <circle cx={s*0.56} cy={s*0.47} r={s*0.025} fill="#001a40"/>
          <path d={`M${s*0.44},${s*0.54} Q${s/2},${s*0.58} ${s*0.56},${s*0.54}`} stroke="#001a40" strokeWidth="1" fill="none"/>
          <text x={s/2} y={s*0.74} textAnchor="middle" fontSize={s*0.1} fontWeight="900" fill="#e8e8e8" fontFamily="Arial Black">DC</text>
          <defs><linearGradient id="dcG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#0090d0"/><stop offset="100%" stopColor="#003060"/></linearGradient></defs>
        </>
      )
    },
    RR: {
      bg: ["#E91E8C","#a00060"],
      border: "#c0006a",
      content: (
        <>
          <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#rrG)"/>
          {/* RR monogram */}
          <circle cx={s/2} cy={s*0.44} r={s*0.28} fill="none" stroke="#c8960a" strokeWidth="2"/>
          <text x={s/2} y={s*0.5} textAnchor="middle" fontSize={s*0.22} fontWeight="900" fill="#c8960a" fontFamily="serif" fontStyle="italic">RR</text>
          <text x={s/2} y={s*0.76} textAnchor="middle" fontSize={s*0.09} fontWeight="700" fill="#ffd0e8" fontFamily="Arial">ROYALS</text>
          <defs><linearGradient id="rrG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#E91E8C"/><stop offset="100%" stopColor="#800040"/></linearGradient></defs>
        </>
      )
    },
    PBKS: {
      bg: ["#AA2222","#7a0808"],
      border: "#cc2222",
      content: (
        <>
          <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#pbksG)"/>
          {/* Lion */}
          <ellipse cx={s/2} cy={s*0.44} rx={s*0.2} ry={s*0.18} fill="#c8960a"/>
          {[0,45,90,135,180,225,270,315].map((deg,i)=>(
            <ellipse key={i} cx={s/2+Math.cos(deg*Math.PI/180)*s*0.2} cy={s*0.44+Math.sin(deg*Math.PI/180)*s*0.2} rx={s*0.055} ry={s*0.055} fill="#d4790a" transform={`rotate(${deg},${s/2+Math.cos(deg*Math.PI/180)*s*0.2},${s*0.44+Math.sin(deg*Math.PI/180)*s*0.2})`}/>
          ))}
          <ellipse cx={s/2} cy={s*0.42} rx={s*0.1} ry={s*0.09} fill="#f5c842"/>
          <text x={s/2} y={s*0.75} textAnchor="middle" fontSize={s*0.12} fontWeight="900" fill="#fff" fontFamily="Arial Black">PBKS</text>
          <defs><linearGradient id="pbksG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#cc3333"/><stop offset="100%" stopColor="#600000"/></linearGradient></defs>
        </>
      )
    },
    GT: {
      bg: ["#1B2A4A","#0d1828"],
      border: "#2a4070",
      content: (
        <>
          <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#gtG)"/>
          {/* Triangle/titans */}
          <polygon points={`${s/2},${s*0.18} ${s*0.78},${s*0.72} ${s*0.22},${s*0.72}`} fill="none" stroke="#c8960a" strokeWidth="2.5"/>
          <polygon points={`${s/2},${s*0.28} ${s*0.68},${s*0.65} ${s*0.32},${s*0.65}`} fill="#c8960a" opacity="0.3"/>
          <text x={s/2} y={s*0.56} textAnchor="middle" fontSize={s*0.16} fontWeight="900" fill="#c8960a" fontFamily="Arial Black">GT</text>
          <defs><linearGradient id="gtG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#243555"/><stop offset="100%" stopColor="#080e1e"/></linearGradient></defs>
        </>
      )
    },
    LSG: {
      bg: ["#A0C4FF","#6a9edf"],
      border: "#5a8ecf",
      content: (
        <>
          <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#lsgG)"/>
          {/* Wings */}
          <path d={`M${s/2},${s*0.5} Q${s*0.25},${s*0.3} ${s*0.15},${s*0.5} Q${s*0.25},${s*0.45} ${s/2},${s*0.6}`} fill="#1a3a6a" opacity="0.8"/>
          <path d={`M${s/2},${s*0.5} Q${s*0.75},${s*0.3} ${s*0.85},${s*0.5} Q${s*0.75},${s*0.45} ${s/2},${s*0.6}`} fill="#1a3a6a" opacity="0.8"/>
          {/* cricket bat */}
          <rect x={s*0.46} y={s*0.28} width={s*0.08} height={s*0.3} rx={s*0.03} fill="#c8960a"/>
          <circle cx={s/2} cy={s*0.25} r={s*0.05} fill="#ef4444"/>
          <text x={s/2} y={s*0.78} textAnchor="middle" fontSize={s*0.11} fontWeight="900" fill="#1a3a6a" fontFamily="Arial Black">LSG</text>
          <defs><linearGradient id="lsgG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d0e8ff"/><stop offset="100%" stopColor="#80b0e8"/></linearGradient></defs>
        </>
      )
    }
  };

  const cfg = configs[team] || configs.CSK;

  return (
    <div style={{ width: s, height: s, borderRadius: "50%", overflow: "hidden", flexShrink: 0, position: "relative", background: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {!imgError ? (
        <img
          src={logoUrl}
          alt={team}
          style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }}
          onError={() => setImgError(true)}
        />
      ) : (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ borderRadius: "50%" }}>
          {cfg.content}
        </svg>
      )}
    </div>
  );
};

// ─── Match Data ───────────────────────────────────────────────────────────────
const MOCK_DATA = {
  matches: [
    { id:1,  date:"28/03/26", day:"Sat", home:"Royal Challengers Bengaluru", away:"Sunrisers Hyderabad",         homeShort:"RCB", awayShort:"SRH", venue:"Bengaluru", matchType:"evening", streamUrl:STREAM_URL },
    { id:2,  date:"29/03/26", day:"Sun", home:"Mumbai Indians",               away:"Kolkata Knight Riders",       homeShort:"MI",  awayShort:"KKR", venue:"Mumbai",    matchType:"evening", streamUrl:STREAM_URL },
    { id:3,  date:"30/03/26", day:"Mon", home:"Rajasthan Royals",             away:"Chennai Super Kings",         homeShort:"RR",  awayShort:"CSK", venue:"Guwahati",  matchType:"evening", streamUrl:STREAM_URL },
    { id:4,  date:"31/03/26", day:"Tue", home:"Punjab Kings",                 away:"Gujarat Titans",              homeShort:"PBKS",awayShort:"GT",  venue:"Mullanpur", matchType:"evening", streamUrl:STREAM_URL },
    { id:5,  date:"01/04/26", day:"Wed", home:"Lucknow Super Giants",         away:"Delhi Capitals",              homeShort:"LSG", awayShort:"DC",  venue:"Lucknow",   matchType:"evening", streamUrl:STREAM_URL },
    { id:6,  date:"02/04/26", day:"Thu", home:"Kolkata Knight Riders",        away:"Sunrisers Hyderabad",         homeShort:"KKR", awayShort:"SRH", venue:"Kolkata",   matchType:"evening", streamUrl:STREAM_URL },
    { id:7,  date:"03/04/26", day:"Fri", home:"Chennai Super Kings",          away:"Punjab Kings",                homeShort:"CSK", awayShort:"PBKS",venue:"Chennai",   matchType:"evening", streamUrl:STREAM_URL },
    { id:8,  date:"04/04/26", day:"Sat", home:"Delhi Capitals",               away:"Mumbai Indians",              homeShort:"DC",  awayShort:"MI",  venue:"Delhi",     matchType:"day",     streamUrl:STREAM_URL },
    { id:9,  date:"04/04/26", day:"Sat", home:"Gujarat Titans",               away:"Rajasthan Royals",            homeShort:"GT",  awayShort:"RR",  venue:"Ahmedabad", matchType:"evening", streamUrl:STREAM_URL },
    { id:10, date:"05/04/26", day:"Sun", home:"Sunrisers Hyderabad",          away:"Lucknow Super Giants",        homeShort:"SRH", awayShort:"LSG", venue:"Hyderabad", matchType:"day",     streamUrl:STREAM_URL },
    { id:11, date:"05/04/26", day:"Sun", home:"Royal Challengers Bengaluru",  away:"Chennai Super Kings",         homeShort:"RCB", awayShort:"CSK", venue:"Bengaluru", matchType:"evening", streamUrl:STREAM_URL },
    { id:12, date:"06/04/26", day:"Mon", home:"Kolkata Knight Riders",        away:"Punjab Kings",                homeShort:"KKR", awayShort:"PBKS",venue:"Kolkata",   matchType:"evening", streamUrl:STREAM_URL },
    { id:13, date:"07/04/26", day:"Tue", home:"Rajasthan Royals",             away:"Mumbai Indians",              homeShort:"RR",  awayShort:"MI",  venue:"Guwahati",  matchType:"evening", streamUrl:STREAM_URL },
    { id:14, date:"08/04/26", day:"Wed", home:"Delhi Capitals",               away:"Gujarat Titans",              homeShort:"DC",  awayShort:"GT",  venue:"Delhi",     matchType:"evening", streamUrl:STREAM_URL },
    { id:15, date:"09/04/26", day:"Thu", home:"Kolkata Knight Riders",        away:"Lucknow Super Giants",        homeShort:"KKR", awayShort:"LSG", venue:"Kolkata",   matchType:"evening", streamUrl:STREAM_URL },
    { id:16, date:"10/04/26", day:"Fri", home:"Rajasthan Royals",             away:"Royal Challengers Bengaluru", homeShort:"RR",  awayShort:"RCB", venue:"Guwahati",  matchType:"evening", streamUrl:STREAM_URL },
    { id:17, date:"11/04/26", day:"Sat", home:"Punjab Kings",                 away:"Sunrisers Hyderabad",         homeShort:"PBKS",awayShort:"SRH", venue:"Mullanpur", matchType:"day",     streamUrl:STREAM_URL },
    { id:18, date:"11/04/26", day:"Sat", home:"Chennai Super Kings",          away:"Delhi Capitals",              homeShort:"CSK", awayShort:"DC",  venue:"Chennai",   matchType:"evening", streamUrl:STREAM_URL },
    { id:19, date:"12/04/26", day:"Sun", home:"Lucknow Super Giants",         away:"Gujarat Titans",              homeShort:"LSG", awayShort:"GT",  venue:"Lucknow",   matchType:"day",     streamUrl:STREAM_URL },
    { id:20, date:"12/04/26", day:"Sun", home:"Mumbai Indians",               away:"Royal Challengers Bengaluru", homeShort:"MI",  awayShort:"RCB", venue:"Mumbai",    matchType:"evening", streamUrl:STREAM_URL }
  ]
};

const teamBg = {
  CSK:"#F9CD05", MI:"#004BA0", RCB:"#EC1C24", SRH:"#F26522",
  KKR:"#3A225D", DC:"#0078BC", RR:"#E91E8C",  PBKS:"#AA2222",
  GT:"#1B2A4A",  LSG:"#A0C4FF"
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-300% 0}100%{background-position:300% 0}}
  @keyframes glow{0%,100%{box-shadow:0 0 10px #ff2d2d44}50%{box-shadow:0 0 24px #ff2d2dbb}}
  .pulse{animation:pulse 1.3s ease-in-out infinite}
  .fade-up{animation:fadeUp .38s ease both}
  .card{transition:transform .18s ease,box-shadow .18s ease}
  .card:hover{transform:translateY(-2px)}
  .btn-watch{transition:filter .15s,transform .12s;cursor:pointer}
  .btn-watch:hover{filter:brightness(1.1);transform:scale(1.01)}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-thumb{background:#1a2a3a;border-radius:4px}
`;

function LiveBadge() {
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:"#ff2d2d",color:"#fff",fontSize:10,fontWeight:800,letterSpacing:1.5,padding:"3px 10px",borderRadius:20,textTransform:"uppercase",animation:"glow 2s infinite",whiteSpace:"nowrap" }}>
      <span className="pulse" style={{ width:6,height:6,borderRadius:"50%",background:"#fff",display:"inline-block" }}/>LIVE
    </span>
  );
}

function SayanBadge({ isLive }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0 }}>
      <div style={{
        width:48,height:48,borderRadius:12,
        background:isLive?"linear-gradient(145deg,#0f1e3a,#0a1222)":"#090f1a",
        border:isLive?"2px solid #f97316":"1.5px solid #111e2e",
        boxShadow:isLive?"0 0 14px #f9731633":"none",
        display:"flex",alignItems:"center",justifyContent:"center",position:"relative"
      }}>
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
          <rect x="17" y="3" width="4" height="16" rx="2" fill="#f59e0b" transform="rotate(12 18 18)"/>
          <circle cx="10" cy="8" r="4" fill="#ef4444"/>
          <path d="M8 7 Q10 8.5 12 7" stroke="#fca5a5" strokeWidth="0.7" fill="none"/>
        </svg>
        {isLive && <span className="pulse" style={{ position:"absolute",bottom:3,right:3,width:7,height:7,borderRadius:"50%",background:"#ff2d2d",boxShadow:"0 0 5px #ff2d2d" }}/>}
      </div>
      <span style={{ fontSize:7,fontWeight:800,letterSpacing:.5,color:isLive?"#f97316":"var(--text-muted)",textTransform:"uppercase" }}>SAYAN-IPL</span>
    </div>
  );
}

// ─── Player Modal ─────────────────────────────────────────────────────────────
function PlayerModal({ match, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"#000000f2",display:"flex",flexDirection:"column" }} onClick={onClose}>
      <div style={{ background:"#0a1020",borderBottom:"1px solid #1a2535",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <TeamLogo team={match.homeShort} size={32}/>
          <div>
            <div style={{ color:"#fff",fontWeight:800,fontSize:13,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1 }}>
              {match.homeShort} <span style={{ color:"#f97316" }}>VS</span> {match.awayShort}
            </div>
            <div style={{ display:"flex",gap:6,alignItems:"center" }}><LiveBadge/><span style={{ color:"var(--text-muted)",fontSize:10 }}>Star Sports 1 Hindi</span></div>
          </div>
          <TeamLogo team={match.awayShort} size={32}/>
        </div>
        <button onClick={onClose} style={{ background:"#1a2535",border:"1px solid #243040",color:"#8090a0",borderRadius:9,padding:"5px 14px",cursor:"pointer",fontSize:13,fontWeight:700 }}>✕</button>
      </div>
      <div style={{ flex:1,overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
        <iframe src={match.streamUrl} style={{ width:"100%",height:"100%",border:"none" }}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen title="Live Stream"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"/>
      </div>
      <div style={{ background:"#070c14",borderTop:"1px solid #0d1a28",padding:"6px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}
        onClick={e=>e.stopPropagation()}>
        <span style={{ color:"#1e3040",fontSize:10 }}>Powered by <span style={{ color:"#f97316",fontWeight:700 }}>SAYAN-IPTV</span></span>
        <a href={match.streamUrl} target="_blank" rel="noopener noreferrer" style={{ color:"#2a5a80",fontSize:10,textDecoration:"none",fontWeight:600 }}>Open in new tab ↗</a>
      </div>
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ match, index, status, onWatch }) {
  const isLive = status === "live";
  const isDone = status === "completed";
  const startTime = match.matchType === "day" ? "2:00 PM" : "6:00 PM";

  return (
    <div className="card fade-up" style={{ animationDelay:`${index*42}ms` }}>
      <div style={{
        borderRadius:18,
        background: isLive
          ? "linear-gradient(135deg,#140408,#1a0c00,#0c1018)"
          : isDone ? "var(--card-bg)" : "var(--card-bg-alt)",
        border: isLive?"1.5px solid #ff2d2d33": isDone?"1.5px solid var(--card-border)":"1.5px solid var(--card-border)",
        overflow:"hidden",position:"relative",
        boxShadow:isLive?"0 4px 28px #ff2d2d18":"none",
        opacity:isDone?.5:1
      }}>
        {isLive && (
          <div style={{ position:"absolute",top:0,left:0,right:0,height:2.5,
            background:"linear-gradient(90deg,transparent,#ff2d2d,#f97316,#ff2d2d,transparent)",
            backgroundSize:"300% 100%",animation:"shimmer 2.8s linear infinite" }}/>
        )}

        <div style={{ padding:"13px 14px" }}>
          {/* Top row */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ background:"rgba(255,255,255,0.05)",color:"var(--text-muted)",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20 }}>Match {match.id}</span>
              {isLive?<LiveBadge/>:isDone
                ?<span style={{ background:"var(--tab-btn-bg)",color:"var(--text-muted)",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20 }}>✓ Completed</span>
                :<span style={{ background:"var(--tab-btn-bg)",color:"var(--text-secondary)",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20 }}>🕐 {startTime} IST</span>}
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:4 }}>
              <span style={{ fontSize:10 }}>{match.matchType==="day"?"☀️":"🌙"}</span>
              <span style={{ color:"var(--text-muted)",fontSize:9 }}>{match.day} {match.date} · {match.venue}</span>
            </div>
          </div>

          {/* Teams row with REAL logos */}
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <div style={{ flex:1,display:"flex",alignItems:"center" }}>

              {/* Home team */}
              <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
                <div style={{ position:"relative" }}>
                  <TeamLogo team={match.homeShort} size={56}/>
                  {/* Colored ring behind logo */}
                  <div style={{ position:"absolute",inset:-3,borderRadius:"50%",border:`2.5px solid ${teamBg[match.homeShort]}44`,pointerEvents:"none" }}/>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ color:isDone?"var(--text-muted)":"var(--text-primary)",fontWeight:900,fontSize:13,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1.2 }}>{match.homeShort}</div>
                  <div style={{ color:"var(--text-secondary)",opacity:0.8,fontSize:8.5,marginTop:1,lineHeight:1.2 }}>{match.home.split(" ").slice(-2).join(" ")}</div>
                </div>
              </div>

              {/* VS */}
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"0 4px",minWidth:40 }}>
                <div style={{ color:isLive?"#ff4422":"var(--text-secondary)",fontSize:14,fontWeight:900,letterSpacing:2,fontFamily:"'Bebas Neue',sans-serif" }}>VS</div>
                {isLive && <span className="pulse" style={{ width:5,height:5,borderRadius:"50%",background:"#ff2d2d",marginTop:4 }}/>}
              </div>

              {/* Away team */}
              <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
                <div style={{ position:"relative" }}>
                  <TeamLogo team={match.awayShort} size={56}/>
                  <div style={{ position:"absolute",inset:-3,borderRadius:"50%",border:`2.5px solid ${teamBg[match.awayShort]}44`,pointerEvents:"none" }}/>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ color:isDone?"var(--text-muted)":"var(--text-primary)",fontWeight:900,fontSize:13,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1.2 }}>{match.awayShort}</div>
                  <div style={{ color:"var(--text-secondary)",opacity:0.8,fontSize:8.5,marginTop:1,lineHeight:1.2 }}>{match.away.split(" ").slice(-2).join(" ")}</div>
                </div>
              </div>
            </div>

            {/* Sayan badge */}
            <SayanBadge isLive={isLive}/>
          </div>

          {/* Watch button */}
          {isLive && (
            <button className="btn-watch" onClick={()=>onWatch(match)}
              style={{ width:"100%",marginTop:12,padding:"10px 0",background:"linear-gradient(90deg,#cc1500,#ff2d2d,#ff5500,#ff2d2d,#cc1500)",backgroundSize:"300% 100%",animation:"shimmer 3s linear infinite",border:"none",borderRadius:12,color:"#fff",fontSize:13,fontWeight:800,letterSpacing:.8,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              <span style={{ fontSize:14 }}>▶</span> WATCH LIVE NOW
            </button>
          )}
          {!isLive && !isDone && (
            <div style={{ marginTop:10,background:"rgba(0,0,0,0.2)",border:"1px solid var(--card-border)",borderRadius:9,padding:"6px 12px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ color:"var(--text-muted)",fontSize:11 }}>Starts {startTime} IST</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [activeMatch, setActiveMatch] = useState(null);
  const [clock, setClock] = useState(getISTClock());
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  useEffect(() => {
    const t = setInterval(() => setClock(getISTClock()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      if (JSON_URL) {
        try { const r = await fetch(JSON_URL); const d = await r.json(); setMatches(d.matches); }
        catch { setMatches(MOCK_DATA.matches); }
      } else { setMatches(MOCK_DATA.matches); }
      setLoading(false);
    })();
  }, []);

  const withStatus = matches.map(m => ({ ...m, _status: getMatchStatus(m) }));
  const liveNow = withStatus.filter(m => m._status === "live");
  const filtered = withStatus.filter(m =>
    tab==="live"?m._status==="live":tab==="upcoming"?m._status==="upcoming":true
  );

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg-gradient)",fontFamily:"'Inter',system-ui,sans-serif",color:"var(--text-primary)", transition: "all 0.3s ease" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ position:"sticky",top:0,zIndex:500,backdropFilter:"blur(18px)",background:"var(--header-bg)",borderBottom:"1px solid var(--card-border)" }}>
        <div style={{ maxWidth:680,margin:"0 auto",padding:"0 14px",height:58,display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:9,background:"#0a1628",border:"2px solid #f97316",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
              <rect x="17" y="3" width="4" height="16" rx="2" fill="#f59e0b" transform="rotate(12 18 18)"/>
              <circle cx="10" cy="8" r="4" fill="#ef4444"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:19,letterSpacing:2,lineHeight:1 }}>
              SAYAN<span style={{ color:"#f97316" }}>-IPL</span>
            </div>
            <div style={{ fontSize:8,color:"var(--text-muted)",letterSpacing:2,fontWeight:700 }}>IPL 2026 LIVE STREAMING</div>
          </div>
          <div style={{ flex:1 }}/>
          <button onClick={toggleTheme} style={{ background:"var(--tab-btn-bg)", border:"1px solid var(--card-border)", color:"var(--text-primary)", borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", marginRight:10, fontSize:18 }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"var(--text-secondary)",fontSize:10,fontWeight:700 }}>{clock}</div>
            {liveNow.length>0 && (
              <div style={{ display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4,marginTop:2 }}>
                <span className="pulse" style={{ width:5,height:5,borderRadius:"50%",background:"#ff2d2d",display:"inline-block" }}/>
                <span style={{ color:"#ff5050",fontSize:9,fontWeight:800 }}>{liveNow.length} LIVE</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:680,margin:"0 auto",padding:"14px 12px 50px" }}>

        {/* Team logos strip */}
        <div style={{ marginBottom:14,padding:"10px 12px",background:"var(--strip-bg)",borderRadius:14,border:"1px solid var(--strip-border)",overflowX:"auto" }}>
          <div style={{ display:"flex",gap:10,alignItems:"center",width:"max-content" }}>
            {["CSK","MI","RCB","SRH","KKR","DC","RR","PBKS","GT","LSG"].map(t=>(
              <div key={t} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                <TeamLogo team={t} size={38}/>
                <span style={{ fontSize:7.5,fontWeight:700,color:"var(--text-secondary)",letterSpacing:.5 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live banner */}
        {liveNow.length>0 && (
          <div className="fade-up" style={{ marginBottom:12,borderRadius:14,padding:"11px 14px",background:"linear-gradient(110deg,#1a0608,#1a0c00)",border:"1.5px solid #ff2d2d33",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <TeamLogo team={liveNow[0].homeShort} size={36}/>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:3 }}><LiveBadge/></div>
                <div style={{ color:"#fff",fontWeight:800,fontSize:13 }}>{liveNow[0].homeShort} vs {liveNow[0].awayShort}</div>
                <div style={{ color:"rgba(255,255,255,0.6)",fontSize:10 }}>Star Sports 1 Hindi · {liveNow[0].matchType==="day"?"2:00":"6:00"} PM – 2:00 AM IST</div>
              </div>
              <TeamLogo team={liveNow[0].awayShort} size={36}/>
            </div>
            <button className="btn-watch" onClick={()=>setActiveMatch(liveNow[0])} style={{ background:"#ff2d2d",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontWeight:800,fontSize:12,flexShrink:0,borderRadius:10 }}>
              ▶ Watch
            </button>
          </div>
        )}

        {/* Schedule bar */}
        <div style={{ marginBottom:12,borderRadius:12,padding:"9px 13px",background:"var(--strip-bg)",border:"1px solid var(--strip-border)",display:"flex",gap:14,flexWrap:"wrap",alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span>🌙</span><div><div style={{ color:"var(--text-secondary)",fontWeight:700,fontSize:11 }}>Evening</div><div style={{ color:"var(--text-muted)",fontSize:9 }}>6:00 PM – 2:00 AM IST</div></div>
          </div>
          <div style={{ width:1,height:28,background:"var(--strip-border)" }}/>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span>☀️</span><div><div style={{ color:"var(--text-secondary)",fontWeight:700,fontSize:11 }}>Day</div><div style={{ color:"var(--text-muted)",fontSize:9 }}>2:00 PM – 2:00 AM IST</div></div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:5,marginBottom:12,background:"var(--tab-bg)",borderRadius:13,padding:4,border:"1px solid var(--strip-border)" }}>
          {[["all","🏏 All (20)"],["live","🔴 Live"],["upcoming","🕐 Upcoming"]].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{ flex:1,padding:"8px 4px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:800,fontSize:10.5,background:tab===key?(key==="live"?"#ff2d2d":key==="upcoming"?"var(--tab-btn-bg)":"var(--tab-btn-bg)"):"transparent",color:tab===key?"#fff":"var(--tab-btn-text)",transition:"all .18s" }}>{label}</button>
          ))}
        </div>

        {/* Cards */}
        {loading
          ? <div style={{ textAlign:"center",padding:70,color:"#1e3040" }}><div style={{ fontSize:38,marginBottom:12 }}>🏏</div><div style={{ fontWeight:700 }}>Loading...</div></div>
          : <div style={{ display:"flex",flexDirection:"column",gap:9 }}>
              {filtered.map((m,i)=><MatchCard key={m.id} match={m} index={i} status={m._status} onWatch={setActiveMatch}/>)}
              {filtered.length===0 && <div style={{ textAlign:"center",padding:60,color:"#1a2a3a",fontSize:13 }}>No matches here.</div>}
            </div>
        }

        <div style={{ marginTop:24,textAlign:"center",color:"var(--text-muted)",fontSize:10,lineHeight:2 }}>
          <span style={{ color:"#f97316",fontWeight:800 }}>SAYAN-IPL</span> · Star Sports 1 Hindi<br/>
          Watch Live button appears automatically during match hours
        </div>
      </div>

      {activeMatch && <PlayerModal match={activeMatch} onClose={()=>setActiveMatch(null)}/>}
    </div>
  );
}
