import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Package,
  Settings,
  LogOut,
  ShieldCheck,
  Briefcase,
  Globe,
  Activity,
  Zap,
  Bell,
  User,
  MessageSquare,
  Tent
} from 'lucide-react';
import { Nav, NavItem } from 'reactstrap';

const Sidebar = ({ role, theme = 'light', accentColor = '#22c55e' }) => {
  const isDark = theme === 'dark';

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  const getLinks = () => {
    switch (role) {
      case 'Admin':
        return [
           { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/admin-dashboard' },
           { icon: <Users size={18} />, label: 'Manage Users', path: '/admin/users' },
           { icon: <Briefcase size={18} />, label: 'Manage Volunteers', path: '/admin/volunteers' },
           { icon: <ShieldCheck size={18} />, label: 'Manage Authorities', path: '/admin/authorities' },
           { icon: <AlertTriangle size={18} />, label: 'Manage Incidents', path: '/admin/incidents' },
           { icon: <Package size={18} />, label: 'Manage Resources', path: '/admin/resources' },
           { icon: <Tent size={18} />, label: 'Manage Relief Nodes', path: '/admin/relief-nodes' },
           { icon: <Globe size={18} />, label: 'Task Assignment', path: '/admin/tasks' },
           { icon: <Globe size={18} />, label: 'Live Disaster Map', path: '/admin/map' },
            { icon: <Activity size={18} />, label: 'Analytics', path: '/admin/reports' },
            { icon: <MessageSquare size={18} />, label: 'Tactical Chat', path: '/admin/communication' },

            { icon: <Bell size={18} />, label: 'Communication Mesh', path: '/notifications' },
         ];
      case 'NGO':
        return [
           { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/ngo-dashboard' },
           { icon: <AlertTriangle size={18} />, label: 'Incident Analysis', path: '/ngo/reports' },
           { icon: <Package size={18} />, label: 'Resources', path: '/ngo/resources' },
           { icon: <ShieldCheck size={18} />, label: 'Rescue operations', path: '/ngo/rescue' },
           { icon: <MessageSquare size={18} />, label: 'Tactical Chat', path: '/ngo/communication' },
           { icon: <Bell size={18} />, label: 'Communication Mesh', path: '/notifications' },
           { icon: <User size={18} />, label: 'Profile', path: '/profile' },
        ];
      case 'Volunteer':
        return [
           { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/volunteer-dashboard' },
           { icon: <Globe size={18} />, label: 'Assigned Tasks', path: '/volunteer/tasks' },
           { icon: <Activity size={18} />, label: 'Disaster Intel', path: '/volunteer/reports' },
           { icon: <Globe size={18} />, label: 'Live Map', path: '/volunteer/map' },
           { icon: <MessageSquare size={18} />, label: 'Tactical Chat', path: '/volunteer/communication' },
           { icon: <Bell size={18} />, label: 'Communication Mesh', path: '/notifications' },
           { icon: <User size={18} />, label: 'Profile', path: '/profile' },
        ];
      default:
        return [];
    }
  };

  return (
    <aside style={{
      height: '100vh', width: '280px', position: 'fixed', left: 0, top: 0,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#fff',
      backdropFilter: isDark ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
      borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f1f1',
      padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', zIndex: 1000
    }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{ padding: '0.6rem', background: `linear-gradient(135deg, ${accentColor}, #0f172a)`, borderRadius: '0.75rem', color: '#fff' }}>
          <ShieldCheck size={22} strokeWidth={2.5} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px', color: isDark ? '#fff' : '#1e293b' }}>
          RESQ<span style={{ color: accentColor }}>AI</span>
        </h2>
      </div>

      <style>{`
        .sidebar-scroller { scrollbar-width: thin; scrollbar-color: ${accentColor}88 transparent; }
        .sidebar-scroller::-webkit-scrollbar { width: 4px; }
        .sidebar-scroller::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroller::-webkit-scrollbar-thumb { background: ${accentColor}88; border-radius: 10px; }
        .sidebar-scroller::-webkit-scrollbar-thumb:hover { background: ${accentColor}; }
      `}</style>

      <div className="sidebar-scroller" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '12px', marginBottom: '1.5rem', height: '0px' }}>
        <Nav vertical>
          {getLinks().map((link) => (
            <NavItem key={link.path} className="mb-2">
              <NavLink 
                to={link.path} 
                style={{ textDecoration: 'none' }}
                // Use 'end' for exact matching on dashboard roots so high-level paths don't stay active on sub-routes
                end={!link.path.includes('#')} 
              >
                {({ isActive }) => {
                  // Custom check for hash-based links
                  const isLinkActive = link.path.includes('#') 
                    ? window.location.pathname === link.path.split('#')[0] && window.location.hash === '#' + link.path.split('#')[1]
                    : isActive;

                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      color: isLinkActive ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
                      backgroundColor: isLinkActive ? (isDark ? `${accentColor}26` : `${accentColor}10`) : 'transparent',
                      fontWeight: isLinkActive ? '700' : '500',
                      transition: 'all 0.2s ease',
                      border: isLinkActive ? (isDark ? `1px solid ${accentColor}55` : `1px solid ${accentColor}44`) : '1px solid transparent'
                    }}>
                      <div style={{ color: isLinkActive ? accentColor : 'inherit' }}>
                        {link.icon}
                      </div>
                      <span style={{ fontSize: '0.95rem', letterSpacing: '0.3px' }}>{link.label}</span>
                    </div>
                  );
                }}
              </NavLink>
            </NavItem>
          ))}
        </Nav>
      </div>

      <div style={{ marginTop: 'auto', borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f1f1', paddingTop: '2.5rem' }}>
        <button
          onClick={handleLogout}
          className="btn btn-link text-decoration-none p-0 d-flex align-items-center gap-3 w-100"
          style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          <LogOut size={18} />
          <span>Terminate Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
