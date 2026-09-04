// src/pages/Profile/ChangePassword.jsx — full replacement
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { changePassword } from '../../api/services/auth';
import {
  ShieldCheck, Eye, EyeOff, KeyRound, Lock, Check, X,
  ArrowLeft, Fingerprint, Clock, LogOut, Sparkles,
} from 'lucide-react';

/* ── Password strength scoring (instant feedback) ─────────────── */
const scorePassword = (pw) => {
  const checks = {
    len: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length; // 0..5
  const level =
    score <= 2 ? 0 : score === 3 ? 1 : score === 4 ? 2 : 3; // 0..3
  return { checks, score, level };
};

const LEVELS = [
  { label: 'Weak',   tone: '#e11d48', fill: 1 },
  { label: 'Fair',   tone: '#f59e0b', fill: 2 },
  { label: 'Good',   tone: '#0ea5e9', fill: 3 },
  { label: 'Strong', tone: '#10b981', fill: 4 },
];

const REQUIREMENTS = [
  { key: 'len',   text: 'At least 8 characters' },
  { key: 'upper', text: 'One uppercase letter (A–Z)' },
  { key: 'lower', text: 'One lowercase letter (a–z)' },
  { key: 'digit', text: 'One digit (0–9)' },
  { key: 'symbol', text: 'One special symbol (! @ # …)' },
];

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ old: '', next: '', confirm: '' });
  const [show, setShow] = useState({ old: false, next: false, confirm: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const { checks, level } = useMemo(() => scorePassword(form.next), [form.next]);
  const lvl = LEVELS[level];
  const match = form.next.length > 0 && form.next === form.confirm;
  const canSubmit =
    form.old.length > 0 &&
    checks.len &&
    level >= 1 &&
    match &&
    !busy;

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await changePassword({ old_password: form.old, new_password: form.next });
      setDone(true); // The backend keeps the current JWT session active
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        err.response?.status === 400 && /old password/i.test(detail || '')
          ? 'The current password is incorrect.'
          : detail || 'Unable to change the password. Please check your connection to the server.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bp-wrap min-h-screen">
      <style>{CSS}</style>

      <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <Link
          to="/profile"
          className="reveal d1 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Back to Profile
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* ── Dark security panel (focus & contrast) ───────── */}
          <aside className="reveal d2 sec-dark rounded-2xl p-6 text-slate-200">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">
                <ShieldCheck size={22} className="text-emerald-300" />
              </span>
              <div>
                <p className="font-disp text-lg leading-none text-white">Security</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Account Security
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-4 text-sm">
              <Fact icon={<KeyRound size={15} />} title="Password" value="Can be changed now" />
              <Fact icon={<Fingerprint size={15} />} title="Current Session" value="Remains active after change" />
              <Fact icon={<Clock size={15} />} title="Last Update" value="Upon save below" />
            </div>

            <div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-3 text-[12px] leading-relaxed text-slate-300">
              <span className="text-emerald-300">Tip:</span> The system uses JWT
              tokens, so you are not logged out automatically. To log out all
              devices, use "Log Out" after the change.
            </div>
          </aside>

          {/* ── Live form ─────────────────────────── */}
          <section className="reveal d3 sec-card rounded-2xl p-6 sm:p-8">
            {done ? (
              <SuccessState onExit={() => navigate('/profile')} />
            ) : (
              <form onSubmit={submit} noValidate>
                <h1 className="font-disp text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Change Password
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Update your password to protect your account within the ERP system.
                </p>

                {/* Strength meter */}
                <div className="mt-7">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">New Password Strength</span>
                    <span
                      className="font-mono text-xs font-bold transition-colors"
                      style={{ color: form.next ? lvl.tone : '#94a3b8' }}
                    >
                      {form.next ? lvl.label : '—'}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-500"
                        style={{
                          background: form.next && i < lvl.fill ? lvl.tone : '#e2e8f0',
                          transform: form.next && i < lvl.fill ? 'scaleY(1.4)' : 'scaleY(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Fields */}
                <div className="mt-7 space-y-4">
                  <Field
                    label="Current Password"
                    value={form.old}
                    onChange={set('old')}
                    show={show.old}
                    toggle={() => setShow((s) => ({ ...s, old: !s.old }))}
                    placeholder="••••••••"
                  />
                  <Field
                    label="New Password"
                    value={form.next}
                    onChange={set('next')}
                    show={show.next}
                    toggle={() => setShow((s) => ({ ...s, next: !s.next }))}
                    placeholder="Enter a new password"
                  />
                  <Field
                    label="Confirm New Password"
                    value={form.confirm}
                    onChange={set('confirm')}
                    show={show.confirm}
                    toggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                    placeholder="Re-enter the password"
                    trailing={
                      form.confirm &&
                      (match ? (
                        <Check size={16} className="text-emerald-500" />
                      ) : (
                        <X size={16} className="text-rose-500" />
                      ))
                    }
                  />
                </div>

                {/* Live requirements */}
                <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {REQUIREMENTS.map((r) => {
                    const ok = checks[r.key];
                    return (
                      <li
                        key={r.key}
                        className="flex items-center gap-2 text-[13px] transition-colors"
                        style={{ color: ok ? '#059669' : '#94a3b8' }}
                      >
                        <span
                          className="grid h-4 w-4 place-items-center rounded-full transition-all"
                          style={{ background: ok ? '#d1fae5' : '#f1f5f9' }}
                        >
                          {ok ? <Check size={11} /> : <span className="h-1 w-1 rounded-full bg-slate-300" />}
                        </span>
                        {r.text}
                      </li>
                    );
                  })}
                </ul>

                {error && (
                  <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="btn-primary rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? 'Saving…' : 'Save Password'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */
function Field({ label, value, onChange, show, toggle, placeholder, trailing }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="group relative">
        <Lock
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-sky-500"
        />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pr-9 pl-10 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
          tabIndex={-1}
        >
          {trailing ?? (show ? <EyeOff size={16} /> : <Eye size={16} />)}
        </button>
      </div>
    </label>
  );
}

function Fact({ icon, title, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3 transition hover:bg-white/10">
      <span className="mt-0.5 text-sky-300">{icon}</span>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-400">{title}</p>
        <p className="text-sm text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function SuccessState({ onExit }) {
  return (
    <div className="pop flex flex-col items-center py-8 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
        <ShieldCheck size={32} />
      </span>
      <h2 className="font-disp mt-5 text-2xl font-bold text-slate-900">Changed Successfully</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Your password has been updated. Your current session remains active; to log
        out other devices, please sign out.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onExit}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Back to Profile
        </button>
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          <LogOut size={15} /> Log Out
        </button>
      </div>
    </div>
  );
}

/* ── Styles & animations (inlined to work immediately on paste) ──────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.bp-wrap{font-family:'Space Grotesk','IBM Plex Sans Arabic',system-ui,sans-serif;position:relative;
  background:#f6f7f9;
  background-image:
    radial-gradient(40rem 30rem at 100% -10%, rgba(245,158,11,.10), transparent 60%),
    radial-gradient(36rem 28rem at -10% 110%, rgba(14,165,233,.10), transparent 60%),
    radial-gradient(rgba(15,23,42,.045) 1px, transparent 1px);
  background-size:auto,auto,22px 22px;}
.font-disp{font-family:'Space Grotesk','IBM Plex Sans Arabic',sans-serif;letter-spacing:-.01em;}
.font-mono{font-family:'JetBrains Mono',monospace;}
.sec-card{background:#fff;border:1px solid #e8eaee;box-shadow:0 24px 60px -40px rgba(15,23,42,.35);}
.sec-dark{background:linear-gradient(165deg,#101722,#0b1119);border:1px solid rgba(255,255,255,.06);
  box-shadow:0 30px 70px -45px rgba(8,12,20,.9);}
.btn-primary{background:linear-gradient(180deg,#0f172a,#0b1119);box-shadow:0 12px 30px -16px rgba(15,23,42,.7);}
.btn-primary:not(:disabled):hover{transform:translateY(-1px);}
.reveal{opacity:0;transform:translateY(16px);animation:rise .7s cubic-bezier(.2,.7,.2,1) forwards;}
.d1{animation-delay:.05s}.d2{animation-delay:.15s}.d3{animation-delay:.25s}
@keyframes rise{to{opacity:1;transform:none;}}
.pop{animation:pop .5s cubic-bezier(.2,.8,.2,1) both;}
@keyframes pop{from{opacity:0;transform:scale(.94);}to{opacity:1;transform:none;}}
`;
