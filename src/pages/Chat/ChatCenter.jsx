import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getConversations, openDirect, openGeneral, getMessages, getUsers, sendMessage,
} from '../../api/services/chat';
import {
  MessageSquare, Send, Users, Hash, AtSign, Search, Plus, X, Paperclip,
  Megaphone, ArrowRight, Circle, CheckCheck, Clock, Building2, User as UserIcon,
} from 'lucide-react';

const ROLE_TONE = {
  GM: 'amber', AGM: 'amber', DESIGN_MGR: 'sky', SUP_MGR: 'violet', PM: 'violet',
  SENIOR_ENG: 'emerald', ENGINEER: 'sky', DRAFTSMAN: 'emerald',
  ACCOUNTANT: 'rose', SECRETARY: 'amber', DOC_CONTROLLER: 'slate',
};
const initials = (n) => (n || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const relTime = (iso) => {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `${m}د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}س`;
  return new Date(iso).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' });
};
const fullTime = (iso) => new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });

export default function ChatCenter() {
  const { user } = useAuth();
  const [convs, setConvs] = useState([]);
  const [users, setUsers] = useState([]);
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [draft, setDraft] = useState('');
  const [mentions, setMentions] = useState([]);      // [{id,name}]
  const [mentionOpen, setMentionOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [mobileList, setMobileList] = useState(true);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
const [convQuery, setConvQuery] = useState('');


// ✅ تصفير عداد الرسائل غير المقروءة فور فتح المحادثة
// ✅ تصفير عداد الرسائل غير المقروءة عند فتح المحادثة، ومنع ظهور الرقم لرسالة أرسلتها أنت
useEffect(() => {
  if (!user?.id) return;

  setConvs((prev) => {
    let changed = false;

    const next = prev.map((conv) => {
      const isOpen = active?.id === conv.id;

      const lastMessageIsMine =
        conv.last_message?.sender_id === user.id ||
        conv.last_message?.sender === user.id;

      if ((isOpen || lastMessageIsMine) && conv.unread_count > 0) {
        changed = true;
        return { ...conv, unread_count: 0 };
      }

      return conv;
    });

    return changed ? next : prev;
  });
}, [convs, active?.id, user?.id]);
  /* ── تحميل المحادثات والمستخدمين ── */
  const loadConvs = useCallback(() => {
    getConversations().then((r) => setConvs(r.data.results || r.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    loadConvs();
    getUsers().then((r) => setUsers((r.data.results || r.data || []).filter((u) => u.id !== user?.id))).catch(() => {});
    const t = setInterval(loadConvs, 9000);
    return () => clearInterval(t);
  }, [loadConvs, user]);

  /* ── تحميل رسائل الغرفة المفتوحة + polling ── */
  const loadMsgs = useCallback(() => {
    if (!active) return;
    getMessages(active.id).then((r) => {
      const list = r.data.results || r.data || [];
      setMsgs([...list].reverse());
    }).catch(() => {});
  }, [active]);
  useEffect(() => {
    if (!active) { setMsgs([]); return; }
    loadMsgs();
    const t = setInterval(loadMsgs, 3500);
    return () => clearInterval(t);
  }, [active, loadMsgs]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs]);

  /* ── فتح محادثة ── */
  const openConv = (c) => { setActive(c); setMobileList(false); };
  const startDirect = async (u) => {
    try { const r = await openDirect(u.id); openConv(r.data); setNewOpen(false); setUserQuery(''); }
    catch { alert('Unable to open the conversation.'); }
  };
  const startGeneral = async () => {
    try { const r = await openGeneral(); openConv(r.data); setNewOpen(false); }
    catch { alert('Unable to open the general broadcast.'); }
  };

  /* ── الإرسال ── */
  const send = async (e) => {
    e?.preventDefault();
    if (!draft.trim() || !active || sending) return;
    setSending(true);
    try {
      await sendMessage(active.id, { message: draft.trim(), mentions: mentions.map((m) => m.id) });
      setDraft(''); setMentions([]); setMentionOpen(false);
      loadMsgs(); loadConvs();
    } catch { alert('Unable to send the message.'); }
    finally { setSending(false); }
  };

  /* ── المنبّه @ ── */
  const addMention = (u) => {
    if (!mentions.find((m) => m.id === u.id)) {
      setMentions((p) => [...p, u]);
      setDraft((d) => `${d}@${u.first_name || u.username} `);
    }
    setMentionOpen(false);
    inputRef.current?.focus();
  };

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return users.filter((u) =>
      !q || `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [users, userQuery]);

  const mentionFiltered = useMemo(() => {
    const q = draft.split('@').pop()?.toLowerCase() || '';
    return users.filter((u) =>
      !mentions.find((m) => m.id === u.id) &&
      `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [users, draft, mentions]);

  const typeLabel = { DIRECT: 'Private conversation', GENERAL: 'General broadcast', PROJECT: 'Project room' };
const filteredConvs = useMemo(() => {
  const q = convQuery.trim().toLowerCase();
  if (!q) return convs;
  
  return convs.filter((c) => 
    c.display_name?.toLowerCase().includes(q)
  );
}, [convs, convQuery]);
  return (
    <div className="cha" dir="rtl">
      <style>{CSS}</style>
      <div className="cha-ambient" aria-hidden />

      {/* ═══ قائمة المحادثات ═══ */}
      <aside className={`cha-side ${mobileList ? 'show' : ''}`}>
        <div className="cha-side-h">
          <div className="cha-brand"><MessageSquare size={18} /><b>Correspondence</b></div>
          <div className="cha-side-acts">
            <button className="cha-ic" title="Broadcast to All" onClick={startGeneral}><Megaphone size={16} /></button>
            <button className="cha-ic primary" title="New Conversation" onClick={() => setNewOpen(true)}><Plus size={16} /></button>
          </div>
        </div>

<div className="cha-search">
  <Search size={14} />
  <input 
    placeholder="Search conversations..." 
    value={convQuery}
    onChange={(e) => setConvQuery(e.target.value)}
  />
</div>
<div className="cha-conv-list">
  {convs.length === 0 && <p className="cha-empty-side">No conversations yet — start a new one.</p>}
  {convs.length > 0 && filteredConvs.length === 0 && (
    <p className="cha-empty-side">No matching conversations found.</p>
  )}
  
  {filteredConvs.map((c) => {
    const on = active?.id === c.id;
    const lm = c.last_message;

            return (
              <button key={c.id} className={`cha-conv ${on ? 'on' : ''}`} onClick={() => openConv(c)}>
                <Avatar name={c.display_name} tone={c.avatar_tone} />
                <div className="cha-conv-body">
                  <div className="cha-conv-top">
                    <span className="cha-conv-name">{c.display_name}</span>
                    <span className="cha-conv-time">{lm ? relTime(lm.created_at) : ''}</span>
                  </div>
                  <div className="cha-conv-bot">
                    <span className="cha-conv-last">
                      {c.room_type === 'GENERAL' && <Megaphone size={11} />}
                      {c.room_type === 'PROJECT' && <Building2 size={11} />}
                      {lm ? `${lm.sender_id === user?.id ? 'أنت: ' : ''}${lm.message || (lm.has_attachment ? '📎 مرفق' : '')}` : 'لا رسائل بعد'}
                    </span>
                    {c.unread_count > 0 && <span className="cha-unread">{c.unread_count > 9 ? '9+' : c.unread_count}</span>}
                  </div>
                </div>
                <span className={`cha-type-dot t-${c.room_type.toLowerCase()}`} title={typeLabel[c.room_type]} />
              </button>
            );
          })}
        </div>
      </aside>

      {/* ═══ منطقة الشات ═══ */}
      <main className="cha-main">
        {!active ? (
          <div className="cha-noconv">
            <div className="cha-noconv-orb"><MessageSquare size={34} /></div>
            <h2>Select a conversation or start a new one.</h2>
            <p>Communicate directly with any colleague, or broadcast an announcement to the entire team from the «General Announcements» room.</p>
            <div className="cha-noconv-acts">
              <button className="cha-btn primary" onClick={() => setNewOpen(true)}><Plus size={16} /> New Conversation</button>
              <button className="cha-btn" onClick={startGeneral}><Megaphone size={16} /> Broadcast to All</button>
            </div>
          </div>
        ) : (
          <>
            {/* رأس المحادثة */}
            <header className="cha-head">
{/* 👈 استبدل زر cha-back القديم بهذا السطر */}
<button className="cha-back" title="إغلاق المحادثة والرجوع" onClick={() => { setActive(null); setMobileList(true); }}>
  <ArrowRight size={18} />
</button>              <Avatar name={active.display_name} tone={active.avatar_tone} size={42} />
              <div className="cha-head-txt">
                <b>{active.display_name}</b>

              </div>
              <span className="cha-live"><span className="cha-live-dot" /> Live</span>
            </header>

            {/* الرسائل */}
            <div className="cha-msgs" ref={scrollRef}>
              {msgs.length === 0 && <p className="cha-empty-msgs">No messages yet. Start the conversation 👋</p>}
              {msgs.map((m, i) => {
                const mine = m.sender === user?.id || m.sender_id === user?.id;
                const prev = msgs[i - 1];
                const grouped = prev && (prev.sender === m.sender || prev.sender_id === m.sender_id);
                return (
                  <div key={m.id} className={`cha-row ${mine ? 'mine' : 'theirs'} ${grouped ? 'grouped' : ''}`}>
                    {!mine && !grouped && <Avatar name={m.sender_name} tone={ROLE_TONE[(users.find((u) => u.id === m.sender_id) || {}).role] || 'slate'} size={30} />}
                    {!mine && grouped && <span className="cha-row-spacer" />}
                    <div className="cha-bubble-wrap">
{!mine && active.room_type !== 'DIRECT' && (
  <span className="cha-sender">{m.sender_name}</span>
)}
                      <div className={`cha-bubble ${mine ? 'mine' : 'theirs'}`}>
                        <p>{m.message}</p>
                        {m.attachment && <a className="cha-attach" href={m.attachment} target="_blank" rel="noreferrer"><Paperclip size={12} /> مرفق</a>}
                      </div>
                      <span className="cha-time">{fullTime(m.created_at)}{mine && <CheckCheck size={11} />}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* حقل الإدخال */}
            <form className="cha-compose" onSubmit={send}>
              {mentions.length > 0 && (
                <div className="cha-mentions">
                  {mentions.map((m) => (
                    <span key={m.id} className="cha-mention-chip">
                      @{m.first_name || m.username}
                      <button type="button" onClick={() => setMentions((p) => p.filter((x) => x.id !== m.id))}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="cha-compose-row">
                <div className="cha-mention-wrap">
                  <button type="button" className="cha-ic" title="Mention a person @" onClick={() => setMentionOpen((o) => !o)}><AtSign size={16} /></button>
                  {mentionOpen && (
                    <div className="cha-mention-pop">
                      <div className="cha-mention-search"><Search size={12} /><input autoFocus placeholder="search…" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} /></div>
                      <div className="cha-mention-list">
                        {mentionFiltered.map((u) => (
                          <button type="button" key={u.id} className="cha-mention-item" onClick={() => addMention(u)}>
                            <Avatar name={`${u.first_name} ${u.last_name}`} tone={ROLE_TONE[u.role] || 'slate'} size={26} />
                            <span><b>{u.first_name} {u.last_name}</b><em>{u.role_display || u.role}</em></span>
                          </button>
                        ))}
                        {mentionFiltered.length === 0 && <p className="cha-empty-mini">No results found</p>}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={inputRef}
                  className="cha-input"
                  placeholder={active.room_type === 'GENERAL' ? 'Write a broadcast to everyone…' : 'Write your message…'}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
                />
                <button type="submit" className="cha-send" disabled={!draft.trim() || sending}>
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        )}
      </main>

      {/* ═══ لوحة محادثة جديدة ═══ */}
      {newOpen && (
        <div className="cha-mask" onClick={() => setNewOpen(false)}>
          <div className="cha-new" onClick={(e) => e.stopPropagation()}>
            <div className="cha-new-h"><h3>New Conversation</h3><button onClick={() => setNewOpen(false)}><X size={18} /></button></div>
            <button className="cha-new-broadcast" onClick={startGeneral}>
              <Megaphone size={18} /><div><b>Broadcast to All</b><span>Send an announcement to the entire team</span></div>
            </button>
            <div className="cha-new-search"><Search size={14} /><input autoFocus placeholder="Search for a colleague…" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} /></div>
            <div className="cha-new-list">
              {filteredUsers.map((u) => (
                <button key={u.id} className="cha-new-item" onClick={() => startDirect(u)}>
                  <Avatar name={`${u.first_name} ${u.last_name}`} tone={ROLE_TONE[u.role] || 'slate'} size={36} />
                  <span className="cha-new-txt"><b>{u.first_name} {u.last_name}</b><em>{u.role_display || u.role} · {u.department || 'General'}</em></span>
                  <MessageSquare size={15} />
                </button>
              ))}
              {filteredUsers.length === 0 && <p className="cha-empty-mini">No colleagues found</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ name, tone = 'slate', size = 40 }) {
  return <span className={`cha-av cha-av--${tone}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials(name)}</span>;
}
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

.cha{ 
  --ink:#ffffff; --ink2:#f8fafc; --surf:#ffffff; --surf2:#f1f5f9; --line:#e2e8f0;
  --paper:#0f172a; --mut:#64748b; --amber:#f59e0b; --emerald:#10b981; --sky:#0ea5e9;
  --rose:#ef4444; --violet:#8b5cf6; --slate:#64748b;
  position:relative; display:flex; height:calc(100vh - 64px); height:calc(100dvh - 64px); overflow:hidden;
  color:var(--paper); font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
  background:linear-gradient(180deg,#f8fafc,#f1f5f9); 
}
.cha-ambient{ position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(50% 40% at 96% -6%, rgba(245,158,11,.08), transparent 60%),
    radial-gradient(46% 40% at -4% 104%, rgba(14,165,233,.08), transparent 60%),
    linear-gradient(rgba(14,165,233,.03) 1px,transparent 1px), linear-gradient(90deg,rgba(14,165,233,.03) 1px,transparent 1px);
  background-size:auto,auto,44px 44px,44px 44px; }
.cha > *:not(.cha-ambient){ position:relative; }

/* القائمة الجانبية */
.cha-side{ width:330px; flex:none; display:flex; flex-direction:column; border-inline-end:1px solid var(--line); background:rgba(255,255,255,.9); backdrop-filter:blur(10px); }
.cha-side-h{ display:flex; align-items:center; justify-content:space-between; padding:16px 16px 12px; border-bottom:1px solid var(--line); }
.cha-brand{ display:flex; align-items:center; gap:9px; }
.cha-brand b{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:17px; font-weight:700; color:var(--paper); }
.cha-brand svg{ color:var(--amber); }
.cha-side-acts{ display:flex; gap:7px; }
.cha-ic{ width:34px; height:34px; border-radius:9px; display:grid; place-items:center; background:rgba(0,0,0,.03); border:1px solid var(--line); color:var(--mut); cursor:pointer; transition:.2s; }
.cha-ic:hover{ color:var(--sky); border-color:#cbd5e1; transform:translateY(-1px); background:rgba(0,0,0,.06); }
.cha-ic.primary{ background:rgba(14,165,233,.1); color:var(--sky); border-color:rgba(14,165,233,.25); }
.cha-ic.primary:hover{ background:rgba(14,165,233,.18); }
.cha-search{ display:flex; align-items:center; gap:8px; margin:12px 14px 6px; padding:0 11px; background:var(--surf); border:1px solid var(--line); border-radius:10px; color:var(--mut); box-shadow:inset 0 2px 4px rgba(0,0,0,.01); }
.cha-search input{ flex:1; background:none; border:none; outline:none; color:var(--paper); font-family:inherit; font-size:13px; padding:9px 0; }
.cha-search input::placeholder{ color:#94a3b8; }
.cha-conv-list{ flex:1; overflow-y:auto; padding:6px 8px 12px; -webkit-overflow-scrolling:touch; }
.cha-conv-list::-webkit-scrollbar{ width:6px; } .cha-conv-list::-webkit-scrollbar-thumb{ background:#cbd5e1; border-radius:9px; }
.cha-empty-side{ text-align:center; color:var(--mut); font-size:12.5px; padding:30px 16px; }
.cha-conv{ position:relative; display:flex; align-items:center; gap:11px; width:100%; text-align:start; padding:10px 11px; border-radius:12px; border:1px solid transparent; background:none; cursor:pointer; transition:.2s; margin-bottom:2px; }
.cha-conv:hover{ background:rgba(0,0,0,.03); }
.cha-conv.on{ background:linear-gradient(90deg,rgba(14,165,233,.1),rgba(14,165,233,.02)); border-color:rgba(14,165,233,.2); }
.cha-conv.on::before{ content:""; position:absolute; inset-inline-start:-1px; top:9px; bottom:9px; width:3px; border-radius:0 3px 3px 0; background:var(--sky); box-shadow:0 0 10px rgba(14,165,233,.4); }
.cha-conv-body{ flex:1; min-width:0; }
.cha-conv-top{ display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
.cha-conv-name{ font-size:13.5px; font-weight:700; color:var(--paper); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cha-conv-time{ font-family:'JetBrains Mono'; font-size:9.5px; color:var(--mut); font-weight:600; flex:none; }
.cha-conv-bot{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:3px; }
.cha-conv-last{ display:flex; align-items:center; gap:5px; font-size:11.5px; color:var(--mut); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cha-conv-last svg{ flex:none; opacity:.7; }
.cha-unread{ flex:none; min-width:18px; height:18px; padding:0 5px; border-radius:9px; background:var(--rose); color:#fff; font-family:'JetBrains Mono'; font-size:10px; font-weight:700; display:grid; place-items:center; position:relative; }
.cha-unread::after{ content:""; position:absolute; inset:-2px; border-radius:9px; background:var(--rose); opacity:.45; animation:chaping 1.7s infinite; z-index:-1; }
@keyframes chaping{ 70%,100%{ transform:scale(1.8); opacity:0; } }
.cha-type-dot{ position:absolute; top:11px; inset-inline-start:11px; width:8px; height:8px; border-radius:50%; box-shadow:0 0 0 2px var(--surf); }
.cha-type-dot.t-direct{ background:var(--emerald); } .cha-type-dot.t-general{ background:var(--amber); } .cha-type-dot.t-project{ background:var(--sky); }

/* الأفاتار */
.cha-av{ flex:none; border-radius:50%; display:grid; place-items:center; font-family:'Space Grotesk'; font-weight:700; color:#ffffff; box-shadow:inset 0 0 0 1px rgba(0,0,0,.08); }
.cha-av--amber{ background:linear-gradient(145deg,#f59e0b,#d97706); } .cha-av--sky{ background:linear-gradient(145deg,#38bdf8,#0284c7); }
.cha-av--emerald{ background:linear-gradient(145deg,#34d399,#059669); } .cha-av--violet{ background:linear-gradient(145deg,#a78bfa,#7c3aed); }
.cha-av--rose{ background:linear-gradient(145deg,#fb7185,#e11d48); } .cha-av--slate{ background:linear-gradient(145deg,#94a3b8,#475569); }

/* المنطقة الرئيسية */
.cha-main{ flex:1; display:flex; flex-direction:column; min-width:0; height:100%; overflow:hidden; }
.cha-noconv{ flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center; padding:30px; }
.cha-noconv-orb{ width:84px; height:84px; border-radius:24px; display:grid; place-items:center; background:linear-gradient(145deg,rgba(14,165,233,.1),rgba(14,165,233,.02)); color:var(--sky); border:1px solid rgba(14,165,233,.2); animation:chafloat 4s ease-in-out infinite; box-shadow:0 12px 24px -10px rgba(14,165,233,.15); }
@keyframes chafloat{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-8px); } }
.cha-noconv h2{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:22px; font-weight:700; margin:0; color:var(--paper); }
.cha-noconv p{ color:var(--mut); font-size:13.5px; max-width:42ch; margin:0; font-weight:500;}
.cha-noconv-acts{ display:flex; gap:10px; margin-top:6px; flex-wrap:wrap; justify-content:center; }
.cha-btn{ display:inline-flex; align-items:center; gap:7px; padding:10px 18px; border-radius:11px; border:1px solid var(--line); background:var(--surf); color:var(--paper); font-family:inherit; font-weight:700; font-size:13px; cursor:pointer; transition:.2s; box-shadow:0 2px 5px rgba(0,0,0,.02); }
.cha-btn:hover{ transform:translateY(-2px); border-color:#cbd5e1; box-shadow:0 4px 10px rgba(0,0,0,.04); }
.cha-btn.primary{ background:linear-gradient(120deg,var(--sky),#0284c7); color:#ffffff; border:none; box-shadow:0 8px 20px -8px rgba(14,165,233,.6); }
.cha-btn.primary:hover{ filter:brightness(1.08); }

/* رأس المحادثة */
.cha-head{ display:flex; align-items:center; gap:12px; padding:13px 18px; border-bottom:1px solid var(--line); background:rgba(255,255,255,.8); backdrop-filter:blur(8px); flex-shrink:0; }
.cha-back{ display:none; width:36px; height:36px; border-radius:9px; background:var(--surf); border:1px solid var(--line); color:var(--paper); cursor:pointer; flex:none; place-items:center; }
.cha-head-txt{ flex:1; min-width:0; }
.cha-head-txt b{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:16px; font-weight:700; display:block; color:var(--paper); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cha-head-txt span{ display:flex; align-items:center; gap:7px; font-size:11px; color:var(--mut); margin-top:2px; font-weight:600;}
.cha-live{ display:flex; align-items:center; gap:6px; font-size:10.5px; color:var(--emerald); font-weight:600; flex:none; }
.cha-live-dot{ width:7px; height:7px; border-radius:50%; background:var(--emerald); position:relative; }
.cha-live-dot::after{ content:""; position:absolute; inset:-3px; border-radius:50%; background:var(--emerald); opacity:.4; animation:chaping 1.8s infinite; }

/* الرسائل */
.cha-msgs{ flex:1; overflow-y:auto; padding:18px clamp(12px,3vw,30px); min-height:0; display:flex; flex-direction:column; gap:4px; -webkit-overflow-scrolling:touch; }
.cha-msgs::-webkit-scrollbar{ width:7px; } .cha-msgs::-webkit-scrollbar-thumb{ background:#cbd5e1; border-radius:9px; }
.cha-empty-msgs{ margin:auto; color:var(--mut); font-size:13px; font-weight:500;}
.cha-row{ display:flex; align-items:flex-end; gap:8px; animation:charow .3s cubic-bezier(.2,.7,.2,1) both; }
@keyframes charow{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:none; } }
.cha-row.mine{ flex-direction:row-reverse; }
.cha-row.grouped{ margin-top:-2px; }
.cha-row-spacer{ width:30px; flex:none; }
.cha-bubble-wrap{ max-width:min(78%,520px); display:flex; flex-direction:column; gap:2px; }
.cha-row.mine .cha-bubble-wrap{ align-items:flex-end; }
.cha-sender{ font-size:10.5px; color:var(--sky); font-weight:700; padding-inline-start:4px; }
.cha-bubble{ padding:9px 13px; border-radius:14px; font-size:13.5px; line-height:1.55; word-break:break-word; font-weight:500;}
.cha-bubble p{ margin:0; }
.cha-bubble.theirs{ background:var(--surf); border:1px solid var(--line); border-start-start-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,.02); color:var(--paper); }
.cha-bubble.mine{ background:linear-gradient(120deg,var(--sky),#0284c7); border:1px solid rgba(14,165,233,.2); border-start-end-radius:4px; color:#ffffff; box-shadow:0 2px 8px -2px rgba(14,165,233,.3); }
.cha-attach{ display:inline-flex; align-items:center; gap:5px; margin-top:6px; font-size:11px; color:inherit; opacity:.9; font-weight:700;}
.cha-time{ display:flex; align-items:center; gap:4px; font-family:'JetBrains Mono'; font-size:9.5px; color:var(--mut); padding:0 4px; font-weight:600;}
.cha-time svg{ color:var(--sky); }

/* الإدخال */
.cha-compose{ padding:10px clamp(12px,3vw,30px) 14px; border-top:1px solid var(--line); background:rgba(255,255,255,.95); backdrop-filter:blur(8px); flex:none; z-index:10; }
.cha-mentions{ display:flex; flex-wrap:wrap; gap:6px; margin-bottom:9px; }
.cha-mention-chip{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; color:#0284c7; background:rgba(14,165,233,.1); border:1px solid rgba(14,165,233,.2); padding:3px 8px; border-radius:999px; }
.cha-mention-chip button{ background:none; border:none; color:#0284c7; cursor:pointer; display:grid; place-items:center; }
.cha-compose-row{ display:flex; align-items:center; gap:8px; background:var(--surf); border:1px solid var(--line); border-radius:13px; padding:5px 6px; transition:.2s; box-shadow:0 2px 6px rgba(0,0,0,.02); }
.cha-compose-row:focus-within{ border-color:var(--sky); box-shadow:0 0 0 3px rgba(14,165,233,.1); }
.cha-input{ flex:1; background:none; border:none; outline:none; color:var(--paper); font-family:inherit; font-size:14px; padding:6px; font-weight:500;}
.cha-input::placeholder{ color:#94a3b8; }
.cha-mention-wrap{ position:relative; }
.cha-mention-pop{ position:absolute; bottom:calc(100% + 8px); inset-inline-start:0; width:min(260px, 80vw); background:var(--surf); border:1px solid var(--line); border-radius:12px; overflow:hidden; box-shadow:0 12px 30px -10px rgba(0,0,0,.12); animation:chapop .16s ease; z-index:20; }
@keyframes chapop{ from{ opacity:0; transform:translateY(6px); } to{ opacity:1; transform:none; } }
.cha-mention-search{ display:flex; align-items:center; gap:7px; padding:8px 11px; border-bottom:1px solid var(--line); color:var(--mut); background:var(--surf2); }
.cha-mention-search input{ flex:1; background:none; border:none; outline:none; color:var(--paper); font-family:inherit; font-size:12.5px; font-weight:500;}
.cha-mention-search input::placeholder{ color:#94a3b8; }
.cha-mention-list{ max-height:200px; overflow-y:auto; padding:5px; }
.cha-mention-item{ display:flex; align-items:center; gap:9px; width:100%; padding:7px 8px; border-radius:9px; background:none; border:none; cursor:pointer; text-align:start; transition:.15s; }
.cha-mention-item:hover{ background:rgba(14,165,233,.08); }
.cha-mention-item span{ display:flex; flex-direction:column; }
.cha-mention-item b{ font-size:12.5px; color:var(--paper); font-weight:700;} 
.cha-mention-item em{ font-style:normal; font-size:10px; color:var(--mut); font-weight:600;}
.cha-empty-mini{ text-align:center; color:var(--mut); font-size:11.5px; padding:14px; font-weight:500;}
.cha-send{ width:38px; height:38px; border-radius:10px; display:grid; place-items:center; border:none; cursor:pointer; color:#ffffff; background:linear-gradient(120deg,var(--sky),#0284c7); transition:.2s; position:relative; overflow:hidden; flex:none; box-shadow:0 4px 12px -4px rgba(14,165,233,.5); }
.cha-send:hover:not(:disabled){ transform:translateY(-1px) scale(1.04); }
.cha-send:disabled{ opacity:.5; cursor:not-allowed; box-shadow:none; }

/* النافذة المنبثقة */
.cha-mask{ position:fixed; inset:0; z-index:60; display:grid; place-items:center; padding:16px; background:rgba(15,23,42,.4); backdrop-filter:blur(4px); }
.cha-new{ width:min(440px,100%); max-height:85vh; max-height:85dvh; display:flex; flex-direction:column; background:var(--surf); border:1px solid var(--line); border-radius:18px; overflow:hidden; animation:chapop .22s cubic-bezier(.2,.8,.2,1); box-shadow:0 20px 40px -10px rgba(0,0,0,.15); }
.cha-new-h{ display:flex; justify-content:space-between; align-items:center; padding:15px 18px; border-bottom:1px solid var(--line); background:var(--surf2); }
.cha-new-h h3{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:17px; margin:0; font-weight:700; color:var(--paper); }
.cha-new-h button{ background:none; border:none; color:var(--mut); cursor:pointer; transition:.2s; }
.cha-new-h button:hover{ color:var(--rose); }
.cha-new-broadcast{ display:flex; align-items:center; gap:13px; margin:14px 16px 4px; padding:13px 15px; border-radius:13px; border:1px solid rgba(245,158,11,.3); background:linear-gradient(90deg,rgba(245,158,11,.08),transparent); color:var(--paper); cursor:pointer; text-align:start; font-family:inherit; transition:.2s; }
.cha-new-broadcast:hover{ transform:translateX(-3px); border-color:var(--amber); }
.cha-new-broadcast svg{ color:#d97706; flex:none; }
.cha-new-broadcast b{ display:block; font-size:14px; font-weight:700; color:#d97706;} 
.cha-new-broadcast span{ font-size:11.5px; color:var(--mut); font-weight:600;}
.cha-new-search{ display:flex; align-items:center; gap:8px; margin:12px 16px 8px; padding:0 11px; background:var(--surf2); border:1px solid var(--line); border-radius:10px; color:var(--mut); }
.cha-new-search input{ flex:1; background:none; border:none; outline:none; color:var(--paper); font-family:inherit; font-size:13px; padding:10px 0; font-weight:500;}
.cha-new-search input::placeholder{ color:#94a3b8; }
.cha-new-list{ overflow-y:auto; padding:4px 10px 14px; -webkit-overflow-scrolling:touch; }
.cha-new-item{ display:flex; align-items:center; gap:11px; width:100%; padding:9px 10px; border-radius:11px; border:1px solid transparent; background:none; cursor:pointer; text-align:start; transition:.18s; }
.cha-new-item:hover{ background:rgba(0,0,0,.03); border-color:var(--line); }
.cha-new-txt{ flex:1; display:flex; flex-direction:column; }
.cha-new-txt b{ font-size:13.5px; color:var(--paper); font-weight:700;} 
.cha-new-txt em{ font-style:normal; font-size:10.5px; color:var(--mut); font-weight:600;}
.cha-new-item > svg{ color:var(--mut); }

/* ═══ التجاوب مع الهواتف ═══ */
@media (max-width: 820px) {
  .cha { 
    height: calc(100dvh - 64px); 
    min-height: 0; 
  }
  .cha-back { display: grid !important; }
  
  .cha-side { 
    position: absolute; 
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%; 
    height: 100%;
    z-index: 30; 
    transform: translateX(100%); 
    visibility: hidden;
    transition: transform .28s cubic-bezier(.2,.7,.2,1), visibility .28s; 
    background: var(--surf);
  }
  
  .cha-side.show { 
    transform: translateX(0); 
    visibility: visible;
  }

  .cha-main {
    width: 100%;
    height: 100%;
  }
  
  .cha-head { padding: 10px 14px; gap: 10px; }
  .cha-head-txt b { font-size: 14.5px; }
  .cha-bubble-wrap { max-width: 88%; }
  
  .cha-compose { padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)); }
  
  .cha-input, 
  .cha-search input, 
  .cha-mention-search input, 
  .cha-new-search input { 
    font-size: 16px !important; 
  }
  
  .cha-noconv h2 { font-size: 19px; }
  .cha-noconv p { font-size: 12.5px; }
  .cha-new { width: 100%; max-height: 90dvh; border-radius: 16px; }
}
`;

