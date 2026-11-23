import { useEffect, useState } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/sql/problems`;
const inputStyle = { width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8, boxSizing: "border-box" };
const overlay = { position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 1200, display: "flex", justifyContent: "center", alignItems: "center", padding: 18 };
const panel = { width: "100%", maxWidth: 850, maxHeight: "90vh", overflowY: "auto", padding: 24, background: "white", borderRadius: 14 };
const empty = () => ({ title: "", description: "", category: "Joins", difficulty: "Easy", tables: [{ tableName: "", columns: [{ name: "", dataType: "INT" }], sampleData: [] }], expectedQuery: "", expectedResult: [], explanation: "", marks: 10, timeLimitSeconds: 5, skillsCovered: [], companyTags: [], isActive: true });
const field = (label, child) => <label style={{ display: "grid", gap: 5, minWidth: 0 }}>{label}{child}</label>;
const textInput = (value, onChange, required = false) => <input style={inputStyle} value={value ?? ""} onChange={e => onChange(e.target.value)} required={required} />;
const area = (value, onChange, rows = 3, required = false) => <textarea style={inputStyle} rows={rows} value={value ?? ""} onChange={e => onChange(e.target.value)} required={required} />;

export default function SqlManagement({ token }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty());
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [tablesJson, setTablesJson] = useState("");
  const [resultJson, setResultJson] = useState("[]");
  const [skillsText, setSkillsText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const headers = { Authorization: `Bearer ${token}` };

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API, { headers });
      setProblems(data.sqlProblems || []);
      setError("");
    } catch (err) { setError(err.response?.data?.message || "Failed to load SQL problems."); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    let live = true;
    axios.get(API, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { if (live) setProblems(data.sqlProblems || []); })
      .catch(err => { if (live) setError(err.response?.data?.message || "Failed to load SQL problems."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [token]);
  const fill = (problem) => {
    setForm(problem);
    setTablesJson(JSON.stringify(problem.tables || [], null, 2));
    setResultJson(JSON.stringify(problem.expectedResult || [], null, 2));
    setSkillsText((problem.skillsCovered || []).join(", "));
    setTagsText((problem.companyTags || []).join(", "));
  };
  const create = () => { setSelected(null); fill(empty()); setError(""); setNotice(""); setMode("create"); };
  const open = async (item, nextMode = "view") => {
    setBusy(true); setError("");
    try {
      const { data } = await axios.get(`${API}/${item._id}`, { headers });
      setSelected(data.sqlProblem); fill(data.sqlProblem); setMode(nextMode);
    } catch (err) { setError(err.response?.data?.message || "Failed to open SQL problem."); }
    finally { setBusy(false); }
  };
  const change = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const save = async e => {
    e.preventDefault(); setError(""); setNotice("");
    let tables, expectedResult;
    try { tables = JSON.parse(tablesJson); expectedResult = JSON.parse(resultJson); }
    catch { setError("Tables and expected result must contain valid JSON."); return; }
    if (!Array.isArray(tables) || !tables.length || tables.some(t => !t.tableName?.trim() || !Array.isArray(t.columns) || !t.columns.length || t.columns.some(c => !c.name?.trim() || !c.dataType?.trim()))) {
      setError("Provide at least one table with a name and valid columns (name and dataType)."); return;
    }
    if (!Array.isArray(expectedResult)) { setError("Expected result must be a JSON array."); return; }
    const payload = { ...form, title: form.title.trim(), description: form.description.trim(), category: form.category.trim(), expectedQuery: form.expectedQuery.trim(), tables, expectedResult, marks: Number(form.marks), timeLimitSeconds: Number(form.timeLimitSeconds), skillsCovered: skillsText.split(",").map(s => s.trim()).filter(Boolean), companyTags: tagsText.split(",").map(s => s.trim()).filter(Boolean) };
    setBusy(true);
    try {
      if (mode === "create") await axios.post(API, payload, { headers });
      else await axios.put(`${API}/${selected._id}`, payload, { headers });
      setNotice(mode === "create" ? "SQL problem created." : "SQL problem updated.");
      setMode(null); setSelected(null); await refresh();
    } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || "Failed to save SQL problem."); }
    finally { setBusy(false); }
  };
  const deactivate = async () => {
    if (!selected?._id || !window.confirm(`Deactivate "${selected.title}"?`)) return;
    setBusy(true); setError("");
    try {
      await axios.patch(`${API}/${selected._id}/deactivate`, {}, { headers });
      setNotice("SQL problem deactivated."); setMode(null); setSelected(null); await refresh();
    } catch (err) { setError(err.response?.data?.message || "Failed to deactivate SQL problem."); }
    finally { setBusy(false); }
  };
  const filtered = problems.filter(p => (!difficulty || p.difficulty === difficulty) && (!status || String(p.isActive) === status) && (!search || `${p.title} ${p.category}`.toLowerCase().includes(search.toLowerCase())));

  return <div className="admin-panel">
    <div className="admin-panel-heading"><div><h3>SQL Problem Management</h3><p>{problems.length} problems · {problems.filter(p => p.isActive).length} active</p></div><button type="button" className="admin-primary-btn" onClick={create}>+ Create SQL Problem</button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {notice && <p role="status" style={{ color: "#15803d" }}>{notice}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 18 }}>
      <input aria-label="Search SQL problems" style={inputStyle} placeholder="Search title or category" value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Difficulty" style={inputStyle} value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="">All difficulties</option>{["Easy", "Medium", "Hard"].map(x => <option key={x}>{x}</option>)}</select>
      <select aria-label="Status" style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select>
    </div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Title</th><th>Category</th><th>Difficulty</th><th>Marks</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {filtered.map(p => <tr key={p._id}><td>{p.title}</td><td>{p.category}</td><td>{p.difficulty}</td><td>{p.marks}</td><td><span className="admin-stage">{p.isActive ? "Active" : "Inactive"}</span></td><td style={{ whiteSpace: "nowrap" }}><button type="button" className="admin-primary-btn" disabled={busy} onClick={() => open(p)}>View</button>{" "}<button type="button" className="admin-primary-btn" disabled={busy} onClick={() => open(p, "edit")}>Edit</button></td></tr>)}
      {!loading && !filtered.length && <tr><td colSpan={6} className="admin-empty">No SQL problems found.</td></tr>}
    </tbody></table></div>
    {loading && <p className="admin-loading">Loading SQL problems...</p>}
    {mode && <div style={overlay} onMouseDown={e => { if (e.target === e.currentTarget && !busy) setMode(null); }}><div style={panel} role="dialog" aria-modal="true" aria-labelledby="sql-dialog-title">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}><h2 id="sql-dialog-title">{mode === "create" ? "Create SQL Problem" : mode === "edit" ? "Edit SQL Problem" : "SQL Problem Details"}</h2><button type="button" disabled={busy} onClick={() => setMode(null)}>Close</button></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {mode === "view" ? <div style={{ display: "grid", gap: 10 }}>
        <h3>{selected?.title}</h3><p><strong>Category:</strong> {selected?.category} · <strong>Difficulty:</strong> {selected?.difficulty}</p>
        <p><strong>Marks:</strong> {selected?.marks} · <strong>Time:</strong> {selected?.timeLimitSeconds}s · <strong>Status:</strong> {selected?.isActive ? "Active" : "Inactive"}</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{selected?.description}</p><h4>Tables</h4><pre style={{ overflowX: "auto", background: "#f1f5f9", padding: 12 }}>{JSON.stringify(selected?.tables || [], null, 2)}</pre>
        <h4>Expected SQL Query (admin only)</h4><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#f1f5f9", padding: 12 }}>{selected?.expectedQuery}</pre>
        <h4>Expected Result</h4><pre style={{ overflowX: "auto", background: "#f1f5f9", padding: 12 }}>{JSON.stringify(selected?.expectedResult || [], null, 2)}</pre>
        <p><strong>Explanation:</strong> {selected?.explanation || "—"}</p><p><strong>Skills:</strong> {(selected?.skillsCovered || []).join(", ") || "—"}</p><p><strong>Companies:</strong> {(selected?.companyTags || []).join(", ") || "—"}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="button" className="admin-primary-btn" onClick={() => setMode("edit")}>Edit Problem</button>{selected?.isActive && <button type="button" disabled={busy} onClick={deactivate} style={{ color: "#b91c1c", border: "1px solid #dc2626", borderRadius: 8, padding: 10, background: "white" }}>Deactivate</button>}</div>
      </div> : <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        {field("Title", textInput(form.title, v => change("title", v), true))}
        {field("Description", area(form.description, v => change("description", v), 4, true))}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
          {field("Category", textInput(form.category, v => change("category", v), true))}
          {field("Difficulty", <select style={inputStyle} value={form.difficulty} onChange={e => change("difficulty", e.target.value)}>{["Easy", "Medium", "Hard"].map(x => <option key={x}>{x}</option>)}</select>)}
          {field("Marks", <input type="number" min="1" required style={inputStyle} value={form.marks} onChange={e => change("marks", e.target.value)} />)}
          {field("Time Limit (seconds)", <input type="number" min="1" required style={inputStyle} value={form.timeLimitSeconds} onChange={e => change("timeLimitSeconds", e.target.value)} />)}
        </div>
        {field("SQL Tables (JSON array)", area(tablesJson, setTablesJson, 9, true))}
        <small style={{ color: "#64748b" }}>Example: [{'{'}"tableName":"employees","columns":[{'{'}"name":"id","dataType":"INT"{'}'}],"sampleData":[{'{'}"id":1{'}'}]{'}'}]</small>
        {field("Expected SQL Query", area(form.expectedQuery, v => change("expectedQuery", v), 5, true))}
        {field("Expected Result (JSON array)", area(resultJson, setResultJson, 4, true))}
        {field("Explanation", area(form.explanation, v => change("explanation", v)))}
        {field("Skills Covered (comma-separated)", textInput(skillsText, setSkillsText))}
        {field("Company Tags (comma-separated)", textInput(tagsText, setTagsText))}
        <label><input type="checkbox" checked={form.isActive !== false} onChange={e => change("isActive", e.target.checked)} /> Active</label>
        <div style={{ display: "flex", gap: 10 }}><button type="submit" className="admin-primary-btn" disabled={busy}>{busy ? "Saving..." : mode === "create" ? "Create Problem" : "Save Changes"}</button><button type="button" disabled={busy} onClick={() => setMode(null)}>Cancel</button></div>
      </form>}
    </div></div>}
  </div>;
}
