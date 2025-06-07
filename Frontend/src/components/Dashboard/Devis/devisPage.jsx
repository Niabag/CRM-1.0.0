import { useEffect, useState } from "react";
import DevisPreview from "./devisPreview";
import { API_ENDPOINTS, apiRequest } from "../../../config/api";
import { DEFAULT_DEVIS } from "./constants";
import "./devis.scss";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR");
  } catch (error) {
    return "";
  }
};

const calculateTTC = (devis) => {
  if (!devis || !Array.isArray(devis.articles)) return 0;
  
  return devis.articles.reduce((total, article) => {
    const price = parseFloat(article.unitPrice || 0);
    const qty = parseFloat(article.quantity || 0);
    const tva = parseFloat(article.tvaRate || 0);
    
    if (isNaN(price) || isNaN(qty) || isNaN(tva)) return total;
    
    const ht = price * qty;
    return total + ht + (ht * tva / 100);
  }, 0);
};

const Devis = ({ clients = [], initialDevisFromClient = null, onBack }) => {
  const normalizeClientId = (c) => {
    if (!c) return null;
    return typeof c === "object" && c !== null ? c._id : c;
  };

  const [devisList, setDevisList] = useState([]);
  const [currentDevis, setCurrentDevis] = useState(initialDevisFromClient || DEFAULT_DEVIS);
  const [filterClientId, setFilterClientId] = useState(
    normalizeClientId(initialDevisFromClient?.clientId)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevis = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
        setDevisList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur récupération des devis:", err);
        setError("Erreur lors de la récupération des devis");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDevis();
  }, []);

  useEffect(() => {
    if (initialDevisFromClient) {
      setCurrentDevis(initialDevisFromClient);
      setFilterClientId(normalizeClientId(initialDevisFromClient.clientId));
    }
  }, [initialDevisFromClient]);

  const handleSelectDevis = (devis) => {
    const normalizedClientId = normalizeClientId(devis.clientId);
    const updatedDevis = {
      ...devis,
      clientId: normalizedClientId,
      articles: Array.isArray(devis.articles) ? devis.articles : [],
    };
    setCurrentDevis(updatedDevis);
    setFilterClientId(normalizedClientId);
  };

  const handleReset = () => {
    setCurrentDevis(DEFAULT_DEVIS);
    setFilterClientId(null);
  };

  const handleSave = async (updatedDevis, isEdit = false) => {
    const clientId = normalizeClientId(updatedDevis.clientId);
    if (!clientId) {
      alert("❌ Veuillez sélectionner un client");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit
        ? API_ENDPOINTS.DEVIS.UPDATE(updatedDevis._id)
        : API_ENDPOINTS.DEVIS.BASE;

      const method = isEdit ? "PUT" : "POST";
      
      await apiRequest(url, {
        method,
        body: JSON.stringify({ ...updatedDevis, clientId }),
      });

      // Recharger la liste des devis
      const data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
      setDevisList(Array.isArray(data) ? data : []);

      alert("✅ Devis enregistré avec succès !");
      setCurrentDevis(DEFAULT_DEVIS);
      setFilterClientId(null);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert(`❌ Erreur lors de l'enregistrement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("❗ Supprimer ce devis ?");
    if (!confirm) return;

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.DEVIS.DELETE(id), {
        method: "DELETE",
      });

      setDevisList((prev) => prev.filter((d) => d._id !== id));
      alert("✅ Devis supprimé");
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert(`❌ Erreur lors de la suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (name, value, index = null) => {
    setCurrentDevis((prev) => {
      if (name.startsWith("article-") && index !== null) {
        const key = name.replace("article-", "");
        const updatedArticles = prev.articles.map((article, i) =>
          i === index ? { ...article, [key]: value } : article
        );
        return { ...prev, articles: updatedArticles };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };

  const handleAddArticle = () => {
    const updated = {
      ...currentDevis,
      articles: [
        ...currentDevis.articles,
        { description: "", unitPrice: "", quantity: "1", unit: "", tvaRate: "20" }
      ],
    };
    setCurrentDevis(updated);
  };

  const handleRemoveArticle = (index) => {
    const updated = {
      ...currentDevis,
      articles: currentDevis.articles.filter((_, i) => i !== index)
    };
    setCurrentDevis(updated);
  };

  const totalTTC = calculateTTC(currentDevis);

  if (loading) {
    return (
      <div className="loading-state">
        <div>⏳ Chargement...</div>
      </div>
    );
  }

  return (
    <div className="devis-page">
      {/* Liste des devis existants */}
      <div className="devis-list-section">
        <div className="devis-list-header">
          <h2 className="devis-list-title">📄 Mes Devis</h2>
        </div>
        
        {error && (
          <div className="error-state">{error}</div>
        )}

        {devisList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <p className="empty-message">Aucun devis créé pour le moment</p>
          </div>
        ) : (
          <div className="devis-grid">
            {devisList
              .filter((devis) => devis.title && devis.title.trim() !== "")
              .map((devis) => (
                <div key={devis._id} className="devis-card">
                  <div className="devis-card-header">
                    <h3 className="devis-card-title">{devis.title}</h3>
                    <div className="devis-card-meta">
                      <span>📅 {formatDate(devis.dateDevis)}</span>
                      <span className="devis-card-amount">
                        💰 {calculateTTC(devis).toFixed(2)} € TTC
                      </span>
                    </div>
                  </div>
                  <div className="devis-card-actions">
                    <button 
                      className="card-btn card-btn-edit"
                      onClick={() => handleSelectDevis(devis)}
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      className="card-btn card-btn-delete"
                      onClick={() => handleDelete(devis._id)}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Interface de création/modification */}
      <div className="devis-container">
        {/* Section formulaire */}
        <div className="devis-form-section">
          <div className="devis-form-header">
            <h2 className="devis-form-title">
              {currentDevis._id ? "✏️ Modifier le devis" : "🆕 Nouveau devis"}
            </h2>
          </div>

          {onBack && (
            <button className="btn-secondary" onClick={onBack} style={{marginBottom: '1rem'}}>
              ← Retour aux prospects
            </button>
          )}

          {/* Informations entreprise */}
          <div className="form-section">
            <h3 className="form-section-title">🏢 Informations de l'entreprise</h3>
            
            <div className="form-group">
              <label className="form-label">Logo de l'entreprise</label>
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  className="file-upload-input"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => handleFieldChange("logoUrl", reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div className="file-upload-label">
                  📷 {currentDevis.logoUrl ? "Changer le logo" : "Ajouter un logo"}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nom de l'entreprise</label>
              <input
                type="text"
                className="form-input"
                value={currentDevis.entrepriseName || ""}
                onChange={(e) => handleFieldChange("entrepriseName", e.target.value)}
                placeholder="Nom de votre entreprise"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Adresse</label>
              <input
                type="text"
                className="form-input"
                value={currentDevis.entrepriseAddress || ""}
                onChange={(e) => handleFieldChange("entrepriseAddress", e.target.value)}
                placeholder="123 Rue Exemple"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ville et code postal</label>
              <input
                type="text"
                className="form-input"
                value={currentDevis.entrepriseCity || ""}
                onChange={(e) => handleFieldChange("entrepriseCity", e.target.value)}
                placeholder="75000 Paris"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                className="form-input"
                value={currentDevis.entreprisePhone || ""}
                onChange={(e) => handleFieldChange("entreprisePhone", e.target.value)}
                placeholder="01 23 45 67 89"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={currentDevis.entrepriseEmail || ""}
                onChange={(e) => handleFieldChange("entrepriseEmail", e.target.value)}
                placeholder="contact@entreprise.com"
              />
            </div>
          </div>

          {/* Informations devis */}
          <div className="form-section">
            <h3 className="form-section-title">📋 Informations du devis</h3>
            
            <div className="form-group">
              <label className="form-label">Titre du devis</label>
              <input
                type="text"
                className="form-input"
                value={currentDevis.title || ""}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Titre de votre devis"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Client</label>
              <select
                className="form-select"
                value={currentDevis.clientId || ""}
                onChange={(e) => handleFieldChange("clientId", e.target.value)}
              >
                <option value="">-- Sélectionner un client --</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date du devis</label>
              <input
                type="date"
                className="form-input"
                value={currentDevis.dateDevis || ""}
                onChange={(e) => handleFieldChange("dateDevis", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date de validité</label>
              <input
                type="date"
                className="form-input"
                value={currentDevis.dateValidite || ""}
                onChange={(e) => handleFieldChange("dateValidite", e.target.value)}
              />
            </div>
          </div>

          {/* Articles */}
          <div className="form-section">
            <div className="articles-section">
              <div className="articles-header">
                <h3 className="form-section-title">🛍️ Prestations</h3>
                <button
                  type="button"
                  className="add-article-btn"
                  onClick={handleAddArticle}
                >
                  ➕ Ajouter une ligne
                </button>
              </div>

              {currentDevis.articles.map((article, index) => (
                <div key={index} className="article-item">
                  <div className="article-grid">
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        className="form-input"
                        value={article.description || ""}
                        onChange={(e) => handleFieldChange("article-description", e.target.value, index)}
                        placeholder="Description de la prestation"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Prix unitaire (€)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={article.unitPrice || ""}
                        onChange={(e) => handleFieldChange("article-unitPrice", e.target.value, index)}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Quantité</label>
                      <input
                        type="number"
                        className="form-input"
                        value={article.quantity || ""}
                        onChange={(e) => handleFieldChange("article-quantity", e.target.value, index)}
                        placeholder="1"
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Unité</label>
                      <input
                        type="text"
                        className="form-input"
                        value={article.unit || ""}
                        onChange={(e) => handleFieldChange("article-unit", e.target.value, index)}
                        placeholder="u, h, j..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">TVA</label>
                      <select
                        className="form-select"
                        value={article.tvaRate || "20"}
                        onChange={(e) => handleFieldChange("article-tvaRate", e.target.value, index)}
                      >
                        <option value="20">20%</option>
                        <option value="10">10%</option>
                        <option value="5.5">5.5%</option>
                        <option value="2.1">2.1%</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="remove-article-btn"
                      onClick={() => handleRemoveArticle(index)}
                      title="Supprimer cette ligne"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleSave(currentDevis, !!currentDevis._id)}
              disabled={loading}
            >
              💾 {loading ? "Enregistrement..." : "Enregistrer le devis"}
            </button>
            {currentDevis._id && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
              >
                🔄 Nouveau devis
              </button>
            )}
          </div>
        </div>

        {/* Section aperçu */}
        <div className="devis-preview-section">
          <div className="preview-header">
            <h2 className="preview-title">
              👁️ Aperçu du devis - Total TTC : {totalTTC.toFixed(2)} €
            </h2>
          </div>

          {currentDevis && (
            <DevisPreview
              devisData={currentDevis}
              totalTTC={totalTTC}
              onFieldChange={handleFieldChange}
              onAddArticle={handleAddArticle}
              onRemoveArticle={handleRemoveArticle}
              onReset={handleReset}
              clients={clients}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Devis;