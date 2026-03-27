import { useState } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  action?: () => void;
  submenu?: MenuItem[];
  separator?: boolean;
}

export interface MenuBarProps {
  items: MenuItem[];
}

export const MenuBar = ({ items }: MenuBarProps) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.action) {
      item.action();
    }
    setActiveMenu(null);
  };

  return (
    <div style={{
      display: 'flex',
      backgroundColor: '#2a2a2a',
      borderBottom: '1px solid #444'
    }}>
      {items.map((menu) => (
        <div key={menu.id} style={{ position: 'relative' }}>
          <button
            onClick={() => handleMenuClick(menu.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: activeMenu === menu.id ? '#4a9eff' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {menu.icon && <span style={{ marginRight: '6px' }}>{menu.icon}</span>}
            {menu.label}
          </button>

          {activeMenu === menu.id && menu.submenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: '#333',
              border: '1px solid #555',
              borderRadius: '4px',
              zIndex: 1000,
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              {menu.submenu.map((item, index) => (
                <div key={item.id || index}>
                  {item.separator ? (
                    <div style={{
                      height: '1px',
                      backgroundColor: '#555',
                      margin: '4px 8px'
                    }} />
                  ) : (
                    <button
                      onClick={() => handleItemClick(item)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: 'transparent',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#555';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {item.icon && <span>{item.icon}</span>}
                      {item.label}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};