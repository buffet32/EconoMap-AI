import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';

const AjouterUtilisateur = () => {
  const [form, setForm] = useState({
    username: "",
    numero_telephone: "",
    numero_carte: "",
    email: "",
    password: "",
    password2: "",
    role: "responsable"
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    if (form.password !== form.password2) {
      setMessage("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }
    const storedUser = localStorage.getItem('user');
    let token = "";
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        token = parsed.access || (parsed.user && parsed.user.access) || parsed.access_token;
      } catch {}
    }
    try {
      const response = await fetch("http://127.0.0.1:8000/api/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData) || "Erreur lors de la création de l'utilisateur");
      }
      setMessage("Utilisateur ajouté avec succès !");
      setTimeout(() => navigate("/AdashM"), 1500);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ color: "#8c54bc", marginBottom: 24 }}>
        <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 10 }} />
        Ajouter un utilisateur
      </h2>
      {message && (
        <div style={{ color: message.includes("succès") ? "#4fd1c5" : "#e53e3e", marginBottom: 16 }}>{message}</div>
      )}
      <form className="dashboard-search" onSubmit={handleSubmit}>
        <div className="dashboard-search-fields" style={{ flexDirection: "column", gap: 18 }}>
          <label>
            Nom d'utilisateur<br />
            <input className="dashboard-input" name="username" value={form.username} onChange={handleChange} required />
          </label>
          <label>
            Numéro de téléphone<br />
            <input className="dashboard-input" name="numero_telephone" value={form.numero_telephone} onChange={handleChange} required />
          </label>
          <label>
            Numéro de carte<br />
            <input className="dashboard-input" name="numero_carte" value={form.numero_carte} onChange={handleChange} required />
          </label>
          <label>
            Email (optionnel)<br />
            <input className="dashboard-input" name="email" value={form.email} onChange={handleChange} type="email" />
          </label>
          <label>
            Mot de passe<br />
            <input className="dashboard-input" name="password" value={form.password} onChange={handleChange} type="password" required />
          </label>
          <label>
            Confirmer le mot de passe<br />
            <input className="dashboard-input" name="password2" value={form.password2} onChange={handleChange} type="password" required />
          </label>
          <label>
            Rôle<br />
            <select className="dashboard-input" name="role" value={form.role} onChange={handleChange} required>
              <option value="responsable">Responsable</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <div className="dashboard-search-actions" style={{ marginTop: 24 }}>
          <button type="submit" style={{ background: "#fbbf24", color: "#23233a" }} disabled={loading}>
            <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 8 }} />
            Ajouter
          </button>
          <button type="button" style={{ background: "#6b7280", color: "#fff", marginLeft: 12 }} onClick={() => navigate("/AdashM")}>Annuler</button>
        </div>
      </form>
    </div>
  );
};

export default AjouterUtilisateur;
