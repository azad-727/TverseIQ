// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Megaphone, Upload, Settings, Search, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
  const { logout, user } = useAuth();

  return (
    <div 
      className={`sidebar ${collapsed ? 'collapsed' : 'expanded'}`}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <div className="sidebar-header">
        {collapsed ? (
          <img src="/icon.png" alt="TverseIQ" className="brand-logo-collapsed" />
        ) : (
          <img src="/logo.png" alt="TverseIQ" className="brand-logo-expanded" />
        )}
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={18} />
          {!collapsed && <span>Overview</span>}
        </NavLink>
        <NavLink to="/keywords" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Search size={18} />
          {!collapsed && <span>Keywords</span>}
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={18} />
          {!collapsed && <span>Products</span>}
        </NavLink>
        <NavLink to="/campaigns" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Megaphone size={18} />
          {!collapsed && <span>Campaigns</span>}
        </NavLink>
        
        {/* Only OWNER and ADMIN can see the upload option */}
        {['OWNER', 'ADMIN'].includes(user?.role) && (
          <NavLink to="/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Upload size={18} />
            {!collapsed && <span>Upload Reports</span>}
          </NavLink>
        )}
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <div className="nav-item" onClick={logout} style={{ cursor: 'pointer', color: '#ef4444' }}>
          <LogOut size={18} />
          {!collapsed && <span>Log Out</span>}
        </div>
      </div>
    </div>
  );
};