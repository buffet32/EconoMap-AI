import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { Slide, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import '../styles/Sign.css'
const Signin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    const onSubmit = async (e) => {
        e.preventDefault();
        const userObject = { username, password };
        
        try {
            const res = await axios.post(apiUrl('/api/login/'), userObject);
            if (res.status === 200) {
                localStorage.setItem('user', JSON.stringify(res.data));
                window.location.href = '/';
            }
        } catch (error) {
            toast.error('Erreur dans le nom d\'utilisateur ou le mot de passe', {
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
        <div className="limiter">
            <div className="container-login100">
                <div className="wrap-login100">
                    <form className="login100-form validate-form p-l-55 p-r-55 p-t-178" onSubmit={onSubmit}>
                        <span className="login100-form-title">
                            Connexion
                        </span>
                        <div>
                            <label className='my-2' id='iname' >Nom d'utilisateur</label>
                            <div className="wrap-input100 validate-input m-b-16">
                                
                                <input
                                    className="input100 placeholder-right"
                                    type="text"
                                    dir='ltr'
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    id='g-font'
                                />
                                <span  className="focus-input100"></span>
                            </div>
                            <label className='my-2' id='iname' >Mot de passe</label>
                            <div className="wrap-input100 validate-input m-b-16">
                                <input
                                    className="input100 placeholder-right"
                                    type="password"
                                    dir='ltr'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    id='g-font'
                                />
                                <span className="focus-input100"></span>
                            </div>
                        </div>
                        <br/>
                        <div className="container-login100-form-btn">
                            <button type="submit" className="login100-form-btn">Continuer</button>
                        </div>
                        <div className="flex-col-c p-t-170 p-b-40">
                            <span  className="txt1 p-b-9">
                                Vous n'avez pas de compte ?  
                            </span>
                            <Link to="/Signup" className='header-link'>
                                <p id='a-font' className="txt3">S'inscrire</p>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default Signin