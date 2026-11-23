
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentLayout from "../../components/student/StudentLayout";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student/profile`;
const GOAL_API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student/goal`;

const emptyProfile = {
  phone: "",
  course: "MCA",
  college: "",
  graduationYear: "",
  cgpa: "",
  backlogs: 0,
  skills: "",
  location: "",
  bio: "",
};

export default function StudentProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyProfile);
  const [goal, setGoal] = useState({ targetRole: "", preferredSkills: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("placifyToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const { data } = await axios.get(API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profile = data.profile;

        setForm({
          phone: profile.phone || "",
          course: profile.course || "MCA",
          college: profile.college || "",
          graduationYear: profile.graduationYear ?? "",
          cgpa: profile.cgpa ?? "",
          backlogs: profile.backlogs ?? 0,
          skills: (profile.skills || []).join(", "),
          location: profile.location || "",
          bio: profile.bio || "",
        });
      } catch (err) {
        if (err.response?.status === 404) {
          // New student: no profile created yet.
        } else if ([401, 403].includes(err.response?.status)) {
          navigate("/login", { replace: true });
        } else {
          setError("Unable to load your profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    const token = localStorage.getItem("placifyToken");
    if (token) {
      axios.get(GOAL_API, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ data }) => {
        setGoal({
          targetRole: data.goal?.targetRole || "",
          preferredSkills: (data.goal?.preferredSkills || []).join(", "),
        });
      }).catch((err) => {
        if (err.response?.status !== 404) {
          console.error("Unable to load career goal", err);
        }
      });
    }
  }, [navigate]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const year = Number(form.graduationYear);
    const cgpa = Number(form.cgpa);
    const backlogs = Number(form.backlogs);

    if (
      (form.graduationYear && (!Number.isInteger(year) || year < 1900)) ||
      (form.cgpa !== "" && (cgpa < 0 || cgpa > 10)) ||
      !Number.isInteger(backlogs) ||
      backlogs < 0
    ) {
      setError("Please enter valid academic details.");
      return;
    }

    const token = localStorage.getItem("placifyToken");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setSaving(true);

    try {
      await axios.put(
        API,
        {
          ...form,
          graduationYear: form.graduationYear === "" ? null : year,
          cgpa: form.cgpa === "" ? null : cgpa,
          backlogs,
          skills: [
            ...new Set(
              form.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean)
            ),
          ],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (goal.targetRole.trim()) {
        await axios.put(GOAL_API, {
          targetRole: goal.targetRole.trim(),
          preferredSkills: [...new Set(goal.preferredSkills.split(",").map((s) => s.trim()).filter(Boolean))],
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setSuccess(goal.targetRole.trim() ? "Profile and career goal saved successfully." : "Profile saved successfully. Add a target role to generate a personalized roadmap.");
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const field = (label, name, type = "text", props = {}) => (
    <label className="placify-profile-field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={updateField}
        {...props}
      />
    </label>
  );

  return (
    <StudentLayout>
      <div className="placify-profile-page">
        <header className="placify-profile-header">
          <div>
            <span className="placify-profile-eyebrow">
              GETTING STARTED
            </span>
            <h1>Student Profile</h1>
            <p>
              Keep your academic details and skills updated
              for personalized placement preparation.
            </p>
          </div>
        </header>

        {loading ? (
          <p>Loading your profile...</p>
        ) : (
          <form onSubmit={saveProfile}>
            <section className="placify-profile-card">
              <h2>Academic Details</h2>
              <div className="placify-profile-grid">
                {field("Course", "course")}
                {field("College", "college")}
                {field("Graduation Year", "graduationYear", "number", {
                  min: 1900,
                  max: 2100,
                })}
                {field("CGPA (out of 10)", "cgpa", "number", {
                  min: 0,
                  max: 10,
                  step: 0.01,
                })}
                {field("Backlogs", "backlogs", "number", {
                  min: 0,
                  step: 1,
                })}
              </div>
            </section>

            <section className="placify-profile-card">
              <h2>Personal Details</h2>
              <div className="placify-profile-grid">
                {field("Phone", "phone", "tel")}
                {field("Location", "location")}
              </div>
              <label className="placify-profile-field">
                <span>About You</span>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={updateField}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell us about your career interests..."
                />
              </label>
            </section>

            <section className="placify-profile-card">
              <h2>Technical Skills</h2>
              <label className="placify-profile-field">
                <span>Skills (comma-separated)</span>
                <textarea
                  name="skills"
                  value={form.skills}
                  onChange={updateField}
                  rows={3}
                  placeholder="JavaScript, React, Node.js, MongoDB"
                />
              </label>
            </section>

            <section className="placify-profile-card">
              <h2>Career Goal</h2>
              <div className="placify-profile-grid">
                <label className="placify-profile-field">
                  <span>Target Role</span>
                  <input
                    value={goal.targetRole}
                    onChange={(e) => setGoal((prev) => ({ ...prev, targetRole: e.target.value }))}
                    placeholder="MERN Stack Developer"
                  />
                </label>
                <label className="placify-profile-field">
                  <span>Skills to Develop (comma-separated)</span>
                  <input
                    value={goal.preferredSkills}
                    onChange={(e) => setGoal((prev) => ({ ...prev, preferredSkills: e.target.value }))}
                    placeholder="TypeScript, Docker, AWS"
                  />
                </label>
              </div>
            </section>

            {error && (
              <p className="placify-profile-error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="placify-profile-success" role="status">
                {success}
              </p>
            )}

            <div className="placify-profile-actions">
              <button
                type="submit"
                disabled={saving}
                className="placify-profile-save"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                className="placify-profile-back"
                onClick={() => navigate("/student/dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .placify-profile-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px;
        }
        .placify-profile-header { margin-bottom: 28px; }
        .placify-profile-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #64748b;
        }
        .placify-profile-header h1 {
          margin: 8px 0;
          font-size: 30px;
        }
        .placify-profile-header p {
          color: #64748b;
          line-height: 1.6;
        }
        .placify-profile-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 26px;
          margin-bottom: 20px;
        }
        .placify-profile-card h2 {
          font-size: 18px;
          margin: 0 0 22px;
        }
        .placify-profile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }
        .placify-profile-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 600;
        }
        .placify-profile-field input,
        .placify-profile-field textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          font: inherit;
          font-weight: 400;
          background: #fff;
          color: #0f172a;
        }
        .placify-profile-field input:focus,
        .placify-profile-field textarea:focus {
          outline: 2px solid #93c5fd;
          border-color: #2563eb;
        }
        .placify-profile-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 24px 0;
        }
        .placify-profile-actions button {
          padding: 12px 22px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
        }
        .placify-profile-save {
          background: #2563eb;
          border: none;
          color: white;
        }
        .placify-profile-save:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .placify-profile-back {
          background: white;
          border: 1px solid #cbd5e1;
          color: #334155;
        }
        .placify-profile-error { color: #dc2626; }
        .placify-profile-success { color: #15803d; }
        @media (max-width: 640px) {
          .placify-profile-page { padding: 12px; }
          .placify-profile-grid { grid-template-columns: 1fr; }
          .placify-profile-card { padding: 18px; }
        }
      `}</style>
    </StudentLayout>
  );
}
