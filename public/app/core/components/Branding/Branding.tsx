import { css, cx } from '@emotion/css';
import { FC } from 'react';

import { colorManipulator } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';

export interface BrandComponentProps {
  className?: string;
  children?: JSX.Element | JSX.Element[];
}

export const LoginLogo: FC<BrandComponentProps & { logo?: string }> = ({ className, logo }) => {
  /** StellaNow customization */
  return <img className={className} src={`${logo ? logo : 'https://stellanow-dev-visualization.s3.eu-west-1.amazonaws.com/dashboards/logo/app_header_logo_white.svg'}`} alt="StellaNow" />;
  /** StellaNow customization - END */
};

const LoginBackground: FC<BrandComponentProps> = ({ className, children }) => {
  const theme = useTheme2();

  const background = css({
    '&:before': {
      content: '""',
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      background: `url(public/img/g8_login_${theme.isDark ? 'dark' : 'light'}.svg)`,
      backgroundPosition: 'top center',
      backgroundSize: 'auto',
      backgroundRepeat: 'no-repeat',

      opacity: 0,
      transition: 'opacity 3s ease-in-out',

      [theme.breakpoints.up('md')]: {
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      },
    },
  });

  return <div className={cx(background, className)}>{children}</div>;
};

const MenuLogo: FC<BrandComponentProps> = ({ className }) => {
  /** StellaNow customization */
  return <img className={className} src="https://stellanow-dev-visualization.s3.eu-west-1.amazonaws.com/dashboards/logo/app_header_logo_white.svg" alt="StellaNow" />;
  /** StellaNow customization - END */
};

const LoginBoxBackground = () => {
  const theme = useTheme2();
  return css({
    background: colorManipulator.alpha(theme.colors.background.primary, 0.7),
    backgroundSize: 'cover',
  });
};

export class Branding {
  static LoginLogo = LoginLogo;
  static LoginBackground = LoginBackground;
  static MenuLogo = MenuLogo;
  static LoginBoxBackground = LoginBoxBackground;
  /** StellaNow customization */
  static AppTitle = 'Visualization';
  static LoginTitle = 'Welcome to StellaNow Visualization';
  /** StellaNow customization - END */
  static HideEdition = false;
  static GetLoginSubTitle = (): null | string => {
    return null;
  };
}
