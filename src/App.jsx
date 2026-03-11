import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#F5F0E8", bg2: "#EDE7D9", ink: "#1A1612", ink2: "#4A3F35",
  ink3: "#8A7D72", accent: "#E85D26", accent2: "#F2A65A",
  cream: "#FBF7F0", border: "#D4C9B8",
};

const OFFERINGS = [
  { num:"01", icon:"📱", title:"Build Apps",
    desc:"Native mobile apps for iOS and Android. From fitness trackers to coach CRMs — I build tools that real people actually use.",
    tags:["iOS","Android","React Native","LINE Mini App"] },
  { num:"02", icon:"🌐", title:"Design Websites",
    desc:"Business websites and LINE bot systems built for the Thai market. Fast, professional, and actually drives customers.",
    tags:["Landing Pages","LINE OA","Web Apps","Thai Market"] },
  { num:"03", icon:"⛓️", title:"Web3 Events Bangkok",
    desc:"Your go-to for crypto and blockchain events in Bangkok. Two Avalanche events done, 6-week bootcamp incoming.",
    tags:["Avalanche","Community","Bangkok","Bootcamps"] },
];

const PRICING = [
  { name:"Starter", price:"฿15K", period:"one-time setup", featured:false,
    features:["Single-page website","Mobile responsive design","LINE OA basic setup","Contact form + Google Maps","1 round of revisions"] },
  { name:"Growth", price:"฿35K", period:"setup + ฿6.5K/month optional", featured:true,
    features:["Multi-page website","LINE bot with auto-replies","Product or service catalogue","Lead capture + CRM integration","Monthly maintenance available","3 rounds of revisions"] },
  { name:"Pro", price:"฿65K", period:"setup + ฿9.5K/month optional", featured:false,
    features:["Full web app or mobile app","Advanced LINE bot system","Admin dashboard","Order management or booking","Priority support + SLA","Unlimited revisions"] },
];

function useReveal() {
  const ref = useRef();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.top < window.innerHeight) { setVisible(true); return; }
    }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay=0, style={} }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{ opacity:visible?1:0, transform:visible?"none":"translateY(24px)", transition:`opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

function AvalancheCard() {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const photos = ["/avalanche-group.jpg", "/avalanche-speaker.jpg"];

  useEffect(() => {
    const t = setInterval(() => setPhotoIdx(i => (i+1)%2), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="work-card" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background:C.cream, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", gridColumn:"span 2", display:"grid", gridTemplateColumns:"1fr 1fr" }}>
      <div style={{ position:"relative", overflow:"hidden", minHeight:240 }}>
        <img src={photos[photoIdx]} alt="Avalanche Bangkok"
          style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.6s ease", transform:hovered?"scale(1.04)":"scale(1)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent 60%,rgba(251,247,240,0.95))" }} />
        <div style={{ position:"absolute", top:12, left:12, background:"rgba(26,22,18,0.75)", backdropFilter:"blur(8px)", borderRadius:100, padding:"4px 12px", fontSize:10, fontWeight:700, color:"#F2A65A", letterSpacing:1.5 }}>
          AVALANCHE × BINANCE TH
        </div>
        <div style={{ position:"absolute", bottom:12, left:12, display:"flex", gap:4 }}>
          {[0,1].map(i => (
            <div key={i} style={{ width:photoIdx===i?20:6, height:6, borderRadius:3, background:photoIdx===i?"#E85D26":"rgba(255,255,255,0.4)", transition:"width 0.3s ease" }} />
          ))}
        </div>
      </div>
      <div style={{ padding:"28px 24px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <span style={{ fontSize:10, padding:"4px 10px", borderRadius:100, fontWeight:700, background:"#F2A65A22", color:"#F2A65A", border:"1px solid #F2A65A44", display:"inline-block", marginBottom:14 }}>WEB3</span>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, marginBottom:10, letterSpacing:-0.5 }}>Avalanche Bangkok</h3>
          <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, fontWeight:300, marginBottom:16 }}>
            Organised 2 community events in Bangkok with Binance TH. Bringing the Avalanche ecosystem to Southeast Asia — builders, developers, and crypto-curious locals all in one room.
          </p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
            {["Bangkok","Avalanche","Binance TH","Community","Web3"].map(t => (
              <span key={t} style={{ fontSize:11, padding:"4px 10px", background:C.bg2, borderRadius:100, color:C.ink2 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:C.ink3 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:C.accent, display:"inline-block", animation:"blink 2s ease-in-out infinite" }} />
          Bootcamp starting soon
        </div>
      </div>
    </div>
  );
}

function WorkCard({ item }) {
  return (
    <div className="work-card" style={{ background:C.cream, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <div style={{ height:160, background:item.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, position:"relative", overflow:"hidden" }}>
        {item.photo
          ? <img src={item.photo} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.85 }} />
          : item.emoji
        }
        <span style={{ position:"absolute", top:10, right:10, fontSize:9, padding:"3px 8px", borderRadius:100, fontWeight:700, background:`${item.tagColor}22`, color:item.tagColor, border:`1px solid ${item.tagColor}44` }}>{item.tag}</span>
      </div>
      <div style={{ padding:"16px 18px 20px", display:"flex", flexDirection:"column", flex:1 }}>
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, marginBottom:8, letterSpacing:-0.3 }}>{item.title}</h3>
        <p style={{ fontSize:12, color:C.ink2, lineHeight:1.6, marginBottom:12, fontWeight:300, flex:1 }}>{item.desc}</p>
        {item.appStore && (
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            <div style={{ background:C.ink, borderRadius:6, padding:"5px 10px", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontSize:11 }}>🍎</span>
              <div>
                <div style={{ fontSize:7, color:"#8A7D72", letterSpacing:0.5 }}>COMING TO</div>
                <div style={{ fontSize:9, fontWeight:700, color:C.bg2, letterSpacing:0.3 }}>App Store</div>
              </div>
            </div>
          </div>
        )}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:C.ink3 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.accent, display:"inline-block", animation:"blink 2s ease-in-out infinite" }} />
            {item.status}
          </div>
          {item.link && item.link !== "#" && (
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, fontWeight:600, color:C.accent, textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
              View project <span>→</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const WORK_ITEMS = [
  { emoji:"🗺️", title:"IronMap", desc:"Equipment-aware gym training app with community accountability groups and daily habit check-ins.", tag:"APP", tagColor:"#E8FF47", bg:"linear-gradient(135deg,#080C0F,#1A2830)", status:"TestFlight — launching soon", link:"https://ironmap.vercel.app", appStore:true },
  { emoji:"📊", title:"CoachProof", desc:"Mobile CRM for weight management coaches. Tanita body composition tracking, before/after photos, client progress.", tag:"APP", tagColor:"#10B981", bg:"linear-gradient(135deg,#0D1B0F,#1A3020)", status:"TestFlight — launching soon", link:"https://coachproof.vercel.app", appStore:true, photo:"/coachproof-icon.jpg" },
  { emoji:"🏀", title:"EIS Chill Pai Nai", desc:"Bangkok Wednesday basketball league — live standings, box scores, player stat cards. Built from STATASTIC screenshots in one session.", tag:"WEB APP", tagColor:"#4EA8FF", bg:"linear-gradient(135deg,#050D1A,#0A1A2E)", status:"Live — updated weekly", link:"https://eis-league.vercel.app" },
];

export default function Shamwise() {
  return (
    <div style={{ fontFamily:"'DM Sans','Outfit',sans-serif", background:C.bg, color:C.ink, overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .nav-link{color:${C.ink2};text-decoration:none;font-size:13px;letter-spacing:0.5px;transition:color 0.2s}
        .nav-link:hover{color:${C.accent}}
        .offering-card{background:${C.cream};transition:background 0.25s}
        .offering-card:hover{background:${C.bg2}}
        .work-card{transition:transform 0.25s,box-shadow 0.25s;cursor:pointer}
        .work-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(26,22,18,0.12)}
        .pricing-card{transition:transform 0.2s}
        .pricing-card:hover{transform:translateY(-3px)}
        .cta-btn{transition:transform 0.2s,box-shadow 0.2s;display:inline-flex;align-items:center;gap:10px}
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(232,93,38,0.3)}
      `}</style>

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:100, padding:"18px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", background:`${C.bg}ee`, backdropFilter:"blur(8px)", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, letterSpacing:-0.5 }}>Shamwise Studios</span>
        <div style={{ display:"flex", gap:32 }}>
          {["offerings","portfolio","pricing","about","contact"].map(s => (
            <a key={s} href={`#${s}`} className="nav-link" style={{ textTransform:"capitalize" }}>{s}</a>
          ))}
        </div>
        <div style={{ background:C.ink, color:C.bg, padding:"8px 18px", borderRadius:100, fontSize:12, fontWeight:600 }}>Available for projects</div>
      </nav>

      {/* HERO */}
      <section style={{ padding:"80px 48px 72px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"end", background:C.bg, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,${C.accent2}30 0%,transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:11, letterSpacing:3, color:C.accent, textTransform:"uppercase", marginBottom:20, display:"flex", alignItems:"center", gap:10, animation:"fadeUp 0.8s ease 0.2s both" }}>
            <span style={{ width:24, height:1, background:C.accent, display:"inline-block" }} /> Bangkok, Thailand
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(48px,5.5vw,80px)", lineHeight:0.95, letterSpacing:-3, marginBottom:28, animation:"fadeUp 0.8s ease 0.35s both" }}>
            Build<br />
            <span style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontWeight:400, color:C.accent, letterSpacing:-2 }}>things</span><br />
            that work.
          </h1>
          <p style={{ fontSize:16, lineHeight:1.7, color:C.ink2, maxWidth:380, marginBottom:32, fontWeight:300, animation:"fadeUp 0.8s ease 0.5s both" }}>
            Apps, websites, and Web3 events — built by a solo studio that ships real products, not just mockups.
          </p>
          <a href="#contact" className="cta-btn" style={{ background:C.accent, color:"white", padding:"15px 32px", borderRadius:100, fontSize:14, fontWeight:600, textDecoration:"none", animation:"fadeUp 0.8s ease 0.65s both" }}>
            Start a project <span style={{ fontSize:18 }}>→</span>
          </a>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:20, animation:"fadeUp 0.8s ease 0.6s both" }}>
          <div style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontSize:56, color:C.ink3, textAlign:"right", lineHeight:1 }}>Bangkok<br />based.</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
            {["2 Apps in TestFlight","2 Avalanche Events","Bootcamp Incoming"].map(t => (
              <span key={t} style={{ background:C.ink, color:C.bg2, padding:"6px 14px", borderRadius:100, fontSize:11, fontWeight:500 }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ background:C.ink, padding:"13px 0", overflow:"hidden", borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:"marquee 18s linear infinite" }}>
          {[...Array(2)].map((_,ri) =>
            ["Mobile Apps","Web Design","LINE Bot Systems","Web3 Events","Bangkok","Avalanche","iOS & Android","React Native"].map((item,i) => (
              <span key={`${ri}-${i}`} style={{ display:"inline-flex", alignItems:"center", gap:20, padding:"0 28px", fontSize:12, letterSpacing:2, color:C.bg2, textTransform:"uppercase", fontWeight:500 }}>
                {item} <span style={{ width:5, height:5, borderRadius:"50%", background:C.accent, display:"inline-block" }} />
              </span>
            ))
          )}
        </div>
      </div>

      {/* OFFERINGS */}
      <section id="offerings" style={{ padding:"80px 48px", background:C.cream }}>
        <div style={{ fontSize:10, letterSpacing:4, color:C.ink3, marginBottom:48, display:"flex", alignItems:"center", gap:12 }}>
          WHAT I DO <span style={{ width:60, height:1, background:C.border, display:"inline-block" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2, background:C.border, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
          {OFFERINGS.map((o,i) => (
            <Reveal key={o.num} delay={i*0.1}>
              <div className="offering-card" style={{ padding:"36px 32px", height:"100%" }}>
                <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:52, color:C.border, lineHeight:1, marginBottom:20 }}>{o.num}</div>
                <div style={{ fontSize:26, marginBottom:14 }}>{o.icon}</div>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, marginBottom:12, letterSpacing:-0.5 }}>{o.title}</h3>
                <p style={{ fontSize:13, lineHeight:1.7, color:C.ink2, marginBottom:20, fontWeight:300 }}>{o.desc}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {o.tags.map(t => <span key={t} style={{ fontSize:11, padding:"4px 10px", background:C.bg2, borderRadius:100, color:C.ink2 }}>{t}</span>)}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" style={{ padding:"80px 48px", background:C.bg }}>
        <div style={{ fontSize:10, letterSpacing:4, color:C.ink3, marginBottom:48, display:"flex", alignItems:"center", gap:12 }}>
          RECENT WORK <span style={{ width:60, height:1, background:C.border, display:"inline-block" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          <Reveal delay={0}><AvalancheCard /></Reveal>
          {WORK_ITEMS.map((item,i) => (
            <Reveal key={item.title} delay={(i+1)*0.08}><WorkCard item={item} /></Reveal>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding:"80px 48px", background:C.cream }}>
        <div style={{ fontSize:10, letterSpacing:4, color:C.ink3, marginBottom:48, display:"flex", alignItems:"center", gap:12 }}>
          PRICING <span style={{ width:60, height:1, background:C.border, display:"inline-block" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, alignItems:"start" }}>
          {PRICING.map((p,i) => (
            <Reveal key={p.name} delay={i*0.1}>
              <div className="pricing-card" style={{ background:p.featured?C.ink:C.bg, border:`1px solid ${p.featured?C.ink:C.border}`, borderRadius:14, padding:"32px 28px", position:"relative", color:p.featured?C.bg:C.ink }}>
                {p.featured && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:C.accent, color:"white", fontSize:10, fontWeight:700, letterSpacing:1.5, padding:"5px 16px", borderRadius:100, whiteSpace:"nowrap" }}>MOST POPULAR</div>}
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:p.featured?C.accent2:C.ink3, marginBottom:12, fontFamily:"monospace" }}>{p.name.toUpperCase()}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:40, letterSpacing:-2, lineHeight:1, marginBottom:4 }}>{p.price}</div>
                <div style={{ fontSize:12, color:p.featured?"#6B5040":C.ink3, marginBottom:24 }}>{p.period}</div>
                <div style={{ height:1, background:p.featured?"#2D2620":C.border, marginBottom:20 }} />
                <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize:13, color:p.featured?"#B0A090":C.ink2, display:"flex", gap:8, alignItems:"flex-start", fontWeight:300 }}>
                      <span style={{ color:C.accent, fontWeight:700, flexShrink:0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" style={{ display:"block", width:"100%", padding:13, borderRadius:10, textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none", background:p.featured?C.accent:"transparent", color:p.featured?"white":C.ink, border:p.featured?"none":`1px solid ${C.border}` }}>Get started</a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding:"80px 48px", background:C.ink, color:C.bg }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:4, color:"#4A3F35", marginBottom:32, display:"flex", alignItems:"center", gap:12 }}>
              ABOUT <span style={{ width:60, height:1, background:"#2D2620", display:"inline-block" }} />
            </div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(32px,3.5vw,52px)", letterSpacing:-2, lineHeight:1.05, marginBottom:24 }}>
              A builder<br />
              <span style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontWeight:400, color:C.accent2 }}>who ships.</span>
            </h2>
            <p style={{ fontSize:15, lineHeight:1.8, color:"#8A7D72", marginBottom:20, fontWeight:300 }}>
              I'm Sam — the person behind Shamwise Studios. I build apps, websites, and run Web3 events out of Bangkok. I don't have a big team or a fancy office. What I have is the ability to take an idea and make it real, fast.
            </p>
            <p style={{ fontSize:15, lineHeight:1.8, color:"#8A7D72", marginBottom:32, fontWeight:300 }}>
              While building IronMap and CoachProof (both in TestFlight), I realised I could help local businesses get the same quality of digital presence. So I started doing that too.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, padding:24, background:"#0D0A08", borderRadius:12, border:"1px solid #2D2620" }}>
              {[["2","Apps in TestFlight"],["2+","Events run"],["BKK","Based in Bangkok"]].map(([num,label]) => (
                <div key={label}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:30, color:C.accent2, lineHeight:1, letterSpacing:-1, marginBottom:4 }}>{num}</div>
                  <div style={{ fontSize:11, color:"#4A3F35", letterSpacing:0.5, lineHeight:1.4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <Reveal>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { icon:"📱", title:"I build things I'd actually use", body:"IronMap and CoachProof came from real problems I saw in the fitness world. That's the filter I apply to every project." },
                { icon:"🇹🇭", title:"Deep in the Bangkok ecosystem", body:"LINE, local payment flows, Thai business culture — I build for the market, not against it." },
                { icon:"⛓️", title:"Web3 projects welcome", body:"Running Avalanche events in Bangkok with Binance TH means I'm plugged into the regional crypto scene." },
              ].map(card => (
                <div key={card.title} style={{ background:"#0D0A08", border:"1px solid #2D2620", borderRadius:12, padding:"20px 22px", transition:"border-color 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#4A3F35"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#2D2620"}>
                  <div style={{ fontSize:22, marginBottom:8 }}>{card.icon}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:14, marginBottom:6, color:C.bg2 }}>{card.title}</div>
                  <div style={{ fontSize:13, color:"#4A3F35", lineHeight:1.6, fontWeight:300 }}>{card.body}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding:"80px 48px", background:C.bg, textAlign:"center" }}>
        <div style={{ fontSize:10, letterSpacing:4, color:C.ink3, marginBottom:32, display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
          LET'S WORK <span style={{ width:60, height:1, background:C.border, display:"inline-block" }} />
        </div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(36px,5vw,72px)", letterSpacing:-3, lineHeight:0.95, marginBottom:20 }}>
          Got a project<br />
          <span style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontWeight:400, color:C.accent }}>in mind?</span>
        </h2>
        <p style={{ fontSize:15, color:C.ink2, maxWidth:420, margin:"0 auto 36px", lineHeight:1.7, fontWeight:300 }}>
          No long forms. Just send a message and we'll figure out if we're a good fit.
        </p>
        <div style={{ display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
          {[
            { label:"💬 LINE: shamfaad",   href:"https://line.me/ti/p/~shamfaad",       s:{ background:C.ink, color:C.bg } },
            { label:"✉️ Email",            href:"mailto:shamwise8@gmail.com",            s:{ background:"transparent", border:`1px solid ${C.border}`, color:C.ink2 } },
            { label:"✈️ Telegram",         href:"https://t.me/shamwise8",               s:{ background:"transparent", border:`1px solid ${C.border}`, color:C.ink2 } },
            { label:"𝕏 @shamwise8",        href:"https://x.com/shamwise8",              s:{ background:"transparent", border:`1px solid ${C.border}`, color:C.ink2 } },
          ].map(btn => (
            <a key={btn.label} href={btn.href} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 28px", borderRadius:100, fontSize:14, fontWeight:500, textDecoration:"none", transition:"all 0.2s", ...btn.s }}>{btn.label}</a>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:C.ink, padding:"24px 48px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:C.bg2 }}>Shamwise Studios</span>
        <span style={{ fontSize:12, color:"#2D2620" }}>© 2026 — All rights reserved</span>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <a href="https://x.com/shamwise8" target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:C.bg2, textDecoration:"none", transition:"color 0.2s" }}>𝕏 @shamwise8</a>
          <a href="https://t.me/shamwise8" target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:C.bg2, textDecoration:"none", transition:"color 0.2s" }}>✈️ Telegram</a>
          <span style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontSize:14, color:C.ink3 }}>Bangkok, Thailand</span>
        </div>
      </footer>
    </div>
  );
}