import React, { useState, useEffect } from 'react';
import './settings.scss';

const Settings = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(prev => ({
        ...prev,
        name: parsedUser.name || '',
        email: parsedUser.email || ''
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setUser(prev => ({
      ...prev,
      [field]: value
    }));
    setMessage({ type: '', text: '' });
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      } else {
        throw new Error('Erreur lors de la mise à jour du profil');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (user.newPassword !== user.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (user.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: user.currentPassword,
          newPassword: user.newPassword
        })
      });

      if (response.ok) {
        setUser(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès !' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du mot de passe');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crm-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: 'Données exportées avec succès !' });
      } else {
        throw new Error('Erreur lors de l\'export des données');
      }
    } catch (err)  {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <h2>⚙️ Paramètres</h2>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-sections">
        {/* Profil utilisateur */}
        <div className="settings-section">
          <h3>👤 Profil utilisateur</h3>
          
          <div className="form-group">
            <label>Nom complet</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Votre nom complet"
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="votre@email.com"
            />
          </div>
          
          <button
            onClick={updateProfile}
            disabled={loading}
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
          </button>
        </div>

        {/* Sécurité */}
        <div className="settings-section">
          <h3>🔒 Sécurité</h3>
          
          <div className="form-group">
            <label>Mot de passe actuel</label>
            <input
              type="password"
              value={user.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              placeholder="Mot de passe actuel"
            />
          </div>
          
          <div className="form-group">
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              value={user.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              placeholder="Nouveau mot de passe"
            />
          </div>
          
          <div className="form-group">
            <label>Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={user.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirmer le mot de passe"
            />
          </div>
          
          <button
            onClick={updatePassword}
            disabled={loading || !user.currentPassword || !user.newPassword}
          >
            {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
          </button>
        </div>

        {/* Données */}
        <div className="settings-section">
          <h3>💾 Gestion des données</h3>
          
          <div className="data-actions">
            <button
              onClick={exportData}
              disabled={loading}
              className="export-btn"
            >
              {loading ? 'Export en cours...' : '📥 Exporter mes données'}
            </button>
            <p className="help-text">
              Téléchargez toutes vos données (clients, devis, etc.) au format JSON
            </p>
          </div>
        </div>

        {/* Informations de l'application */}
        <div className="settings-section">
          <h3>ℹ️ Informations</h3>
          
          <div className="app-info">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Dernière mise à jour:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
            <p><strong>Support:</strong> contact@crm-pro.fr</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;