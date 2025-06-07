import { useEffect, useState } from "react";
import DevisPreview from "./devisPreview";
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
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchDevis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:5000/api/devis", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`);
        }
        
        const data = await res.json();
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
    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Token d'authentification manquant");
      return;
    }

    const clientId = normalizeClientId(updatedDevis.clientId);
    if (!clientId) {
      alert("❌ Veuillez sélectionner un client");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit
        ? `http://localhost:5000/api/devis/${updatedDevis._id}`
        : "http://localhost:5000/api/devis";

      const method = isEdit ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...updatedDevis, clientId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'enregistrement");
      }

      // Recharger la liste des devis
      const res = await fetch("http://localhost:5000/api/devis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setDevisList(Array.isArray(data) ? data : []);
      }

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

    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/devis/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la suppression");
      }

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
    return <div className="loading">Chargement...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="devis-page">
      {onBack && (
        <button className="back-button\" onClick={onBack}>
          ← Retour aux prospects
        </button>
      )}

      <div className="devis-list-section">
        <h3>Modifier/Télécharger un devis existant</h3>
        <div className="containerDevisListItems">
          {devisList.length === 0 ? (
            <p>Aucun devis trouvé</p>
          ) : (
            devisList
              .filter((devis) => devis.title && devis.title.trim() !== "")
              .map((devis) => (
                <div key={devis._id} className="devis-item">
                  <div className="devis-info">
                    <strong>{devis.title}</strong>
                    <div className="devis-sub">
                      📅 {formatDate(devis.dateDevis)} — 💰 {calculateTTC(devis).toFixed(2)} € TTC
                    </div>
                  </div>
                  <div className="devis-actions">
                    <button onClick={() => handleSelectDevis(devis)}>✏️ Modifier</button>
                    <button onClick={() => handleDelete(devis._id)}>🗑️ Supprimer</button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="containerDevisPreview">
        {currentDevis && (
          <div className="devis-meta-header">
            <h2 className="devis-title">
              {currentDevis._id
                ? `✏️ Modification du devis du ${formatDate(currentDevis.dateDevis)} — Total TTC : ${totalTTC.toFixed(2)} €`
                : `🆕 Nouveau devis — Total TTC : ${totalTTC.toFixed(2)} €`}
            </h2>
          </div>
        )}

        <div className="actions">
          <button 
            onClick={() => handleSave(currentDevis, !!currentDevis._id)}
            disabled={loading}
          >
            💾 {loading ? "Enregistrement..." : "Enregistrer le devis"}
          </button>
          {currentDevis._id && (
            <button className="cancel-button" onClick={handleReset}>
              ❌ Annuler
            </button>
          )}
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
  );
};

export default Devis;