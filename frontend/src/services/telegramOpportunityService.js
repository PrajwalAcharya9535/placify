
import axios from "axios";

const API_URL =
  "http://localhost:5000/api/student/telegram-opportunities";

function getAuthHeaders() {
  const token = localStorage.getItem("placifyToken");

  if (!token) {
    throw new Error("Student login required.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

// ========================================
// FETCH REAL TELEGRAM OPPORTUNITIES
// ========================================

export async function fetchTelegramOpportunities() {
  const response = await axios.get(API_URL, {
    headers: getAuthHeaders(),
  });

  return response.data;
}

// ========================================
// SAVE STUDENT OPPORTUNITY RESPONSE
// ========================================

export async function updateTelegramResponse(
  announcementId,
  action
) {
  const response = await axios.patch(
    `${API_URL}/${encodeURIComponent(
      announcementId
    )}/response`,
    { action },
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
}
