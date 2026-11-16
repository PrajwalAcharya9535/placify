import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/admin/debugging/problems";
const input = { width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8, boxSizing: "border-box" };
const overlay = { position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const panel = { background: "white", borderRadius: 14, padding: 24, maxWidth: 850, width: "100%", maxHeight: "90vh", overflowY: "auto" };
const blank = () => ({ title: "", description: "", difficulty: "Easy", category: "Logic", language: "Python", buggyCode: "", bugDescription: "", expectedFixedCode: "", inputFormat: "", outputFormat: "", constraints: "", testCases: [{ input: "", expectedOutput: "", isHidden: false }], marks: 10, timeLimitSeconds: 5, skillsCovered: [], companyTags: [], isActive: true });
const field = (label, element) => <label style={{ display: "grid", gap: 5 }}>{label}{element}</label>;

export default function DebuggingManagement({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blank());
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [language, setLanguage] = useState("");
  const [status, setStatus] = useState("");
  const [skills, setSkills] = useState("");
  const [tags, setTags] = useState("");
  const headers = { Authorization: `Bearer ${token}` };

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API, { headers });
      setItems(data.debuggingProblems || []);
      setError("");
    } catch (err) { setError(err.response?.data?.message || "Unable to load debugging problems."); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let live = true;
    axios.get(API, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { if (live) setItems(data.debuggingProblems || []); })
      .catch(err => { if (live) setError(err.response?.data?.message || "Unable to load debugging problems."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [token]);

  const fill = item => {
    setForm({ ...blank(), ...item, testCases: item.testCases?.length ? item.testCases.map(t => ({ input: t.input || "", expectedOutput: t.expectedOutput || "", isHidden: !!t.isHidden })) : [{ input: "", expectedOutput: "", isHidden: false }] });
    setSkills((item.skillsCovered || []).join(", "));
    setTags((item.companyTags || []).join(", "));
  };
  const change = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const create = () => { setSelected(null); fill(blank()); setError(""); setNotice(""); setMode("create"); };
  const open = async (item, nextMode = "view") => {
    setBusy(true); setError("");
    try {
      const { data } = await axios.get(`${API}/${item._id}`, { headers });
      setSelected(data.debuggingProblem); fill(data.debuggingProblem); setMode(nextMode);
    } catch (err) { setError(err.response?.data?.message || "Unable to open debugging problem."); }
    finally { setBusy(false); }
  };
  const updateCase = (index, key, value) => change("testCases", form.testCases.map((test, i) => i === index ? { ...test, [key]: value } : test));
  const save = async e => {
    e.preventDefault(); setError(""); setNotice("");
    if (!form.title.trim() || !form.description.trim() || !form.category.trim() || !form.buggyCode.trim()) { setError("Title, description, category and buggy code are required."); return; }
    if (!form.testCases.length || form.testCases.some(t => !t.expectedOutput.trim())) { setError("Every test case needs a nonempty expected output."); return; }
    const payload = { ...form, title: form.title.trim(), description: form.description.trim(), category: form.category.trim(), marks: Number(form.marks), timeLimitSeconds: Number(form.timeLimitSeconds), skillsCovered: skills.split(",").map(x => x.trim()).filter(Boolean), companyTags: tags.split(",").map(x => x.trim()).filter(Boolean) };
    setBusy(true);
    try {
      if (mode === "create") await axios.post(API, payload, { headers });
      else await axios.put(`${API}/${selected._id}`, payload, { headers });
      setNotice(mode === "create" ? "Debugging problem created." : "Debugging problem updated.");
      setMode(null); setSelected(null); await refresh();
    } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || "Unable to save debugging problem."); }
    finally { setBusy(false); }
  };
  const deactivate = async () => {
    if (!selected?._id || !window.confirm(`Deactivate "${selected.title}"?`)) return;
    setBusy(true); setError("");
    try {
      await axios.patch(`${API}/${selected._id}/deactivate`, {}, { headers });
      setNotice("Debugging problem deactivated."); setMode(null); setSelected(null); await refresh();
    } catch (err) { setError(err.response?.data?.message || "Unable to deactivate debugging problem."); }
    finally { setBusy(false); }
  };
  const filtered = items.filter(item => (!difficulty || item.difficulty === difficulty) && (!language || item.language === language) && (!status || String(item.isActive) === status) && (!search || `${item.title} ${item.category}`.toLowerCase().includes(search.toLowerCase())));
  const text = (key, label, rows = 1, required = false) => field(label, rows === 1 ? <input style={input} required={required} value={form[key] ?? ""} onChange={e => change(key, e.target.value)} /> : <textarea style={input} rows={rows} required={required} value={form[key] ?? ""} onChange={e => change(key, e.target.value)} />);

  return <div className="admin-panel">
    <div className="admin-panel-heading"><div><h3>Debugging Problem Management</h3><p>{items.length} problems · {items.filter(i => i.isActive).length} active</p></div><button className="admin-primary-btn" type="button" onClick={create}>+ Create Debugging Problem</button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {notice && <p role="status" style={{ color: "#15803d" }}>{notice}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 18 }}>
      <input style={input} placeholder="Search title or category" aria-label="Search debugging problems" value={search} onChange={e => setSearch(e.target.value)} />
      <select style={input} aria-label="Difficulty filter" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="">All difficulties</option>{["Easy", "Medium", "Hard"].map(x => <option key={x}>{x}</option>)}</select>
      <select style={input} aria-label="Language filter" value={language} onChange={e => setLanguage(e.target.value)}><option value="">All languages</option>{["Java", "Python", "C", "C++"].map(x => <option key={x}>{x}</option>)}</select>
      <select style={input} aria-label="Status filter" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select>
    </div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Title</th><th>Category</th><th>Language</th><th>Difficulty</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {filtered.map(item => <tr key={item._id}><td>{item.title}</td><td>{item.category}</td><td>{item.language}</td><td>{item.difficulty}</td><td><span className="admin-stage">{item.isActive ? "Active" : "Inactive"}</span></td><td style={{ whiteSpace: "nowrap" }}><button type="button" className="admin-primary-btn" disabled={busy} onClick={() => open(item)}>View</button>{" "}<button type="button" className="admin-primary-btn" disabled={busy} onClick={() => open(item, "edit")}>Edit</button></td></tr>)}
      {!loading && filtered.length === 0 && <tr><td colSpan={6} className="admin-empty">No debugging problems found.</td></tr>}
    </tbody></table></div>
    {loading && <p className="admin-loading">Loading debugging problems...</p>}
    {mode && <div style={overlay} role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setMode(null); }}><div style={panel} role="dialog" aria-modal="true" aria-labelledby="debugging-title">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><h2 id="debugging-title">{mode === "create" ? "Create Debugging Problem" : mode === "edit" ? "Edit Debugging Problem" : "Debugging Problem Details"}</h2><button type="button" disabled={busy} onClick={() => setMode(null)}>Close</button></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {mode === "view" ? <div style={{ display: "grid", gap: 12 }}>
        <h3>{selected?.title}</h3><p>{selected?.description}</p><p><strong>Category:</strong> {selected?.category} · <strong>Language:</strong> {selected?.language} · <strong>Difficulty:</strong> {selected?.difficulty}</p>
        <p><strong>Marks:</strong> {selected?.marks} · <strong>Time:</strong> {selected?.timeLimitSeconds}s · <strong>Status:</strong> {selected?.isActive ? "Active" : "Inactive"}</p>
        {[ ["Buggy Code", selected?.buggyCode], ["Bug Description", selected?.bugDescription], ["Expected Fixed Code", selected?.expectedFixedCode], ["Input Format", selected?.inputFormat], ["Output Format", selected?.outputFormat], ["Constraints", selected?.constraints] ].map(([label, value]) => <div key={label}><strong>{label}</strong><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#f1f5f9", padding: 12, borderRadius: 8 }}>{value || "—"}</pre></div>)}
        <h4>Test Cases</h4>{(selected?.testCases || []).map((t, i) => <div key={i} style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}><strong>Case {i + 1} {t.isHidden ? "(Hidden)" : "(Visible)"}</strong><pre style={{ whiteSpace: "pre-wrap" }}>Input: {t.input || "(empty)"}{"\n"}Expected: {t.expectedOutput}</pre></div>)}
        <p><strong>Skills:</strong> {selected?.skillsCovered?.join(", ") || "—"}</p><p><strong>Company Tags:</strong> {selected?.companyTags?.join(", ") || "—"}</p>
        <div style={{ display: "flex", gap: 10 }}><button type="button" className="admin-primary-btn" onClick={() => setMode("edit")}>Edit</button>{selected?.isActive && <button type="button" disabled={busy} onClick={deactivate} style={{ color: "#b91c1c", padding: 10 }}>Deactivate</button>}</div>
      </div> : <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        {text("title", "Title", 1, true)}{text("description", "Description", 3, true)}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
          {text("category", "Category", 1, true)}
          {field("Difficulty", <select style={input} value={form.difficulty} onChange={e => change("difficulty", e.target.value)}>{["Easy", "Medium", "Hard"].map(x => <option key={x}>{x}</option>)}</select>)}
          {field("Language", <select style={input} value={form.language} onChange={e => change("language", e.target.value)}>{["Java", "Python", "C", "C++"].map(x => <option key={x}>{x}</option>)}</select>)}
          {field("Marks", <input style={input} type="number" min="1" required value={form.marks} onChange={e => change("marks", e.target.value)} />)}
          {field("Time Limit (seconds)", <input style={input} type="number" min="1" required value={form.timeLimitSeconds} onChange={e => change("timeLimitSeconds", e.target.value)} />)}
        </div>
        {text("buggyCode", "Buggy Code", 8, true)}{text("bugDescription", "Bug Description", 3)}{text("expectedFixedCode", "Expected Fixed Code", 8)}{text("inputFormat", "Input Format", 2)}{text("outputFormat", "Output Format", 2)}{text("constraints", "Constraints", 2)}
        <h3 style={{ marginBottom: 0 }}>Test Cases</h3>
        {form.testCases.map((test, i) => <div key={i} style={{ display: "grid", gap: 10, border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}><div style={{ display: "flex", justifyContent: "space-between" }}><strong>Test Case {i + 1}</strong>{form.testCases.length > 1 && <button type="button" onClick={() => change("testCases", form.testCases.filter((_, j) => i !== j))}>Remove</button>}</div>
          {field("Input", <textarea style={input} rows={2} value={test.input} onChange={e => updateCase(i, "input", e.target.value)} />)}
          {field("Expected Output", <textarea style={input} rows={2} required value={test.expectedOutput} onChange={e => updateCase(i, "expectedOutput", e.target.value)} />)}
          <label><input type="checkbox" checked={test.isHidden} onChange={e => updateCase(i, "isHidden", e.target.checked)} /> Hidden test case</label>
        </div>)}
        <button type="button" onClick={() => change("testCases", [...form.testCases, { input: "", expectedOutput: "", isHidden: false }])}>+ Add Test Case</button>
        {field("Skills Covered (comma-separated)", <input style={input} value={skills} onChange={e => setSkills(e.target.value)} />)}
        {field("Company Tags (comma-separated)", <input style={input} value={tags} onChange={e => setTags(e.target.value)} />)}
        <label><input type="checkbox" checked={form.isActive} onChange={e => change("isActive", e.target.checked)} /> Active</label>
        <div style={{ display: "flex", gap: 10 }}><button type="submit" className="admin-primary-btn" disabled={busy}>{busy ? "Saving..." : mode === "create" ? "Create Problem" : "Save Changes"}</button><button type="button" disabled={busy} onClick={() => setMode(null)}>Cancel</button></div>
      </form>}
    </div></div>}
  </div>;
}
