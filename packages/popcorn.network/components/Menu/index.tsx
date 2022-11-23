import React from 'react';
import { bool } from 'prop-types';
import styled from 'styled-components';
import { MobileExpandableMenu } from 'components/MobileExpandableMenu';

interface StyledMenuProps {
  open: boolean;
}
export const StyledMenu = styled.nav<StyledMenuProps>`
  height: 100%;
  min-height: 100vh;
  display: ${({ open }) => (open ? 'flex' : 'none')};
  flex-direction: column;
  justify-content: center;
  background: ${({ theme }) => theme.primaryLight};
  text-align: left;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;

  animation: fade_in_show 1s;

  @keyframes fade_in_show {
    0% {
      opacity: 0;
      transform: translateX(100%);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: ${({ theme }) => theme.mobile}) {
    width: 100%;
  }
`;

const Menu = ({ open, ...props }) => {
  const isHidden = open ? true : false;
  const tabIndex = isHidden ? 0 : -1;

  return (
    <StyledMenu open={open} aria-hidden={!isHidden} {...props}>
      <MobileExpandableMenu />
    </StyledMenu>
  );
};

Menu.propTypes = {
  open: bool.isRequired,
};

export default Menu;
