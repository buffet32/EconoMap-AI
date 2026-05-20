import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faMapMarkerAlt, faClock } from '@fortawesome/free-solid-svg-icons';
import './Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        alert('Message envoyé avec succès!');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="contact-container">
            <div className="contact-header">
                <h1>Contactez-nous</h1>
                <p>Nous sommes là pour vous aider. N'hésitez pas à nous contacter.</p>
            </div>

            <div className="contact-content">
                <div className="contact-info">
                    <h2>Informations de contact</h2>
                    
                    <div className="contact-item">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="contact-icon" />
                        <div className="contact-details">
                            <h3>Adresse</h3>
                            <p>123 Avenue Mohammed V</p>
                            <p>Casablanca, Maroc</p>
                        </div>
                    </div>

                    <div className="contact-item">
                        <FontAwesomeIcon icon={faPhone} className="contact-icon" />
                        <div className="contact-details">
                            <h3>Téléphone</h3>
                            <p>+212 522 123 456</p>
                            <p>+212 522 789 012</p>
                        </div>
                    </div>

                    <div className="contact-item">
                        <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                        <div className="contact-details">
                            <h3>Email</h3>
                            <p>contact@g-entreprises.ma</p>
                            <p>support@g-entreprises.ma</p>
                        </div>
                    </div>

                    <div className="contact-item">
                        <FontAwesomeIcon icon={faClock} className="contact-icon" />
                        <div className="contact-details">
                            <h3>Heures d'ouverture</h3>
                            <p>Lundi - Vendredi: 9h00 - 18h00</p>
                            <p>Samedi: 9h00 - 13h00</p>
                        </div>
                    </div>
                </div>

                <div className="contact-form-wrapper">
                    <h2>Envoyez-nous un message</h2>
                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Nom complet</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Votre nom complet"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="votre@email.com"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">Sujet</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                placeholder="Sujet de votre message"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="6"
                                placeholder="Écrivez votre message ici..."
                            ></textarea>
                        </div>

                        <button type="submit" className="submit-btn">
                            Envoyer le message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
