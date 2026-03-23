import { useEffect, useRef, useState } from "react";

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

/* Pricing section — kept for future use
const PRICING = [
  { name:"Starter", price:"฿15K", period:"one-time setup", featured:false,
    features:["Single-page website","Mobile responsive design","LINE OA basic setup","Contact form + Google Maps","1 round of revisions"] },
  { name:"Growth", price:"฿35K", period:"setup + ฿6.5K/month optional", featured:true,
    features:["Multi-page website","LINE bot with auto-replies","Product or service catalogue","Lead capture + CRM integration","Monthly maintenance available","3 rounds of revisions"] },
  { name:"Pro", price:"฿65K", period:"setup + ฿9.5K/month optional", featured:false,
    features:["Full web app or mobile app","Advanced LINE bot system","Admin dashboard","Order management or booking","Priority support + SLA","Unlimited revisions"] },
];
*/

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

function CommunityCard({ item }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  useEffect(() => {
    if (!item.photos || item.photos.length < 2) return;
    const t = setInterval(() => setPhotoIdx(i => (i+1) % item.photos.length), 3500);
    return () => clearInterval(t);
  }, [item.photos]);

  return (
    <div className="work-card community-card-grid" style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", display:"grid", gridTemplateColumns:"1fr 1fr" }}>
      <div style={{ position:"relative", overflow:"hidden", minHeight:260 }}>
        <img src={item.photos[photoIdx]} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent 60%,rgba(245,240,232,0.95))" }} />
        {item.badge && (
          <div style={{ position:"absolute", top:12, left:12, background:"rgba(26,22,18,0.75)", backdropFilter:"blur(8px)", borderRadius:100, padding:"4px 12px", fontSize:10, fontWeight:700, color:"#F2A65A", letterSpacing:1.5 }}>
            {item.badge}
          </div>
        )}
        {item.photos.length > 1 && (
          <div style={{ position:"absolute", bottom:12, left:12, display:"flex", gap:4 }}>
            {item.photos.map((_,i) => (
              <div key={i} style={{ width:photoIdx===i?20:6, height:6, borderRadius:3, background:photoIdx===i?C.accent:"rgba(255,255,255,0.4)", transition:"width 0.3s ease" }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ padding:"32px 28px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:24, marginBottom:12, letterSpacing:-0.5 }}>{item.title}</h3>
          <p style={{ fontSize:14, color:C.ink2, lineHeight:1.7, fontWeight:300, marginBottom:20 }}>{item.desc}</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {item.tags.map(t => (
              <span key={t} style={{ fontSize:11, padding:"4px 10px", background:C.bg2, borderRadius:100, color:C.ink2 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:11, color:C.ink3, marginTop:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.accent, display:"inline-block", animation:"blink 2s ease-in-out infinite" }} />
            {item.status}
          </div>
          {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color:C.accent, fontWeight:600, textDecoration:"none", fontSize:12 }}>View events →</a>}
        </div>
      </div>
    </div>
  );
}

const WORK_ITEMS = [
  { title:"IronMap", desc:"Equipment-aware gym training. Filters exercises to what your gym actually has, rest timer on Dynamic Island + Apple Watch, community accountability groups via join codes.", tag:"iOS + ANDROID", tagColor:"#E8FF47", hero:"/ironmap-og.png", status:"TestFlight approved", link:"https://ironmap.vercel.app", appStore:true },
  { title:"CoachProof", desc:"Mobile CRM for weight management coaches. Tanita body composition tracking, structured before/after photos, client progress visualization, and sales pitch support.", tag:"iOS APP", tagColor:"#10B981", hero:"/coachproof-og.jpg", status:"TestFlight live — external testing", link:"https://coachproof.vercel.app", appStore:true },
  { title:"EIS Chill Pai Nai", desc:"Bangkok Wednesday basketball league tracker. Live standings, box scores, and player stat cards — built from STATASTIC screenshots.", tag:"WEB APP", tagColor:"#4EA8FF", hero:"/eis-preview1.png", status:"Live — updated weekly", link:"https://eis-league.vercel.app" },
];

const COMMUNITY_ITEMS = [
  { title:"Hmong Cyber", desc:"Co-founded a youth development platform for Hmong hill tribe communities in Phitsanulok. 3 seasons of coding, media production, culinary arts, and hospitality training — 100+ students, 50+ volunteer teachers, 300+ hours taught. Ran the Hmong Cyber Festival celebrating culture and new skills.", photos:["/hmong-coding.jpg","/hmong-festival.jpg","/hmong-teaching.jpg","/hmong-tiedye.jpg"], badge:"CO-FOUNDER", tags:["Phitsanulok","Youth Dev","Education","Social Impact"], status:"Active" },
  { title:"Avalanche Team1 Bangkok", desc:"2 community crypto events in Bangkok with Avalanche Team1. 6-week bootcamp incoming — part of the Avalanche Southeast Asia ecosystem push.", photos:["/avalanche-group.jpg","/avalanche-speaker.jpg"], badge:"AVALANCHE × BINANCE TH", tags:["Bangkok","Avalanche","Team1","Web3"], status:"Bootcamp starting soon", link:"https://luma.com/avaxbuilders" },
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
        .cta-btn{transition:transform 0.2s,box-shadow 0.2s;display:inline-flex;align-items:center;gap:10px}
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(232,93,38,0.3)}
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr !important}
          .hero-right{display:none !important}
          .nav-links{display:none !important}
          .nav-badge{display:none !important}
          .offerings-grid{grid-template-columns:1fr !important}
          .about-grid{grid-template-columns:1fr !important;gap:40px !important}
          .community-card-grid{grid-template-columns:1fr !important}
          .contact-btns{flex-direction:column !important;align-items:center}
          .footer-inner{flex-direction:column !important;gap:16px !important;text-align:center}
          .footer-links{flex-direction:column !important;align-items:center !important;gap:8px !important}
          .section-pad{padding-left:20px !important;padding-right:20px !important}
          .nav-bar{padding-left:20px !important;padding-right:20px !important}
        }
        @media(max-width:480px){
          .hero-heading{font-size:42px !important}
        }
      `}</style>

      {/* NAV */}
      <nav className="nav-bar" style={{ position:"sticky", top:0, zIndex:100, padding:"18px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", background:`${C.bg}ee`, backdropFilter:"blur(8px)", borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, letterSpacing:-0.5 }}>Shamwise Studios</span>
        <div className="nav-links" style={{ display:"flex", gap:32 }}>
          {["offerings","portfolio","about","contact"].map(s => (
            <a key={s} href={`#${s}`} className="nav-link" style={{ textTransform:"capitalize" }}>{s}</a>
          ))}
        </div>
        <div className="nav-badge" style={{ background:C.ink, color:C.bg, padding:"8px 18px", borderRadius:100, fontSize:12, fontWeight:600 }}>Available for projects</div>
      </nav>

      {/* HERO */}
      <section className="section-pad hero-grid" style={{ padding:"80px 48px 72px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"end", background:C.bg, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,${C.accent2}30 0%,transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:11, letterSpacing:3, color:C.accent, textTransform:"uppercase", marginBottom:20, display:"flex", alignItems:"center", gap:10, animation:"fadeUp 0.8s ease 0.2s both" }}>
            <span style={{ width:24, height:1, background:C.accent, display:"inline-block" }} /> Bangkok, Thailand
          </div>
          <h1 className="hero-heading" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(48px,5.5vw,80px)", lineHeight:0.95, letterSpacing:-3, marginBottom:28, animation:"fadeUp 0.8s ease 0.35s both" }}>
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
        <div className="hero-right" style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:20, animation:"fadeUp 0.8s ease 0.6s both" }}>
          <div style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontSize:56, color:C.ink3, textAlign:"right", lineHeight:1 }}>Bangkok<br />based.</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
            {["3 Apps in TestFlight","5+ Events Run","All Independent"].map(t => (
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
      <section id="offerings" className="section-pad" style={{ padding:"80px 48px", background:C.cream }}>
        <div style={{ fontSize:10, letterSpacing:4, color:C.ink3, marginBottom:48, display:"flex", alignItems:"center", gap:12 }}>
          WHAT I DO <span style={{ width:60, height:1, background:C.border, display:"inline-block" }} />
        </div>
        <div className="offerings-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2, background:C.border, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
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
      <section id="portfolio" className="section-pad" style={{ padding:"80px 48px", background:C.bg }}>
        <div style={{ fontSize:10, letterSpacing:4, color:C.ink3, marginBottom:48, display:"flex", alignItems:"center", gap:12 }}>
          RECENT WORK <span style={{ width:60, height:1, background:C.border, display:"inline-block" }} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:1200, margin:"0 auto" }}>
          {WORK_ITEMS.map((item,i) => (
            <Reveal key={item.title} delay={i*0.08}>
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="work-card" style={{ display:"block", borderRadius:14, overflow:"hidden", textDecoration:"none", color:"white", background:"#1A1612", border:"1px solid #2D2620" }}>
                <div style={{ overflow:"hidden", background:"#0D0A08", padding:"16px 24px 0" }}>
                  <img src={item.hero} alt={item.title} style={{ width:"100%", aspectRatio:"16/9", objectFit:"cover", display:"block", borderRadius:"8px 8px 0 0" }} />
                </div>
                <div style={{ padding:"20px 28px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:10, padding:"3px 10px", borderRadius:100, fontWeight:700, background:`${item.tagColor}18`, color:item.tagColor, border:`1px solid ${item.tagColor}33` }}>{item.tag}</span>
                      <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, letterSpacing:-0.5 }}>{item.title}</h3>
                    </div>
                    {item.appStore && (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:9, color:"#8A7D72", fontWeight:600 }}>🍎 App Store</span>
                        {item.tag.includes("ANDROID") && <span style={{ fontSize:9, color:"#8A7D72", fontWeight:600 }}>🤖 Play Store</span>}
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.6, marginBottom:14, fontWeight:300 }}>{item.desc}</p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"rgba(255,255,255,0.4)" }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:C.accent, display:"inline-block", animation:"blink 2s ease-in-out infinite" }} />
                      {item.status}
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color:C.accent, display:"flex", alignItems:"center", gap:4 }}>
                      View project <span>→</span>
                    </span>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="section-pad" style={{ padding:"80px 48px", background:C.cream }}>
        <div style={{ fontSize:10, letterSpacing:4, color:C.ink3, marginBottom:48, display:"flex", alignItems:"center", gap:12 }}>
          COMMUNITY <span style={{ width:60, height:1, background:C.border, display:"inline-block" }} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {COMMUNITY_ITEMS.map((item,i) => (
            <Reveal key={item.title} delay={i*0.08}>
              <CommunityCard item={item} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* COMING SOON */}
      <section className="section-pad" style={{ padding:"80px 48px", background:C.bg }}>
        <div style={{ fontSize:10, letterSpacing:4, color:C.ink3, marginBottom:48, display:"flex", alignItems:"center", gap:12 }}>
          COMING SOON <span style={{ width:60, height:1, background:C.border, display:"inline-block" }} />
        </div>
        <Reveal>
          <div style={{ background:C.ink, borderRadius:14, overflow:"hidden", padding:"48px 40px", display:"flex", alignItems:"center", gap:40, border:`1px solid #2D2620` }}>
            <div style={{ width:100, height:100, borderRadius:"50%", background:"radial-gradient(circle at 38% 35%, #A8F0B8CC, #5BC98A66 50%, #7EE8A233)", boxShadow:"0 0 60px rgba(126,232,162,0.15)", flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <span style={{ fontSize:10, padding:"3px 10px", borderRadius:100, fontWeight:700, background:"rgba(126,232,162,0.12)", color:"#7EE8A2", border:"1px solid rgba(126,232,162,0.25)" }}>watchOS + iOS</span>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:24, letterSpacing:-0.5, color:"#E8F5EC" }}>Santi</h3>
              </div>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.55)", lineHeight:1.7, fontWeight:300, marginBottom:12 }}>
                A nervous system coach on your wrist. Haptic-guided breathing, real-time heart rate proof, emotional check-ins mapped to planets. Apple Watch first — your body knows the way.
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#8A7D72" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#7EE8A2", display:"inline-block", animation:"blink 2s ease-in-out infinite" }} />
                  Beta coming soon
                </div>
                <a href="https://santi-theta.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color:"#7EE8A2", fontWeight:600, textDecoration:"none", fontSize:12 }}>View site →</a>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ background:C.ink, borderRadius:14, overflow:"hidden", border:`1px solid #2D2620`, marginTop:20 }}>
            <div style={{ padding:"32px 40px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:10, padding:"3px 10px", borderRadius:100, fontWeight:700, background:"rgba(196,89,42,0.15)", color:"#C4592A", border:"1px solid rgba(196,89,42,0.3)" }}>WEB APP</span>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:24, letterSpacing:-0.5, color:"#F8F5EE" }}>Recall</h3>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#8A7D72" }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#C4592A", display:"inline-block" }} />
                Live
              </div>
            </div>
            <p style={{ padding:"0 40px 16px", fontSize:14, color:"rgba(255,255,255,0.55)", lineHeight:1.7, fontWeight:300 }}>
              Spanish and Thai vocabulary trainer with spaced repetition. Type the translation, get instant feedback, repeat at the right intervals.
            </p>
            <div style={{ borderTop:"1px solid #2D2620", background:"#F8F5EE", borderRadius:"0 0 14px 14px", display:"flex", justifyContent:"center", padding:"24px 0" }}>
              <iframe
                src="https://playrecall.vercel.app"
                title="Recall — Spanish vocabulary trainer"
                style={{ width:"100%", maxWidth:420, height:600, border:"1px solid #E0DBD2", borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.08)" }}
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ABOUT */}
      <section id="about" className="section-pad" style={{ padding:"80px 48px", background:C.ink, color:C.bg }}>
        <div className="about-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>
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
              While building IronMap, CoachProof, and Santi (all in TestFlight), I realised I could help local businesses get the same quality of digital presence. So I started doing that too.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, padding:24, background:"#0D0A08", borderRadius:12, border:"1px solid #2D2620" }}>
              {[["3","Apps in TestFlight"],["5+","Events run"],["BKK","Based in Bangkok"]].map(([num,label]) => (
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
                { icon:"⛓️", title:"Web3 projects welcome", body:"Running Avalanche events in Bangkok with Avalanche Team1 means I'm plugged into the regional crypto scene." },
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
      <section id="contact" className="section-pad" style={{ padding:"80px 48px", background:C.bg, textAlign:"center" }}>
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
        <div className="contact-btns" style={{ display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
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
      <footer className="section-pad" style={{ background:C.ink, padding:"24px 48px" }}>
        <div className="footer-inner" style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:C.bg2 }}>Shamwise Studios</span>
        <span style={{ fontSize:12, color:"#2D2620" }}>© 2026 — All rights reserved</span>
        <div className="footer-links" style={{ display:"flex", alignItems:"center", gap:16 }}>
          <a href="https://x.com/shamwise8" target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:C.bg2, textDecoration:"none", transition:"color 0.2s" }}>𝕏 @shamwise8</a>
          <a href="https://t.me/shamwise8" target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:C.bg2, textDecoration:"none", transition:"color 0.2s" }}>✈️ Telegram</a>
          <span style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontSize:14, color:C.ink3 }}>Bangkok, Thailand</span>
        </div>
        </div>
      </footer>
    </div>
  );
}