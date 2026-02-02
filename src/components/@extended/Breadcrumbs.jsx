import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// material-ui
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';

// project imports
import MainCard from '../MainCard';
import { adminUsersApi } from '../../lib/api/admin';

// assets
import { MdBusiness as ApartmentOutlined, MdHome as HomeOutlined, MdHome as HomeFilled } from 'react-icons/md';

export default function Breadcrumbs({
  card = false,
  custom = false,
  divider = false,
  heading,
  icon,
  icons,
  links,
  maxItems,
  rightAlign,
  separator,
  title = true,
  titleBottom = true,
  sx,
  ...others
}) {
  const theme = useTheme();
  const location = useLocation();

  const [main, setMain] = useState();
  const [item, setItem] = useState();
  
  // 사용자 ID 추출 (/users/:id 패턴 감지)
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isUserDetailPage = pathSegments.length === 2 && pathSegments[0] === 'users' && pathSegments[1] !== 'create';
  const userId = isUserDetailPage ? pathSegments[1] : null;
  
  // 사용자 데이터 조회
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminUsersApi.getUser(userId),
    enabled: !!userId,
  });

  const iconSX = {
    marginRight: theme.spacing(0.75),
    marginLeft: 0,
    width: '1rem',
    height: '1rem',
    color: theme.palette.secondary.main
  };

  let customLocation = location.pathname;

  // only used for component demo breadcrumbs
  if (customLocation.includes('/components-overview/breadcrumbs')) {
    customLocation = '/apps/customer/customer-card';
  }

  useEffect(() => {
    // Path to Korean mapping
    const pathToKorean = {
      'dashboard': '대시보드',
      'users': '사용자 관리',
      'admins': '관리자 관리',
      'clubs': '클럽 관리',
      'applications': '신청 관리',
      'rounds': '라운딩 관리',
      'socials': '소셜 모임 관리',
      'meetings': '모임 관리',
      'settings': '설정',
      'notifications': '알림 관리',
      'terms': '약관 관리'
    };

    const pathSegments = customLocation.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const mainSegment = pathSegments[0];
      const lastSegment = pathSegments[pathSegments.length - 1];
      
      // Set main category
      setMain({ 
        title: pathToKorean[mainSegment] || mainSegment, 
        type: 'group',
        url: `/${mainSegment}`
      });
      
      // Set current page (avoid duplication)
      if (pathSegments.length > 1 && lastSegment !== mainSegment) {
        // 클럽 상세 페이지인 경우 (clubs/{id} 패턴 또는 clubs/applications/{id} 패턴)
        let itemTitle = pathToKorean[lastSegment] || lastSegment;
        
        // 특수 경로 매핑
        if (lastSegment === 'edit') {
          itemTitle = '수정';
        }
        else if (lastSegment === 'create') {
          itemTitle = '생성';
        }
        
        // 사용자 상세 페이지인 경우 (/users/:id 패턴)
        if (mainSegment === 'users' && pathSegments.length === 2 && lastSegment !== 'create') {
          itemTitle = '사용자 상세';
        }
        // 관리자 관련 페이지
        if (mainSegment === 'admins') {
          if (lastSegment === 'create') itemTitle = '관리자 추가';
          else if (pathSegments.length === 2) itemTitle = '관리자 상세';
        }
        
        if (mainSegment === 'clubs') {
          // /clubs/create 패턴이면 '클럽 생성'으로 표시
          if (pathSegments.length === 2 && lastSegment === 'create') {
            itemTitle = '클럽 생성';
          }
          // /clubs/{id} 패턴이면 '클럽 상세'로 표시
          else if (pathSegments.length === 2) {
            itemTitle = '클럽 상세';
          }
          // /clubs/applications/{id} 패턴이면 '클럽 상세'로 표시
          else if (pathSegments.length === 3 && pathSegments[1] === 'applications') {
            itemTitle = '클럽 상세';
          }
          // /clubs/{id}/edit 패턴이면 '클럽 수정'으로 표시
          else if (pathSegments.length === 3 && pathSegments[1] !== 'applications' && lastSegment === 'edit') {
            itemTitle = '클럽 수정';
          }
          // /clubs/{id}/notices, /clubs/{id}/notices/create, /clubs/{id}/notices/{id}/edit
          else if (pathSegments[2] === 'notices') {
            itemTitle = lastSegment === 'create' ? '공지 추가' : lastSegment === 'edit' ? '공지 수정' : '공지사항';
          }
          // /clubs/{id}/regulations
          else if (pathSegments[2] === 'regulations') {
            itemTitle = lastSegment === 'create' ? '규정 추가' : lastSegment === 'edit' ? '규정 수정' : '규정';
          }
          // /clubs/{id}/fees
          else if (pathSegments[2] === 'fees') {
            itemTitle = '회비';
          }
        }
        
        setItem({ 
          title: itemTitle,
          type: 'item',
          url: customLocation
        });
      } else {
        // For single segment paths like /dashboard, don't set item to avoid duplication
        setItem(null);
      }
    }
  }, [customLocation]);

  // item separator
  const SeparatorIcon = separator;
  const separatorIcon = separator ? <SeparatorIcon style={{ fontSize: '0.75rem', marginTop: 2 }} /> : '/';

  let mainContent;
  let itemContent;
  let breadcrumbContent = <Typography />;
  let itemTitle = '';
  let CollapseIcon;
  let ItemIcon;

  // collapse item
  if (main && main.type === 'group') {
    CollapseIcon = main.icon ? main.icon : ApartmentOutlined;
    mainContent = (
      <Typography
        {...(main.url && { component: Link, to: main.url })}
        variant={window.location.pathname === main.url ? 'subtitle1' : 'h6'}
        sx={{ textDecoration: 'none' }}
        color={window.location.pathname === main.url ? 'text.primary' : 'text.secondary'}
      >
        {icons && <CollapseIcon style={iconSX} />}
        {main?.title}
      </Typography>
    );

    if (!!custom) {
      breadcrumbContent = (
        <MainCard
          border={card}
          sx={card === false ? { mb: 3, bgcolor: 'inherit', backgroundImage: 'none', ...sx } : { mb: 3, ...sx }}
          {...others}
          content={card}
          shadow="none"
        >
          <Grid
            container
            direction={rightAlign ? 'row' : 'column'}
            justifyContent={rightAlign ? 'space-between' : 'flex-start'}
            alignItems={rightAlign ? 'center' : 'flex-start'}
            spacing={1}
          >
            <Grid>
              <MuiBreadcrumbs aria-label="breadcrumb" maxItems={maxItems || 8} separator={separatorIcon}>
                <Typography component={Link} to="/" color="text.secondary" variant="h6" sx={{ textDecoration: 'none' }}>
                  {icons && <HomeOutlined style={iconSX} />}
                  {icon && !icons && <HomeFilled style={{ ...iconSX, marginRight: 0 }} />}
                  {(!icon || icons) && '홈'}
                </Typography>
                {mainContent}
              </MuiBreadcrumbs>
            </Grid>
            {title && titleBottom && (
              <Grid sx={{ mt: card === false ? 0.25 : 1 }}>
                <Typography variant="h2">{main.title}</Typography>
              </Grid>
            )}
          </Grid>
          {card === false && divider !== false && <Divider sx={{ mt: 2 }} />}
        </MainCard>
      );
    }
  }

  // items
  if ((item && item.type === 'item') || (item?.type === 'group' && item?.url) || custom) {
    // Breadcrumb item은 item?.title을 그대로 사용 (사용자 상세 페이지는 '사용자 상세')
    itemTitle = item?.title;

    ItemIcon = item?.icon ? item.icon : ApartmentOutlined;
    itemContent = (
      <Typography variant="subtitle1" color="text.primary">
        {icons && <ItemIcon style={iconSX} />}
        {itemTitle}
      </Typography>
    );

    let tempContent = (
      <MuiBreadcrumbs aria-label="breadcrumb" maxItems={maxItems || 8} separator={separatorIcon}>
        <Typography component={Link} to="/" color="text.secondary" variant="h6" sx={{ textDecoration: 'none' }}>
          {icons && <HomeOutlined style={iconSX} />}
          {icon && !icons && <HomeFilled style={{ ...iconSX, marginRight: 0 }} />}
          {(!icon || icons) && '홈'}
        </Typography>
        {mainContent}
        {itemContent}
      </MuiBreadcrumbs>
    );

    if (custom && links && links?.length > 0) {
      tempContent = (
        <MuiBreadcrumbs aria-label="breadcrumb" maxItems={maxItems || 8} separator={separatorIcon}>
          {links?.map((link, index) => {
            CollapseIcon = link.icon ? link.icon : ApartmentOutlined;

            return (
              <Typography
                key={index}
                {...(link.to && { component: Link, to: link.to })}
                variant={!link.to ? 'subtitle1' : 'h6'}
                sx={{ textDecoration: 'none' }}
                color={!link.to ? 'text.primary' : 'text.secondary'}
              >
                {link.icon && <CollapseIcon style={iconSX} />}
                {link.title}
              </Typography>
            );
          })}
        </MuiBreadcrumbs>
      );
    }

    // main
    if (item?.breadcrumbs !== false || custom) {
      // 페이지 제목 계산 (사용자 상세 페이지인 경우 nickname(realname) 형태)
      let pageTitle = custom ? heading : item?.title;
      if (isUserDetailPage) {
        if (userData) {
          const nickname = userData.nickname || '';
          const realname = userData.realname || '';
          pageTitle = realname ? `${nickname}(${realname})` : `${nickname}()`;
        } else {
          pageTitle = userId || item?.title;
        }
      }
      
      breadcrumbContent = (
        <MainCard
          border={card}
          sx={card === false ? { mb: 3, bgcolor: 'inherit', backgroundImage: 'none', ...sx } : { mb: 3, ...sx }}
          {...others}
          content={card}
          shadow="none"
        >
          <Grid
            container
            direction={rightAlign ? 'row' : 'column'}
            justifyContent={rightAlign ? 'space-between' : 'flex-start'}
            alignItems={rightAlign ? 'center' : 'flex-start'}
            spacing={1}
          >
            {title && !titleBottom && (
              <Grid>
                <Typography variant="h2">{pageTitle}</Typography>
              </Grid>
            )}
            <Grid>{tempContent}</Grid>
            {title && titleBottom && (
              <Grid sx={{ mt: card === false ? 0.25 : 1 }}>
                <Typography variant="h2">{pageTitle}</Typography>
              </Grid>
            )}
          </Grid>
          {card === false && divider !== false && <Divider sx={{ mt: 2 }} />}
        </MainCard>
      );
    }
  }

  return breadcrumbContent;
}

Breadcrumbs.propTypes = {
  card: PropTypes.bool,
  custom: PropTypes.bool,
  divider: PropTypes.bool,
  heading: PropTypes.string,
  icon: PropTypes.bool,
  icons: PropTypes.bool,
  links: PropTypes.array,
  maxItems: PropTypes.number,
  rightAlign: PropTypes.bool,
  separator: PropTypes.any,
  title: PropTypes.bool,
  titleBottom: PropTypes.bool,
  sx: PropTypes.any,
  others: PropTypes.any
};
