import React, { useState, useEffect } from 'react';
import './registerClient.scss';

const RegisterClient = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessCard, setBusinessCard] = useState(null);
  const [actions, setActions] = useState([]);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Récupérer l'ID de la carte depuis l'URL
  const getCardIdFromUrl = () => {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  };

  // Charger les données de la carte de visite
  useEffect(() => {
    const loadBusinessCard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const cardId = getCardIdFromUrl();
        console.log('🔍 Chargement de la carte:', cardId);
        
        if (!cardId || cardId === 'register-client') {
          throw new Error('ID de carte invalide');
        }

        // Ajouter un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/business-cards/${cardId}?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📋 Données reçues:', data);
        
        setBusinessCard(data);
        
        // Traiter les actions avec cache-busting
        if (data.actions && Array.isArray(data.actions)) {
          const activeActions = data.actions
            .filter(action => action.active !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          
          console.log('🎯 Actions actives trouvées:', activeActions);
          setActions(activeActions);
        } else {
          console.log('❌ Aucune action trouvée');
          setActions([]);
        }
        
      } catch (err) {
        console.error('❌ Erreur lors du chargement:', err);
        setError(err.message);
        setActions([]); // Assurer qu'on a un tableau vide en cas d'erreur
      } finally {
        setLoading(false);
      }
    };

    loadBusinessCard();
  }, []);

  // Gérer les changements de formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      const cardId = getCardIdFromUrl();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'business_card',
          businessCardId: cardId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'inscription');
      }
      
      console.log('✅ Inscription réussie');
      setSubmitSuccess(true);
      
      // Exécuter les actions suivantes après inscription
      executeNextActions();
      
    } catch (err) {
      console.error('❌ Erreur inscription:', err);
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exécuter les actions suivantes
  const executeNextActions = () => {
    const remainingActions = actions.slice(currentActionIndex + 1);
    
    remainingActions.forEach((action, index) => {
      setTimeout(() => {
        executeAction(action);
      }, index * 1000);
    });
  };

  // Exécuter une action
  const executeAction = (action) => {
    console.log('🎬 Exécution de l\'action:', action);
    
    switch (action.type) {
      case 'redirect':
        if (action.url) {
          console.log('🔗 Redirection vers:', action.url);
          window.location.href = action.url;
        }
        break;
        
      case 'download':
        if (action.fileUrl) {
          console.log('📥 Téléchargement:', action.fileUrl);
          const link = document.createElement('a');
          link.href = action.fileUrl;
          link.download = action.fileName || 'document';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;
        
      default:
        console.log('❓ Type d\'action non reconnu:', action.type);
    }
  };

  // Téléchargement manuel
  const handleManualDownload = () => {
    const downloadAction = actions.find(action => action.type === 'download');
    if (downloadAction) {
      executeAction(downloadAction);
    }
  };

  // Déterminer ce qu'il faut afficher
  const shouldShowForm = () => {
    // Toujours afficher le formulaire s'il y a une action 'form' OU si pas d'actions
    return actions.length === 0 || actions.some(action => action.type === 'form');
  };

  const shouldShowDownloadOnly = () => {
    // Afficher téléchargement seulement s'il n'y a QUE des actions de téléchargement
    return actions.length > 0 && 
           actions.every(action => action.type === 'download') && 
           !actions.some(action => action.type === 'form');
  };

  console.log('🔍 État actuel:', {
    loading,
    error,
    actionsCount: actions.length,
    actions: actions.map(a => ({ type: a.type, active: a.active })),
    shouldShowForm: shouldShowForm(),
    shouldShowDownloadOnly: shouldShowDownloadOnly(),
    submitSuccess
  });

  // Affichage du loading
  if (loading) {
    return (
      <div className="register-client-container">
        <div className="loading-container">
          <div className="loading-message">
            <h2>⏳ Chargement...</h2>
            <p>Récupération des informations de la carte de visite...</p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="register-client-container">
        <div className="no-actions-container">
          <div className="no-actions-message">
            <h2>❌ Erreur</h2>
            <p>Impossible de charger la carte de visite : {error}</p>
            <p>Vous pouvez tout de même vous inscrire :</p>
          </div>
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-section">
              <h3>📝 Vos informations</h3>
              <input
                type="text"
                name="name"
                placeholder="Nom complet *"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Téléphone"
                value={formData.phone}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="company"
                placeholder="Entreprise"
                value={formData.company}
                onChange={handleInputChange}
              />
              <textarea
                name="notes"
                placeholder="Message ou demande particulière"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ Inscription...' : '✅ S\'inscrire'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Affichage après inscription réussie
  if (submitSuccess) {
    return (
      <div className="register-client-container">
        <div className="actions-completed">
          <div className="completion-message">
            <h2>✅ Inscription réussie !</h2>
            <p>Merci pour votre inscription. Nous vous contacterons bientôt.</p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage téléchargement uniquement
  if (shouldShowDownloadOnly()) {
    const downloadAction = actions.find(action => action.type === 'download');
    
    return (
      <div className="register-client-container">
        <div className="download-only-container">
          <div className="download-message">
            <h2>📥 Téléchargement disponible</h2>
            <p>Un document est disponible au téléchargement.</p>
          </div>
          
          <div className="manual-download-section">
            <button 
              onClick={handleManualDownload}
              className="manual-download-btn"
              disabled={!downloadAction?.fileUrl}
            >
              📥 Télécharger {downloadAction?.fileName || 'le document'}
            </button>
            <p className="download-help">
              Cliquez sur le bouton pour télécharger le document.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage du formulaire (cas par défaut)
  return (
    <div className="register-client-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>📝 Inscription</h2>
        <p className="form-subtitle">
          {businessCard?.companyName ? 
            `Contactez ${businessCard.companyName}` : 
            'Laissez-nous vos coordonnées'
          }
        </p>
        
        {submitError && (
          <div className="error-message">
            ❌ {submitError}
          </div>
        )}
        
        {actions.length > 0 && (
          <div className="actions-list">
            <h3>📋 Actions configurées</h3>
            <ul>
              {actions.map((action, index) => (
                <li key={index}>
                  {action.type === 'form' && '📝 Formulaire d\'inscription'}
                  {action.type === 'download' && `📥 Téléchargement: ${action.fileName || 'Document'}`}
                  {action.type === 'redirect' && `🔗 Redirection: ${action.url || 'URL'}`}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="form-section">
          <h3>📝 Vos informations</h3>
          <div className="form-row">
            <input
              type="text"
              name="name"
              placeholder="Nom complet *"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-row">
            <input
              type="tel"
              name="phone"
              placeholder="Téléphone"
              value={formData.phone}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="company"
              placeholder="Entreprise"
              value={formData.company}
              onChange={handleInputChange}
            />
          </div>
          <textarea
            name="notes"
            placeholder="Message ou demande particulière"
            value={formData.notes}
            onChange={handleInputChange}
            rows="4"
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? '⏳ Inscription en cours...' : '✅ S\'inscrire'}
        </button>
        
        <p className="form-footer">
          Vos données sont sécurisées et ne seront pas partagées.
        </p>
      </form>
    </div>
  );
};

export default RegisterClient;