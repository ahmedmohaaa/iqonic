import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HardHat, Clock, Send, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/axios';

const MySupervisionProjects = () => {
  const [assignments, setAssignments] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [engineerId, setEngineerId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    apiClient.get('my-supervision-projects/')
      .then((r) => { setAssignments(r.data.assignments || []); setEngineers(r.data.available_engineers || []); })
      .finally(() => setLoading(false));
  }, []);

  const openModal = (a) => { setSelected(a); setEngineerId(''); setReason(''); setErr(''); setOk(''); };

  const submit = async () => {
    if (!engineerId) return setErr('Please select the replacement engineer.');
    if (!reason.trim()) return setErr('Please write the reason.');
    setBusy(true); setErr('');
    try {
      await apiClient.post('supervision-team/replacement-request/', {
        assignment: selected.id, suggested_engineer: engineerId, reason,
      });
      setOk('Request sent — you will be notified once responded.');
      setTimeout(() => setSelected(null), 900);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to send the request.');
    } finally { setBusy(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HardHat className="text-amber-600" size={26} /> My Supervision Projects
        </h1>
        <p className="text-sm text-gray-600">Your active supervision assignments, work days and effort percentages.</p>
      </div>

      {loading ? <p className="text-gray-500">Loading…</p>
      : assignments.length === 0 ? (
        <p className="text-gray-500 bg-white rounded-lg p-8 text-center border">No supervision assignments yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">{a.project_no || a.project?.project_no}</p>
                  <p className="text-xs text-gray-600">{a.project_name || a.project?.name}</p>
                </div>
                {a.is_pm && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 flex items-center gap-1">
                    <ShieldCheck size={10} /> PM
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {(a.days_of_week || []).map((d) => (
                  <span key={d} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-semibold">{d}</span>
                ))}
                <span className="px-2 py-0.5 bg-gray-50 text-gray-700 rounded text-[11px] font-semibold flex items-center gap-1">
                  <Clock size={10} /> {a.time_from?.slice(0, 5)} - {a.time_to?.slice(0, 5)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-[11px] text-blue-600 font-semibold">Contract %</p>
                  <p className="font-bold text-blue-800">{a.contract_percentage ?? 0}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <p className="text-[11px] text-purple-600 font-semibold">Actual %</p>
                  <p className="font-bold text-purple-800">{a.actual_percentage ?? 0}%</p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Link to={`/projects/${a.project?.id ?? a.project}`}
                  className="flex-1 text-center bg-gray-900 text-white rounded-lg py-2 text-xs font-bold hover:bg-blue-700 transition">
                  Project Details
                </Link>
                <button onClick={() => openModal(a)}
                  className="flex-1 bg-rose-600 text-white rounded-lg py-2 text-xs font-bold hover:bg-rose-700 transition">
                  Replacement Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Replacement Request Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Replacement Request — {selected.project_no || selected.project?.project_no}
              </h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {ok ? (
              <p className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm font-semibold">{ok}</p>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Supervision Engineer *</label>
                  <select value={engineerId} onChange={(e) => setEngineerId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none">
                    <option value="">Select engineer…</option>
                    {engineers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reason *</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                </div>
                {err && (
                  <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 text-xs font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} /> {err}
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={submit} disabled={busy}
                    className="flex-1 bg-rose-600 text-white rounded-lg py-2 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1">
                    <Send size={14} /> {busy ? 'Sending…' : 'Send Request'}
                  </button>
                  <button onClick={() => setSelected(null)} className="px-4 border rounded-lg text-sm text-gray-600">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MySupervisionProjects;