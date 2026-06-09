import React from 'react';
import logo from '../assets/logo.png';
import './Navbar.css';
import { NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseconfig';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/resources', label: 'Resources' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/history', label: 'History' },
  { to: '/profile', label: 'Profile' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/prediction', label: '📊 Performance' },
  { to: '/settings', label: 'Settings' }
];

const Navbar = ({ user }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="MainDiv">
      <div>
        <img src={logo} alt="Logo" className="logo" />
      </div>

      <div className="navItems">
        {navItems.map((item) => (
          <div className="item" key={item.to}>
            <NavLink to={item.to} end={item.to === '/'}>
              {item.label}
            </NavLink>
          </div>
        ))}
      </div>

      <div className="NavbarUserArea">
        {user ? (
          <>
            <span className="NavbarUserLabel">{user.email || 'User'}</span>
            <button onClick={handleLogout} className="NavbarLogoutButton">
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/login" className="NavbarSigninLink">
            Sign In
          </NavLink>
        )}
      </div>
    </div>
  );
};

export default Navbar;
