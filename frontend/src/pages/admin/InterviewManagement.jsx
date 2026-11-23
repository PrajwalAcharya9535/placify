import { useEffect, useState } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin`;
const field = { width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 8, boxSizing: "border-box" };
const overlay = { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const panel = { background: "white", borderRadius: 16, padding: 26, width: "100%", maxWidth: 760, maxHeight: "88vh", overflowY: "auto" };
const TYPES = ["Technical", "HR", "Behavioral", "Communication"];
const MODES = ["Theory", "Coding", "SQL"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const empty = () => ({ question: "", interviewType: "Technical", questionMode: "Theory", codingProblem: "", sqlProblem: "", category: "", targetRole: "", targetCompany: "", difficulty: "Medium", expectedKeywords: "", sampleAnswer: "", evaluationPoints: "", maxScore: 10, isActive: true });
const toId = value => typeof value === "object" && value !== null ? value._id || "" : value || "";
const csv = value => value.split(",").map(x => x.trim()).filter(Boolean);

export default function InterviewManagement({ token }) {
  const [questions, setQuestions] = useState([]);
  const [coding, setCoding] = useState([]);
  const [sql, setSql] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const headers = { Authorization: `Bearer ${token}` };
  const change = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const load = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/interview/questions`, { headers });
      setQuestions(response.data.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load interview questions.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    axios.get(`${API}/interview/questions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (active) setQuestions(r.data.questions || []); })
      .catch(err => { if (active) setError(err.response?.data?.message || "Unable to load interview questions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!mode || mode === "view") return;
    let active = true;
    Promise.allSettled([
      axios.get(`${API}/coding/problems`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API}/sql/problems`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([a, b]) => {
      if (!active) return;
      if (a.status === "fulfilled") setCoding(a.value.data.codingProblems || a.value.data.problems || []);
      if (b.status === "fulfilled") setSql(b.value.data.sqlProblems || b.value.data.problems || []);
    });
    return () => { active = false; };
  }, [mode, token]);

  const openCreate = () => { setForm(empty()); setSelected(null); setError(""); setNotice(""); setMode("create"); };
  const openQuestion = async (item, nextMode = "view") => {
    setBusy(true); setError("");
    try {
      const response = await axios.get(`${API}/interview/questions/${item._id}`, { headers });
      const q = response.data.question;
      setSelected(q);
      setForm({
        question: q.question || "", interviewType: q.interviewType || "Technical", questionMode: q.questionMode || "Theory",
        codingProblem: toId(q.codingProblem), sqlProblem: toId(q.sqlProblem), category: q.category || "",
        targetRole: q.targetRole || "", targetCompany: q.targetCompany || "", difficulty: q.difficulty || "Medium",
        expectedKeywords: (q.expectedKeywords || []).join(", "), sampleAnswer: q.sampleAnswer || "",
        evaluationPoints: (q.evaluationPoints || []).join(", "), maxScore: q.maxScore ?? 10,
        isActive: q.isActive !== false,
      });
      setMode(nextMode);
    } catch (err) { setError(err.response?.data?.message || "Unable to open question."); }
    finally { setBusy(false); }
  };

  const save = async event => {
    event.preventDefault(); setError(""); setNotice("");
    if (!form.question.trim()) return setError("Question is required.");
    if (form.questionMode !== "Theory" && form.interviewType !== "Technical") return setError("Coding and SQL modes require Technical interview type.");
    if (form.questionMode === "Coding" && !form.codingProblem) return setError("Select a coding problem.");
    if (form.questionMode === "SQL" && !form.sqlProblem) return setError("Select an SQL problem.");
    const payload = {
      ...form, question: form.question.trim(), maxScore: Number(form.maxScore),
      expectedKeywords: csv(form.expectedKeywords), evaluationPoints: csv(form.evaluationPoints),
      codingProblem: form.questionMode === "Coding" ? form.codingProblem : null,
      sqlProblem: form.questionMode === "SQL" ? form.sqlProblem : null,
    };
    setBusy(true);
    try {
      if (mode === "create") await axios.post(`${API}/interview/questions`, payload, { headers });
      else await axios.put(`${API}/interview/questions/${selected._id}`, payload, { headers });
      setNotice(mode === "create" ? "Interview question created." : "Interview question updated.");
      setMode(null); setSelected(null); await load();
    } catch (err) { setError(err.response?.data?.message || "Unable to save interview question."); }
    finally { setBusy(false); }
  };

  const deactivate = async () => {
    if (!selected?._id || !window.confirm("Deactivate this interview question?")) return;
    setBusy(true); setError("");
    try {
      await axios.patch(`${API}/interview/questions/${selected._id}/deactivate`, {}, { headers });
      setNotice("Interview question deactivated."); setMode(null); setSelected(null); await load();
    } catch (err) { setError(err.response?.data?.message || "Unable to deactivate question."); }
    finally { setBusy(false); }
  };

  const filtered = questions.filter(q =>
    (!search || `${q.question} ${q.category || ""}`.toLowerCase().includes(search.toLowerCase())) &&
    (!typeFilter || q.interviewType === typeFilter) && (!modeFilter || q.questionMode === modeFilter) &&
    (!difficultyFilter || q.difficulty === difficultyFilter) &&
    (!statusFilter || String(q.isActive) === statusFilter)
  );

  return <div className="admin-panel">
    <div className="admin-panel-heading"><div><h3>Interview Question Management</h3><p>{questions.length} questions · {questions.filter(q => q.isActive).length} active</p></div><button type="button" className="admin-primary-btn" onClick={openCreate}>+ Create Interview Question</button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {notice && <p role="status" style={{ color: "#15803d" }}>{notice}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 20 }}>
      <input style={field} aria-label="Search interview questions" placeholder="Search questions" value={search} onChange={e => setSearch(e.target.value)} />
      <select style={field} aria-label="Interview type filter" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="">All types</option>{TYPES.map(x => <option key={x}>{x}</option>)}</select>
      <select style={field} aria-label="Question mode filter" value={modeFilter} onChange={e => setModeFilter(e.target.value)}><option value="">All modes</option>{MODES.map(x => <option key={x}>{x}</option>)}</select>
      <select style={field} aria-label="Difficulty filter" value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}><option value="">All difficulties</option>{DIFFICULTIES.map(x => <option key={x}>{x}</option>)}</select>
      <select style={field} aria-label="Status filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select>
    </div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Question</th><th>Interview Type</th><th>Mode</th><th>Difficulty</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {filtered.map(q => <tr key={q._id}><td style={{ maxWidth: 340, overflowWrap: "anywhere" }}>{q.question}</td><td>{q.interviewType}</td><td>{q.questionMode}</td><td>{q.difficulty}</td><td><span className="admin-stage">{q.isActive ? "Active" : "Inactive"}</span></td><td style={{ whiteSpace: "nowrap" }}><button type="button" className="admin-primary-btn" disabled={busy} onClick={() => openQuestion(q)}>View</button>{" "}<button type="button" className="admin-primary-btn" disabled={busy} onClick={() => openQuestion(q, "edit")}>Edit</button></td></tr>)}
      {!loading && filtered.length === 0 && <tr><td colSpan={6} className="admin-empty">No interview questions found.</td></tr>}
    </tbody></table></div>
    {loading && <p className="admin-loading">Loading interview questions...</p>}
    {mode && <div style={overlay} role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setMode(null); }}><div style={panel} role="dialog" aria-modal="true" aria-labelledby="interview-modal-title">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><h2 id="interview-modal-title">{mode === "create" ? "Create Interview Question" : mode === "edit" ? "Edit Interview Question" : "Interview Question Details"}</h2><button type="button" disabled={busy} onClick={() => setMode(null)}>Close</button></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {mode === "view" ? <div style={{ display: "grid", gap: 10 }}>
        <h3 style={{ overflowWrap: "anywhere" }}>{selected?.question}</h3>
        <p><strong>Type:</strong> {selected?.interviewType} · <strong>Mode:</strong> {selected?.questionMode} · <strong>Difficulty:</strong> {selected?.difficulty}</p>
        <p><strong>Category:</strong> {selected?.category || "—"} · <strong>Role:</strong> {selected?.targetRole || "—"} · <strong>Company:</strong> {selected?.targetCompany || "—"}</p>
        <p><strong>Maximum score:</strong> {selected?.maxScore} · <strong>Status:</strong> {selected?.isActive ? "Active" : "Inactive"}</p>
        {selected?.questionMode === "Coding" && <p><strong>Coding problem:</strong> {selected?.codingProblem?.title || toId(selected?.codingProblem) || "—"}</p>}
        {selected?.questionMode === "SQL" && <p><strong>SQL problem:</strong> {selected?.sqlProblem?.title || toId(selected?.sqlProblem) || "—"}</p>}
        <p><strong>Expected keywords:</strong> {(selected?.expectedKeywords || []).join(", ") || "—"}</p>
        <p><strong>Evaluation points:</strong> {(selected?.evaluationPoints || []).join(", ") || "—"}</p>
        <h4>Sample answer</h4><p style={{ whiteSpace: "pre-wrap" }}>{selected?.sampleAnswer || "—"}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="button" className="admin-primary-btn" onClick={() => setMode("edit")}>Edit Question</button>{selected?.isActive && <button type="button" disabled={busy} onClick={deactivate} style={{ padding: "10px 14px", color: "#b91c1c", background: "white", border: "1px solid #dc2626", borderRadius: 8 }}>Deactivate Question</button>}</div>
      </div> : <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        <label>Question<textarea required rows={4} style={field} value={form.question} onChange={e => change("question", e.target.value)} /></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          <label>Interview Type<select style={field} value={form.interviewType} onChange={e => setForm(p => ({ ...p, interviewType: e.target.value, questionMode: e.target.value === "Technical" ? p.questionMode : "Theory" }))}>{TYPES.map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Question Mode<select style={field} value={form.questionMode} onChange={e => change("questionMode", e.target.value)}>{MODES.filter(x => form.interviewType === "Technical" || x === "Theory").map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Difficulty<select style={field} value={form.difficulty} onChange={e => change("difficulty", e.target.value)}>{DIFFICULTIES.map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Maximum Score<input required type="number" min="1" style={field} value={form.maxScore} onChange={e => change("maxScore", e.target.value)} /></label>
          <label>Category<input style={field} value={form.category} onChange={e => change("category", e.target.value)} /></label>
          <label>Target Role<input style={field} value={form.targetRole} onChange={e => change("targetRole", e.target.value)} /></label>
          <label>Target Company<input style={field} value={form.targetCompany} onChange={e => change("targetCompany", e.target.value)} /></label>
        </div>
        {form.questionMode === "Coding" && <label>Linked Coding Problem<select required style={field} value={form.codingProblem} onChange={e => change("codingProblem", e.target.value)}><option value="">Select coding problem</option>{coding.filter(p => p.isActive !== false || p._id === form.codingProblem).map(p => <option key={p._id} value={p._id}>{p.title}</option>)}{form.codingProblem && !coding.some(p => p._id === form.codingProblem) && <option value={form.codingProblem}>Current problem ({form.codingProblem})</option>}</select></label>}
        {form.questionMode === "SQL" && <label>Linked SQL Problem<select required style={field} value={form.sqlProblem} onChange={e => change("sqlProblem", e.target.value)}><option value="">Select SQL problem</option>{sql.filter(p => p.isActive !== false || p._id === form.sqlProblem).map(p => <option key={p._id} value={p._id}>{p.title}</option>)}{form.sqlProblem && !sql.some(p => p._id === form.sqlProblem) && <option value={form.sqlProblem}>Current problem ({form.sqlProblem})</option>}</select></label>}
        <label>Expected Keywords (comma-separated)<input style={field} value={form.expectedKeywords} onChange={e => change("expectedKeywords", e.target.value)} /></label>
        <label>Evaluation Points (comma-separated)<textarea rows={3} style={field} value={form.evaluationPoints} onChange={e => change("evaluationPoints", e.target.value)} /></label>
        <label>Sample Answer<textarea rows={5} style={field} value={form.sampleAnswer} onChange={e => change("sampleAnswer", e.target.value)} /></label>
        <label><input type="checkbox" checked={form.isActive} onChange={e => change("isActive", e.target.checked)} /> Active</label>
        <div style={{ display: "flex", gap: 10 }}><button type="submit" disabled={busy} className="admin-primary-btn">{busy ? "Saving..." : mode === "create" ? "Create Question" : "Save Changes"}</button><button type="button" disabled={busy} onClick={() => setMode(null)}>Cancel</button></div>
      </form>}
    </div></div>}
  </div>;
}
