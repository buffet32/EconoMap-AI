// src/components/Sidenav.js
import React, { useState, useEffect } from "react";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faBuilding, faHeadset, faUsersRectangle } from '@fortawesome/free-solid-svg-icons';

import { Slide, toast } from 'react-toastify';

const Sidenav = () => {


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
            window.location.href = '/Coderoute'; // Set loggedIn to true if user is verified
          
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

    return (
        <>
        <ul className="sidenav-menu" id="sidenav-menu">
          <li className="sidenav-item">
            <a className="sidenav-link" href="/">
            <FontAwesomeIcon icon={faHouse} />
              <span className="mt-1 ml-3" id="nav_items">Accueil</span>
            </a>
          </li>
          <li className="sidenav-item">
            <a className="sidenav-link" onClick={handleCodeRDClick} >
              <FontAwesomeIcon icon={faBuilding} />
              <span className="mt-1 ml-4" id="nav_items">Code en ligne</span>
              </a>
          </li>
          <li className="sidenav-item">
            <a className="sidenav-link">
                <FontAwesomeIcon icon={faUsersRectangle} />
              <span  className="mt-1 ml-3" id="nav_items">Personnes morales</span>
            </a>
          </li>


          <li className="sidenav-item">
            <a className="sidenav-link" href="#about">
            <FontAwesomeIcon icon={faHeadset} />
              <span className="mt-1 ml-3" id="nav_items">Contactez-nous</span>
            </a>
          </li>
        </ul>
        </>

  
    );
};

export default Sidenav;
