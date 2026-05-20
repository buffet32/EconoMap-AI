import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { Slide, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Logo from './Logo'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { faUserGear } from '@fortawesome/free-solid-svg-icons'
import { faUserGroup } from '@fortawesome/free-solid-svg-icons'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { faBrain } from '@fortawesome/free-solid-svg-icons'
import { faCrown } from '@fortawesome/free-solid-svg-icons'
import { faChartBar } from '@fortawesome/free-solid-svg-icons'
import { faLightbulb } from '@fortawesome/free-solid-svg-icons'
import { faChartLine } from '@fortawesome/free-solid-svg-icons'
import { getStoredUser, hasPremiumAccess } from '../utils/auth';


const HeaderM = () => {

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const navigate = useNavigate();
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [premiumDropdownVisible, setPremiumDropdownVisible] = useState(false);
    const storedUser = localStorage.getItem('user');

    const toggleDropdown = () => {
        const dropdown = document.getElementById('dropdown-menu');
    
        if (dropdownVisible) {
            // If the dropdown is currently visible, start the slide-out animation
            dropdown.classList.add('slide-exit');
    
            // Wait for the animation duration before hiding the dropdown
            setTimeout(() => {
                setDropdownVisible(false);
                dropdown.classList.remove('slide-exit'); // Reset for next open
            }, 300); // Match this duration with your animation duration
        } else {
            setDropdownVisible(true); // Show the dropdown
            dropdown.classList.add('slide-enter2'); // Start the slide-in animation
    
            // Cleanup after animation
            setTimeout(() => {
                dropdown.classList.remove('slide-enter2'); // Reset for next close
            }, 300); // Match this duration with your animation duration
        }
    };

    const togglePremiumDropdown = () => {
        const dropdown = document.getElementById('premium-dropdown-menu');
    
        if (premiumDropdownVisible) {
            dropdown.classList.add('slide-exit');
            setTimeout(() => {
                setPremiumDropdownVisible(false);
                dropdown.classList.remove('slide-exit');
            }, 300);
        } else {
            setPremiumDropdownVisible(true);
            dropdown.classList.add('slide-enter2');
            setTimeout(() => {
                dropdown.classList.remove('slide-enter2');
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
        } catch {}
      }
    }, []);


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
        navigate('/premium-access');
    }
};

    return windowWidth < 992 ? (
        <nav id="main-navbar" className="navbar navbar-expand-lg navbar-light fixed-top">
       
        <div className="container-fluid">

          <button id="btn" data-toggle="sidenav" data-target="#sidenav-1" className="btn btn-lg shadow-0 p-3 mr-3 d-block d-xxl-none"
            aria-controls="#sidenav-1" aria-haspopup="true" data-mdb-ripple-duration="0">
      
              <FontAwesomeIcon icon={faBars} />
          </button>
  
          <a href="/">
            <Logo size="small" />
          </a>
          
            {storedUser ? (
              <>
                <a
                  className="nav-link dropdown-toggle hidden-arrow d-flex align-items-center"
                  id="navbarDropdownMenuLink"
                  role="button"
                  data-bs-toggle="dropdown" // Ensure MDB dropdown is triggered
                  aria-expanded={dropdownVisible}
                  onClick={toggleDropdown}
                >
                  <FontAwesomeIcon id="account"  icon={faUser} />
                </a>

                <ul
                  id="dropdown-menu"
                  className={`dropdown-menu dropdown-menu-right ${dropdownVisible ? 'slide-enter2' : 'slide-exit'}`}
                  aria-labelledby="navbarDropdownMenuLink"
                  style={{ display: dropdownVisible ? 'block' : 'none' }} // Control display for MDB compatibility
                >
                  <li>
                    <a id="sdropdown" href="/Profile" className="d-flex justify-content-start dropdown-item">
                      
                      <FontAwesomeIcon className="mr-2" id="logout-m " icon={faUserGear} />
                      Compte
                    </a>
                  </li>
                  <li className="nav-item dropdown">
                    <a id="sdropdown" className="d-flex justify-content-between dropdown-item dropdown-toggle" 
                       onClick={togglePremiumDropdown}
                       aria-expanded={premiumDropdownVisible}>
                      <span>
                        <FontAwesomeIcon className="mr-2" icon={faCrown} />
                        Premium
                      </span>
                    </a>
                    <ul
                      id="premium-dropdown-menu"
                      className={`dropdown-menu dropdown-menu-right ${premiumDropdownVisible ? 'slide-enter2' : 'slide-exit'}`}
                      aria-labelledby="premiumDropdown"
                      style={{ display: premiumDropdownVisible ? 'block' : 'none', position: 'absolute', left: '100%', top: '0' }}
                    >
                      <li>
                        <a id="sdropdown" href="/ai-features?tab=predict" className="d-flex justify-content-start dropdown-item">
                          <FontAwesomeIcon className="mr-2" icon={faChartLine} />
                          Attractivité par zone
                        </a>
                      </li>
                      <li>
                        <a id="sdropdown" href="/ai-features?tab=recommend" className="d-flex justify-content-start dropdown-item">
                          <FontAwesomeIcon className="mr-2" icon={faLightbulb} />
                          Zones recommandées
                        </a>
                      </li>
                    </ul>
                  </li>
                  {isPremium && (
                    <li>
                      <a id="sdropdown" href="/ai-features" className="d-flex justify-content-start dropdown-item">
                        <FontAwesomeIcon className="mr-2" id="logout-m " icon={faCrown} />
                        Prédictions ML
                      </a>
                    </li>
                  )}
                  {isAdmin ? (
                    <>
                      <li>
                        <a id="sdropdown" className="d-flex justify-content-start dropdown-item" href="/AdashM">
                          <FontAwesomeIcon className="mr-2" id="logout-m " icon={faUserGroup} />
                          Utilisateurs
                        </a>
                      </li>
                    </>
                  ) : null}
                  <li>
                    <a id="sdropdown" className="d-flex justify-content-start dropdown-item" onClick={handleLogout}>
                      <FontAwesomeIcon className="mr-2" id="logout-m "  icon={faArrowLeft} /><span>Se déconnecter</span>
                    </a>
                  </li>
                </ul>
              </>
            ) : (
              <a href="/login">
        
                <span id="login-btn-m" class="material-symbols-outlined">
                <FontAwesomeIcon icon={faArrowRightToBracket} />
              </span>
              </a>

            )}

        </div>

      </nav>
    ): null;
}

export default HeaderM;