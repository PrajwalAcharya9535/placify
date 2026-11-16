
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CreateOpportunity from "./CreateOpportunity";
import CodingManagement from "./CodingManagement";
import SqlManagement from "./SqlManagement";
import DebuggingManagement from "./DebuggingManagement";
import InterviewManagement from "./InterviewManagement";
import "./AdminDashboard.css";

const API = "http://localhost:5000/api/admin";

const menu = [
  ["Dashboard", "dashboard", "◫"],
  ["Students", "students", "♙"],
  ["Opportunities", "opportunities", "◈"],
  ["Applications", "applications", "▤"],
  ["Mock Tests", "mock-tests", "✎"],
  ["Learning", "learning", "▣"],
  ["Practice", "practice", "✦"],
  ["Coding", "coding", "⌘"],
  ["SQL", "sql", "▦"],
  ["Debugging", "debugging", "⌁"],
  ["Interview", "interview", "♧"],
  ["Analytics", "analytics", "◉"],
];


const MCQ_ROUND_TYPES = ["Aptitude", "Reasoning", "Verbal", "Technical"];
const ROUND_TYPES = ["Aptitude", "Reasoning", "Verbal", "Technical", "Coding", "SQL", "Communication", "Interview"];
const blankRound = (order) => ({ roundName: "", roundType: "Aptitude", order, durationMinutes: 30, totalMarks: 30, passingPercentage: 60, numberOfQuestions: 10 });
const fieldStyle = { padding: 11, border: "1px solid #cbd5e1", borderRadius: 8, width: "100%", boxSizing: "border-box" };
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const modalPanel = { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 760, maxHeight: "88vh", overflowY: "auto", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,.2)" };

function CreateMockTest({ token, onCreated, onCancel }) {
  const [form, setForm] = useState({ title: "", description: "", companyName: "", difficulty: "Medium", passingPercentage: 60, instructions: "", startDate: "", endDate: "", maxAttempts: "", isActive: true, proctoringEnabled: true, requireFullscreen: false, requireCamera: false, maxTabSwitches: 3, autoSubmitOnViolation: false });
  const [rounds, setRounds] = useState([blankRound(1)]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const updateRound = (index, key, value) => setRounds(previous => previous.map((round, i) => i === index ? { ...round, [key]: value } : round));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const normalizedRounds = rounds.map((round, index) => ({ ...round, order: index + 1, durationMinutes: Number(round.durationMinutes), totalMarks: Number(round.totalMarks), passingPercentage: Number(round.passingPercentage), numberOfQuestions: MCQ_ROUND_TYPES.includes(round.roundType) ? Number(round.numberOfQuestions) : 0 }));
    if (normalizedRounds.some(round => !round.roundName.trim() || round.durationMinutes < 1 || round.totalMarks < 1)) { setError("Every round needs a name, positive duration and marks."); return; }
    if (normalizedRounds.some(round => MCQ_ROUND_TYPES.includes(round.roundType) && (!Number.isInteger(round.numberOfQuestions) || round.numberOfQuestions < 1))) { setError("Every MCQ round must have at least 1 question."); return; }
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) { setError("End date must be after start date."); return; }
    const totalDurationMinutes = normalizedRounds.reduce((sum, round) => sum + round.durationMinutes, 0);
    const totalMarks = normalizedRounds.reduce((sum, round) => sum + round.totalMarks, 0);
    setBusy(true);
    try {
      await axios.post(`${API}/mock-tests`, {
        ...form, rounds: normalizedRounds, totalDurationMinutes, totalMarks,
        passingPercentage: Number(form.passingPercentage), maxTabSwitches: Number(form.maxTabSwitches),
        instructions: form.instructions.split("\n").map(line => line.trim()).filter(Boolean),
        startDate: form.startDate || null, endDate: form.endDate || null,
        maxAttempts: form.maxAttempts === "" ? null : Number(form.maxAttempts),
      }, { headers: { Authorization: `Bearer ${token}` } });
      onCreated();
    } catch (err) { setError(err.response?.data?.message || "Unable to create mock test."); }
    finally { setBusy(false); }
  };
  return (
    <div style={modalOverlay} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <div style={modalPanel} role="dialog" aria-modal="true" aria-labelledby="create-mock-title">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div><small style={{ color: "#2563eb", fontWeight: 700 }}>MOCK PLACEMENT MANAGEMENT</small><h2 id="create-mock-title">Create Mock Test</h2></div>
          <button type="button" disabled={busy} onClick={onCancel}>Close</button>
        </div>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
            {[["title", "Test Title"], ["companyName", "Company Name"]].map(([key, label]) => <label key={key}>{label}<input required style={fieldStyle} value={form[key]} onChange={e => change(key, e.target.value)} /></label>)}
            <label>Difficulty<select style={fieldStyle} value={form.difficulty} onChange={e => change("difficulty", e.target.value)}>{["Easy", "Medium", "Hard"].map(x => <option key={x}>{x}</option>)}</select></label>
            <label>Passing Percentage<input type="number" min="0" max="100" required style={fieldStyle} value={form.passingPercentage} onChange={e => change("passingPercentage", e.target.value)} /></label>
            <label>Start Date (optional)<input type="datetime-local" style={fieldStyle} value={form.startDate} onChange={e => change("startDate", e.target.value)} /></label>
            <label>End Date (optional)<input type="datetime-local" style={fieldStyle} value={form.endDate} onChange={e => change("endDate", e.target.value)} /></label>
            <label>Maximum Attempts (blank = unlimited)<input type="number" min="1" style={fieldStyle} value={form.maxAttempts} onChange={e => change("maxAttempts", e.target.value)} /></label>
            <label>Maximum Tab Switches<input type="number" min="0" style={fieldStyle} value={form.maxTabSwitches} onChange={e => change("maxTabSwitches", e.target.value)} /></label>
          </div>
          <label>Description<textarea required rows={3} style={fieldStyle} value={form.description} onChange={e => change("description", e.target.value)} /></label>
          <label>Instructions (one per line)<textarea rows={3} style={fieldStyle} value={form.instructions} onChange={e => change("instructions", e.target.value)} /></label>
          <h3 style={{ margin: 0 }}>Assessment Rounds</h3>
          {rounds.map((round, index) => (
            <div key={index} style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 12, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong>Round {index + 1}</strong>{rounds.length > 1 && <button type="button" onClick={() => setRounds(previous => previous.filter((_, i) => i !== index))}>Remove</button>}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
                <label>Round Name<input required style={fieldStyle} value={round.roundName} onChange={e => updateRound(index, "roundName", e.target.value)} /></label>
                <label>Round Type<select style={fieldStyle} value={round.roundType} onChange={e => updateRound(index, "roundType", e.target.value)}>{ROUND_TYPES.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Duration (minutes)<input required type="number" min="1" style={fieldStyle} value={round.durationMinutes} onChange={e => updateRound(index, "durationMinutes", e.target.value)} /></label>
                <label>Total Marks<input required type="number" min="1" style={fieldStyle} value={round.totalMarks} onChange={e => updateRound(index, "totalMarks", e.target.value)} /></label>
                <label>Passing Percentage<input type="number" min="0" max="100" style={fieldStyle} value={round.passingPercentage} onChange={e => updateRound(index, "passingPercentage", e.target.value)} /></label>
                {MCQ_ROUND_TYPES.includes(round.roundType) && <label>Number of Questions<input required type="number" min="1" step="1" style={fieldStyle} value={round.numberOfQuestions ?? 10} onChange={e => updateRound(index, "numberOfQuestions", e.target.value)} /></label>}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setRounds(previous => [...previous, blankRound(previous.length + 1)])}>+ Add Round</button>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
            {[["isActive", "Active"], ["proctoringEnabled", "Enable Proctoring"], ["requireFullscreen", "Require Fullscreen"], ["requireCamera", "Require Camera"], ["autoSubmitOnViolation", "Auto-submit on Violation"]].map(([key, label]) => <label key={key}><input type="checkbox" checked={form[key]} onChange={e => change(key, e.target.checked)} /> {label}</label>)}
          </div>
          <p style={{ margin: 0, color: "#64748b" }}>Total: {rounds.reduce((sum, r) => sum + (Number(r.durationMinutes) || 0), 0)} minutes · {rounds.reduce((sum, r) => sum + (Number(r.totalMarks) || 0), 0)} marks</p>
          <div style={{ display: "flex", gap: 10 }}><button type="submit" disabled={busy} className="admin-primary-btn">{busy ? "Creating..." : "Create Mock Test"}</button><button type="button" disabled={busy} onClick={onCancel}>Cancel</button></div>
        </form>
      </div>
    </div>
  );
}


// ==============================
// ADMIN LEARNING MANAGEMENT
// ==============================
const LEARNING_CATEGORIES = [
  "Aptitude", "Reasoning", "Verbal", "Programming", "SQL", "DSA",
  "Technical Subject", "Communication", "Interview",
];
const LEARNING_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const blankLearningTopic = () => ({
  title: "", category: "Aptitude", description: "", difficulty: "Beginner",
  content: "", estimatedMinutes: 15, skillsCovered: "", isActive: true,
});

function LearningManagement({ token }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(blankLearningTopic());
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const headers = { Authorization: `Bearer ${token}` };

  const loadTopics = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API}/learning`, { headers });
      setTopics(response.data.topics || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load learning topics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    axios.get(`${API}/learning`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => { if (active) setTopics(response.data.topics || []); })
      .catch(err => { if (active) setError(err.response?.data?.message || "Unable to load learning topics."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const openCreate = () => {
    setForm(blankLearningTopic());
    setSelected(null);
    setError("");
    setMode("create");
  };

  const openTopic = async (topic, nextMode = "view") => {
    setBusy(true);
    setError("");
    try {
      const response = await axios.get(`${API}/learning/${topic._id}`, { headers });
      const fullTopic = response.data.topic;
      setSelected(fullTopic);
      setForm({
        title: fullTopic.title || "",
        category: fullTopic.category || "Aptitude",
        description: fullTopic.description || "",
        difficulty: fullTopic.difficulty || "Beginner",
        content: fullTopic.content || "",
        estimatedMinutes: fullTopic.estimatedMinutes ?? 15,
        skillsCovered: (fullTopic.skillsCovered || []).join(", "),
        isActive: fullTopic.isActive !== false,
      });
      setMode(nextMode);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to open learning topic.");
    } finally {
      setBusy(false);
    }
  };

  const saveTopic = async event => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      content: form.content.trim(),
      estimatedMinutes: Number(form.estimatedMinutes),
      skillsCovered: form.skillsCovered.split(",").map(s => s.trim()).filter(Boolean),
    };
    try {
      if (mode === "create") {
        await axios.post(`${API}/learning`, payload, { headers });
        setNotice("Learning topic created successfully.");
      } else {
        await axios.put(`${API}/learning/${selected._id}`, payload, { headers });
        setNotice("Learning topic updated successfully.");
      }
      setMode(null);
      setSelected(null);
      await loadTopics();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save learning topic.");
    } finally {
      setBusy(false);
    }
  };

  const deactivateTopic = async () => {
    if (!selected?._id || !window.confirm(`Deactivate "${selected.title}"? Students will no longer see this topic.`)) return;
    setBusy(true);
    setError("");
    try {
      await axios.patch(`${API}/learning/${selected._id}/deactivate`, {}, { headers });
      setNotice("Learning topic deactivated successfully.");
      setMode(null);
      setSelected(null);
      await loadTopics();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to deactivate learning topic.");
    } finally {
      setBusy(false);
    }
  };

  const filtered = topics.filter(topic =>
    (!categoryFilter || topic.category === categoryFilter) &&
    (!difficultyFilter || topic.difficulty === difficultyFilter) &&
    (!statusFilter || String(topic.isActive) === statusFilter) &&
    (!search || topic.title?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Learning Management</h3>
          <p>{topics.length} topics · {topics.filter(t => t.isActive).length} active</p>
        </div>
        <button type="button" className="admin-primary-btn" onClick={openCreate}>+ Create Learning Topic</button>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p role="status" style={{ color: "#15803d" }}>{notice}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 20 }}>
        <input aria-label="Search topics" placeholder="Search topic title" style={fieldStyle} value={search} onChange={e => setSearch(e.target.value)} />
        <select aria-label="Filter category" style={fieldStyle} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {LEARNING_CATEGORIES.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <select aria-label="Filter difficulty" style={fieldStyle} value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}>
          <option value="">All difficulties</option>
          {LEARNING_DIFFICULTIES.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <select aria-label="Filter status" style={fieldStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Topic</th><th>Category</th><th>Difficulty</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(topic => (
              <tr key={topic._id}>
                <td>{topic.title}</td>
                <td>{topic.category}</td>
                <td>{topic.difficulty}</td>
                <td>{topic.estimatedMinutes} min</td>
                <td><span className="admin-stage">{topic.isActive ? "Active" : "Inactive"}</span></td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="admin-primary-btn" disabled={busy} onClick={() => openTopic(topic)}>View</button>{" "}
                  <button type="button" className="admin-primary-btn" disabled={busy} onClick={() => openTopic(topic, "edit")}>Edit</button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="admin-empty">No learning topics found.</td></tr>}
          </tbody>
        </table>
      </div>
      {loading && <p className="admin-loading">Loading learning topics...</p>}
      {mode && (
        <div style={modalOverlay} role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setMode(null); }}>
          <div style={modalPanel} role="dialog" aria-modal="true" aria-labelledby="learning-modal-title">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h2 id="learning-modal-title">{mode === "create" ? "Create Learning Topic" : mode === "edit" ? "Edit Learning Topic" : "Learning Topic Details"}</h2>
              <button type="button" disabled={busy} onClick={() => setMode(null)}>Close</button>
            </div>
            {error && <p className="admin-error" role="alert">{error}</p>}
            {mode === "view" ? (
              <div style={{ display: "grid", gap: 10 }}>
                <h3>{selected?.title}</h3>
                <p><strong>Category:</strong> {selected?.category} · <strong>Difficulty:</strong> {selected?.difficulty}</p>
                <p><strong>Duration:</strong> {selected?.estimatedMinutes} minutes · <strong>Status:</strong> {selected?.isActive ? "Active" : "Inactive"}</p>
                <p><strong>Skills:</strong> {selected?.skillsCovered?.join(", ") || "—"}</p>
                <h4>Description</h4><p style={{ whiteSpace: "pre-wrap" }}>{selected?.description}</p>
                <h4>Content</h4><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{selected?.content}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" className="admin-primary-btn" onClick={() => setMode("edit")}>Edit Topic</button>
                  {selected?.isActive && <button type="button" disabled={busy} onClick={deactivateTopic} style={{ padding: "10px 14px", border: "1px solid #dc2626", borderRadius: 8, color: "#b91c1c", background: "white", cursor: "pointer" }}>Deactivate Topic</button>}
                </div>
              </div>
            ) : (
              <form onSubmit={saveTopic} style={{ display: "grid", gap: 14 }}>
                <label>Title<input required style={fieldStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                  <label>Category<select style={fieldStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>{LEARNING_CATEGORIES.map(x => <option key={x}>{x}</option>)}</select></label>
                  <label>Difficulty<select style={fieldStyle} value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>{LEARNING_DIFFICULTIES.map(x => <option key={x}>{x}</option>)}</select></label>
                  <label>Duration (minutes)<input required type="number" min="1" style={fieldStyle} value={form.estimatedMinutes} onChange={e => setForm(p => ({ ...p, estimatedMinutes: e.target.value }))} /></label>
                </div>
                <label>Description<textarea required rows={3} style={fieldStyle} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></label>
                <label>Learning Content<textarea required rows={9} style={fieldStyle} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} /></label>
                <label>Skills Covered (comma-separated)<input style={fieldStyle} value={form.skillsCovered} onChange={e => setForm(p => ({ ...p, skillsCovered: e.target.value }))} /></label>
                <label><input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} /> Active</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" disabled={busy} className="admin-primary-btn">{busy ? "Saving..." : mode === "create" ? "Create Topic" : "Save Changes"}</button>
                  <button type="button" disabled={busy} onClick={() => setMode(null)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================
// ADMIN PRACTICE MANAGEMENT
// ==============================
const PRACTICE_CATEGORIES = ["Aptitude", "Reasoning", "Verbal", "Technical", "Coding", "SQL", "Debugging"];
const PRACTICE_TYPES = ["MCQ", "Coding", "SQL", "Debugging"];
const PRACTICE_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const blankPracticeQuestion = () => ({
  questionText: "", category: "Aptitude", subCategory: "", difficulty: "Easy",
  questionType: "MCQ", options: ["", "", "", ""], correctAnswer: "",
  explanation: "", marks: 1, timeLimitSeconds: 60, skillsCovered: "", isActive: true,
});

function PracticeManagement({ token }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blankPracticeQuestion());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const headers = { Authorization: `Bearer ${token}` };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/practice/questions`, { headers });
      setQuestions(response.data.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load practice questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    axios.get(`${API}/practice/questions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => { if (active) setQuestions(response.data.questions || []); })
      .catch(err => { if (active) setError(err.response?.data?.message || "Unable to load practice questions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const openCreate = () => {
    setForm(blankPracticeQuestion());
    setSelected(null);
    setError("");
    setNotice("");
    setMode("create");
  };
  const openQuestion = async (item, nextMode = "view") => {
    setBusy(true);
    setError("");
    try {
      const response = await axios.get(`${API}/practice/questions/${item._id}`, { headers });
      const question = response.data.question;
      setSelected(question);
      setForm({
        questionText: question.questionText || "",
        category: question.category || "Aptitude",
        subCategory: question.subCategory || "",
        difficulty: question.difficulty || "Easy",
        questionType: question.questionType || "MCQ",
        options: question.options?.length ? [...question.options] : ["", "", "", ""],
        correctAnswer: question.correctAnswer || "",
        explanation: question.explanation || "",
        marks: question.marks ?? 1,
        timeLimitSeconds: question.timeLimitSeconds ?? 60,
        skillsCovered: (question.skillsCovered || []).join(", "),
        isActive: question.isActive !== false,
      });
      setMode(nextMode);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to open practice question.");
    } finally {
      setBusy(false);
    }
  };

  const saveQuestion = async event => {
    event.preventDefault();
    setError("");
    setNotice("");
    const options = form.questionType === "MCQ" ? form.options.map(x => x.trim()).filter(Boolean) : [];
    const answer = form.correctAnswer.trim();
    if (!form.questionText.trim()) { setError("Question text is required."); return; }
    if (form.questionType === "MCQ" && (options.length < 2 || !answer || !options.includes(answer))) {
      setError("MCQ requires at least two options and a correct answer matching one option.");
      return;
    }
    const payload = {
      ...form,
      questionText: form.questionText.trim(),
      subCategory: form.subCategory.trim(),
      options,
      correctAnswer: form.questionType === "MCQ" ? answer : form.correctAnswer.trim(),
      explanation: form.explanation.trim(),
      marks: Number(form.marks),
      timeLimitSeconds: Number(form.timeLimitSeconds),
      skillsCovered: form.skillsCovered.split(",").map(x => x.trim()).filter(Boolean),
    };
    setBusy(true);
    try {
      if (mode === "create") {
        await axios.post(`${API}/practice/questions`, payload, { headers });
        setNotice("Practice question created successfully.");
      } else {
        await axios.put(`${API}/practice/questions/${selected._id}`, payload, { headers });
        setNotice("Practice question updated successfully.");
      }
      setMode(null);
      setSelected(null);
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save practice question.");
    } finally {
      setBusy(false);
    }
  };

  const deactivateQuestion = async () => {
    if (!selected?._id || !window.confirm("Deactivate this question?")) return;
    setBusy(true);
    setError("");
    try {
      await axios.patch(`${API}/practice/questions/${selected._id}/deactivate`, {}, { headers });
      setNotice("Practice question deactivated successfully.");
      setMode(null);
      setSelected(null);
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to deactivate practice question.");
    } finally {
      setBusy(false);
    }
  };

  const filtered = questions.filter(question =>
    (!categoryFilter || question.category === categoryFilter) &&
    (!difficultyFilter || question.difficulty === difficultyFilter) &&
    (!statusFilter || String(question.isActive) === statusFilter) &&
    (!search || `${question.questionText} ${question.subCategory || ""}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-heading">
        <div><h3>Practice Question Management</h3><p>{questions.length} questions · {questions.filter(q => q.isActive).length} active</p></div>
        <button type="button" className="admin-primary-btn" onClick={openCreate}>+ Create Question</button>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p role="status" style={{ color: "#15803d" }}>{notice}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 20 }}>
        <input aria-label="Search questions" placeholder="Search questions" style={fieldStyle} value={search} onChange={e => setSearch(e.target.value)} />
        <select aria-label="Category" style={fieldStyle} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="">All categories</option>{PRACTICE_CATEGORIES.map(x => <option key={x}>{x}</option>)}</select>
        <select aria-label="Difficulty" style={fieldStyle} value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}><option value="">All difficulties</option>{PRACTICE_DIFFICULTIES.map(x => <option key={x}>{x}</option>)}</select>
        <select aria-label="Status" style={fieldStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Question</th><th>Category</th><th>Type</th><th>Difficulty</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(question => <tr key={question._id}>
              <td style={{ maxWidth: 350, overflowWrap: "anywhere" }}>{question.questionText}</td>
              <td>{question.category}</td><td>{question.questionType}</td><td>{question.difficulty}</td>
              <td><span className="admin-stage">{question.isActive ? "Active" : "Inactive"}</span></td>
              <td style={{ whiteSpace: "nowrap" }}><button type="button" className="admin-primary-btn" disabled={busy} onClick={() => openQuestion(question)}>View</button>{" "}<button type="button" className="admin-primary-btn" disabled={busy} onClick={() => openQuestion(question, "edit")}>Edit</button></td>
            </tr>)}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="admin-empty">No practice questions found.</td></tr>}
          </tbody>
        </table>
      </div>
      {loading && <p className="admin-loading">Loading practice questions...</p>}
      {mode && <div style={modalOverlay} role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setMode(null); }}>
        <div style={modalPanel} role="dialog" aria-modal="true" aria-labelledby="practice-modal-title">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h2 id="practice-modal-title">{mode === "create" ? "Create Practice Question" : mode === "edit" ? "Edit Practice Question" : "Practice Question Details"}</h2>
            <button type="button" disabled={busy} onClick={() => setMode(null)}>Close</button>
          </div>
          {error && <p className="admin-error" role="alert">{error}</p>}
          {mode === "view" ? <div style={{ display: "grid", gap: 10 }}>
            <h3 style={{ overflowWrap: "anywhere" }}>{selected?.questionText}</h3>
            <p><strong>Category:</strong> {selected?.category} {selected?.subCategory ? ` / ${selected.subCategory}` : ""}</p>
            <p><strong>Type:</strong> {selected?.questionType} · <strong>Difficulty:</strong> {selected?.difficulty}</p>
            <p><strong>Marks:</strong> {selected?.marks} · <strong>Time:</strong> {selected?.timeLimitSeconds}s · <strong>Status:</strong> {selected?.isActive ? "Active" : "Inactive"}</p>
            {selected?.questionType === "MCQ" && <><h4>Options</h4><ol>{(selected.options || []).map((option, i) => <li key={i}>{option}</li>)}</ol></>}
            <p><strong>Correct Answer:</strong> {selected?.correctAnswer || "—"}</p>
            <p><strong>Explanation:</strong> {selected?.explanation || "—"}</p>
            <p><strong>Skills:</strong> {selected?.skillsCovered?.join(", ") || "—"}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="admin-primary-btn" onClick={() => setMode("edit")}>Edit Question</button>
              {selected?.isActive && <button type="button" disabled={busy} onClick={deactivateQuestion} style={{ padding: "10px 14px", border: "1px solid #dc2626", borderRadius: 8, color: "#b91c1c", background: "white", cursor: "pointer" }}>Deactivate Question</button>}
            </div>
          </div> : <form onSubmit={saveQuestion} style={{ display: "grid", gap: 14 }}>
            <label>Question Text<textarea required rows={4} style={fieldStyle} value={form.questionText} onChange={e => change("questionText", e.target.value)} /></label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              <label>Category<select style={fieldStyle} value={form.category} onChange={e => change("category", e.target.value)}>{PRACTICE_CATEGORIES.map(x => <option key={x}>{x}</option>)}</select></label>
              <label>Question Type<select style={fieldStyle} value={form.questionType} onChange={e => change("questionType", e.target.value)}>{PRACTICE_TYPES.map(x => <option key={x}>{x}</option>)}</select></label>
              <label>Difficulty<select style={fieldStyle} value={form.difficulty} onChange={e => change("difficulty", e.target.value)}>{PRACTICE_DIFFICULTIES.map(x => <option key={x}>{x}</option>)}</select></label>
              <label>Subcategory<input style={fieldStyle} value={form.subCategory} onChange={e => change("subCategory", e.target.value)} /></label>
              <label>Marks<input required type="number" min="1" style={fieldStyle} value={form.marks} onChange={e => change("marks", e.target.value)} /></label>
              <label>Time Limit (seconds)<input required type="number" min="10" style={fieldStyle} value={form.timeLimitSeconds} onChange={e => change("timeLimitSeconds", e.target.value)} /></label>
            </div>
            {form.questionType === "MCQ" && <div style={{ display: "grid", gap: 10 }}>
              <h4 style={{ margin: 0 }}>MCQ Options</h4>
              {form.options.map((option, index) => <label key={index}>Option {index + 1}<div style={{ display: "flex", gap: 8 }}><input style={fieldStyle} value={option} onChange={e => change("options", form.options.map((value, i) => i === index ? e.target.value : value))} />{form.options.length > 2 && <button type="button" onClick={() => change("options", form.options.filter((_, i) => i !== index))}>Remove</button>}</div></label>)}
              <button type="button" onClick={() => change("options", [...form.options, ""])}>+ Add Option</button>
              <label>Correct Answer<select required style={fieldStyle} value={form.correctAnswer} onChange={e => change("correctAnswer", e.target.value)}><option value="">Select correct option</option>{form.options.map((option, index) => option.trim() ? <option key={index} value={option.trim()}>{option.trim()}</option> : null)}</select></label>
            </div>}
            {form.questionType !== "MCQ" && <label>Correct Answer / Expected Output<textarea rows={3} style={fieldStyle} value={form.correctAnswer} onChange={e => change("correctAnswer", e.target.value)} /></label>}
            <label>Explanation<textarea rows={3} style={fieldStyle} value={form.explanation} onChange={e => change("explanation", e.target.value)} /></label>
            <label>Skills Covered (comma-separated)<input style={fieldStyle} value={form.skillsCovered} onChange={e => change("skillsCovered", e.target.value)} /></label>
            <label><input type="checkbox" checked={form.isActive} onChange={e => change("isActive", e.target.checked)} /> Active</label>
            <div style={{ display: "flex", gap: 10 }}><button type="submit" className="admin-primary-btn" disabled={busy}>{busy ? "Saving..." : mode === "create" ? "Create Question" : "Save Changes"}</button><button type="button" disabled={busy} onClick={() => setMode(null)}>Cancel</button></div>
          </form>}
        </div>
      </div>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState("dashboard");
  const [showCreateMockTest, setShowCreateMockTest] = useState(false);
  const [selectedMockTest, setSelectedMockTest] = useState(null);
  const [mockBusy, setMockBusy] = useState(false);
  const [mockError, setMockError] = useState("");
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [overview, setOverview] = useState(null);
  const [records, setRecords] = useState([]);
  const [recent, setRecent] = useState([]);
  const [stages, setStages] = useState({});
  const [mockAnalytics, setMockAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [editingOpportunity, setEditingOpportunity] = useState(false);
  const [opportunityForm, setOpportunityForm] = useState({});
  const [opportunityBusy, setOpportunityBusy] = useState(false);
  const [opportunityError, setOpportunityError] = useState("");

  const token = localStorage.getItem("placifyToken");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      setRecords([]);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        if (section === "dashboard") {
          const [a, b] = await Promise.all([
            axios.get(`${API}/dashboard`, { headers }),
            axios.get(`${API}/dashboard/recent-applications`, {
              headers,
            }),
          ]);

          if (active) {
            setOverview(a.data.overview);
            setRecent(b.data.applications || []);
          }
        } else if (section === "learning" || section === "practice" || section === "coding" || section === "sql" || section === "debugging" || section === "interview") {
          // LearningManagement fetches and manages its own topics.
        } else if (section === "analytics") {
          const [applicationResponse, mockResponse] = await Promise.allSettled([
            axios.get(`${API}/applications/analytics/stages`, { headers }),
            axios.get(`${API}/mock-tests/analytics/summary`, { headers }),
          ]);

          if (active) {
            if (applicationResponse.status === "fulfilled") {
              setStages(applicationResponse.value.data.analytics?.stageCounts || {});
            } else {
              setStages({});
            }
            if (mockResponse.status === "fulfilled") {
              setMockAnalytics(mockResponse.value.data.analytics || null);
            } else {
              setMockAnalytics(null);
            }
            if (applicationResponse.status === "rejected" || mockResponse.status === "rejected") {
              setError("Some analytics could not be loaded. Check the backend endpoints.");
            }
          }
        } else {
          const response = await axios.get(
            `${API}/${section}`,
            { headers }
          );

          if (active) {
            const data = response.data;
            const list =
              data.students ||
              data.opportunities ||
              data.applications ||
              data.mockTests ||
              data.tests ||
              data.data ||
              [];

            setRecords(Array.isArray(list) ? list : []);
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load admin data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [section, token, navigate, refreshKey]);

  const openStudent = async (studentId) => {
    setSelectedStudent(null);
    setStudentError("");
    setStudentLoading(true);
    try {
      const response = await axios.get(`${API}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedStudent(response.data.student);
    } catch (err) {
      setStudentError(err.response?.data?.message || "Unable to load student details.");
    } finally {
      setStudentLoading(false);
    }
  };

  const openMockTest = async (id) => {
    setMockError("");
    setMockBusy(true);
    try {
      const response = await axios.get(`${API}/mock-tests/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedMockTest(response.data.mockTest);
    } catch (err) { setMockError(err.response?.data?.message || "Unable to load mock test."); }
    finally { setMockBusy(false); }
  };

  const deactivateMockTest = async () => {
    if (!selectedMockTest?._id || !window.confirm(`Deactivate ${selectedMockTest.title}?`)) return;
    setMockBusy(true);
    setMockError("");
    try {
      await axios.patch(`${API}/mock-tests/${selectedMockTest._id}/deactivate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedMockTest(null);
      setRefreshKey(previous => previous + 1);
    } catch (err) { setMockError(err.response?.data?.message || "Unable to deactivate mock test."); }
    finally { setMockBusy(false); }
  };

  const logout = () => {
    localStorage.removeItem("placifyToken");
    localStorage.removeItem("placifyUser");
    navigate("/login", { replace: true });
  };

  const openOpportunity = (item, edit = false) => {
    setSelectedOpportunity(item);
    setEditingOpportunity(edit);
    setOpportunityError("");
    setOpportunityForm({
      title: item.title || "", companyName: item.companyName || "",
      description: item.description || "", opportunityType: item.opportunityType || "Fresher Job",
      jobRole: item.jobRole || "", location: item.location || "",
      workMode: item.workMode || "On-site", minimumCGPA: item.minimumCGPA ?? 0,
      requiredSkills: (item.requiredSkills || []).join(", "),
      applicationUrl: item.applicationUrl || "",
      applicationDeadline: item.applicationDeadline ? new Date(item.applicationDeadline).toISOString().slice(0, 10) : "",
      status: item.status || "Active",
    });
  };

  const saveOpportunity = async (event) => {
    event.preventDefault();
    if (!selectedOpportunity?._id) return;
    setOpportunityBusy(true);
    setOpportunityError("");
    try {
      await axios.put(`${API}/opportunities/${selectedOpportunity._id}`, {
        ...opportunityForm,
        minimumCGPA: Number(opportunityForm.minimumCGPA),
        requiredSkills: opportunityForm.requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
        applicationDeadline: `${opportunityForm.applicationDeadline}T23:59:59`,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedOpportunity(null);
      setEditingOpportunity(false);
      setRefreshKey(value => value + 1);
    } catch (err) {
      setOpportunityError(err.response?.data?.message || "Unable to update opportunity.");
    } finally { setOpportunityBusy(false); }
  };

  const closeOpportunity = async () => {
    if (!selectedOpportunity?._id || !window.confirm(`Close ${selectedOpportunity.title}? Students will no longer be able to apply.`)) return;
    setOpportunityBusy(true);
    setOpportunityError("");
    try {
      await axios.patch(`${API}/opportunities/${selectedOpportunity._id}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOpportunity(null);
      setRefreshKey(value => value + 1);
    } catch (err) {
      setOpportunityError(err.response?.data?.message || "Unable to close opportunity.");
    } finally { setOpportunityBusy(false); }
  };

  const stats = [
    ["Total Students", overview?.users?.totalStudents],
    ["Active Opportunities", overview?.opportunities?.active],
    ["Total Applications", overview?.applications?.total],
    ["Placed Students", overview?.placements?.placedStudents],
  ];

  const title = menu.find((item) => item[1] === section)?.[0];

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  const format = (value) =>
    value === undefined || value === null ? "—" : value;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-mark">P</div>
          <div>
            <strong>Placify</strong>
            <small>ADMIN PORTAL</small>
          </div>
        </div>

        <div className="admin-menu-label">WORKSPACE</div>

        <nav className="admin-navigation">
          {menu.map(([label, key, symbol]) => (
            <button
              key={key}
              type="button"
              className={
                section === key ? "admin-nav active" : "admin-nav"
              }
              onClick={() => { setSection(key); setSelectedApplication(null); setSelectedStudent(null); setStudentError(""); setSelectedOpportunity(null); setEditingOpportunity(false); setSelectedMockTest(null); setMockError(""); setShowCreateMockTest(false); }}
            >
              <span>{symbol}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-account">
            <div className="admin-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <small>admin@placify.com</small>
            </div>
          </div>

          <button
            className="admin-logout"
            type="button"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">
              PLACIFY / ADMINISTRATION
            </span>
            <h1>{title}</h1>
          </div>
          <span className="admin-topbar-tag">Admin Workspace</span>
        </header>

        {error && <div className="admin-error">{error}</div>}
        {loading && <p className="admin-loading">Loading data...</p>}

        {section === "learning" && <LearningManagement token={token} />}
        {section === "practice" && <PracticeManagement token={token} />}
        {section === "coding" && <CodingManagement token={token} />}
        {section === "sql" && <SqlManagement token={token} />}
        {section === "debugging" && <DebuggingManagement token={token} />}
        {section === "interview" && <InterviewManagement token={token} />}

        {section === "dashboard" && (
          <>
            <div className="admin-welcome">
              <span>ADMINISTRATION OVERVIEW</span>
              <h2>Welcome to Placify.</h2>
              <p>
                Manage your placement ecosystem and monitor student
                progress from one workspace.
              </p>
            </div>

            <div className="admin-stats">
              {stats.map(([label, value]) => (
                <div className="admin-stat" key={label}>
                  <span>{label}</span>
                  <strong>{format(value)}</strong>
                  <small>Live database metric</small>
                </div>
              ))}
            </div>

            <div className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h3>Recent Applications</h3>
                  <p>Latest placement application activity</p>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Company</th>
                      <th>Position</th>
                      <th>Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((item) => (
                      <tr key={item._id}>
                        <td>{item.student?.name || "—"}</td>
                        <td>
                          {item.opportunity?.companyName || "—"}
                        </td>
                        <td>
                          {item.opportunity?.jobRole ||
                            item.opportunity?.title ||
                            "—"}
                        </td>
                        <td>
                          <span className="admin-stage">
                            {item.currentStage || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!recent.length && !loading && (
                      <tr>
                        <td colSpan="4" className="admin-empty">
                          No recent applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {["students", "opportunities", "applications", "mock-tests"].includes(
          section
        ) && (
          <div className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h3>{title} Management</h3>
                <p>
                  {records.length} records returned from the server
                </p>
              </div>
              {section === "mock-tests" && (
                <button type="button" className="admin-primary-btn" onClick={() => setShowCreateMockTest(true)}>+ Create Mock Test</button>
              )}
              {section === "opportunities" && (
   <button
    type="button"
    className="admin-primary-btn"
    onClick={() => setShowCreateOpportunity(true)}
  >
    + Create Opportunity
  </button>
)}
            </div>

            {section === "opportunities" && showCreateOpportunity && (
              <CreateOpportunity
                onCreated={() => {
                  setShowCreateOpportunity(false);
                  setRefreshKey((previous) => previous + 1);
                }}
                onCancel={() => setShowCreateOpportunity(false)}
              />
            )}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name / Title</th>
                    <th>Details</th>
                    <th>Status</th>
                    {["students", "applications", "opportunities", "mock-tests"].includes(section) && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {records.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>
                        {item.name ||
                          item.title ||
                          item.student?.name ||
                          "—"}
                      </td>
                      <td>
                        {item.email ||
                          item.companyName ||
                          item.opportunity?.companyName ||
                          item.description ||
                          "—"}
                      </td>
                      <td>
                        <span className="admin-stage">
                        {section === "mock-tests"
  ? item.isActive ? "Active" : "Inactive"
  : item.currentStage ||
    item.status ||
    item.role ||
    "—"}
                        </span>
                      </td>
                      {section === "students" && (
                        <td>
                          <button type="button" className="admin-primary-btn"
                            disabled={studentLoading} onClick={() => openStudent(item._id)}>
                            View Details
                          </button>
                        </td>
                      )}
                      {section === "opportunities" && (
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button type="button" className="admin-primary-btn" onClick={() => openOpportunity(item)}>View Details</button>{" "}
                          <button type="button" className="admin-primary-btn" onClick={() => openOpportunity(item, true)}>Edit</button>{" "}
                          {item.status !== "Closed" && <button type="button" className="admin-primary-btn" onClick={() => openOpportunity(item)}>Manage</button>}
                        </td>
                      )}
                      {section === "mock-tests" && (
                        <td><button type="button" className="admin-primary-btn" disabled={mockBusy} onClick={() => openMockTest(item._id)}>View Details</button></td>
                      )}
                      {section === "applications" && (
                        <td>
                          <button type="button" className="admin-primary-btn"
                            onClick={() => setSelectedApplication(item)}>
                            View Details
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {!records.length && !loading && (
                    <tr>
                      <td colSpan={["students", "applications", "opportunities", "mock-tests"].includes(section) ? 4 : 3} className="admin-empty">
                        No records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === "mock-tests" && mockError && <div className="admin-error" role="alert">{mockError}</div>}
        {section === "mock-tests" && showCreateMockTest && (
          <CreateMockTest token={token} onCreated={() => { setShowCreateMockTest(false); setRefreshKey(previous => previous + 1); }} onCancel={() => setShowCreateMockTest(false)} />
        )}
        {section === "mock-tests" && selectedMockTest && (
          <div style={modalOverlay} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !mockBusy) setSelectedMockTest(null); }}>
            <div style={modalPanel} role="dialog" aria-modal="true" aria-labelledby="admin-mock-title">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div><small style={{ color: "#2563eb", fontWeight: 700 }}>MOCK TEST DETAILS</small><h2 id="admin-mock-title">{selectedMockTest.title}</h2><p>{selectedMockTest.companyName}</p></div>
                <button
  type="button"
  disabled={mockBusy}
  onClick={() => setSelectedMockTest(null)}
  style={{
    alignSelf: "flex-start",
    padding: "10px 16px",
    width: "auto",
    height: "auto",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    flexShrink: 0,
  }}
>
  Close
</button>
              </div>
              {mockError && <p className="admin-error">{mockError}</p>}
              <p style={{ whiteSpace: "pre-wrap" }}>{selectedMockTest.description}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, margin: "18px 0" }}>
                {[["Difficulty", selectedMockTest.difficulty], ["Status", selectedMockTest.isActive ? "Active" : "Inactive"], ["Duration", `${selectedMockTest.totalDurationMinutes} min`], ["Marks", selectedMockTest.totalMarks], ["Passing", `${selectedMockTest.passingPercentage}%`], ["Attempts", selectedMockTest.maxAttempts ?? "Unlimited"], ["Start", formatDate(selectedMockTest.startDate)], ["End", formatDate(selectedMockTest.endDate)], ["Proctoring", selectedMockTest.proctoringEnabled ? "Enabled" : "Disabled"]].map(([label, value]) => <div key={label}><small style={{ color: "#64748b" }}>{label}</small><div style={{ fontWeight: 600 }}>{value}</div></div>)}
              </div>
              <h3>Rounds</h3>
              <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>#</th><th>Name</th><th>Type</th><th>Duration</th><th>Marks</th></tr></thead><tbody>
                {(selectedMockTest.rounds || []).slice().sort((a,b) => a.order - b.order).map((round, i) => <tr key={round._id || i}><td>{round.order}</td><td>{round.roundName}</td><td>{round.roundType}</td><td>{round.durationMinutes} min</td><td>{round.totalMarks}</td></tr>)}
              </tbody></table></div>
              {selectedMockTest.instructions?.length > 0 && <><h3>Instructions</h3><ul>{selectedMockTest.instructions.map((instruction, i) => <li key={i}>{instruction}</li>)}</ul></>}
              {selectedMockTest.isActive && <button type="button" disabled={mockBusy} onClick={deactivateMockTest} style={{ ...fieldStyle, width: "auto", color: "#b91c1c", cursor: "pointer", marginTop: 16 }}>{mockBusy ? "Deactivating..." : "Deactivate Test"}</button>}
            </div>
          </div>
        )}

        {section === "students" && studentError && (
          <div className="admin-error" role="alert">{studentError}</div>
        )}

        {section === "students" && selectedStudent && (
          <div role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedStudent(null);
            }}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div role="dialog" aria-modal="true" aria-labelledby="admin-student-title"
              style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 720,
                maxHeight: "85vh", overflowY: "auto", padding: 28,
                boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <small style={{ color: "#2563eb", fontWeight: 700 }}>STUDENT PROFILE</small>
                  <h2 id="admin-student-title">{selectedStudent.name}</h2>
                  <p>{selectedStudent.email}</p>
                </div>
                <button type="button" className="admin-primary-btn"
                  onClick={() => setSelectedStudent(null)}>Close</button>
              </div>

              <h3>Academic & Personal Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
                gap: 16, margin: "20px 0" }}>
                {[
                  ["Phone", selectedStudent.profile?.phone],
                  ["Course", selectedStudent.profile?.course],
                  ["College", selectedStudent.profile?.college],
                  ["Graduation Year", selectedStudent.profile?.graduationYear],
                  ["CGPA", selectedStudent.profile?.cgpa],
                  ["Backlogs", selectedStudent.profile?.backlogs],
                  ["Location", selectedStudent.profile?.location],
                  ["Registered On", formatDate(selectedStudent.createdAt)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <small style={{ color: "#64748b" }}>{label}</small>
                    <div style={{ fontWeight: 600, marginTop: 5 }}>{value ?? "—"}</div>
                  </div>
                ))}
              </div>
              <h3>Skills</h3>
              <p>{selectedStudent.profile?.skills?.length
                ? selectedStudent.profile.skills.map((skill) =>
                    typeof skill === "string" ? skill : skill.name || "—").join(", ")
                : "No skills added"}</p>
              <h3>Placement Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
                gap: 12, margin: "16px 0" }}>
                {[
                  ["Total", selectedStudent.placementSummary?.totalApplications],
                  ["Active", selectedStudent.placementSummary?.activeApplications],
                  ["Placed", selectedStudent.placementSummary?.placedApplications],
                  ["Rejected", selectedStudent.placementSummary?.rejectedApplications],
                ].map(([label, value]) => (
                  <div className="admin-stat" key={label}>
                    <span>{label}</span><strong>{value ?? 0}</strong>
                  </div>
                ))}
              </div>
              <h3>Application History</h3>
              {selectedStudent.applications?.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Company</th><th>Role</th><th>Stage</th></tr></thead>
                    <tbody>
                      {selectedStudent.applications.map((application) => (
                        <tr key={application._id}>
                          <td>{application.opportunity?.companyName || "—"}</td>
                          <td>{application.opportunity?.jobRole || application.opportunity?.title || "—"}</td>
                          <td>{application.currentStage || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p>No applications found.</p>}
            </div>
          </div>
        )}

        {section === "analytics" && (
          <>
          <div className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h3>Application Stage Analytics</h3>
                <p>Live placement pipeline distribution</p>
              </div>
            </div>

            <div className="admin-analytics">
              {Object.entries(stages).map(([stage, count]) => {
                const max = Math.max(
                  1,
                  ...Object.values(stages)
                );

                return (
                  <div className="admin-analytics-row" key={stage}>
                    <span>{stage}</span>
                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill"
                        style={{
                          width: `${(count / max) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              })}

              {!Object.keys(stages).length && !loading && (
                <p>No analytics available.</p>
              )}
            </div>
          </div>
          <div className="admin-panel" style={{ marginTop: 22 }}>
            <div className="admin-panel-heading">
              <div>
                <h3>Mock Placement Analytics</h3>
                <p>Live student assessment performance</p>
              </div>
            </div>
            {mockAnalytics ? (
              <>
                <div className="admin-stats" style={{ marginBottom: 20 }}>
                  {[
                    ["Total Attempts", mockAnalytics.totalAttempts],
                    ["Completed", mockAnalytics.completedAttempts],
                    ["In Progress", mockAnalytics.inProgressAttempts],
                    ["Not Started", mockAnalytics.notStartedAttempts ?? mockAnalytics.statusCounts?.["Not Started"] ?? 0],
                    ["Auto Submitted", mockAnalytics.autoSubmittedAttempts ?? mockAnalytics.statusCounts?.["Auto Submitted"] ?? 0],
                    ["Disqualified", mockAnalytics.disqualifiedAttempts ?? mockAnalytics.statusCounts?.Disqualified ?? 0],
                  ].map(([label, value]) => (
                    <div className="admin-stat" key={label}>
                      <span>{label}</span>
                      <strong>{value ?? 0}</strong>
                      <small>Attempt status</small>
                    </div>
                  ))}
                </div>
                <h4 style={{ margin: "12px 0 8px" }}>Attempt Status Breakdown</h4>
                <div className="admin-analytics" style={{ marginBottom: 24 }}>
                  {[
                    ["Completed", mockAnalytics.completedAttempts ?? 0, "#16a34a"],
                    ["In Progress", mockAnalytics.inProgressAttempts ?? 0, "#f59e0b"],
                    ["Not Started", mockAnalytics.notStartedAttempts ?? mockAnalytics.statusCounts?.["Not Started"] ?? 0, "#94a3b8"],
                    ["Auto Submitted", mockAnalytics.autoSubmittedAttempts ?? mockAnalytics.statusCounts?.["Auto Submitted"] ?? 0, "#6366f1"],
                    ["Disqualified", mockAnalytics.disqualifiedAttempts ?? mockAnalytics.statusCounts?.Disqualified ?? 0, "#dc2626"],
                  ].map(([label, count, color]) => (
                    <div className="admin-analytics-row" key={label}>
                      <span>{label}</span>
                      <div className="admin-bar-track">
                        <div className="admin-bar-fill" style={{
                          width: `${(count / Math.max(1, mockAnalytics.totalAttempts || 0)) * 100}%`,
                          background: color,
                        }} />
                      </div>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
                <h4 style={{ margin: "12px 0 8px" }}>Assessment Results</h4>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                  Results are counted independently of attempt status. A failed result does not necessarily mean an attempt has a Completed status.
                </p>
                <div className="admin-stats" style={{ marginBottom: 20 }}>
                  {[
                    ["Passed Results", mockAnalytics.resultCounts?.Passed ?? mockAnalytics.passedAttempts ?? 0],
                    ["Failed Results", mockAnalytics.resultCounts?.Failed ?? mockAnalytics.failedAttempts ?? 0],
                    ["Pending Results", mockAnalytics.resultCounts?.Pending ?? 0],
                    ["Disqualified Results", mockAnalytics.resultCounts?.Disqualified ?? 0],
                    ["Avg. Scored Attempt", `${mockAnalytics.averagePercentage ?? 0}%`],
                  ].map(([label, value]) => (
                    <div className="admin-stat" key={label}>
                      <span>{label}</span>
                      <strong>{value ?? 0}</strong>
                      <small>{label.startsWith("Avg.") ? "Completed and auto-submitted attempts" : "Result classification"}</small>
                    </div>
                  ))}
                </div>
                <div className="admin-analytics">
                  {[
                    ["Passed", mockAnalytics.resultCounts?.Passed ?? mockAnalytics.passedAttempts ?? 0, "#16a34a"],
                    ["Failed", mockAnalytics.resultCounts?.Failed ?? mockAnalytics.failedAttempts ?? 0, "#dc2626"],
                    ["Pending", mockAnalytics.resultCounts?.Pending ?? 0, "#f59e0b"],
                    ["Disqualified", mockAnalytics.resultCounts?.Disqualified ?? 0, "#64748b"],
                  ].map(([label, count, color]) => (
                    <div className="admin-analytics-row" key={label}>
                      <span>{label}</span>
                      <div className="admin-bar-track">
                        <div className="admin-bar-fill" style={{
                          width: `${(count / Math.max(1, mockAnalytics.totalAttempts || 0)) * 100}%`,
                          background: color,
                        }} />
                      </div>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : !loading ? <p>No mock placement analytics available.</p> : null}
          </div>
          </>
        )}
        {section === "opportunities" && selectedOpportunity && (
          <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !opportunityBusy) setSelectedOpportunity(null); }}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div role="dialog" aria-modal="true" aria-labelledby="admin-opportunity-title"
              style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "85vh", overflowY: "auto", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div><small style={{ color: "#2563eb", fontWeight: 700 }}>OPPORTUNITY MANAGEMENT</small>
                  <h2 id="admin-opportunity-title">{selectedOpportunity.title}</h2><p>{selectedOpportunity.companyName}</p></div>
                <button type="button" disabled={opportunityBusy} onClick={() => setSelectedOpportunity(null)} style={{ padding: "10px 15px", border: "1px solid #cbd5e1", borderRadius: 8, background: "white", cursor: "pointer" }}>Close Popup</button>
              </div>
              {opportunityError && <p role="alert" style={{ color: "#b91c1c" }}>{opportunityError}</p>}
              {editingOpportunity ? (
                <form onSubmit={saveOpportunity} style={{ display: "grid", gap: 12 }}>
                  {[
                    ["title", "Title"], ["companyName", "Company"], ["jobRole", "Job Role"],
                    ["location", "Location"], ["applicationUrl", "Application URL"],
                    ["requiredSkills", "Required Skills (comma-separated)"], ["minimumCGPA", "Minimum CGPA"],
                    ["applicationDeadline", "Application Deadline"],
                  ].map(([key, label]) => (
                    <label key={key} style={{ display: "grid", gap: 5, fontWeight: 600 }}>{label}
                      <input required={["title", "companyName", "jobRole", "location", "applicationDeadline"].includes(key)}
                        type={key === "applicationDeadline" ? "date" : key === "minimumCGPA" ? "number" : "text"}
                        min={key === "minimumCGPA" ? 0 : undefined} max={key === "minimumCGPA" ? 10 : undefined}
                        step={key === "minimumCGPA" ? 0.1 : undefined}
                        value={opportunityForm[key] ?? ""}
                        onChange={event => setOpportunityForm(prev => ({ ...prev, [key]: event.target.value }))}
                        style={{ padding: 11, border: "1px solid #cbd5e1", borderRadius: 8 }} />
                    </label>
                  ))}
                  <label style={{ display: "grid", gap: 5, fontWeight: 600 }}>Description
                    <textarea required rows={4} value={opportunityForm.description} onChange={event => setOpportunityForm(prev => ({ ...prev, description: event.target.value }))} style={{ padding: 11, border: "1px solid #cbd5e1", borderRadius: 8 }} />
                  </label>
                  {[["opportunityType", "Type", ["Fresher Job", "Internship", "Campus", "Off-Campus"]], ["workMode", "Work Mode", ["On-site", "Remote", "Hybrid"]], ["status", "Status", ["Active", "Draft", "Closed"]]].map(([key, label, choices]) => (
                    <label key={key} style={{ display: "grid", gap: 5, fontWeight: 600 }}>{label}
                      <select value={opportunityForm[key]} onChange={event => setOpportunityForm(prev => ({ ...prev, [key]: event.target.value }))} style={{ padding: 11, border: "1px solid #cbd5e1", borderRadius: 8 }}>
                        {choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
                      </select>
                    </label>
                  ))}
                  <div style={{ display: "flex", gap: 10 }}><button type="submit" className="admin-primary-btn" disabled={opportunityBusy}>{opportunityBusy ? "Saving..." : "Save Changes"}</button>
                    <button type="button" disabled={opportunityBusy} onClick={() => setEditingOpportunity(false)}>Cancel</button></div>
                </form>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, margin: "20px 0" }}>
                    {[["Company", selectedOpportunity.companyName], ["Role", selectedOpportunity.jobRole], ["Type", selectedOpportunity.opportunityType], ["Location", selectedOpportunity.location], ["Work Mode", selectedOpportunity.workMode], ["Status", selectedOpportunity.applicationStatus || selectedOpportunity.status], ["Deadline", formatDate(selectedOpportunity.applicationDeadline)], ["Minimum CGPA", selectedOpportunity.minimumCGPA], ["Skills", (selectedOpportunity.requiredSkills || []).join(", ")]].map(([label, value]) => (
                      <div key={label}><small style={{ color: "#64748b" }}>{label}</small><div style={{ fontWeight: 600, marginTop: 5 }}>{value ?? "—"}</div></div>
                    ))}
                  </div>
                  <h3>Description</h3><p style={{ whiteSpace: "pre-wrap" }}>{selectedOpportunity.description || "—"}</p>
                  {selectedOpportunity.applicationUrl && <p><a href={selectedOpportunity.applicationUrl} target="_blank" rel="noopener noreferrer">Open application link</a></p>}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="button" className="admin-primary-btn" onClick={() => setEditingOpportunity(true)}>Edit Opportunity</button>
                    {selectedOpportunity.status !== "Closed" && <button type="button" disabled={opportunityBusy} onClick={closeOpportunity} style={{ padding: "10px 15px", border: "1px solid #dc2626", borderRadius: 8, color: "#b91c1c", background: "white", cursor: "pointer" }}>{opportunityBusy ? "Closing..." : "Close Opportunity"}</button>}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {section === "applications" && selectedApplication && (
          <div role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedApplication(null);
          }} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div role="dialog" aria-modal="true" aria-labelledby="admin-application-title"
              style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 650, maxHeight: "85vh", overflowY: "auto", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <small style={{ color: "#2563eb", fontWeight: 700 }}>APPLICATION DETAILS</small>
                  <h2 id="admin-application-title" style={{ margin: "8px 0" }}>
                    {selectedApplication.opportunity?.companyName || selectedApplication.telegramAnnouncement?.companyName || "Placement Application"}
                  </h2>
                  <p>{selectedApplication.opportunity?.jobRole || selectedApplication.opportunity?.title || selectedApplication.telegramAnnouncement?.jobRole || "Role not available"}</p>
                </div>
                <button type="button" onClick={() => setSelectedApplication(null)}
                  style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 14px", cursor: "pointer" }}>Close</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, padding: "20px 0", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
                {[
                  ["Student", selectedApplication.student?.name],
                  ["Email", selectedApplication.student?.email],
                  ["Current Stage", selectedApplication.currentStage],
                  ["Applied On", formatDate(selectedApplication.appliedAt)],
                  ["Next Round", formatDate(selectedApplication.nextRoundDate)],
                  ["Source", selectedApplication.telegramAnnouncement ? "Telegram" : "Placement Opportunity"],
                ].map(([label, value]) => (
                  <div key={label}><small style={{ color: "#64748b" }}>{label}</small><div style={{ marginTop: 5, fontWeight: 600, overflowWrap: "anywhere" }}>{value || "—"}</div></div>
                ))}
              </div>
              <h3 style={{ marginTop: 22 }}>Stage History</h3>
              {Array.isArray(selectedApplication.stageHistory) && selectedApplication.stageHistory.length > 0 ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {selectedApplication.stageHistory.map((entry, index) => (
                    <div key={entry._id || index} style={{ borderLeft: "3px solid #2563eb", paddingLeft: 14 }}>
                      <strong>{entry.stage || "Stage update"}</strong>
                      <div style={{ color: "#64748b", fontSize: 13 }}>{formatDate(entry.changedAt)}</div>
                      {entry.note && <p style={{ margin: "5px 0" }}>{entry.note}</p>}
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: "#64748b" }}>Stage history is not included in the current admin API response.</p>}
              {selectedApplication.notes && <><h3>Student Notes</h3><p style={{ whiteSpace: "pre-wrap" }}>{selectedApplication.notes}</p></>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
