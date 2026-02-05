import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// project imports
import ThemeCustomization from './theme/index.jsx';
import { SnackbarProvider, useSnackbar } from './contexts/SnackbarContext.jsx';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Auth pages
import AdminLoginPage from './pages/auth/AdminLoginPage';
import AdminProfilePage from './pages/auth/AdminProfilePage';
import SettingsPage from './pages/settings/SettingsPage';

// Dashboard pages
import DashboardDefault from './pages/dashboard/default';

// User management pages
import UserManagePage from './pages/user/UserManagePage';
import UserDetailPage from './pages/user/UserDetailPage';
import UserCreatePage from './pages/user/UserCreatePage';

// Admin management pages
import AdminManagePage from './pages/admin/AdminManagePage';
import AdminDetailPage from './pages/admin/AdminDetailPage';
import AdminCreatePage from './pages/admin/AdminCreatePage';

// Club management pages
import ClubListPage from './pages/clubs/ClubListPage';
import ClubDetailPage from './pages/clubs/ClubDetailPage';
import ClubCreatePage from './pages/clubs/ClubCreatePage';
import ClubEditPage from './pages/clubs/ClubEditPage';
import ClubNoticesPage from './pages/clubs/ClubNoticesPage';
import ClubNoticeCreatePage from './pages/clubs/ClubNoticeCreatePage';
import ClubNoticeEditPage from './pages/clubs/ClubNoticeEditPage';
import ClubRegulationsPage from './pages/clubs/ClubRegulationsPage';
import ClubRegulationCreatePage from './pages/clubs/ClubRegulationCreatePage';
import ClubRegulationEditPage from './pages/clubs/ClubRegulationEditPage';
import ClubFeesPage from './pages/clubs/ClubFeesPage';
import ClubApplicationsPage from './pages/clubs/ClubApplicationsPage';
import ClubApplicationDetailPage from './pages/clubs/ClubApplicationDetailPage';

// Rounding management pages
import RoundListPage from './pages/rounds/RoundListPage';
import RoundDetailPage from './pages/rounds/RoundDetailPage';
import RoundCreatePage from './pages/rounds/RoundCreatePage';
import RoundEditPage from './pages/rounds/RoundEditPage';
import RoundStatsPage from './pages/rounds/RoundStatsPage';
import RoundExpenseManagementPage from './pages/rounds/RoundExpenseManagementPage';
import RoundScoreManagementPage from './pages/rounds/RoundScoreManagementPage';
import RoundTeamManagementPage from './pages/rounds/RoundTeamManagementPage';

// Social management pages
import SocialListPage from './pages/socials/SocialListPage';
import SocialDetailPage from './pages/socials/SocialDetailPage';
import SocialCreatePage from './pages/socials/SocialCreatePage';
import SocialEditPage from './pages/socials/SocialEditPage';
import SocialExpenseManagementPage from './pages/socials/SocialExpenseManagementPage';

// Other pages
import NotificationsPage from './pages/notifications/NotificationsPage';
import PageNotFound from './pages/PageNotFound';

// Notice management pages
import NoticeListPage from './pages/notices/NoticeListPage';
import NoticeCreatePage from './pages/notices/NoticeCreatePage';
import NoticeDetailPage from './pages/notices/NoticeDetailPage';
import NoticeEditPage from './pages/notices/NoticeEditPage';

// FAQ management pages
import FAQListPage from './pages/faq/FAQListPage';
import FAQCreatePage from './pages/faq/FAQCreatePage';
import FAQDetailPage from './pages/faq/FAQDetailPage';
import FAQEditPage from './pages/faq/FAQEditPage';

// Inquiry management pages
import InquiryListPage from './pages/inquiries/InquiryListPage';
import InquiryDetailPage from './pages/inquiries/InquiryDetailPage';

// Layout
import DashboardLayout from './layout/Dashboard';

// Snackbar 전역 설정 컴포넌트
const SnackbarGlobalSetup = () => {
  const { showSnackbar } = useSnackbar();
  
  useEffect(() => {
    // 전역 함수를 설정하여 API 인터셉터에서 사용할 수 있도록 함
    window.showSnackbar = showSnackbar;
    
    return () => {
      // 컴포넌트 언마운트 시 정리
      delete window.showSnackbar;
    };
  }, [showSnackbar]);
  
  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeCustomization>
        <SnackbarProvider>
          <SnackbarGlobalSetup />
          <Routes>
          {/* Auth routes */}
          <Route path="/auth/login" element={<AdminLoginPage />} />

          {/* Dashboard routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardDefault />} />

            {/* User management */}
            <Route path="users" element={<UserManagePage />} />
            <Route path="users/create" element={<UserCreatePage />} />
            <Route path="users/:id" element={<UserDetailPage />} />

            {/* Admin management */}
            <Route path="admins" element={<AdminManagePage />} />
            <Route path="admins/create" element={<AdminCreatePage />} />
            <Route path="admins/:id" element={<AdminDetailPage />} />

            {/* Club management */}
            <Route path="clubs" element={<ClubListPage />} />
            <Route path="clubs/create" element={<ClubCreatePage />} />
            <Route path="clubs/:id" element={<ClubDetailPage />} />
            <Route path="clubs/:id/edit" element={<ClubEditPage />} />
            <Route path="clubs/:id/notices" element={<ClubNoticesPage />} />
            <Route path="clubs/:id/notices/create" element={<ClubNoticeCreatePage />} />
            <Route path="clubs/:id/notices/:noticeId/edit" element={<ClubNoticeEditPage />} />
            <Route path="clubs/:id/regulations" element={<ClubRegulationsPage />} />
            <Route path="clubs/:id/regulations/create" element={<ClubRegulationCreatePage />} />
            <Route path="clubs/:id/regulations/:regulationId/edit" element={<ClubRegulationEditPage />} />
            <Route path="clubs/:id/fees" element={<ClubFeesPage />} />
            <Route path="clubs/applications" element={<ClubApplicationsPage />} />
            <Route path="clubs/applications/:id" element={<ClubApplicationDetailPage />} />

            {/* /meetings 접근 시 라운딩으로 리다이렉트 */}
            <Route path="meetings" element={<Navigate to="/rounds" replace />} />
            <Route path="meetings/*" element={<Navigate to="/rounds" replace />} />

            {/* Rounding management */}
            <Route path="rounds" element={<RoundListPage />} />
            <Route path="rounds/create" element={<RoundCreatePage />} />
            <Route path="rounds/:id" element={<RoundDetailPage />} />
            <Route path="rounds/:id/edit" element={<RoundEditPage />} />
            <Route path="rounds/:id/stats" element={<RoundStatsPage />} />
            <Route path="rounds/:id/expenses" element={<RoundExpenseManagementPage />} />
            <Route path="rounds/:id/scores" element={<RoundScoreManagementPage />} />
            <Route path="rounds/:id/teams" element={<RoundTeamManagementPage />} />

            {/* Social management */}
            <Route path="socials" element={<SocialListPage />} />
            <Route path="socials/create" element={<SocialCreatePage />} />
            <Route path="socials/:id" element={<SocialDetailPage />} />
            <Route path="socials/:id/edit" element={<SocialEditPage />} />
            <Route path="socials/:id/expenses" element={<SocialExpenseManagementPage />} />

            {/* Notice management */}
            <Route path="notices" element={<NoticeListPage />} />
            <Route path="notices/create" element={<NoticeCreatePage />} />
            <Route path="notices/:id" element={<NoticeDetailPage />} />
            <Route path="notices/:id/edit" element={<NoticeEditPage />} />

            {/* FAQ management */}
            <Route path="faq" element={<FAQListPage />} />
            <Route path="faq/new" element={<FAQCreatePage />} />
            <Route path="faq/:id" element={<FAQDetailPage />} />
            <Route path="faq/:id/edit" element={<FAQEditPage />} />

            {/* Inquiry management */}
            <Route path="inquiries" element={<InquiryListPage />} />
            <Route path="inquiries/:id" element={<InquiryDetailPage />} />

            {/* Other pages */}
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* 404 */}
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
        </SnackbarProvider>
      </ThemeCustomization>
    </QueryClientProvider>
  );
}

export default App;
