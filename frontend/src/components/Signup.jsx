import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { apiUrl } from '../config/api';
import { Slide, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        numero_telephone: '',
        numero_carte: '',
        password: '',
        password2: '',
        role: 'client', // Default role for all new users
    });
    const navigate = useNavigate();

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const { username, numero_telephone, numero_carte, password, password2, role } = formData;
        if (!username || !numero_telephone || !numero_carte || !password || !password2 || !role) {
            toast.error('Veuillez remplir toutes les informations !', {
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
            return;
        }
        try {
            const res = await axios.post(apiUrl('/api/register/'), formData);
            toast.success('Inscription réussie !', {
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
            navigate('/');
        } catch (error) {
            if (error.response && error.response.data) {
                let errorObject = error.response.data;
                if (errorObject.numero_telephone) {
                    toast.error('Numéro de téléphone déjà utilisé !', { position: "top-center", autoClose: 1500, theme: "colored", transition: Slide });
                }
                if (errorObject.numero_carte) {
                    toast.error('Numéro de carte déjà utilisé !', { position: "top-center", autoClose: 1500, theme: "colored", transition: Slide });
                }
                if (errorObject.password) {
                    toast.error('Le mot de passe est trop court ou invalide !', { position: "top-center", autoClose: 1500, theme: "colored", transition: Slide });
                }
                if (errorObject.password2) {
                    toast.error('La confirmation du mot de passe ne correspond pas !', { position: "top-center", autoClose: 1500, theme: "colored", transition: Slide });
                }
            } else {
                alert("Une erreur est survenue. Veuillez réessayer plus tard.");
            }
        }
    };
    
    

    return (
        <div className="limiter">
            <div className="container-login100">
                <div className="wrap-login100">
                    <form className="login100-form validate-form p-l-55 p-r-55 p-t-178" onSubmit={onSubmit}>
                        <span className="login100-form-title">S'inscrire</span>
                        <label className='my-2' id='iname' >Nom d'utilisateur</label>
                        <div className="wrap-input100 validate-input m-b-16">
                            <input
                                className="input100 placeholder-right"
                                type="text"
                                dir='ltr'
                                onChange={onChangeInput}
                                name="username"
                                value={formData.username}
                                id='g-font'
                            />
                            <span className="focus-input100"></span>
                        </div>
                        <label className='my-2' id='iname' >Utilisateur</label>
                        <div className="wrap-input100 validate-input m-b-16">
                            <input
                                className="input100 placeholder-right"
                                type="text"
                                dir='ltr'
                                onChange={onChangeInput}
                                name="numero_telephone"
                                value={formData.numero_telephone}
                                id='g-font'
                            />
                            <span className="focus-input100"></span>
                        </div>
                        <label className='my-2' id='iname' >Numéro de téléphone</label>
                        
                        <div className="wrap-input100 validate-input m-b-16">
                            <input
                                className="input100 placeholder-right"
                                type="text"
                                dir='ltr'
                                onChange={onChangeInput}
                                name="numero_carte"
                                value={formData.numero_carte}
                                id='g-font'
                            />
                            <span className="focus-input100"></span>
                        </div>
                        <label className='my-2' id='iname' >Mot de passe</label>
                        <div className="wrap-input100 validate-input m-b-16">
                            <input
                                className="input100 placeholder-right"
                                type="password"
                                dir='ltr'
                                onChange={onChangeInput}
                                name="password"
                                value={formData.password}
                                id='g-font'
                            />
                            <span className="focus-input100"></span>
                        </div>
                        
                        <label className='my-2' id='iname' >Confirmer le mot de passe</label>
                        <div className="wrap-input100 validate-input m-b-16">
                            <input
                                className="input100 placeholder-right"
                                type="password"
                                dir='ltr'
                                onChange={onChangeInput}
                                name="password2"
                                value={formData.password2}
                                id='g-font'
                            />
                            <span className="focus-input100"></span>
                        </div>
                        <br/>
                        

                        
<br/>
                        <div className="container-login100-form-btn">
                            <button type="submit" className="login100-form-btn">Continuer</button>
                        </div>

                        <div className="flex-col-c p-t-170 p-b-40">
                            <span className="txt1 p-b-9">Vous avez déjà un compte ?</span>
                            <Link to="/Login" className='header-link'><p id='a-font' className="txt3">Connexion</p></Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Signup;
