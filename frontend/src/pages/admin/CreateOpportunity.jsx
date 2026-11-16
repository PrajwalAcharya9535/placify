
import { useState } from "react";
import axios from "axios";

const initialForm = {
  title: "",
  companyName: "",
  description: "",
  opportunityType: "Fresher Job",
  jobRole: "",
  location: "",
  workMode: "On-site",
  applicationDeadline: "",
  applicationUrl: "",
  requiredSkills: "",
  minimumCGPA: "",
};

export default function CreateOpportunity({ onCreated, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const token = localStorage.getItem("placifyToken");

      const payload = {
        ...form,
        requiredSkills: form.requiredSkills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        minimumCGPA: Number(form.minimumCGPA) || 0,
        applicationDeadline: new Date(
          `${form.applicationDeadline}T23:59:59`
        ).toISOString(),
      };

      await axios.post(
        "http://localhost:5000/api/admin/opportunities",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Placement opportunity created successfully.");
      setForm(initialForm);

      if (onCreated) onCreated();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create opportunity."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Create Placement Opportunity</h3>
          <p>Publish a new opportunity for students.</p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <p role="status">{success}</p>}

      <form onSubmit={submit} className="admin-create-form">
        {[
          ["title", "Opportunity Title", "text"],
          ["companyName", "Company Name", "text"],
          ["jobRole", "Job Role", "text"],
          ["location", "Location", "text"],
          ["applicationDeadline", "Application Deadline", "date"],
        ].map(([name, label, type]) => (
          <label key={name}>
            {label} *
            <input
              type={type}
              name={name}
              value={form[name]}
              onChange={update}
              required
            />
          </label>
        ))}

        <label>
          Opportunity Type *
          <select
            name="opportunityType"
            value={form.opportunityType}
            onChange={update}
            required
          >
            <option value="Fresher Job">Fresher Job</option>
            <option value="Internship">Internship</option>
            <option value="Campus">Campus</option>
            <option value="Off-Campus">Off-Campus</option>
          </select>
        </label>

        <label>
          Work Mode
          <select
            name="workMode"
            value={form.workMode}
            onChange={update}
          >
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
          </select>
        </label>

        <label>
          Minimum CGPA
          <input
            type="number"
            name="minimumCGPA"
            min="0"
            max="10"
            step="0.1"
            value={form.minimumCGPA}
            onChange={update}
          />
        </label>

        <label>
          Required Skills (comma separated)
          <input
            name="requiredSkills"
            value={form.requiredSkills}
            onChange={update}
            placeholder="React, JavaScript, MongoDB"
          />
        </label>

        <label>
          Application URL
          <input
            type="url"
            name="applicationUrl"
            value={form.applicationUrl}
            onChange={update}
            placeholder="https://company.com/careers"
          />
        </label>

        <label className="admin-form-full">
          Description *
          <textarea
            name="description"
            rows="5"
            value={form.description}
            onChange={update}
            required
          />
        </label>

        <div className="admin-form-actions">
          {onCancel && (
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={saving}>
            {saving ? "Publishing..." : "Publish Opportunity"}
          </button>
        </div>
      </form>
    </div>
  );
}
