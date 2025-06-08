import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DevisPreview from './devisPreview.jsx';
import './devis.scss';

const DevisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [devis, setDevis] = useState({
    devisNumber: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientId: '',
    companyName: 'Mon Entreprise',
    companyAddress: 'Adresse de l\'entreprise',
    companyPhone: '01 23 45 67 89',
    companyEmail: 'contact@monentreprise.fr',
    date: new Date().toISOString().split('T')[0],
    validityDate: '',
    status: 'brouillon',
    articles: [
      {
        description: 'Prestation exemple',
        quantity: 1,
        unitPrice: 0,
        tva: 20,
        total: 0
      }
    ],
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    conditions: 'Conditions générales de vente...'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      loadDevis();
    } else {
      generateDevisNumber();
    }
  }, [id]);

  useEffect(() => {
    calculateTotals();
  }, [devis.articles]);

  const loadDevis = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/devis/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDevis(data);
      } else {
        throw new Error('Devis non trouvé');
      }
    } catch (err) {
      console.error('Erreur chargement devis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateDevisNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    setDevis(prev => ({
      ...prev,
      devisNumber: `DEV-${year}${month}${day}-${random}`
    }));
  };

  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;

    devis.articles.forEach(article => {
      const articleTotal = (article.quantity || 0) * (article.unitPrice || 0);
      const articleTVA = articleTotal * ((article.tva || 0) / 100);
      
      totalHT += articleTotal;
      totalTVA += articleTVA;
    });

    const totalTTC = totalHT + totalTVA;

    setDevis(prev => ({
      ...prev,
      totalHT: Math.round(totalHT * 100) / 100,
      totalTVA: Math.round(totalTVA * 100) / 100,
      totalTTC: Math.round(totalTTC * 100) / 100
    }));
  };

  const handleInputChange = (field, value) => {
    setDevis(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArticleChange = (index, field, value) => {
    const newArticles = [...devis.articles];
    newArticles[index] = {
      ...newArticles[index],
      [field]: value
    };

    // Recalculer le total de l'article
    if (field === 'quantity' || field === 'unitPrice') {
      newArticles[index].total = (newArticles[index].quantity || 0) * (newArticles[index].unitPrice || 0);
    }

    setDevis(prev => ({
      ...prev,
      articles: newArticles
    }));
  };

  const addArticle = () => {
    setDevis(prev => ({
      ...prev,
      articles: [
        ...prev.articles,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          tva: 20,
          total: 0
        }
      ]
    }));
  };

  const removeArticle = (index) => {
    if (devis.articles.length > 1) {
      setDevis(prev => ({
        ...prev,
        articles: prev.articles.filter((_, i) => i !== index)
      }));
    }
  };

  const resetDevis = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le devis ?')) {
      setDevis({
        devisNumber: '',
        clientName: '',
        clientEmail: '',
        clientAddress: '',
        clientId: '',
        companyName: 'Mon Entreprise',
        companyAddress: 'Adresse de l\'entreprise',
        companyPhone: '01 23 45 67 89',
        companyEmail: 'contact@monentreprise.fr',
        date: new Date().toISOString().split('T')[0],
        validityDate: '',
        status: 'brouillon',
        articles: [
          {
            description: 'Prestation exemple',
            quantity: 1,
            unitPrice: 0,
            tva: 20,
            total: 0
          }
        ],
        totalHT: 0,
        totalTVA: 0,
        totalTTC: 0,
        conditions: 'Conditions générales de vente...'
      });
      generateDevisNumber();
    }
  };

  const saveDevis = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL}/api/devis/${id}`
        : `${import.meta.env.VITE_API_URL}/api/devis`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(devis)
      });

      if (response.ok) {
        const savedDevis = await response.json();
        if (!isEditing) {
          navigate(`/dashboard/devis/edit/${savedDevis._id}`);
        }
        alert('Devis sauvegardé avec succès !');
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="devis-page">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Chargement du devis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="devis-page">
      <div className="devis-preview-container">
        <div className="preview-header">
          <h2 className="preview-title">
            {isEditing ? 'Modification du devis' : 'Nouveau devis'}
          </h2>
          <p className="preview-subtitle">
            Devis #{devis.devisNumber} - Total: <span className="total-amount">{devis.totalTTC.toFixed(2)}€</span>
          </p>
        </div>

        {error && (
          <div className="error-state">❌ {error}</div>
        )}

        <div className="preview-actions">
          <button onClick={addArticle} className="btn-new">
            ➕ Ajouter un article
          </button>
          <button onClick={resetDevis} className="btn-secondary">
            🔄 Réinitialiser
          </button>
          <button 
            onClick={saveDevis} 
            disabled={saving}
            className="btn-save"
          >
            {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>

        <DevisPreview
          devis={devis}
          onInputChange={handleInputChange}
          onArticleChange={handleArticleChange}
          onRemoveArticle={removeArticle}
          isEditable={true}
        />
      </div>
    </div>
  );
};

export default DevisPage;