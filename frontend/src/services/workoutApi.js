import { apiRequest } from './apiClient';

/**
 * API Kế hoạch tập PT, Kết quả tập, Nhận xét HLV, Tiến độ cơ thể & Gợi ý bài tập AI
 * (COA-07, COA-08, COA-09, COA-10, MEM-20, MEM-21, MEM-22, MEM-23)
 */

export const getMyWorkoutProgress = () => apiRequest('/workout-progress/me');

export const getMemberWorkoutProgress = (memberId) =>
  apiRequest(`/workout-progress/member/${memberId}`);

export const createWorkoutPlan = (data) =>
  apiRequest('/workout-progress/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const createClassWorkoutPlan = (data) =>
  apiRequest('/workout-progress/class-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const recordBodyProgress = (data) =>
  apiRequest('/workout-progress/body-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
