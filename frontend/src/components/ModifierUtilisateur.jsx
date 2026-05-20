import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';

const ModifierUtilisateur = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    numero_telephone: "",
    numero_carte: "",
    email: "",
    role: "responsable",
    is_active: true
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let token = "";
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        token = parsed.access || (parsed.user && parsed.user.access) || parsed.access_token;
      } catch {}
    }
    if (!token) return;
    fetch(`http://127.0.0.1:8000/api/users/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setForm({
          username: data.username || "",
          numero_telephone: data.numero_telephone || "",
          numero_carte: data.numero_carte || "",
          email: data.email || "",
          role: data.role || "responsable",
          is_active: data.is_active
        });
      })
      .catch(() => setMessage("Erreur lors du chargement de l'utilisateur"));
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const storedUser = localStorage.getItem('user');
    let token = "";
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        token = parsed.access || (parsed.user && parsed.user.access) || parsed.access_token;
      } catch {}
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData) || "Erreur lors de la modification");
      }
      setMessage("Utilisateur modifié avec succès !");
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
        <FontAwesomeIcon icon={faPen} style={{ marginRight: 10 }} />
        Modifier utilisateur
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
            Rôle<br />
            <select className="dashboard-input" name="role" value={form.role} onChange={handleChange} required>
              <option value="responsable">Responsable</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Statut<br />
            <select className="dashboard-input" name="is_active" value={form.is_active ? "true" : "false"} onChange={e => setForm({ ...form, is_active: e.target.value === "true" })} required>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </label>
        </div>
        <div className="dashboard-search-actions" style={{ marginTop: 24 }}>
          <button type="submit" style={{ background: "#8c54bc", color: "#fff" }} disabled={loading}>
            <FontAwesomeIcon icon={faPen} style={{ marginRight: 8 }} />
            Modifier
          </button>
          <button type="button" style={{ background: "#6b7280", color: "#fff", marginLeft: 12 }} onClick={() => navigate("/AdashM")}>Annuler</button>
        </div>
      </form>
    </div>
  );
};

export default ModifierUtilisateur;
