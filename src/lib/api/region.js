import apiClient from './apiClient.js';

/**
 * 지역(시도/군구) API
 */
export const regionApi = {
  /** 시도 목록 조회 - [{code, name}] */
  getSidoList: async () => {
    const response = await apiClient.get('/v1/sido-list');
    return response.data;
  },

  /** 군구 목록 조회 - [{code, name}] */
  getGunguList: async (sidoCode) => {
    const response = await apiClient.get('/v1/gungu-list', {
      params: { sido_code: sidoCode },
    });
    return response.data;
  },
};
