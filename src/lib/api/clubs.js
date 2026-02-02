import apiClient from './apiClient.js';

/**
 * 관리자용 클럽 관련 API 클라이언트
 * old-ts-version/apps/admin-ts/src/lib/clubsApi.ts를 JSX로 변환
 */

// ===== 타입 정의 (JSDoc) =====

/**
 * @typedef {Object} Club
 * @property {string} id - 클럽 ID
 * @property {string} display_id - CLUB-48219 형태의 표시용 ID
 * @property {string} name - 클럽명
 * @property {string} description - 클럽 설명
 * @property {'REGULAR'|'IRREGULAR'} type - 클럽 타입
 * @property {number} member_count - 멤버 수
 * @property {string} location - 위치
 * @property {string} contact_info - 연락처
 * @property {string} [additional_info] - 추가 정보
 * @property {string} [attachment_file] - 첨부 파일
 * @property {'PENDING'|'APPROVED'|'REJECTED'|'CANCELED'} status - 클럽 상태
 * @property {string} created_at - 생성일
 * @property {string} updated_at - 수정일
 * @property {string} representative_id - 대표자 ID
 * @property {string} representative_name - 대표자명
 * @property {string} representative_email - 대표자 이메일
 */

/**
 * @typedef {Object} ClubApplication
 * @property {string} id - 신청 ID
 * @property {string} name - 클럽명
 * @property {string} description - 클럽 설명
 * @property {'REGULAR'|'IRREGULAR'} type - 클럽 타입
 * @property {number} member_count - 멤버 수
 * @property {string} location - 위치
 * @property {string} contact_info - 연락처
 * @property {string} [additional_info] - 추가 정보
 * @property {string} attachment_file - 첨부 파일
 * @property {'PENDING'|'APPROVED'|'REJECTED'|'CANCELED'} status - 신청 상태
 * @property {string} created_at - 신청일
 * @property {string} updated_at - 수정일
 * @property {string} applicant_id - 신청자 ID
 * @property {string} applicant_name - 신청자명
 * @property {string} applicant_email - 신청자 이메일
 * @property {string} [rejection_reason] - 거절 사유
 */

/**
 * @typedef {Object} ClubMember
 * @property {string} id - 멤버 ID
 * @property {string} club_id - 클럽 ID
 * @property {string} user_id - 사용자 ID
 * @property {'LEADER'|'MANAGER'|'MEMBER'} role - 역할
 * @property {'PENDING'|'APPROVED'|'REJECTED'} status - 멤버십 상태
 * @property {string} [term_start] - 임기 시작일
 * @property {string} [term_end] - 임기 종료일
 * @property {string} created_at - 가입일
 * @property {string} updated_at - 수정일
 * @property {string} user_nickname - 사용자 닉네임
 * @property {string} [user_realname] - 사용자 실명
 * @property {string} [user_email] - 사용자 이메일
 */

/**
 * @typedef {Object} ClubMembersResponse
 * @property {ClubMember[]} members - 멤버 목록
 * @property {number} total_members - 총 멤버 수
 */

/**
 * @typedef {Object} ClubCreateRequest
 * @property {string} name - 클럽명
 * @property {string} description - 클럽 설명
 * @property {'REGULAR'|'IRREGULAR'} type - 클럽 타입
 * @property {number} member_count - 멤버 수
 * @property {string} location - 위치
 * @property {string} contact_info - 연락처
 * @property {string} [additional_info] - 추가 정보
 * @property {string} [attachment_file] - 첨부 파일
 * @property {string} representative_id - 대표자 ID
 */

/**
 * @typedef {Object} ClubUpdateRequest
 * @property {string} [name] - 클럽명
 * @property {string} [description] - 클럽 설명
 * @property {'REGULAR'|'IRREGULAR'} [type] - 클럽 타입
 * @property {number} [member_count] - 멤버 수
 * @property {string} [location] - 위치
 * @property {string} [contact_info] - 연락처
 * @property {string} [additional_info] - 추가 정보
 * @property {string} [attachment_file] - 첨부 파일
 */

/**
 * @typedef {Object} ClubApplicationApprovalRequest
 * @property {'APPROVED'|'REJECTED'} status - 승인 상태
 * @property {string} [admin_comment] - 관리자 코멘트
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {any[]} data - 데이터 목록
 * @property {number} total - 총 개수
 * @property {number} page - 현재 페이지
 * @property {number} limit - 페이지당 개수
 * @property {number} total_pages - 총 페이지 수
 */

/**
 * @typedef {Object} MessageResponse
 * @property {string} message - 메시지
 * @property {boolean} success - 성공 여부
 */

// ===== 클럽 API 함수들 =====

export const clubsApi = {
  // ===== 클럽 신청 관리 =====

  /**
   * 클럽 신청 목록 조회 (관리자용)
   * @param {Object} params - 쿼리 파라미터
   * @param {number} [params.page] - 페이지 번호
   * @param {number} [params.limit] - 페이지당 개수
   * @param {'PENDING'|'APPROVED'|'REJECTED'|'CANCELED'} [params.status_filter] - 상태 필터
   * @param {string} [params.search] - 검색어
   * @returns {Promise<PaginatedResponse<ClubApplication>>}
   */
  getClubApplications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`/v1/admin/clubs/applications?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 클럽 신청 상세 조회 (관리자용)
   * @param {string} applicationId - 신청 ID
   * @returns {Promise<ClubApplication>}
   */
  getClubApplication: async (applicationId) => {
    const response = await apiClient.get(`/v1/admin/clubs/applications/${applicationId}`);
    return response.data;
  },

  /**
   * 클럽 신청 승인/거절 처리 (관리자용)
   * @param {string} applicationId - 신청 ID
   * @param {ClubApplicationApprovalRequest} approvalData - 승인 데이터
   * @returns {Promise<MessageResponse>}
   */
  approveClubApplication: async (applicationId, approvalData) => {
    const response = await apiClient.put(`/v1/admin/clubs/applications/${applicationId}/process`, approvalData);
    return response.data;
  },

  // ===== 클럽 관리 =====

  /**
   * 클럽 목록 조회 (관리자용)
   * @param {Object} params - 쿼리 파라미터
   * @param {number} [params.page] - 페이지 번호
   * @param {number} [params.limit] - 페이지당 개수
   * @param {'PENDING'|'APPROVED'|'REJECTED'|'CANCELED'} [params.status_filter] - 상태 필터
   * @param {string} [params.search] - 검색어
   * @returns {Promise<PaginatedResponse<Club>>}
   */
  getClubs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`/v1/admin/clubs?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * 클럽 상세 조회 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<Club>}
   */
  getClub: async (clubId) => {
    const response = await apiClient.get(`/v1/admin/clubs/${clubId}`);
    return response.data;
  },

  /**
   * 클럽 생성 (관리자용)
   * @param {ClubCreateRequest} clubData - 클럽 데이터
   * @returns {Promise<Club>}
   */
  createClub: async (clubData) => {
    const response = await apiClient.post('/v1/admin/clubs', clubData);
    return response.data;
  },

  /**
   * 클럽 수정 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @param {ClubUpdateRequest} clubData - 수정할 클럽 데이터
   * @returns {Promise<Club>}
   */
  updateClub: async (clubId, clubData) => {
    const response = await apiClient.put(`/v1/admin/clubs/${clubId}`, clubData);
    return response.data;
  },

  /**
   * 클럽 상태 변경 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @param {Object} statusData - 상태 변경 데이터
   * @param {'ACTIVE'|'INACTIVE'} statusData.status - 변경할 상태
   * @param {string} [statusData.reason] - 변경 사유
   * @returns {Promise<Club>}
   */
  updateClubStatus: async (clubId, statusData) => {
    const response = await apiClient.put(`/v1/admin/clubs/${clubId}`, {
      status: statusData.status,
      ...(statusData.reason && { additional_info: statusData.reason })
    });
    return response.data;
  },

  /**
   * 클럽 삭제 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<MessageResponse>}
   */
  deleteClub: async (clubId) => {
    const response = await apiClient.delete(`/v1/admin/clubs/${clubId}`);
    return response.data;
  },

  /**
   * 클럽 승인 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<MessageResponse>}
   */
  approveClub: async (clubId) => {
    const response = await apiClient.put(`/v1/admin/clubs/${clubId}/approve`);
    return response.data;
  },

  /**
   * 클럽 거절 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @param {Object} rejectionData - 거절 데이터
   * @param {string} rejectionData.rejection_reason - 거절 사유
   * @returns {Promise<MessageResponse>}
   */
  rejectClub: async (clubId, rejectionData) => {
    const response = await apiClient.put(`/v1/admin/clubs/${clubId}/reject`, rejectionData);
    return response.data;
  },

  // ===== 클럽 멤버 관리 =====

  /**
   * 클럽 멤버 목록 조회 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<ClubMembersResponse>}
   */
  getClubMembers: async (clubId) => {
    const response = await apiClient.get(`/v1/admin/clubs/${clubId}/members`);
    return response.data;
  },

  /**
   * 클럽 가입 대기자 목록 조회 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @returns {Promise<{club_id: string, club_name: string, pending_members: any[], total_pending: number}>}
   */
  getClubPendingMembers: async (clubId) => {
    const response = await apiClient.get(`/v1/admin/clubs/${clubId}/pending-members`);
    return response.data;
  },

  /**
   * 클럽 가입 승인 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<{message: string, membership_id: string, user_id: string, status: string}>}
   */
  approveClubMembership: async (clubId, userId) => {
    const response = await apiClient.put(`/v1/admin/clubs/${clubId}/members/${userId}/approve`);
    return response.data;
  },

  /**
   * 클럽 가입 거절 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<{message: string, user_id: string}>}
   */
  rejectClubMembership: async (clubId, userId) => {
    const response = await apiClient.put(`/v1/admin/clubs/${clubId}/members/${userId}/reject`);
    return response.data;
  },

  /**
   * 클럽 멤버 추가 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @param {'LEADER'|'MANAGER'|'MEMBER'} [role='MEMBER'] - 역할
   * @returns {Promise<{message: string, membership_id: string, user_id: string, role: string, status: string}>}
   */
  addClubMember: async (clubId, userId, role = 'MEMBER') => {
    const response = await apiClient.post(`/v1/admin/clubs/${clubId}/members`, null, {
      params: { user_id: userId, role }
    });
    return response.data;
  },

  /**
   * 클럽 멤버 역할 변경 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @param {'LEADER'|'MANAGER'|'MEMBER'} newRole - 새로운 역할
   * @returns {Promise<MessageResponse>}
   */
  updateMemberRole: async (clubId, userId, newRole) => {
    const response = await apiClient.put(`/v1/admin/clubs/${clubId}/members/${userId}/role`, { 
      new_role: newRole 
    });
    return response.data;
  },

  /**
   * 클럽 멤버 내보내기 (관리자용)
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<MessageResponse>}
   */
  removeClubMember: async (clubId, userId) => {
    const response = await apiClient.delete(`/v1/admin/clubs/${clubId}/members/${userId}`);
    return response.data;
  },

  // ===== 멤버십 관리 (새로운 API) =====

  /**
   * 멤버십 승인 (새로운 API)
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<{message: string}>}
   */
  approveMembershipNew: async (clubId, userId) => {
    const response = await apiClient.post(`/v1/admin/clubs/${clubId}/members/${userId}/approve`);
    return response.data;
  },

  /**
   * 멤버십 거절 (새로운 API)
   * @param {string} clubId - 클럽 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<{message: string}>}
   */
  rejectMembershipNew: async (clubId, userId) => {
    const response = await apiClient.post(`/v1/admin/clubs/${clubId}/members/${userId}/reject`);
    return response.data;
  },

  // ===== 파일 업로드 =====

  /**
   * 파일 업로드 (관리자용)
   * @param {File} file - 업로드할 파일
   * @returns {Promise<{success: boolean, message: string, filename: string, original_filename: string, file_size: number, upload_path: string}>}
   */
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/v1/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default clubsApi;