import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — paste your Tally form IDs here (create free forms at tally.so)
const TALLY_CANDIDATE_ID = "eqErLk";
const TALLY_HIRING_ID    = "Me5aOk";

// Your deployed site URL — update this before launch
const SITE_URL = "https://skiptheline.us";
// ─────────────────────────────────────────────────────────────────────────────

// ─────────── REFERRAL UTILITIES ──────────────────────────────────────────────

// Generates a deterministic 4-char code from an email string.
// Same email always produces the same code — no database needed.
function makeRefCode(name, email) {
  const str = (name + email).toLowerCase().replace(/\s+/g, "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const chars = "abcdefhjkmnpqrstvwxyz23456789";
  const code = [0, 6, 12, 18].map(shift =>
    chars[Math.abs((hash >> shift) & 0xff) % chars.length]
  ).join("");
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20);
  return `${slug}-${code}`;
}

// Builds the full shareable referral URL
function makeRefUrl(name, email) {
  return `${SITE_URL}/?ref=${makeRefCode(name, email)}`;
}

// Reads ?ref= from the current URL on page load
function getInboundRef() {
  try {
    return new URLSearchParams(window.location.search).get("ref") || "";
  } catch (_) { return ""; }
}

// ─────────── COPY DATA ───────────────────────────────────────────────────────

const COPY = {
  landing: {
    badge: "Founding Cohort · 127 spots remaining",
    heroHeadline: ["Your next role", "starts with a", "real conversation,", "not a form."],
    heroSub: "SkipTheLine connects ambitious professionals directly with the hiring managers who can say yes through live, small-group conversations. No applications. No ATS. No waiting in the dark.",
    heroCta: "Claim your founding spot →",
    heroNote: "347 professionals on the waitlist · 127 founding spots remain · closes when full",
    problemHead: "You're not struggling because you're unqualified. You're struggling because no one can see you.",
    problemBody: [
      "The average corporate job posting receives 250 applications. Fewer than 10 get a phone call. Most never get a human response at all, just automated rejections from software that was never designed to recognize talent.",
      "It's not a resume problem. It's an access problem. The people who get hired fastest aren't necessarily the best candidates. They're the ones who found a way into a real conversation first.",
      "SkipTheLine is that way in."
    ],
    howHead: "How it works",
    steps: [
      { n: "01", head: "Apply and get matched", body: "Tell us who you are and where you want to go. We personally review every application and match you to hiring managers actively looking for someone like you, based on your role, your goals, and the companies you care about." },
      { n: "02", head: "Join a live office hours session", body: "Sit in a small group of 5–6 candidates with a verified hiring manager. Ask real questions. Have a real conversation. No recruiters in the room, no scripts, no filters. Just you and the person with the authority to hire." },
      { n: "03", head: "Request a direct follow-up", body: "If there's genuine mutual interest, you can request a 1:1 directly with the hiring manager after the session. They decide. You get a real answer, not a month of silence followed by a form rejection." }
    ],
    cohortHead: "300 candidates. 30 hiring managers. One room that changes everything.",
    cohortBody: "We hand-selected every person in this cohort. Not by resume score, but by potential, ambition, and readiness to have a direct conversation. The hiring managers in this room are real decision-makers at companies that are actively hiring right now. They agreed to be here because they believe the current process fails everyone. When you join the founding cohort, you're not joining a waitlist. You're walking into the room.",
    cohortList: [
      "Direct access to 30 verified, actively-hiring managers",
      "Matched to sessions based on your goals and target companies",
      "Permanent Founding Member credential on your profile, visible to every hiring manager on the platform",
      "First access to every future cohort before public launch",
      "Completely free. No fees, no subscriptions, no catch"
    ],
    insights: [
      { stat: "75%", statLabel: "of hiring managers say their best hires came from referrals or direct conversations, not from applications submitted through a job board.", source: "LinkedIn Global Talent Trends" },
      { stat: "1 in 152", statLabel: "online applications results in a hire. The other 151 are filtered out by software, buried in inboxes, or never opened at all.", source: "Jobvite Recruiter Nation Report" },
      { stat: "20 minutes", statLabel: "is all an experienced hiring manager needs to know whether someone is worth pursuing. A resume rarely gives them even that.", source: "Harvard Business Review" }
    ],
    ctaHead: "The founding cohort won't stay open long.",
    ctaSub: "We're reviewing applications now and sending invites on a rolling basis. The sooner you apply, the better your position. Once the 300 spots are filled, this cohort closes.",
    ctaBtn: "Apply for your spot →",
    footer: "SkipTheLine · Real conversations. Real opportunities. · Your information is never shared with employers without your explicit consent."
  },
  candidate: {
    badge: "Founding Cohort · Candidate Application",
    head: "You deserve to be in the room.",
    sub: "This isn't a form that disappears into a database. We read every application personally and match you to hiring managers who are actually looking for someone like you. Tell us who you are.",
    fields: [
      { id: "name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
      { id: "email", label: "Email Address", type: "email", placeholder: "your@email.com", required: true },
      { id: "role", label: "Current or Most Recent Job Title", type: "text", placeholder: "e.g. Senior Product Designer", required: true },
      { id: "years", label: "Years of Professional Experience", type: "select", options: ["1–2 years", "3–5 years", "6–10 years", "10+ years"], required: true },
      { id: "linkedin", label: "LinkedIn Profile URL", type: "url", placeholder: "linkedin.com/in/yourname", required: true, hint: "Hiring managers preview your LinkedIn before each session. Make sure it reflects your best work." },
      { id: "looking", label: "What are you looking for right now?", type: "multiselect", options: ["A new full-time role", "A startup opportunity", "A career pivot", "Mentorship and career guidance", "Expanding my professional network"], required: true },
      { id: "companies", label: "Name 3 companies you'd genuinely love to work for", type: "textarea", placeholder: "e.g. Stripe, Linear, a Series B fintech in New York. Be as specific as you like.", required: true, hint: "The more specific you are, the better we can match you to the right hiring managers." },
      { id: "why", label: "In your own words: why do you want a direct conversation with a hiring manager instead of the standard process?", type: "textarea", placeholder: "Be honest. The best answers aren't polished. They're real.", required: true, hint: "This is the question we care about most. It tells us whether you're ready to make the most of this opportunity." },
      { id: "referral", label: "How did you find out about SkipTheLine?", type: "select", options: ["LinkedIn post", "A friend or colleague referred me", "Twitter / X", "A community or Slack group", "Google search", "Other"], required: false }
    ],
    submit: "Submit my application →",
    disclaimer: "Every application is reviewed by a human within 48 hours. You'll receive your waitlist position and next steps by email. Founding cohort invites go out on a rolling basis. Apply early.",
    success: {
      head: "You're in the room.",
      sub: "We'll review your application within 48 hours and send you your waitlist position along with next steps. Keep an eye on your inbox and your spam folder just in case.",
      note: "Want to move up the list? Share your referral link below. Every person who applies through your link bumps you 30 spots forward."
    }
  },
  hiring: {
    badge: "Founding Cohort · Hiring Manager Application",
    head: "Meet your next great hire before they apply anywhere else.",
    sub: "We've pre-screened 300 ambitious professionals and matched them to hiring managers based on role, seniority, and company fit. Your commitment is four 45-minute sessions over 30 days. Everything is free, and the caliber of candidates in this cohort reflects the caliber of the hiring managers who agreed to show up.",
    intro: "Here's exactly what joining looks like:",
    commitments: [
      "4 live office hours sessions over 30 days, 45 minutes each, one per week",
      "A 10-minute profile setup so candidates know who they're meeting",
      "Post-session: review any follow-up requests from candidates you want to know more about",
      "A 15-minute closing debrief to help us improve the next cohort"
    ],
    fields: [
      { id: "name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
      { id: "email", label: "Work Email", type: "email", placeholder: "you@company.com", required: true, hint: "Your work email helps us verify your role and company. We won't share it with candidates." },
      { id: "title", label: "Job Title", type: "text", placeholder: "e.g. VP of Engineering", required: true },
      { id: "company", label: "Company Name", type: "text", placeholder: "Your company", required: true },
      { id: "stage", label: "Company Stage", type: "select", options: ["Seed / Pre-Series A", "Series A", "Series B", "Series C+", "Public company", "Agency / Consultancy"], required: true },
      { id: "linkedin", label: "LinkedIn Profile URL", type: "url", placeholder: "linkedin.com/in/yourname", required: true },
      { id: "roles", label: "What roles are you currently hiring for, or expect to hire for in the next 6 months?", type: "textarea", placeholder: "e.g. Senior Product Designer, Staff Engineer, Head of Growth. Be as specific as you like.", required: true, hint: "This determines which candidates we match to your sessions. The more specific, the better the room." },
      { id: "seniority", label: "What seniority levels do you typically hire?", type: "multiselect", options: ["Early career (0–2 years)", "Mid-level (3–5 years)", "Senior (6–10 years)", "Staff / Principal (10+ years)", "Leadership / VP level"], required: true },
      { id: "why", label: "What makes a candidate worth 15 minutes of your time, before you've seen their resume?", type: "textarea", placeholder: "This becomes part of your public profile. Candidates will read it before signing up for your session.", required: true, hint: "Be direct. The hiring managers who get the best sessions are the ones who tell candidates exactly what they're looking for." },
      { id: "availability", label: "Which session slot works best for you?", type: "select", options: ["Tuesdays 5–6 PM ET", "Thursdays 5–6 PM ET", "Wednesdays 12–1 PM ET", "Flexible, I'll work around the cohort"], required: true },
      { id: "hear", label: "How did you hear about SkipTheLine?", type: "select", options: ["Direct outreach from the team", "A colleague recommended it", "LinkedIn", "Other"], required: false }
    ],
    submit: "Apply to join the founding cohort →",
    disclaimer: "We review every hiring manager application within 24 hours and respond personally. If accepted, you'll receive an onboarding guide and a calendar link to confirm your first session.",
    success: {
      head: "We'll be in touch within 48 hours.",
      sub: "Your application is being reviewed now. If accepted, you'll receive a personal email with your onboarding guide and everything you need to get your first session set up.",
      note: "The best rooms are built by people who know other great people. If there's a hiring manager in your network who'd raise the caliber of this cohort, send them this link. You'll both get priority session scheduling."
    }
  }
};

// ─────────── SHARED COMPONENTS ───────────────────────────────────────────────

// Concept C — queue of muted figures, one gold leaper with arc + spark
// ─────────── LIVE ACTIVITY TICKER ────────────────────────────────────────────

const FIRST_NAMES = ["Jordan","Marcus","Priya","Devon","Aaliyah","Tyler","Simone","Kai","Zara","Elijah","Nina","Reece","Amara","Blake","Jasmine","Theo","Camille","Andre","Leila","Miles","Tariq","Sofia","Donovan","Imani","Nate","Chloe","Darius","Maya","Owen","Nia"];
const CITIES = ["New York","Austin","Atlanta","Chicago","Los Angeles","Seattle","Miami","Boston","Denver","Houston","San Francisco","Washington DC","Charlotte","Phoenix","Nashville","Detroit","Portland","Dallas","Philadelphia","Minneapolis"];
const ACTIONS = [
  (name, city) => `${name} from ${city} just joined the waitlist`,
  (name, city) => `${name} from ${city} applied for a founding spot`,
  (name, city) => `${name} in ${city} is reviewing hiring manager profiles`,
  (name, city) => `${name} from ${city} just claimed a founding spot`,
  (name, city) => `${name} in ${city} submitted their application`,
  (name, city) => `${name} from ${city} was matched to a hiring manager`,
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateActivity() {
  const name = randomItem(FIRST_NAMES);
  const city = randomItem(CITIES);
  const action = randomItem(ACTIONS);
  return action(name, city);
}

const ActivityTicker = () => {
  const [items, setItems] = useState([
    { id: 1, text: generateActivity(), visible: true },
  ]);
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 18) + 24);
  const counterRef = useRef(0);

  useEffect(() => {
    // Add new activity every 4–7 seconds
    const addActivity = () => {
      counterRef.current += 1;
      const id = counterRef.current;
      setItems(prev => [{ id, text: generateActivity(), visible: true }, ...prev.slice(0, 2)]);
      // Schedule next
      setTimeout(addActivity, Math.random() * 3000 + 4000);
    };
    const t = setTimeout(addActivity, Math.random() * 2000 + 3000);

    // Fluctuate viewer count
    const viewerInterval = setInterval(() => {
      setViewers(v => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(18, Math.min(52, v + delta));
      });
    }, 5000);

    return () => { clearTimeout(t); clearInterval(viewerInterval); };
  }, []);

  return (
    <div style={{ marginTop: 24 }}>
      <style>{`
        @keyframes tickerSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ticker-item { animation: tickerSlideIn 0.4s ease both; }
      `}</style>

      {/* Live viewer count */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        marginBottom: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
            boxShadow: "0 0 6px rgba(34,197,94,0.7)",
            animation: "pulse 2s infinite"
          }} />
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            color: "#4a5248", fontWeight: 500
          }}>
            {viewers} people viewing right now
          </span>
        </div>
      </div>

      {/* Activity feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <div key={item.id} className="ticker-item" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            background: i === 0 ? "rgba(201,150,60,0.07)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${i === 0 ? "rgba(201,150,60,0.2)" : "rgba(255,255,255,0.04)"}`,
            borderRadius: 20,
            opacity: i === 0 ? 1 : i === 1 ? 0.55 : 0.25,
            transition: "opacity 0.5s ease",
            width: "fit-content",
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
              background: i === 0 ? "#c9963c" : "#3a3428"
            }} />
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, color: i === 0 ? "#9a8a72" : "#4a4238",
              whiteSpace: "nowrap"
            }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────── LIVE ACTIVITY TICKER ────────────────────────────────────────────

const FIRST_NAMES = ["Jordan","Marcus","Priya","Devon","Aaliyah","Tyler","Simone","Kai","Zara","Elijah","Nina","Reece","Amara","Blake","Jasmine","Theo","Camille","Andre","Leila","Miles","Tariq","Sofia","Donovan","Imani","Nate","Chloe","Darius","Maya","Owen","Nia"];
const CITIES = ["New York","Austin","Atlanta","Chicago","Los Angeles","Seattle","Miami","Boston","Denver","Houston","San Francisco","Washington DC","Charlotte","Phoenix","Nashville","Detroit","Portland","Dallas","Philadelphia","Minneapolis"];
const ACTIONS = [
  (name, city) => `${name} from ${city} just joined the waitlist`,
  (name, city) => `${name} from ${city} applied for a founding spot`,
  (name, city) => `${name} in ${city} is reviewing hiring manager profiles`,
  (name, city) => `${name} from ${city} just claimed a founding spot`,
  (name, city) => `${name} in ${city} submitted their application`,
  (name, city) => `${name} from ${city} was matched to a hiring manager`,
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateActivity() {
  const name = randomItem(FIRST_NAMES);
  const city = randomItem(CITIES);
  const action = randomItem(ACTIONS);
  return action(name, city);
}

const ActivityTicker = () => {
  const [items, setItems] = useState([
    { id: 1, text: generateActivity(), visible: true },
  ]);
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 18) + 24);
  const counterRef = useRef(0);

  useEffect(() => {
    // Add new activity every 4–7 seconds
    const addActivity = () => {
      counterRef.current += 1;
      const id = counterRef.current;
      setItems(prev => [{ id, text: generateActivity(), visible: true }, ...prev.slice(0, 2)]);
      // Schedule next
      setTimeout(addActivity, Math.random() * 3000 + 4000);
    };
    const t = setTimeout(addActivity, Math.random() * 2000 + 3000);

    // Fluctuate viewer count
    const viewerInterval = setInterval(() => {
      setViewers(v => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(18, Math.min(52, v + delta));
      });
    }, 5000);

    return () => { clearTimeout(t); clearInterval(viewerInterval); };
  }, []);

  return (
    <div style={{ marginTop: 24 }}>
      <style>{`
        @keyframes tickerSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ticker-item { animation: tickerSlideIn 0.4s ease both; }
      `}</style>

      {/* Live viewer count */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        marginBottom: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
            boxShadow: "0 0 6px rgba(34,197,94,0.7)",
            animation: "pulse 2s infinite"
          }} />
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            color: "#4a5248", fontWeight: 500
          }}>
            {viewers} people viewing right now
          </span>
        </div>
      </div>

      {/* Activity feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <div key={item.id} className="ticker-item" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            background: i === 0 ? "rgba(201,150,60,0.07)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${i === 0 ? "rgba(201,150,60,0.2)" : "rgba(255,255,255,0.04)"}`,
            borderRadius: 20,
            opacity: i === 0 ? 1 : i === 1 ? 0.55 : 0.25,
            transition: "opacity 0.5s ease",
            width: "fit-content",
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
              background: i === 0 ? "#c9963c" : "#3a3428"
            }} />
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, color: i === 0 ? "#9a8a72" : "#4a4238",
              whiteSpace: "nowrap"
            }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────── REFERRAL WELCOME OVERLAY ────────────────────────────────────────

const ReferralWelcome = ({ refCode, onContinue }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Extract a readable name from the ref code (e.g. "alex-chen-4f2a" → "Alex Chen")
  const referrerName = refCode
    ? refCode.split("-").slice(0, -1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "";

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
  }, []);

  const handleContinue = () => {
    setLeaving(true);
    setTimeout(onContinue, 500);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "#0d0c09",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px",
      opacity: leaving ? 0 : 1,
      transition: "opacity 0.5s ease",
    }}>
      <style>{`
        @keyframes sparkle {
          0%   { opacity: 0; transform: scale(0) rotate(0deg); }
          50%  { opacity: 1; transform: scale(1.3) rotate(180deg); }
          100% { opacity: 1; transform: scale(1) rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ref-line { animation: slideUp 0.6s ease both; }
        .ref-l1 { animation-delay: 0.2s; }
        .ref-l2 { animation-delay: 0.4s; }
        .ref-l3 { animation-delay: 0.6s; }
        .ref-l4 { animation-delay: 0.8s; }
        .ref-l5 { animation-delay: 1.0s; }
        .ref-spark { animation: sparkle 0.8s ease both; animation-delay: 0.1s; }
        .ref-btn:hover { background: #e8b84a !important; transform: translateY(-2px) !important; }
        .ref-btn { transition: all 0.2s ease !important; }
      `}</style>

      <div style={{ maxWidth: 520, textAlign: "center" }}>

        {/* Animated spark */}
        <div className="ref-spark" style={{
          fontSize: 48, marginBottom: 32,
          filter: "drop-shadow(0 0 20px rgba(201,150,60,0.6))"
        }}>✦</div>

        {/* You were invited */}
        <div className="ref-line ref-l1" style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.15em",
          textTransform: "uppercase", color: "#c9963c", marginBottom: 20
        }}>
          Personal Invitation
        </div>

        {/* Main message */}
        <h1 className="ref-line ref-l2" style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: "clamp(32px, 6vw, 52px)",
          fontWeight: 400, fontStyle: "italic",
          color: "#f0ede6", lineHeight: 1.15,
          letterSpacing: "-0.02em", marginBottom: 24
        }}>
          {referrerName ? `${referrerName} thinks you belong in the room.` : "You've been personally invited."}
        </h1>

        {/* Supporting copy */}
        <p className="ref-line ref-l3" style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 17, lineHeight: 1.75,
          color: "#7a6e64", fontWeight: 300,
          marginBottom: 16, maxWidth: 440, margin: "0 auto 16px"
        }}>
          {referrerName
            ? `${referrerName} saved you a spot in the SkipTheLine founding cohort, a hand-selected group of 300 professionals getting direct access to hiring managers at companies that are actively hiring right now.`
            : "Someone saved you a spot in the SkipTheLine founding cohort, a hand-selected group of 300 professionals getting direct access to hiring managers at companies that are actively hiring right now."
          }
        </p>

        <p className="ref-line ref-l4" style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15, lineHeight: 1.7,
          color: "#5a5248", fontWeight: 300,
          marginBottom: 44
        }}>
          No applications. No ATS. No waiting in the dark. Just a real conversation with the person who can say yes.
        </p>

        {/* CTA */}
        <div className="ref-line ref-l5">
          <button
            className="ref-btn"
            onClick={handleContinue}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              padding: "16px 48px",
              background: "#c9963c",
              color: "#0d0c09",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.01em",
              boxShadow: "0 4px 32px rgba(201,150,60,0.35)",
              display: "block",
              margin: "0 auto 20px"
            }}
          >
            Claim my spot →
          </button>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, color: "#3a3428"
          }}>
            Founding cohort · 127 spots remaining · completely free
          </p>
        </div>

      </div>
    </div>
  );
};

const NavLogo = () => (
  <svg width="210" height="36" viewBox="0 0 420 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>

    {/* Muted queue figures × 3 */}
    <g stroke="#4a4030" fill="none" strokeWidth="1.5" strokeLinecap="round">
      {/* Figure 1 */}
      <circle cx="30" cy="14" r="7" />
      <line x1="30" y1="21" x2="30" y2="40" />
      <line x1="30" y1="28" x2="23" y2="36" /><line x1="30" y1="28" x2="37" y2="36" />
      <line x1="30" y1="40" x2="23" y2="52" /><line x1="30" y1="40" x2="37" y2="52" />
      {/* Figure 2 */}
      <circle cx="62" cy="14" r="7" />
      <line x1="62" y1="21" x2="62" y2="40" />
      <line x1="62" y1="28" x2="55" y2="36" /><line x1="62" y1="28" x2="69" y2="36" />
      <line x1="62" y1="40" x2="55" y2="52" /><line x1="62" y1="40" x2="69" y2="52" />
      {/* Figure 3 */}
      <circle cx="94" cy="14" r="7" />
      <line x1="94" y1="21" x2="94" y2="40" />
      <line x1="94" y1="28" x2="87" y2="36" /><line x1="94" y1="28" x2="101" y2="36" />
      <line x1="94" y1="40" x2="87" y2="52" /><line x1="94" y1="40" x2="101" y2="52" />
    </g>

    {/* Dashed leap arc */}
    <path d="M112,42 C112,10 136,8 136,14" stroke="#C8903A" strokeWidth="1.5" strokeDasharray="4,3" fill="none" strokeLinecap="round" />

    {/* Gold leaping figure */}
    <g stroke="#C8903A" fill="none" strokeWidth="2" strokeLinecap="round">
      <circle cx="136" cy="14" r="8" stroke="#C8903A" fill="#C8903A" fillOpacity="0.1" />
      <line x1="136" y1="22" x2="138" y2="40" />
      <line x1="137" y1="30" x2="127" y2="26" /><line x1="137" y1="30" x2="147" y2="34" />
      <line x1="138" y1="40" x2="128" y2="52" /><line x1="138" y1="40" x2="148" y2="50" />
      {/* Spark ✦ */}
      <text x="136" y="8" textAnchor="middle" fill="#C8903A" fontSize="9" fontFamily="serif" stroke="none">✦</text>
    </g>

    {/* Ground line */}
    <line x1="18" y1="55" x2="158" y2="55" stroke="#2A2318" strokeWidth="0.75" />

    {/* Wordmark */}
    <text x="200" y="38" textAnchor="middle" fontFamily="'Instrument Serif',Georgia,serif" fontStyle="italic" fontSize="28" fill="#EEE8DC" letterSpacing="-0.5">SkipTheLine</text>
    <line x1="148" y1="46" x2="252" y2="46" stroke="#2A2318" strokeWidth="0.75" />
    <text x="200" y="56" textAnchor="middle" fontFamily="'DM Sans',Arial,sans-serif" fontWeight="300" fontSize="7" fill="#6a5d4a" letterSpacing="3">TALK FIRST.</text>
  </svg>
);


// ─────────── LANDING PAGE ────────────────────────────────────────────────────

const LandingPage = ({ onApply }) => {
  const [visible, setVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const c = COPY.landing;
  const fade = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(24px)",
    transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`
  });

  return (
    <div style={{ fontFamily: "'Instrument Serif', 'Georgia', serif", color: "#f0ede6", background: "#0d0c09" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #c9963c44; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0c09; }
        ::-webkit-scrollbar-thumb { background: #2a2820; border-radius: 2px; }
        @keyframes grain {
          0%, 100% { transform: translate(0,0); }
          25% { transform: translate(2px,-2px); }
          50% { transform: translate(-2px,2px); }
          75% { transform: translate(2px,2px); }
        }
        @keyframes slowFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes shimmerLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal { animation: fadeInUp .6s ease both; }
        .d1 { animation-delay: .1s; }
        .d2 { animation-delay: .2s; }
        .d3 { animation-delay: .3s; }
        .d4 { animation-delay: .4s; }
        .d5 { animation-delay: .5s; }
        .d6 { animation-delay: .6s; }
        .d7 { animation-delay: .7s; }
        .d8 { animation-delay: .8s; }
        .landing-btn:hover { background: #e8b84a !important; transform: translateY(-1px); box-shadow: 0 8px 32px rgba(201,150,60,0.35) !important; }
        .landing-btn { transition: all .2s ease; }
        .step-card:hover { border-color: rgba(201,150,60,0.3) !important; background: rgba(201,150,60,0.04) !important; }
        .step-card { transition: all .2s ease; }
        .quote-card:hover { border-color: rgba(240,237,230,0.12) !important; }
        .quote-card { transition: border-color .2s ease; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes sparkPop {
          0%   { opacity: 0; transform: scale(0.2) translateY(4px); }
          60%  { opacity: 1; transform: scale(1.4) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-14px) rotate(0.5deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) rotate(0.5deg); }
          50%       { transform: translateY(-10px) rotate(-0.5deg); }
        }
        @keyframes floatC {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50%       { transform: translateY(-16px) rotate(-0.5deg); }
        }
      `}</style>

      {/* Grain overlay */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", animation: "grain 0.5s steps(2) infinite" }} />

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrollY > 20 ? "rgba(13,12,9,0.93)" : "transparent", backdropFilter: scrollY > 20 ? "blur(16px)" : "none", borderBottom: scrollY > 20 ? "1px solid rgba(255,255,255,0.05)" : "none", transition: "all .3s ease" }}>
        <NavLogo />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#5a5248", cursor: "pointer" }} onClick={() => onApply("hiring")}>For hiring managers</span>
          <button className="landing-btn" onClick={onApply} style={{ fontFamily: "'DM Sans', sans-serif", padding: "9px 22px", background: "#c9963c", color: "#0d0c09", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "0.01em" }}>
            Apply for access
          </button>
        </div>
      </nav>

      {/* ── HERO — Split layout: left editorial / right floating cards ── */}
      <section style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", padding: "80px 0 0", position: "relative", overflow: "hidden" }}>

        {/* Subtle radial glow behind right panel */}
        <div style={{ position: "absolute", top: "10%", right: "0%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,150,60,0.13) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "5%", left: "5%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(42,157,143,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* LEFT — copy */}
        <div style={{ padding: "100px 48px 80px 56px", position: "relative", zIndex: 1 }}>

          {/* Logo mark + badge row */}
          <div className="reveal d1" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <svg width="52" height="58" viewBox="0 0 160 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <g stroke="#4a4030" fill="none" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="30" cy="14" r="7"/><line x1="30" y1="21" x2="30" y2="40"/><line x1="30" y1="28" x2="23" y2="36"/><line x1="30" y1="28" x2="37" y2="36"/><line x1="30" y1="40" x2="23" y2="52"/><line x1="30" y1="40" x2="37" y2="52"/>
                <circle cx="62" cy="14" r="7"/><line x1="62" y1="21" x2="62" y2="40"/><line x1="62" y1="28" x2="55" y2="36"/><line x1="62" y1="28" x2="69" y2="36"/><line x1="62" y1="40" x2="55" y2="52"/><line x1="62" y1="40" x2="69" y2="52"/>
                <circle cx="94" cy="14" r="7"/><line x1="94" y1="21" x2="94" y2="40"/><line x1="94" y1="28" x2="87" y2="36"/><line x1="94" y1="28" x2="101" y2="36"/><line x1="94" y1="40" x2="87" y2="52"/><line x1="94" y1="40" x2="101" y2="52"/>
              </g>
              <path d="M112,42 C112,10 136,8 136,14" stroke="#C8903A" strokeWidth="1.5" strokeDasharray="4,3" fill="none" strokeLinecap="round"/>
              <g stroke="#C8903A" fill="none" strokeWidth="2" strokeLinecap="round">
                <circle cx="136" cy="14" r="8" fill="#C8903A" fillOpacity="0.1"/>
                <line x1="136" y1="22" x2="138" y2="40"/><line x1="137" y1="30" x2="127" y2="26"/><line x1="137" y1="30" x2="147" y2="34"/><line x1="138" y1="40" x2="128" y2="52"/><line x1="138" y1="40" x2="148" y2="50"/>
                <text x="136" y="8" textAnchor="middle" fill="#C8903A" fontSize="9" fontFamily="serif" stroke="none">✦</text>
              </g>
              <line x1="18" y1="55" x2="158" y2="55" stroke="#2A2318" strokeWidth="0.75"/>
            </svg>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, border: "1px solid rgba(201,150,60,0.35)", background: "rgba(201,150,60,0.07)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#c9963c" }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: "#c9963c", letterSpacing: "0.05em" }}>{c.badge}</span>
            </div>
          </div>

          {/* Big headline */}
          <h1 className="reveal d2" style={{ fontSize: "clamp(48px, 5.5vw, 88px)", fontWeight: 400, lineHeight: 0.92, letterSpacing: "-0.035em", marginBottom: 28, fontStyle: "italic", fontFamily: "'Instrument Serif', Georgia, serif" }}>
            <span style={{ display: "block", color: "#f0ede6" }}>Skip the</span>
            <span style={{ display: "block", color: "#c9963c" }}>resume pile.</span>
            <span style={{ display: "block", color: "#f0ede6" }}>Talk directly</span>
            <span style={{ display: "block", color: "#f0ede6", opacity: 0.55 }}>to them.</span>
          </h1>

          <p className="reveal d3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.7, color: "#7a6e64", maxWidth: 420, marginBottom: 40, fontWeight: 300 }}>
            {c.heroSub}
          </p>

          {/* CTA row */}
          <div className="reveal d4" style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginBottom: 56 }}>
            <button className="landing-btn" onClick={onApply} style={{ fontFamily: "'DM Sans', sans-serif", padding: "14px 32px", background: "#c9963c", color: "#0d0c09", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 24px rgba(201,150,60,0.28)", letterSpacing: "0.01em" }}>
              {c.heroCta}
            </button>
            <button onClick={() => onApply("hiring")} style={{ fontFamily: "'DM Sans', sans-serif", padding: "14px 28px", background: "transparent", color: "#7a6e64", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 15, fontWeight: 400, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.target.style.borderColor = "rgba(201,150,60,0.3)"; e.target.style.color = "#c9963c"; }}
              onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.color = "#7a6e64"; }}>
              I'm a hiring manager →
            </button>
          </div>

          {/* Stats bar */}
          <div className="reveal d5" style={{ display: "inline-flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 28px", gap: 32 }}>
            {[["347", "on waitlist"], ["30", "hiring managers"], ["zero", "applications needed"]].map(([num, label], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, fontWeight: 400, color: i === 0 ? "#c9963c" : "#f0ede6", lineHeight: 1, fontStyle: "italic" }}>{num}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#4a4238", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Stat card — moved down from float panel */}
          <div className="reveal d6" style={{ marginTop: 20, display: "inline-flex", background: "rgba(20,18,14,0.85)", border: "1px solid rgba(201,150,60,0.18)", borderRadius: 12, padding: "16px 22px", gap: 24, backdropFilter: "blur(8px)" }}>
            {[["85%", "skip the screening call"], ["3×", "faster first conversation"]].map(([stat, label], i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, fontWeight: 400, color: "#c9963c", fontStyle: "italic", flexShrink: 0 }}>{stat}</span>
                <div style={{ width: 20, height: 1, background: "#3a3428", flexShrink: 0, marginBottom: 3 }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#5a5040", lineHeight: 1.4, maxWidth: 100 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Waitlist note */}
          <p className="reveal d7" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#3a3428", marginTop: 14 }}>{c.heroNote}</p>

          {/* Live activity ticker */}
          <div className="reveal d8"><ActivityTicker /></div>
        </div>

        {/* RIGHT — floating person cards, redesigned */}
        <div style={{ position: "relative", height: "100vh", minHeight: 640, zIndex: 1, overflow: "hidden" }}>

          {/* Atmospheric depth */}
          <div style={{ position: "absolute", top: "15%", left: "10%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,150,60,0.12) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(42,157,143,0.09) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "absolute", top: "55%", left: "20%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,111,205,0.06) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
          {/* SVG connection web — coords mapped to card centers */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", zIndex: 1 }} viewBox="0 0 500 700" preserveAspectRatio="none">
            {/* Card centers: Fatima ~185,175  Sarah ~345,370  Alex ~210,555 */}
            <line x1="195" y1="195" x2="320" y2="345" stroke="#c9963c" strokeWidth="1.5" strokeDasharray="6,5" opacity="0.5" className="reveal d3"/>
            <line x1="330" y1="390" x2="240" y2="530" stroke="#2a9d8f" strokeWidth="1.5" strokeDasharray="6,5" opacity="0.45" className="reveal d4"/>
            <line x1="180" y1="200" x2="205" y2="525" stroke="#c9963c" strokeWidth="1" strokeDasharray="4,7" opacity="0.22" className="reveal d5"/>
            <line x1="360" y1="340" x2="445" y2="265" stroke="#c9963c" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" className="reveal d4"/>
            <line x1="445" y1="265" x2="465" y2="410" stroke="#c9963c" strokeWidth="1" strokeDasharray="5,5" opacity="0.2" className="reveal d5"/>
            {[
              { cx: 445, cy: 265, icon: "✦" },
              { cx: 465, cy: 410, icon: "◎" },
              { cx: 100, cy: 390, icon: "→" },
            ].map(({ cx, cy, icon }, i) => (
              <g key={cx} className={`reveal d${i + 4}`}>
                <circle cx={cx} cy={cy} r="15" fill="rgba(18,16,12,0.95)" stroke="rgba(201,150,60,0.4)" strokeWidth="1"/>
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize="10" fill="#c9963c" fontFamily="serif">{icon}</text>
              </g>
            ))}
          </svg>

          {/* CARD 1 — Fatima Johnson — HIRING — top-left, primary, largest */}
          <div className="reveal d2" style={{
            position: "absolute", top: "6%", left: "3%",
            width: 205, borderRadius: 18, overflow: "hidden",
            border: "1px solid rgba(201,150,60,0.4)",
            background: "rgba(20,16,10,0.95)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 1px 0 rgba(201,150,60,0.15) inset",
            animation: "floatA 6s ease-in-out infinite", zIndex: 3,
          }}>
            <div style={{ position: "relative", height: 195, overflow: "hidden" }}>
              <img src="data:image/png;base64,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" alt="Fatima Johnson" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}/>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(18,14,8,0.98) 0%, rgba(18,14,8,0.35) 50%, transparent 100%)" }} />
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, padding: "6px 14px", borderRadius: 6, background: "#c9963c", fontSize: 11, color: "#0d0c09", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.09em", fontWeight: 800, textTransform: "uppercase", boxShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>HIRING</div>
            </div>
            <div style={{ padding: "14px 16px 16px", background: "rgba(26,20,12,0.98)" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#f0ede6", marginBottom: 2 }}>Fatima Johnson</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#c9963c", marginBottom: 10, fontWeight: 400 }}>Dir. Design · Figma</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0, boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#5a5248", lineHeight: 1 }}>Accepting requests</span>
              </div>
            </div>
          </div>

          {/* CARD 2 — Sarah Brown — HIRING — right, mid */}
          <div className="reveal d3" style={{
            position: "absolute", top: "30%", right: "2%",
            width: 190, borderRadius: 16, overflow: "hidden",
            border: "1px solid rgba(42,157,143,0.38)",
            background: "rgba(16,22,18,0.95)",
            boxShadow: "0 18px 52px rgba(0,0,0,0.5), 0 1px 0 rgba(42,157,143,0.12) inset",
            animation: "floatB 7s ease-in-out infinite", zIndex: 2,
          }}>
            <div style={{ position: "relative", height: 178, overflow: "hidden" }}>
              <img src="data:image/jpeg;base64,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" alt="Sarah Brown" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}/>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(14,20,16,0.98) 0%, rgba(14,20,16,0.3) 55%, transparent 100%)" }} />
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, padding: "6px 14px", borderRadius: 6, background: "#2a9d8f", fontSize: 11, color: "#ffffff", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.09em", fontWeight: 800, textTransform: "uppercase", boxShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>HIRING</div>
            </div>
            <div style={{ padding: "12px 14px 14px", background: "rgba(16,24,18,0.98)" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#f0ede6", marginBottom: 2 }}>Sarah Brown</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2a9d8f", marginBottom: 8, fontWeight: 400 }}>VP Eng · Stripe</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", flexShrink: 0, boxShadow: "0 0 5px rgba(245,158,11,0.5)" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#4a4840", lineHeight: 1 }}>2 spots left</span>
              </div>
            </div>
          </div>

          {/* CARD 3 — Alex Chen — CANDIDATE — bottom-center, smallest */}
          <div className="reveal d4" style={{
            position: "absolute", bottom: "8%", left: "22%",
            width: 175, borderRadius: 14, overflow: "hidden",
            border: "1px solid rgba(124,111,205,0.32)",
            background: "rgba(18,16,24,0.95)",
            boxShadow: "0 14px 40px rgba(0,0,0,0.45), 0 1px 0 rgba(124,111,205,0.1) inset",
            animation: "floatC 8s ease-in-out infinite", zIndex: 2,
          }}>
            <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
              <img src="data:image/jpeg;base64,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" alt="Alex Chen" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}/>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,14,20,0.98) 0%, rgba(16,14,20,0.3) 55%, transparent 100%)" }} />
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, padding: "6px 14px", borderRadius: 6, background: "#7c6fcd", fontSize: 11, color: "#ffffff", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.09em", fontWeight: 800, textTransform: "uppercase", boxShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>CANDIDATE</div>
            </div>
            <div style={{ padding: "11px 13px 13px", background: "rgba(18,16,26,0.98)" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#f0ede6", marginBottom: 2 }}>Alex Chen</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#9a8fdd", marginBottom: 8, fontWeight: 400 }}>Sr. Product Designer</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0, boxShadow: "0 0 5px rgba(34,197,94,0.5)" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#4a4448", lineHeight: 1 }}>In the cohort</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Problem */}
      <section style={{ padding: "100px 48px", maxWidth: 760, margin: "0 auto" }}>
        <div className="reveal" style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,150,60,0.4), transparent)", marginBottom: 64 }} />
        <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, fontStyle: "italic", lineHeight: 1.2, marginBottom: 40, color: "#f0ede6", letterSpacing: "-0.02em" }} className="reveal">
          {c.problemHead}
        </h2>
        {c.problemBody.map((p, i) => (
          <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, lineHeight: 1.8, color: i === 2 ? "#c9963c" : "#7a6e64", marginBottom: 20, fontWeight: i === 2 ? 500 : 300 }} className={`reveal d${i + 2}`}>
            {p}
          </p>
        ))}
      </section>

      {/* How it works */}
      <section style={{ padding: "80px 48px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 52 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5a5248" }}>Process</div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, fontWeight: 400, fontStyle: "italic", color: "#f0ede6", letterSpacing: "-0.02em" }}>{c.howHead}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {c.steps.map((s, i) => (
              <div key={i} className={`step-card reveal d${i + 2}`} style={{ padding: 32, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, background: "rgba(255,255,255,0.02)", position: "relative", overflow: "hidden" }}>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 64, fontWeight: 400, color: "rgba(201,150,60,0.12)", lineHeight: 1, marginBottom: 20, fontStyle: "italic" }}>{s.n}</div>
                <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, fontWeight: 400, color: "#f0ede6", marginBottom: 14, lineHeight: 1.2, fontStyle: "italic" }}>{s.head}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.7, color: "#7a6e64", fontWeight: 300, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding cohort */}
      <section style={{ padding: "100px 48px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 400, fontStyle: "italic", lineHeight: 1.2, marginBottom: 32, color: "#f0ede6", letterSpacing: "-0.02em" }} className="reveal">
            {c.cohortHead}
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, lineHeight: 1.8, color: "#7a6e64", marginBottom: 40, fontWeight: 300 }} className="reveal d2">
            {c.cohortBody}
          </p>
          <div className="reveal d3" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {c.cohortList.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(201,150,60,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c9963c" }} />
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#c8bfb4", lineHeight: 1.5, fontWeight: 300 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights — research-backed, no fake quotes */}
      <section style={{ padding: "80px 48px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Section header */}
          <div className="reveal" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 52 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5a5248" }}>Why the current system fails everyone</div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
          </div>

          {/* Insight cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {c.insights.map((item, i) => (
              <div key={i} className={`reveal d${i + 2}`} style={{
                padding: 36,
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Subtle top accent line */}
                <div style={{ position: "absolute", top: 0, left: 32, right: 32, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,150,60,0.25), transparent)" }} />

                {/* Big stat */}
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 52, fontWeight: 400, fontStyle: "italic", color: "#c9963c", lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {item.stat}
                </div>

                {/* Statement */}
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.7, color: "#9a9080", fontWeight: 300, margin: 0, flex: 1 }}>
                  {item.statLabel}
                </p>

                {/* Source */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#5a5248", flexShrink: 0 }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#4a4440", letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.source}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Honest placeholder for real quotes */}
          <div className="reveal d5" style={{
            marginTop: 32,
            padding: "24px 32px",
            border: "1px dashed rgba(201,150,60,0.18)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 20,
            background: "rgba(201,150,60,0.025)"
          }}>
            <div style={{ fontSize: 28, opacity: 0.3 }}>✦</div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#7a6e64", fontWeight: 400, marginBottom: 4 }}>
                We're collecting feedback from hiring managers in the founding cohort.
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#4a4440", fontWeight: 300 }}>
                Real quotes from real people will live here. We'd rather wait and be honest than invent voices we don't have yet.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "120px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div className="reveal" style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,150,60,0.3), transparent)", marginBottom: 64 }} />
          <h2 style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 20, color: "#f0ede6", letterSpacing: "-0.02em" }} className="reveal">
            {c.ctaHead}
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#7a6e64", marginBottom: 44, lineHeight: 1.7, fontWeight: 300 }} className="reveal d2">
            {c.ctaSub}
          </p>
          <button className="landing-btn reveal d3" onClick={onApply} style={{ fontFamily: "'DM Sans', sans-serif", padding: "16px 44px", background: "#c9963c", color: "#0d0c09", border: "none", borderRadius: 8, fontSize: 17, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 24px rgba(201,150,60,0.25)", letterSpacing: "0.01em", display: "inline-block" }}>
            {c.ctaBtn}
          </button>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#3a3830", marginTop: 28 }} className="reveal d4">
            Are you a hiring manager? <span style={{ color: "#5a5248", cursor: "pointer", textDecoration: "underline" }} onClick={() => onApply("hiring")}>Apply here →</span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 48px", borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#3a3830", lineHeight: 1.7, maxWidth: 600, margin: "0 auto" }}>{c.footer}</p>
      </footer>
    </div>
  );
};

// ─────────── FORM COMPONENT ──────────────────────────────────────────────────

const FormPage = ({ type, onBack }) => {
  const c = COPY[type];
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(null);
  const [refLink, setRefLink] = useState("");
  const [copied, setCopied] = useState(false);
  const isHiring = type === "hiring";

  // Capture inbound referral code on mount
  const inboundRef = useRef(getInboundRef());

  const set = (id, val) => setValues(v => ({ ...v, [id]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formId = isHiring ? TALLY_HIRING_ID : TALLY_CANDIDATE_ID;

    // Generate referral link
    if (!isHiring && values.name && values.email) {
      setRefLink(makeRefUrl(values.name, values.email));
    }

    try {
      // Build form payload
      const payload = {};
      Object.entries(values).forEach(([key, val]) => {
        payload[key] = Array.isArray(val) ? val.join(", ") : (val || "");
      });
      if (inboundRef.current) payload["referred_by"] = inboundRef.current;

      // Submit to Tally's embed endpoint — silent background POST, no redirect
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => formData.append(k, v));

      await fetch(`https://tally.so/r/${formId}`, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });
    } catch (_) {
      // no-cors always throws — submission still goes through
    }

    setSubmitting(false);
    setSubmitted(true);
  };
  const inputStyle = (id) => ({
    width: "100%", padding: "11px 14px",
    background: focused === id ? "rgba(201,150,60,0.05)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${focused === id ? "rgba(201,150,60,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 8, color: "#f0ede6", fontSize: 14, outline: "none",
    fontFamily: "'DM Sans', sans-serif", transition: "all .15s", lineHeight: 1.5,
    caretColor: "#c9963c"
  });

  if (submitted) {
    const s = c.success;
    const copyRef = () => {
      navigator.clipboard.writeText(refLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#f0ede6", background: "#0d0c09", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ maxWidth: 500, textAlign: "center" }}>

          {/* Checkmark */}
          <div style={{ width: 60, height: 60, borderRadius: "50%", border: "1px solid rgba(201,150,60,0.4)", background: "rgba(201,150,60,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", fontSize: 24 }}>✦</div>

          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 40, fontWeight: 400, fontStyle: "italic", color: "#f0ede6", marginBottom: 16, letterSpacing: "-0.02em" }}>{s.head}</h2>
          <p style={{ fontSize: 16, color: "#7a6e64", lineHeight: 1.7, marginBottom: 36, fontWeight: 300 }}>{s.sub}</p>

          {/* Referral block — candidates only */}
          {!isHiring && refLink && (
            <div style={{ marginBottom: 28, padding: 24, background: "rgba(201,150,60,0.05)", border: "1px solid rgba(201,150,60,0.2)", borderRadius: 12, textAlign: "left" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "#c9963c", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Your referral link</div>
              <p style={{ fontSize: 13, color: "#7a6e64", lineHeight: 1.6, marginBottom: 16 }}>
                Every person who applies through your link moves you <strong style={{ color: "#c8bfb4" }}>30 spots forward</strong> on the waitlist.
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                <div style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12, color: "#9a9080", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {refLink}
                </div>
                <button onClick={copyRef} style={{ padding: "10px 18px", background: copied ? "rgba(34,197,94,0.15)" : "#c9963c", color: copied ? "#22c55e" : "#0d0c09", border: copied ? "1px solid rgba(34,197,94,0.4)" : "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", transition: "all .2s", flexShrink: 0 }}>
                  {copied ? "✓ Copied" : "Copy link"}
                </button>
              </div>
            </div>
          )}

          {/* HM thank-you note */}
          {isHiring && (
            <div style={{ marginBottom: 28, padding: 20, background: "rgba(42,157,143,0.05)", border: "1px solid rgba(42,157,143,0.2)", borderRadius: 10, fontSize: 14, color: "#9a8a72", lineHeight: 1.65, textAlign: "left" }}>
              {s.note}
            </div>
          )}

          <button onClick={onBack} style={{ fontFamily: "'DM Sans', sans-serif", padding: "11px 24px", background: "transparent", color: "#5a5248", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>← Back to site</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#f0ede6", background: "#0d0c09", minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; }
        .checkbox-opt { display: flex; align-items: center; gap: 10; padding: 9px 12px; border: 1px solid rgba(255,255,255,0.07); border-radius: 7px; cursor: pointer; transition: all .15s; }
        .checkbox-opt:hover { border-color: rgba(201,150,60,0.3); background: rgba(201,150,60,0.04); }
        .submit-btn:hover { background: #e8b84a !important; transform: translateY(-1px); }
        .submit-btn { transition: all .2s ease; }
        select option { background-color: #1e1c18; color: #f0ede6; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 8px 12px; }
        select option:hover { background-color: #2a2318; }
        select option:checked { background-color: #c9963c; color: #0d0c09; }
      `}</style>
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "72px 32px 100px" }}>
        <button onClick={onBack} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#5a5248", background: "none", border: "none", cursor: "pointer", marginBottom: 32, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>← Back</button>
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, border: "1px solid rgba(201,150,60,0.3)", background: "rgba(201,150,60,0.06)", marginBottom: 32 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#c9963c" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#c9963c", letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.badge}</span>
        </div>

        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 400, fontStyle: "italic", color: "#f0ede6", marginBottom: 16, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{c.head}</h1>
        <p style={{ fontSize: 16, color: "#7a6e64", lineHeight: 1.7, marginBottom: 20, fontWeight: 300, maxWidth: 560 }}>{c.sub}</p>
        {!isHiring && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 16px", borderRadius: 100, background: "rgba(201,150,60,0.06)", border: "1px solid rgba(201,150,60,0.2)", marginBottom: isHiring ? 12 : 28 }}>
            <div style={{ display: "flex", gap: -4 }}>
              {["#c9963c","#2a9d8f","#7c6fcd"].map((c,i) => (
                <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: "2px solid #0d0c09", marginLeft: i > 0 ? -6 : 0, opacity: 0.85 }} />
              ))}
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9a8a72", fontWeight: 400 }}>347 professionals already on the waitlist</span>
          </div>
        )}

        {isHiring && c.intro && (
          <div style={{ padding: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#5a5248", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>{c.intro}</div>
            {c.commitments.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < c.commitments.length - 1 ? 10 : 0 }}>
                <div style={{ color: "#c9963c", fontSize: 14, marginTop: 2, flexShrink: 0 }}>→</div>
                <span style={{ fontSize: 14, color: "#8a8078", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {c.fields.map(field => (
            <div key={field.id}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8a8078", marginBottom: 8, letterSpacing: "0.01em" }}>
                {field.label}
                {field.required && <span style={{ color: "#c9963c", marginLeft: 4 }}>*</span>}
              </label>

              {field.type === "text" || field.type === "email" || field.type === "url" || field.type === "number" ? (
                <input type={field.type} placeholder={field.placeholder} value={values[field.id] || ""} onChange={e => set(field.id, e.target.value)} onFocus={() => setFocused(field.id)} onBlur={() => setFocused(null)} style={inputStyle(field.id)} required={field.required} />
              ) : field.type === "textarea" ? (
                <textarea rows={4} placeholder={field.placeholder} value={values[field.id] || ""} onChange={e => set(field.id, e.target.value)} onFocus={() => setFocused(field.id)} onBlur={() => setFocused(null)} style={{ ...inputStyle(field.id), resize: "vertical" }} required={field.required} />
              ) : field.type === "select" ? (
                <select value={values[field.id] || ""} onChange={e => set(field.id, e.target.value)} onFocus={() => setFocused(field.id)} onBlur={() => setFocused(null)} style={{ ...inputStyle(field.id), appearance: "none", backgroundColor: "#1e1c18", color: "#f0ede6", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c9963c' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}>
                  <option value="">Select one...</option>
                  {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : field.type === "multiselect" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {field.options.map(opt => {
                    const selected = (values[field.id] || []).includes(opt);
                    return (
                      <div key={opt} className="checkbox-opt" onClick={() => { const cur = values[field.id] || []; set(field.id, selected ? cur.filter(x => x !== opt) : [...cur, opt]); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", border: `1px solid ${selected ? "rgba(201,150,60,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, cursor: "pointer", background: selected ? "rgba(201,150,60,0.08)" : "transparent", transition: "all .15s" }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${selected ? "#c9963c" : "rgba(255,255,255,0.2)"}`, background: selected ? "#c9963c" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                          {selected && <span style={{ fontSize: 10, color: "#0d0c09", fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 14, color: selected ? "#c9963c" : "#8a8078" }}>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {field.hint && <div style={{ fontSize: 12, color: "#4a4238", marginTop: 7, lineHeight: 1.5 }}>{field.hint}</div>}
            </div>
          ))}

          {(isHiring ? TALLY_HIRING_ID : TALLY_CANDIDATE_ID).startsWith("YOUR_") && (
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(201,150,60,0.07)", border: "1px solid rgba(201,150,60,0.25)", borderRadius: 8, fontSize: 12, color: "#9a8a72", lineHeight: 1.7 }}>
              ⚠️ <strong style={{ color: "#c9963c" }}>Form not connected.</strong> Go to <a href="https://tally.so" target="_blank" rel="noreferrer" style={{ color: "#c9963c" }}>tally.so</a>, create a free form, and paste the ID into <code style={{ background: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 3 }}>{isHiring ? "TALLY_HIRING_ID" : "TALLY_CANDIDATE_ID"}</code> at the top of this file.
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <button type="submit" disabled={submitting} className="submit-btn" style={{ width: "100%", padding: "16px 0", background: submitting ? "#a07828" : "#c9963c", color: "#0d0c09", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: submitting ? "wait" : "pointer", letterSpacing: "0.01em", fontFamily: "'DM Sans', sans-serif", transition: "background .2s", opacity: submitting ? 0.8 : 1 }}>
              {submitting ? "Submitting..." : c.submit}
            </button>


            <p style={{ fontSize: 12, color: "#3a3830", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>{c.disclaimer}</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [page, setPage] = useState("landing");

  // Detect inbound referral code — show welcome screen if present
  const inboundRef = getInboundRef();
  const [showWelcome, setShowWelcome] = useState(!!inboundRef);

  if (showWelcome) {
    return (
      <ReferralWelcome
        refCode={inboundRef}
        onContinue={() => {
          setShowWelcome(false);
          setPage("candidate");
        }}
      />
    );
  }

  return (
    <div style={{ background: "#0d0c09", minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0c09; }
      `}</style>
      {page === "landing"   && <LandingPage onApply={(t) => setPage(t === "hiring" ? "hiring" : "candidate")} />}
      {page === "candidate" && <FormPage type="candidate" onBack={() => setPage("landing")} />}
      {page === "hiring"    && <FormPage type="hiring"    onBack={() => setPage("landing")} />}
    </div>
  );
}
