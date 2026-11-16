import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/admin/coding/problems";
const languages = ["Java", "JavaScript", "Python", "C", "C++"];
const field = { width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 };
const overlay = { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const panel = { background: "white", width: "100%", maxWidth: 850, maxHeight: "90vh", overflowY: "auto", padding: 24, borderRadius: 14 };
const empty = () => ({ title: "", description: "", difficulty: "Easy", category: "Arrays", supportedLanguages: ["JavaScript"], inputFormat: "", outputFormat: "", constraints: "", sampleInput: "", sampleOutput: "", testCases: [{ input: "", expectedOutput: "", isHidden: false }], marks: 10, timeLimitSeconds: 5, skillsCovered: "", companyTags: "", isActive: true });
const csv = value => (Array.isArray(value) ? value.join(", ") : value || "");
const split = value => value.split(",").map(x => x.trim()).filter(Boolean);

export default function CodingManagement({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty());
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API, { headers });
      setItems(response.data.codingProblems || []);
    } catch (e) { setError(e.response?.data?.message || "Unable to load coding problems."); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let alive = true;
    axios.get(API, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (alive) setItems(r.data.codingProblems || []); })
      .catch(e => { if (alive) setError(e.response?.data?.message || "Unable to load coding problems."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token]);

  const change = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const openCreate = () => { setForm(empty()); setSelected(null); setError(""); setMode("create"); };
  const openItem = async (item, nextMode = "view") => {
    setBusy(true); setError("");
    try {
      const response = await axios.get(`${API}/${item._id}`, { headers });
      const p = response.data.codingProblem;
      setSelected(p);
      setForm({ ...empty(), ...p, supportedLanguages: p.supportedLanguages || [], testCases: (p.testCases || []).map(t => ({ input: t.input || "", expectedOutput: t.expectedOutput ?? "", isHidden: !!t.isHidden })), skillsCovered: csv(p.skillsCovered), companyTags: csv(p.companyTags) });
      setMode(nextMode);
    } catch (e) { setError(e.response?.data?.message || "Unable to open coding problem."); }
    finally { setBusy(false); }
  };
  const save = async event => {
    event.preventDefault(); setError(""); setNotice("");
    if (!form.supportedLanguages.length) { setError("Select at least one programming language."); return; }
    if (!form.testCases.length || form.testCases.some(t => typeof t.expectedOutput !== "string")) { setError("Add at least one valid test case."); return; }
    setBusy(true);
    try {
      const payload = { ...form, title: form.title.trim(), description: form.description.trim(), category: form.category.trim(), marks: Number(form.marks), timeLimitSeconds: Number(form.timeLimitSeconds), skillsCovered: split(form.skillsCovered), companyTags: split(form.companyTags), testCases: form.testCases.map(t => ({ input: t.input, expectedOutput: t.expectedOutput, isHidden: t.isHidden })) };
      if (mode === "create") await axios.post(API, payload, { headers });
      else await axios.put(`${API}/${selected._id}`, payload, { headers });
      setNotice(mode === "create" ? "Coding problem created." : "Coding problem updated.");
      setMode(null); await load();
    } catch (e) { setError(e.response?.data?.message || e.response?.data?.error || "Unable to save coding problem."); }
    finally { setBusy(false); }
  };
  const deactivate = async () => {
    if (!selected || !window.confirm(`Deactivate "${selected.title}"?`)) return;
    setBusy(true); setError("");
    try { await axios.patch(`${API}/${selected._id}/deactivate`, {}, { headers }); setNotice("Coding problem deactivated."); setMode(null); await load(); }
    catch (e) { setError(e.response?.data?.message || "Unable to deactivate coding problem."); }
    finally { setBusy(false); }
  };
  const visible = items.filter(p => (!search || `${p.title} ${p.category}`.toLowerCase().includes(search.toLowerCase())) && (!difficulty || p.difficulty === difficulty) && (!status || String(p.isActive) === status));
  const textInput = (key, label, required = false) => <label key={key} style={{ display: "grid", gap: 5 }}>{label}<input required={required} style={field} value={form[key] ?? ""} onChange={e => change(key, e.target.value)} /></label>;
  const area = (key, label, required = false, rows = 3) => <label style={{ display: "grid", gap: 5 }}>{label}<textarea required={required} rows={rows} style={field} value={form[key] ?? ""} onChange={e => change(key, e.target.value)} /></label>;

  return <div className="admin-panel">
    <div className="admin-panel-heading"><div><h3>Coding Management</h3><p>{items.length} problems · {items.filter(x => x.isActive).length} active</p></div><button type="button" className="admin-primary-btn" onClick={openCreate}>+ Create Coding Problem</button></div>
    {notice && <p role="status" style={{ color: "#15803d" }}>{notice}</p>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 18 }}>
      <input aria-label="Search coding problems" style={field} placeholder="Search title or category" value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Difficulty" style={field} value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="">All difficulties</option>{["Easy", "Medium", "Hard"].map(x => <option key={x}>{x}</option>)}</select>
      <select aria-label="Status" style={field} value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select>
    </div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Title</th><th>Category</th><th>Difficulty</th><th>Languages</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {visible.map(p => <tr key={p._id}><td>{p.title}</td><td>{p.category}</td><td>{p.difficulty}</td><td>{csv(p.supportedLanguages)}</td><td><span className="admin-stage">{p.isActive ? "Active" : "Inactive"}</span></td><td style={{ whiteSpace: "nowrap" }}><button className="admin-primary-btn" disabled={busy} onClick={() => openItem(p)}>View</button>{" "}<button className="admin-primary-btn" disabled={busy} onClick={() => openItem(p, "edit")}>Edit</button></td></tr>)}
      {!loading && !visible.length && <tr><td colSpan={6} className="admin-empty">No coding problems found.</td></tr>}
    </tbody></table></div>
    {loading && <p className="admin-loading">Loading coding problems...</p>}
    {mode && <div style={overlay} onMouseDown={e => { if (e.target === e.currentTarget && !busy) setMode(null); }}><div style={panel} role="dialog" aria-modal="true" aria-labelledby="coding-title">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><h2 id="coding-title">{mode === "create" ? "Create Coding Problem" : mode === "edit" ? "Edit Coding Problem" : "Coding Problem Details"}</h2><button type="button" disabled={busy} onClick={() => setMode(null)}>Close</button></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {mode === "view" ? <div style={{ display: "grid", gap: 10 }}>
        <h3>{selected?.title}</h3><p><b>Category:</b> {selected?.category} · <b>Difficulty:</b> {selected?.difficulty} · <b>Status:</b> {selected?.isActive ? "Active" : "Inactive"}</p>
        <p><b>Languages:</b> {csv(selected?.supportedLanguages)} · <b>Marks:</b> {selected?.marks} · <b>Time:</b> {selected?.timeLimitSeconds}s</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{selected?.description}</p>
        {["inputFormat", "outputFormat", "constraints", "sampleInput", "sampleOutput"].map(k => <div key={k}><b>{k.replace(/([A-Z])/g, " $1")}</b><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{selected?.[k] || "—"}</pre></div>)}
        <p><b>Skills:</b> {csv(selected?.skillsCovered) || "—"} · <b>Companies:</b> {csv(selected?.companyTags) || "—"}</p>
        <h3>Test Cases (Admin Only)</h3>{(selected?.testCases || []).map((t, i) => <div key={i} style={{ border: "1px solid #e2e8f0", padding: 12, borderRadius: 8 }}><b>Test {i + 1} {t.isHidden ? "(Hidden)" : "(Public)"}</b><pre style={{ whiteSpace: "pre-wrap" }}>Input: {t.input}{"\n"}Expected: {t.expectedOutput}</pre></div>)}
        <div style={{ display: "flex", gap: 10 }}><button className="admin-primary-btn" onClick={() => setMode("edit")}>Edit Problem</button>{selected?.isActive && <button type="button" disabled={busy} onClick={deactivate} style={{ ...field, width: "auto", color: "#b91c1c", cursor: "pointer" }}>Deactivate</button>}</div>
      </div> : <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        {textInput("title", "Title", true)}{area("description", "Description", true, 5)}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>{textInput("category", "Category", true)}<label>Difficulty<select style={field} value={form.difficulty} onChange={e => change("difficulty", e.target.value)}>{["Easy", "Medium", "Hard"].map(x => <option key={x}>{x}</option>)}</select></label><label>Marks<input required type="number" min="1" style={field} value={form.marks} onChange={e => change("marks", e.target.value)} /></label><label>Time Limit (seconds)<input required type="number" min="1" style={field} value={form.timeLimitSeconds} onChange={e => change("timeLimitSeconds", e.target.value)} /></label></div>
        <div><b>Supported Languages</b><div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 8 }}>{languages.map(lang => <label key={lang}><input type="checkbox" checked={form.supportedLanguages.includes(lang)} onChange={e => change("supportedLanguages", e.target.checked ? [...form.supportedLanguages, lang] : form.supportedLanguages.filter(x => x !== lang))} /> {lang}</label>)}</div></div>
        {area("inputFormat", "Input Format")}{area("outputFormat", "Output Format")}{area("constraints", "Constraints")}{area("sampleInput", "Sample Input")}{area("sampleOutput", "Sample Output")}
        <div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h3>Test Cases</h3><button type="button" onClick={() => change("testCases", [...form.testCases, { input: "", expectedOutput: "", isHidden: false }])}>+ Add Test Case</button></div>
          {form.testCases.map((t, i) => <div key={i} style={{ border: "1px solid #e2e8f0", padding: 12, borderRadius: 10, marginBottom: 12, display: "grid", gap: 10 }}><div style={{ display: "flex", justifyContent: "space-between" }}><b>Test Case {i + 1}</b><button type="button" disabled={form.testCases.length === 1} onClick={() => change("testCases", form.testCases.filter((_, j) => j !== i))}>Remove</button></div>
            <label>Input<textarea style={field} rows={2} value={t.input} onChange={e => change("testCases", form.testCases.map((v, j) => j === i ? { ...v, input: e.target.value } : v))} /></label>
            <label>Expected Output<textarea required style={field} rows={2} value={t.expectedOutput} onChange={e => change("testCases", form.testCases.map((v, j) => j === i ? { ...v, expectedOutput: e.target.value } : v))} /></label>
            <label><input type="checkbox" checked={t.isHidden} onChange={e => change("testCases", form.testCases.map((v, j) => j === i ? { ...v, isHidden: e.target.checked } : v))} /> Hidden test case</label>
          </div>)}
        </div>
        {textInput("skillsCovered", "Skills Covered (comma-separated)")}{textInput("companyTags", "Company Tags (comma-separated)")}
        <label><input type="checkbox" checked={form.isActive} onChange={e => change("isActive", e.target.checked)} /> Active</label>
        <div style={{ display: "flex", gap: 10 }}><button type="submit" disabled={busy} className="admin-primary-btn">{busy ? "Saving..." : mode === "create" ? "Create Problem" : "Save Changes"}</button><button type="button" disabled={busy} onClick={() => setMode(null)}>Cancel</button></div>
      </form>}
    </div></div>}
  </div>;
}
