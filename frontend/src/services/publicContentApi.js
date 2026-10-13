const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
  .replace(/\/$/, '');

async function fetchCollection(collection) {
  const response = await fetch(`${API_BASE_URL}/public/content/${collection}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Không thể tải dữ liệu ${collection}.`);
  }
  return response.json();
}

export const getPublicSports = () => fetchCollection('sports');
export const getPublicFacilities = () => fetchCollection('facilities');
