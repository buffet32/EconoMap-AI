import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Slide, toast } from 'react-toastify';
import Logo from './Logo'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faHeadset, faUser, faUserGear, faUserGroup, faArrowLeft, faBrain, faCrown, faChartBar, faLightbulb, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { getStoredUser, hasPremiumAccess } from '../utils/auth';
import { faFacebookF, faTwitter, faLinkedinIn, faYoutube } from '@fortawesome/free-brands-svg-icons';

const TOPBAR_HEIGHT = 44; // px, adjust if needed

const HeaderD = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [loggedIn, setLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [premiumDropdownVisible, setPremiumDropdownVisible] = useState(false);
    const storedUser = localStorage.getItem('user');

    // Helper function to determine if nav item is active
    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path === '/regional-dashboard' && location.pathname === '/regional-dashboard') return true;
        if (path === '/premium-dashboard' && location.pathname === '/premium-dashboard') return true;
        if (path === '/premium-access' && location.pathname === '/premium-access') return true;
        if (path === '/ai-features' && location.pathname.startsWith('/ai-features')) return true;
        if (path === '/ai-interpretation' && location.pathname.startsWith('/ai-interpretation')) return true;
        return false;
    };

    const toggleDropdown = () => {
        const dropdown = document.getElementById('dropdown-menu');
    
        if (dropdownVisible) {
            dropdown.classList.add('slide-exit2');
            setTimeout(() => {
                setDropdownVisible(false);
                dropdown.classList.remove('slide-exit2');
            }, 300);
        } else {
            setDropdownVisible(true);
            dropdown.classList.add('slide-enter');
            setTimeout(() => {
                dropdown.classList.remove('slide-enter');
            }, 300);
        }
    };

    const togglePremiumDropdown = () => {
        const dropdown = document.getElementById('premium-dropdown-menu');
    
        if (premiumDropdownVisible) {
            dropdown.classList.add('slide-exit2');
            setTimeout(() => {
                setPremiumDropdownVisible(false);
                dropdown.classList.remove('slide-exit2');
            }, 300);
        } else {
            setPremiumDropdownVisible(true);
            dropdown.classList.add('slide-enter');
            setTimeout(() => {
                dropdown.classList.remove('slide-enter');
            }, 300);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser).user;
                setIsAdmin(user && user.role === 'admin');
                setIsPremium(hasPremiumAccess(user));
                setLoggedIn(true);
            } catch {}
        }
    }, []);


    const handleCodeRDClick = (e) => {
        e.preventDefault();
        const storedUser = localStorage.getItem('user');
      
        if (storedUser) {
            const user = JSON.parse(storedUser).user;
            
            if (!user.is_verified) {
                toast.error('Veuillez activer votre compte pour accéder à cette page', {
                    position: "top-center",
                    autoClose: 1500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                    rtl: false,
                    transition: Slide,
                });
             
            } else {
                navigate('/Coderoute');
            
            }
        } else {
            toast.error('Vous devez vous connecter pour accéder à cette page', {
                position: "top-center",
                autoClose: 1500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "colored",
                rtl: false,
                transition: Slide,
            });
  
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
      
        navigate('/');
    };

    const handlePremiumClick = () => {
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
            try {
                const user = JSON.parse(storedUser).user;
                if (hasPremiumAccess(user)) {
                    navigate('/ai-features');
                } else {
                    navigate('/premium-access');
                }
            } catch (error) {
                navigate('/premium-access');
            }
        } else {
            // Redirect to login page if not logged in
            navigate('/login');
        }
    };

    return windowWidth > 992 ? (
        <header>
            {/* Top Info Bar */}

            <nav id="main-navbar" className="navbar navbar-expand-lg navbar-light fixed-top" >
              <div style={{ marginLeft: '20px' }}>
                <a href="/">
                  <Logo size="small" />
                </a>
              </div>
                <div className="container-fluid justify-content-center">
                    <center>
                        <ul id="links" className="navbar-nav ml-auto d-flex flex-row">
                        <li className="nav-item">
                                <a id="a-nav-item" className={`sidenav-link ${isActive('/') || isActive('/intelligence') ? 'active' : ''}`} href="/">
                                    <FontAwesomeIcon icon={faHouse} />
                                    <span className="mt-1 ml-2" id="nav_items">Accueil</span></a>
                            </li>
                            <li className="nav-item">
                                <a id="a-nav-item" href="/regional-dashboard" className={`sidenav-link ${isActive('/regional-dashboard') ? 'active' : ''}`}>
                                    <FontAwesomeIcon icon={faChartBar} />
                                    <span className="mt-1 ml-2" id="nav_items">Régions</span></a>
                            </li>
                            <li className="nav-item dropdown">
                                <a id="a-nav-item" className="sidenav-link dropdown-toggle"
                                   onClick={togglePremiumDropdown}
                                   aria-expanded={premiumDropdownVisible}>
                                    <FontAwesomeIcon icon={faCrown} />
                                    <span className="mt-1 ml-2" id="nav_items">{isPremium ? 'AI Tools' : 'Premium'}</span></a>
                                <ul
                                    id="premium-dropdown-menu"
                                    className={`dropdown-menu dropdown-menu-right ${premiumDropdownVisible ? 'slide-enter' : 'slide-exit2'}`}
                                    aria-labelledby="premiumDropdown"
                                    style={{ display: premiumDropdownVisible ? 'block' : 'none' }}
                                >
                                    <li>
                                        <a id="sdropdown" href="/ai-features?tab=predict" className="d-flex justify-content-start dropdown-item" onClick={(e) => {
                                            if (!getStoredUser()) { e.preventDefault(); navigate('/login'); }
                                        }}>
                                            <FontAwesomeIcon className="mr-2" icon={faChartLine} />
                                            Attractivité par zone
                                        </a>
                                    </li>
                                    <li>
                                        <a id="sdropdown" href="/ai-features?tab=recommend" className="d-flex justify-content-start dropdown-item" onClick={(e) => {
                                            if (!getStoredUser()) { e.preventDefault(); navigate('/login'); }
                                        }}>
                                            <FontAwesomeIcon className="mr-2" icon={faLightbulb} />
                                            Zones recommandées
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <li className="nav-item dropdown">
                                <a id="a-nav-item" className="sidenav-link" href="/contact">
                                    <FontAwesomeIcon icon={faHeadset} />
                                    <span className="mt-1 ml-2" id="nav_items">Contactez-nous</span></a>
                            </li>



                        </ul>
                    </center>
                </div>

                {storedUser ? (
                    <>
                        <a
                            className="nav-link dropdown-toggle hidden-arrow d-flex align-items-center"
                            id="navbarDropdownMenuLink"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded={dropdownVisible}
                            onClick={toggleDropdown}
                        >
                            <div style={{
                                background: 'linear-gradient(135deg, #8c54bc 0%, #4fd1c5 100%)',
                                borderRadius: '50%',
                                width: '45px',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 15px rgba(140, 84, 188, 0.4)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(140, 84, 188, 0.6)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(140, 84, 188, 0.4)';
                            }}
                            >
                                <FontAwesomeIcon icon={faUser} style={{ color: '#fff', fontSize: '20px' }} />
                            </div>
                        </a>

                        <ul
                            id="dropdown-menu"
                            className={`dropdown-menu dropdown-menu-right ${dropdownVisible ? 'slide-enter' : 'slide-exit2'}`}
                            aria-labelledby="navbarDropdownMenuLink"
                            style={{ display: dropdownVisible ? 'block' : 'none' }}
                        >
                            <li>
                                <a id="sdropdown" href="/Profile" className="d-flex justify-content-start dropdown-item">
                                    
                                    <FontAwesomeIcon className="mr-2" id="logout-m " icon={faUserGear} />
                                    Compte
                                </a>
                            </li>
                            {isPremium && (
                                <li>
                                    <a id="sdropdown" href="/ai-features" className="d-flex justify-content-start dropdown-item">
                                        <FontAwesomeIcon className="mr-2" id="logout-m " icon={faCrown} />
                                        Prédictions ML
                                    </a>
                                </li>
                            )}
                            {isAdmin && (
                                <>
                                    <li>
                                        <a id="sdropdown" className="d-flex justify-content-start dropdown-item" href="/AdashM">
                                            
                                            <FontAwesomeIcon className="mr-2" id="logout-m " icon={faUserGroup} />
                                            Utilisateurs
                                        </a>
                                    </li>
                                </>
                            )}
                            <li>
                                <a id="sdropdown" className="d-flex justify-content-start dropdown-item" onClick={handleLogout}>
                                    <FontAwesomeIcon className="mr-2" id="logout-m " icon={faArrowLeft} /><span>Se déconnecter</span>
                                </a>
                            </li>
                        </ul>
                    </>
                ) : (
                    <a href="/login">
                        <button id="login-btn-d" className="btn btn" type="button">Connexion</button>
                    </a>
                )}
            </nav>
        </header>
    ) : null;
}

export default HeaderD;
