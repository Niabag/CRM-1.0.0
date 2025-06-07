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

const Devis = ({ clients = [], initialDevisFromClient = null, onBack, selectedClientId = null }) => {
  const normalizeClientId = (c) => {
    if (!c) return null;
    return typeof c === "object" && c !== null ? c._id : c;
  };

  const [devisList, setDevisList] = useState([]);
  const [currentDevis, setCurrentDevis] = useState(() => {
    // ✅ CORRECTION: Initialiser avec le client pré-sélectionné
    const baseDevis = initialDevisFromClient || DEFAULT_DEVIS;
    return {
      ...baseDevis,
      clientId: selectedClientId || normalizeClientId(baseDevis.clientId) || ""
    };
  });
  const [filterClientId, setFilterClientId] = useState(
    selectedClientId || normalizeClientId(initialDevisFromClient?.clientId)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevis = async () => {
      setLoading(true);
      setError(null);
      try {
        let data;
        
        // ✅ Si un client spécifique est sélectionné, récupérer uniquement ses devis
        if (filterClientId) {
          console.log("🎯 Récupération des devis pour le client:", filterClientId);
          data = await apiRequest(API_ENDPOINTS.DEVIS.BY_CLIENT(filterClientId));
        } else {
          // Sinon, récupérer tous les devis de l'utilisateur
          data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
        }
        
        setDevisList(Array.isArray(data) ? data : []);
        console.log("📋 Devis récupérés:", data.length);
      } catch (err) {
        console.error("Erreur récupération des devis:", err);
        setError("Erreur lors de la récupération des devis");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDevis();
  }, [filterClientId]); // ✅ Recharger quand le client change

  useEffect(() => {
    if (initialDevisFromClient) {
      setCurrentDevis(initialDevisFromClient);
      const clientId = normalizeClientId(initialDevisFromClient.clientId);
      setFilterClientId(clientId);
    }
  }, [initialDevisFromClient]);

  // ✅ CORRECTION: Mettre à jour le devis courant quand selectedClientId change
  useEffect(() => {
    if (selectedClientId) {
      setFilterClientId(selectedClientId);
      // ✅ Mettre à jour le devis courant avec le client sélectionné
      setCurrentDevis(prev => ({
        ...prev,
        clientId: selectedClientId
      }));
    }
  }, [selectedClientId]);

  const handleSelectDevis = (devis) => {
    const normalizedClientId = normalizeClientId(devis.clientId);
    const updatedDevis = {
      ...devis,
      clientId: normalizedClientId,
      articles: Array.isArray(devis.articles) ? devis.articles : [],
    };
    setCurrentDevis(updatedDevis);
  };

  const handleReset = () => {
    const newDevis = {
      ...DEFAULT_DEVIS,
      clientId: filterClientId || selectedClientId || "" // ✅ Pré-remplir avec le client sélectionné
    };
    setCurrentDevis(newDevis);
  };

  const handleSave = async (updatedDevis, isEdit = false) => {
    // ✅ CORRECTION: Utiliser le clientId du devis courant ou le client sélectionné
    const clientId = normalizeClientId(updatedDevis.clientId) || selectedClientId;
    
    console.log("🔍 Debug sauvegarde:");
    console.log("- updatedDevis.clientId:", updatedDevis.clientId);
    console.log("- selectedClientId:", selectedClientId);
    console.log("- clientId final:", clientId);
    
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
      
      // ✅ S'assurer que le clientId est bien inclus dans les données envoyées
      const devisData = {
        ...updatedDevis,
        clientId: clientId
      };
      
      console.log("📤 Données envoyées:", devisData);
      
      await apiRequest(url, {
        method,
        body: JSON.stringify(devisData),
      });

      // ✅ Recharger les devis du client spécifique ou tous les devis
      let data;
      if (filterClientId) {
        data = await apiRequest(API_ENDPOINTS.DEVIS.BY_CLIENT(filterClientId));
      } else {
        data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
      }
      setDevisList(Array.isArray(data) ? data : []);

      alert("✅ Devis enregistré avec succès !");
      
      // ✅ Réinitialiser avec le client pré-sélectionné
      const newDevis = {
        ...DEFAULT_DEVIS,
        clientId: filterClientId || selectedClientId || ""
      };
      setCurrentDevis(newDevis);
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

  // ✅ FONCTION PDF SIMPLIFIÉE ET CORRIGÉE
  const handleDownloadPDF = async (devis) => {
    try {
      console.log("🔄 Début génération PDF...");
      
      // Importer dynamiquement les modules nécessaires
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      console.log("✅ Modules importés");

      // Obtenir les infos client
      const clientInfo = clients.find(c => c._id === normalizeClientId(devis.clientId)) || {};
      
      // Calculer les totaux
      const tauxTVA = { "20": { ht: 0, tva: 0 }, "10": { ht: 0, tva: 0 }, "5.5": { ht: 0, tva: 0 } };
      
      if (Array.isArray(devis.articles)) {
        devis.articles.forEach((item) => {
          const price = parseFloat(item.unitPrice || "0");
          const qty = parseFloat(item.quantity || "0");
          const taux = item.tvaRate || "20";
          if (!isNaN(price) && !isNaN(qty) && tauxTVA[taux]) {
            const ht = price * qty;
            tauxTVA[taux].ht += ht;
            tauxTVA[taux].tva += ht * (parseFloat(taux) / 100);
          }
        });
      }

      const totalHT = Object.values(tauxTVA).reduce((sum, t) => sum + t.ht, 0);
      const totalTVA = Object.values(tauxTVA).reduce((sum, t) => sum + t.tva, 0);
      const totalTTC = totalHT + totalTVA;

      // Créer un conteneur temporaire simple
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        color: black;
      `;

      // HTML simplifié pour éviter les erreurs
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; background: white; color: black; padding: 20px;">
          <!-- En-tête -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 20px;">
            <div>
              <h2 style="margin: 0; color: #333;">${devis.entrepriseName || 'Entreprise'}</h2>
              <p style="margin: 5px 0;">${devis.entrepriseAddress || ''}</p>
              <p style="margin: 5px 0;">${devis.entrepriseCity || ''}</p>
              <p style="margin: 5px 0;">${devis.entreprisePhone || ''}</p>
              <p style="margin: 5px 0;">${devis.entrepriseEmail || ''}</p>
            </div>
            <div style="text-align: right;">
              <h1 style="margin: 0; font-size: 2.5em; color: #333;">DEVIS</h1>
              <p style="margin: 5px 0;"><strong>N°:</strong> ${devis._id || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(devis.dateDevis)}</p>
              <p style="margin: 5px 0;"><strong>Validité:</strong> ${formatDate(devis.dateValidite)}</p>
            </div>
          </div>
          
          <!-- Client -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Client</h3>
            <p style="margin: 5px 0;"><strong>${clientInfo.name || devis.clientName || 'Client'}</strong></p>
            <p style="margin: 5px 0;">${clientInfo.email || devis.clientEmail || ''}</p>
            <p style="margin: 5px 0;">${clientInfo.phone || devis.clientPhone || ''}</p>
          </div>

          <!-- Tableau des prestations -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #333; color: white;">
                <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Description</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">Unité</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">Qté</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">Prix HT</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">TVA</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${(devis.articles || []).map(article => {
                const price = parseFloat(article.unitPrice || 0);
                const qty = parseFloat(article.quantity || 0);
                const total = price * qty;
                return `
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 10px;">${article.description || ''}</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${article.unit || ''}</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${qty}</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${price.toFixed(2)} €</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${article.tvaRate || 20}%</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${total.toFixed(2)} €</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <!-- Totaux -->
          <div style="text-align: right; margin-bottom: 30px;">
            <p style="margin: 5px 0; font-size: 1.1em;"><strong>Total HT: ${totalHT.toFixed(2)} €</strong></p>
            <p style="margin: 5px 0; font-size: 1.1em;"><strong>Total TVA: ${totalTVA.toFixed(2)} €</strong></p>
            <p style="margin: 5px 0; font-size: 1.2em;"><strong>Total TTC: ${totalTTC.toFixed(2)} €</strong></p>
          </div>

          <!-- Signature -->
          <div style="margin-top: 50px; text-align: center;">
            <p style="font-style: italic;">Bon pour accord - Date et signature :</p>
            <div style="margin-top: 30px; border-bottom: 1px solid #000; width: 200px; margin-left: auto; margin-right: auto;"></div>
          </div>
        </div>
      `;

      document.body.appendChild(tempDiv);
      console.log("✅ Conteneur ajouté au DOM");

      // Attendre un peu pour le rendu
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capturer avec html2canvas
      console.log("🔄 Capture en cours...");
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      console.log("✅ Capture terminée");

      // Créer le PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Télécharger le PDF
      const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devis._id}`;
      pdf.save(`${fileName}.pdf`);

      // Nettoyer
      document.body.removeChild(tempDiv);
      console.log("✅ PDF généré avec succès");
      
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF: ' + error.message);
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

  // ✅ Filtrer les devis affichés selon le client sélectionné
  const filteredDevisList = filterClientId 
    ? devisList.filter(devis => {
        const devisClientId = normalizeClientId(devis.clientId);
        return devisClientId === filterClientId;
      })
    : devisList;

  // ✅ Obtenir le nom du client sélectionné
  const selectedClient = filterClientId 
    ? clients.find(c => c._id === filterClientId)
    : null;

  if (loading && devisList.length === 0) {
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
          <h2 className="devis-list-title">
            📄 {selectedClient ? `Devis de ${selectedClient.name}` : "Mes Devis"}
          </h2>
          {selectedClient && (
            <p style={{textAlign: 'center', color: '#718096', marginTop: '0.5rem'}}>
              📧 {selectedClient.email} • 📞 {selectedClient.phone}
            </p>
          )}
        </div>
        
        {error && (
          <div className="error-state">{error}</div>
        )}

        {onBack && (
          <button className="btn-secondary" onClick={onBack} style={{marginBottom: '2rem'}}>
            ← Retour aux prospects
          </button>
        )}

        {filteredDevisList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <p className="empty-message">
              {selectedClient 
                ? `Aucun devis créé pour ${selectedClient.name}`
                : "Aucun devis créé pour le moment"
              }
            </p>
          </div>
        ) : (
          <div className="devis-grid">
            {filteredDevisList
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
                      className="card-btn card-btn-pdf"
                      onClick={() => handleDownloadPDF(devis)}
                    >
                      📄 PDF
                    </button>
                    <button 
                      className="card-btn card-btn-delete"
                      onClick={() => handleDelete(devis._id)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Aperçu du devis - Section unique */}
      <div className="devis-preview-container">
        <div className="preview-header">
          <h2 className="preview-title">
            {currentDevis._id 
              ? `✏️ Modification du devis : ${currentDevis.title || "Sans titre"}` 
              : `🆕 Nouveau devis${selectedClient ? ` pour ${selectedClient.name}` : ""}`
            }
          </h2>
          <div className="preview-subtitle">
            Total TTC : <span className="total-amount">{totalTTC.toFixed(2)} €</span>
          </div>
        </div>

        <div className="preview-actions">
          <button
            className="btn-save"
            onClick={() => handleSave(currentDevis, !!currentDevis._id)}
            disabled={loading}
          >
            💾 {loading ? "Enregistrement..." : "Enregistrer le devis"}
          </button>
          
          {/* ✅ NOUVEAU: Bouton "Nouveau devis" seulement quand on modifie un devis existant */}
          {currentDevis._id && (
            <button
              className="btn-new"
              onClick={handleReset}
            >
              🆕 Nouveau devis
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