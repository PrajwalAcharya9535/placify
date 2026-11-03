
import axios from "axios";

const API_URL = "http://localhost:5000/api/student/placement-tracker";

function getAuthHeaders() {
  const token = localStorage.getItem("placifyToken");

  if (!token) {
    throw new Error("Student login required.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

// Get all tracked applications
export async function fetchPlacementApplications() {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders(),
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Get one application
export async function fetchPlacementApplicationById(applicationId) {
  try {
    const response = await axios.get(
      `${API_URL}/${encodeURIComponent(applicationId)}`,
      { headers: getAuthHeaders() }
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Add an opportunity to the tracker
export async function addPlacementApplication(opportunityId) {
  try {
    const response = await axios.post(
      `${API_URL}/${encodeURIComponent(opportunityId)}`,
      {},
      { headers: getAuthHeaders() }
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Update application stage
export async function updatePlacementApplicationStage(applicationId, data) {
  try {
    const response = await axios.patch(
      `${API_URL}/${encodeURIComponent(applicationId)}/stage`,
      data,
      { headers: getAuthHeaders() }
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Update application notes
export async function updatePlacementApplicationNotes(applicationId, notes) {
  try {
    const response = await axios.patch(
      `${API_URL}/${encodeURIComponent(applicationId)}/notes`,
      { notes },
      { headers: getAuthHeaders() }
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Update offer details
export async function updatePlacementApplicationOffer(applicationId, data) {
  try {
    const response = await axios.patch(
      `${API_URL}/${encodeURIComponent(applicationId)}/offer`,
      data,
      { headers: getAuthHeaders() }
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
