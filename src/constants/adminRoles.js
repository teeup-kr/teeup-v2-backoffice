/**
 * 백오피스 관리자 역할 상수
 * 역할별 접근 가능 메뉴 ID 매핑
 */
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CLUB_ADMIN: 'CLUB_ADMIN',
  MEETING_ADMIN: 'MEETING_ADMIN',
  USER_ADMIN: 'USER_ADMIN',
  CONTENT_ADMIN: 'CONTENT_ADMIN',
  SUPPORT_ADMIN: 'SUPPORT_ADMIN',
};

export const ADMIN_ROLE_LABELS = {
  [ADMIN_ROLES.SUPER_ADMIN]: '슈퍼어드민',
  [ADMIN_ROLES.CLUB_ADMIN]: '클럽 관리',
  [ADMIN_ROLES.MEETING_ADMIN]: '모임 관리',
  [ADMIN_ROLES.USER_ADMIN]: '사용자 관리',
  [ADMIN_ROLES.CONTENT_ADMIN]: '콘텐츠 관리',
  [ADMIN_ROLES.SUPPORT_ADMIN]: '고객지원',
};

/** 역할별 접근 가능한 메뉴 ID (그룹 id, 메뉴 id, url 기반) */
export const ROLE_MENU_ACCESS = {
  [ADMIN_ROLES.SUPER_ADMIN]: ['*'],
  [ADMIN_ROLES.CLUB_ADMIN]: ['dashboard', 'clubs', 'club-list'],
  [ADMIN_ROLES.MEETING_ADMIN]: ['dashboard', 'meetings', 'rounds-list', 'socials-list'],
  [ADMIN_ROLES.USER_ADMIN]: ['dashboard', 'users', 'user-list'],
  [ADMIN_ROLES.CONTENT_ADMIN]: ['dashboard', 'support', 'notice-list', 'faq-list', 'system', 'settings'],
  [ADMIN_ROLES.SUPPORT_ADMIN]: ['dashboard', 'support', 'inquiry-list'],
};

/** 메뉴/그룹이 역할에 접근 가능한지 */
export function canAccessMenu(role, menuId) {
  if (!role) return false;
  const allowed = ROLE_MENU_ACCESS[role] || [];
  if (allowed.includes('*')) return true;
  return allowed.includes(menuId);
}

/** 그룹 아이템 필터 - 접근 가능한 children만 반환, 없으면 null */
export function filterMenuByRole(role, menuItems) {
  if (!role) return [];
  const allowed = ROLE_MENU_ACCESS[role] || [];
  if (allowed.includes('*')) return menuItems;

  return menuItems.filter((item) => {
    if (item.type === 'item') {
      return canAccessMenu(role, item.id);
    }
    if (item.type === 'group' && item.children) {
      const filteredChildren = item.children.filter((c) => canAccessMenu(role, c.id));
      return filteredChildren.length > 0;
    }
    return false;
  }).map((item) => {
    if (item.type === 'group' && item.children) {
      const filteredChildren = item.children.filter((c) => canAccessMenu(role, c.id));
      return { ...item, children: filteredChildren };
    }
    return item;
  });
}
