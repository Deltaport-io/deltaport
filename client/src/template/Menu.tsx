import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Collapse } from 'react-bootstrap';
import classNames from 'classnames';

const baseMenuItems: any[] = [
    { key: 'navigation', label: 'Navigation', isTitle: true },
    { key: 'dashboard', label: 'Dashboard', isTitle: false, icon: 'uil-home-alt', url: '/dashboard' },
    { key: 'marketplace', label: 'Marketplace', isTitle: false, icon: 'uil-store', url: '/marketplace' },
    { key: 'docs', label: 'Docs', isTitle: false, icon: 'uil-book-alt', url: '/docs' },
    { key: 'automation', label: 'Automation', isTitle: true },
    { key: 'bots', label: 'Bots', isTitle: false, icon: 'uil-robot', url: '/bots' },
    { key: 'backtests', label: 'Backtests', isTitle: false, icon: 'uil-table', url: '/backtests' },
    { key: 'trading', label: 'Trading', isTitle: false, icon: 'uil-chart', url: '/tradings' },
    { key: 'ethereum', label: 'Ethereum', isTitle: true },
    { key: 'wallets', label: 'Wallets', isTitle: false, icon: 'uil-globe', url: '/dexwallets' },
    { key: 'tokens', label: 'Tokens', isTitle: false, icon: 'uil-layers-alt', url: '/dextokens' },
    { key: 'pools', label: 'Pools', isTitle: false, icon: 'uil-coins', url: '/dexpools' },
    { key: 'exchanges', label: 'Exchanges', isTitle: true },
    { key: 'exchanges', label: 'Exchanges', isTitle: false, icon: 'uil-building', url: '/exchanges' },
    { key: 'pairs', label: 'Pairs', isTitle: false, icon: 'uil-layer-group', url: '/pairs' }
];

const findAllParent = (menuItems:any, menuItem:any):any => {
    let parents = [];
    const parent = findMenuItem(menuItems, menuItem['parentKey']);

    if (parent) {
        parents.push(parent['key']);
        if (parent['parentKey']) parents = [...parents, ...findAllParent(menuItems, parent)];
    }
    return parents;
};

const findMenuItem = (menuItems:any, menuItemKey:any) => {
    if (menuItems && menuItemKey) {
        for (var i = 0; i < menuItems.length; i++) {
            if (menuItems[i].key === menuItemKey) {
                return menuItems[i];
            }
            let found:any = findMenuItem(menuItems[i].children, menuItemKey);
            if (found) return found;
        }
    }
    return null;
};

const MenuItemWithChildren = ({ item, linkClassName, subMenuClassNames, activeMenuItems, toggleMenu }: any) => {
    const [open, setOpen] = useState(activeMenuItems.includes(item.key));

    useEffect(() => {
        setOpen(activeMenuItems.includes(item.key));
    }, [activeMenuItems, item]);

    const toggleMenuItem = (e:any) => {
        e.preventDefault();
        const status = !open;
        setOpen(status);
        if (toggleMenu) toggleMenu(item, status);
        return false;
    };

    return (
        <li className={classNames('side-nav-item', { 'menuitem-active': open })}>
            <Link
                to="/#"
                onClick={toggleMenuItem}
                data-menu-key={item.key}
                aria-expanded={open}
                className={classNames('has-arrow', 'side-sub-nav-link', linkClassName, {
                    'menuitem-active': activeMenuItems.includes(item.key) ? 'active' : '',
                })}>
                {item.icon && <i className={'uil '+item.icon}></i>}
                {!item.badge ? (
                    <span className="menu-arrow"></span>
                ) : (
                    <span className={`badge bg-${item.badge.variant} float-end`}>{item.badge.text}</span>
                )}
                <span> {item.label} </span>
            </Link>
            <Collapse in={open}>
                <ul className={classNames(subMenuClassNames)}>
                    {item.children.map((child:any, i:any) => {
                        return (
                            <React.Fragment key={i}>
                                {child.children ? (
                                    <>
                                        <MenuItemWithChildren
                                            item={child}
                                            linkClassName={activeMenuItems.includes(child.key) ? 'active' : ''}
                                            activeMenuItems={activeMenuItems}
                                            subMenuClassNames="side-nav-third-level"
                                            toggleMenu={toggleMenu}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <MenuItem
                                            item={child}
                                            className={activeMenuItems.includes(child.key) ? 'menuitem-active' : ''}
                                            linkClassName={activeMenuItems.includes(child.key) ? 'active' : ''}
                                        />
                                    </>
                                )}
                            </React.Fragment>
                        );
                    })}
                </ul>
            </Collapse>
        </li>
    );
};

const MenuItem = ({ item, className, linkClassName }:any) => {
    return (
        <li className={classNames('side-nav-item', className)}>
            <MenuItemLink item={item} className={linkClassName} />
        </li>
    );
};

const MenuItemLink = ({ item, className }:any) => {
    return (
        <Link
            to={item.url}
            target={item.target}
            className={classNames('side-nav-link-ref', 'side-sub-nav-link', className)}
            data-menu-key={item.key}>
            {item.icon && <i className={'uil '+item.icon}></i>}
            {item.badge && (
                <span className={`badge badge-${item.badge.variant} rounded-pill font-10 float-end`}>
                    {item.badge.text}
                </span>
            )}
            <span> {item.label} </span>
        </Link>
    );
};

type AppMenuProps = {
    history: any,
    location: any,
    match: any
}

const AppMenu = (props: AppMenuProps) => {
    const menuRef = useRef(null);

    const [activeMenuItems, setActiveMenuItems] = useState([] as any[]);

    const toggleMenu = (menuItem:any, show:any) => {
        if (show) setActiveMenuItems([menuItem['key'], ...findAllParent(baseMenuItems, menuItem)]);
    };

    const logout = () => {
        localStorage.removeItem('accounts')
        props.history.push('/')
    }

    const activeMenu = useCallback(() => {
        const div = document.getElementById('main-side-menu');
        let matchingMenuItem = null;

        if (div) {
            let items: any = div.getElementsByClassName('side-nav-link-ref');
            for (let i = 0; i < items.length; ++i) {
                if (props.location.pathname === items[i].pathname) {
                    matchingMenuItem = items[i];
                    break;
                }
            }

            if (matchingMenuItem) {
                const mid = matchingMenuItem.getAttribute('data-menu-key');
                const activeMt = findMenuItem(baseMenuItems, mid);
                if (activeMt) {
                    setActiveMenuItems([activeMt['key'], ...findAllParent(baseMenuItems, activeMt)]);
                }
            }
        }
    }, [props.location.pathname]);

    useEffect(() => {
        activeMenu();
    }, [activeMenu]);

    return (
        <>
            <ul className="side-nav" ref={menuRef} id="main-side-menu">
                {(baseMenuItems || []).map((item, idx) => {
                    return (
                        <React.Fragment key={idx}>
                            {item.isTitle ? (
                                <li className="side-nav-title side-nav-item">{item.label}</li>
                            ) : (
                                <>
                                    {item.children ? (
                                        <MenuItemWithChildren
                                            item={item}
                                            toggleMenu={toggleMenu}
                                            subMenuClassNames="side-nav-second-level"
                                            activeMenuItems={activeMenuItems}
                                            linkClassName="side-nav-link"
                                        />
                                    ) : (
                                        <MenuItem
                                            item={item}
                                            linkClassName="side-nav-link"
                                            className={activeMenuItems.includes(item.key) ? 'menuitem-active' : ''}
                                        />
                                    )}
                                </>
                            )}
                        </React.Fragment>
                    );
                })}
            </ul>
            <div
                onClick={() => logout()}
                style={{marginLeft: 65, marginTop:40, marginBottom:20, cursor:'pointer'}}
            >
                Logout
            </div>
        </>
    );
};

export default withRouter(AppMenu)
