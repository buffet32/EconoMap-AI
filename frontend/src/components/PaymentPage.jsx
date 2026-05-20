import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faLock, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './PaymentPage.css';

const PaymentPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        address: '',
        city: '',
        postalCode: ''
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error for this field when user starts typing
        setErrors({
            ...errors,
            [e.target.name]: ''
        });
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.cardNumber || formData.cardNumber.length < 16) {
            newErrors.cardNumber = 'Numéro de carte invalide';
        }
        if (!formData.cardName) {
            newErrors.cardName = 'Nom du titulaire requis';
        }
        if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
            newErrors.expiryDate = 'Date d\'expiration invalide (MM/AA)';
        }
        if (!formData.cvv || formData.cvv.length < 3) {
            newErrors.cvv = 'CVV invalide';
        }
        if (!formData.address) {
            newErrors.address = 'Adresse requise';
        }
        if (!formData.city) {
            newErrors.city = 'Ville requise';
        }
        if (!formData.postalCode) {
            newErrors.postalCode = 'Code postal requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setProcessing(true);

        // Simulate payment processing
        setTimeout(() => {
            // Update user's premium status in localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    if (userData.user) {
                        userData.user.is_premium = true;
                        userData.user.subscription_type = 'premium';
                        localStorage.setItem('user', JSON.stringify(userData));
                    }
                } catch (error) {
                    console.error('Error updating user data:', error);
                }
            }

            setProcessing(false);
            // Redirect to premium dashboard after successful payment
            navigate('/premium-dashboard');
        }, 3000);
    };

    const formatCardNumber = (value) => {
        // Format card number with spaces every 4 digits
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    const formatExpiryDate = (value) => {
        // Format expiry date as MM/AA
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        setFormData({
            ...formData,
            cardNumber: formatted
        });
        setErrors({
            ...errors,
            cardNumber: ''
        });
    };

    const handleExpiryDateChange = (e) => {
        const formatted = formatExpiryDate(e.target.value);
        setFormData({
            ...formData,
            expiryDate: formatted
        });
        setErrors({
            ...errors,
            expiryDate: ''
        });
    };

    return (
        <div className="payment-container">
            <div className="payment-header">
                <h1>Paiement Premium</h1>
                <p>Complétez vos informations de paiement pour accéder aux fonctionnalités IA</p>
            </div>

            <div className="payment-content">
                <div className="payment-form-wrapper">
                    <div className="payment-secure-badge">
                        <FontAwesomeIcon icon={faLock} />
                        <span>Paiement sécurisé</span>
                    </div>

                    <form className="payment-form" onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h3>Informations de carte</h3>
                            
                            <div className="form-group">
                                <label htmlFor="cardNumber">Numéro de carte</label>
                                <input
                                    type="text"
                                    id="cardNumber"
                                    name="cardNumber"
                                    value={formData.cardNumber}
                                    onChange={handleCardNumberChange}
                                    placeholder="1234 5678 9012 3456"
                                    maxLength={19}
                                    className={errors.cardNumber ? 'error' : ''}
                                />
                                {errors.cardNumber && <span className="error-message">{errors.cardNumber}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="cardName">Nom du titulaire</label>
                                <input
                                    type="text"
                                    id="cardName"
                                    name="cardName"
                                    value={formData.cardName}
                                    onChange={handleChange}
                                    placeholder="JEAN DUPONT"
                                    className={errors.cardName ? 'error' : ''}
                                />
                                {errors.cardName && <span className="error-message">{errors.cardName}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="expiryDate">Date d'expiration</label>
                                    <input
                                        type="text"
                                        id="expiryDate"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleExpiryDateChange}
                                        placeholder="MM/AA"
                                        maxLength={5}
                                        className={errors.expiryDate ? 'error' : ''}
                                    />
                                    {errors.expiryDate && <span className="error-message">{errors.expiryDate}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="cvv">CVV</label>
                                    <input
                                        type="text"
                                        id="cvv"
                                        name="cvv"
                                        value={formData.cvv}
                                        onChange={handleChange}
                                        placeholder="123"
                                        maxLength={4}
                                        className={errors.cvv ? 'error' : ''}
                                    />
                                    {errors.cvv && <span className="error-message">{errors.cvv}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Adresse de facturation</h3>
                            
                            <div className="form-group">
                                <label htmlFor="address">Adresse</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="123 Avenue Mohammed V"
                                    className={errors.address ? 'error' : ''}
                                />
                                {errors.address && <span className="error-message">{errors.address}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="city">Ville</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="Casablanca"
                                        className={errors.city ? 'error' : ''}
                                    />
                                    {errors.city && <span className="error-message">{errors.city}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="postalCode">Code postal</label>
                                    <input
                                        type="text"
                                        id="postalCode"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleChange}
                                        placeholder="20250"
                                        className={errors.postalCode ? 'error' : ''}
                                    />
                                    {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="payment-summary">
                            <div className="summary-item">
                                <span>Abonnement Premium</span>
                                <span>299 MAD/mois</span>
                            </div>
                            <div className="summary-item">
                                <span>TVA (20%)</span>
                                <span>59.80 MAD</span>
                            </div>
                            <div className="summary-item total">
                                <span>Total</span>
                                <span>358.80 MAD</span>
                            </div>
                        </div>

                        <button type="submit" className="payment-submit-btn" disabled={processing}>
                            {processing ? (
                                <>
                                    <FontAwesomeIcon icon={faCreditCard} spin />
                                    <span>Traitement en cours...</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faCreditCard} />
                                    <span>Payer 358.80 MAD</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="payment-info">
                    <h3>Pourquoi passer Premium ?</h3>
                    <ul className="premium-features-list">
                        <li>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>Accès complet aux fonctionnalités IA</span>
                        </li>
                        <li>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>Prédiction d'activités rentables par région</span>
                        </li>
                        <li>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>Suggestion de régions optimales par activité</span>
                        </li>
                        <li>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>Chatbot IA spécialisé en entrepreneuriat</span>
                        </li>
                        <li>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>Insights marché en temps réel</span>
                        </li>
                        <li>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>Support prioritaire 24/7</span>
                        </li>
                    </ul>

                    <div className="payment-guarantee">
                        <FontAwesomeIcon icon={faLock} />
                        <div>
                            <h4>Garantie de remboursement</h4>
                            <p>Satisfait ou remboursé sous 30 jours</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
