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
  const [currentDevis, setCurrentDevis] = useState(initialDevisFromClient || DEFAULT_DEVIS);
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

  // ✅ Mettre à jour le filtre quand selectedClientId change
  useEffect(() => {
    if (selectedClientId) {
      setFilterClientId(selectedClientId);
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
      clientId: filterClientId || "" // ✅ Pré-remplir avec le client sélectionné
    };
    setCurrentDevis(newDevis);
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
        clientId: filterClientId || ""
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

  // ✅ FONCTION PDF CORRIGÉE - Sans masquage, rendu direct
  const handleDownloadPDF = async (devis) => {
    try {
      // Importer dynamiquement les modules nécessaires
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      // Créer le contenu HTML du devis
      const devisHTML = generateDevisHTML(devis);
      
      // Créer un conteneur temporaire VISIBLE pour le rendu
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 794px;
        min-height: 1123px;
        background: white;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #000;
        padding: 40px;
        box-sizing: border-box;
        transform: scale(1);
        transform-origin: top left;
      `;
      
      tempContainer.innerHTML = devisHTML;
      document.body.appendChild(tempContainer);

      // Attendre que le contenu soit complètement rendu
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Générer le canvas avec des paramètres optimisés
      const canvas = await html2canvas(tempContainer, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: tempContainer.scrollHeight,
        logging: false,
        removeContainer: false,
        foreignObjectRendering: true
      });

      // Créer le PDF en format A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calculer les dimensions pour remplir la page A4
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;

      // Ajouter la première page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= pdfHeight;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
        heightLeft -= pdfHeight;
      }

      // Télécharger le PDF
      const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devis._id}`;
      pdf.save(`${fileName}.pdf`);

      // Nettoyer immédiatement
      document.body.removeChild(tempContainer);
      
      console.log('✅ PDF généré avec succès');
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF');
    }
  };

  // ✅ Fonction pour générer le HTML du devis optimisé pour PDF
  const generateDevisHTML = (devis) => {
    const totalTTC = calculateTTC(devis);
    const clientInfo = clients.find(c => c._id === devis.clientId) || {};
    
    return `
      <div style="width: 100%; background: white; color: black; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4;">
        <!-- En-tête -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <div style="flex: 1;">
            <h2 style="margin: 0 0 10px 0; color: #333; font-size: 18px; font-weight: bold;">${devis.entrepriseName || 'Entreprise'}</h2>
            <div style="font-size: 11px; line-height: 1.5;">
              <div>${devis.entrepriseAddress || ''}</div>
              <div>${devis.entrepriseCity || ''}</div>
              <div>${devis.entreprisePhone || ''}</div>
              <div>${devis.entrepriseEmail || ''}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <h1 style="margin: 0; font-size: 32px; color: #333; font-weight: bold;">DEVIS</h1>
            <div style="font-size: 11px; margin-top: 10px;">
              <div><strong>N°:</strong> ${devis._id?.slice(-8) || 'N/A'}</div>
              <div><strong>Date:</strong> ${formatDate(devis.dateDevis)}</div>
              <div><strong>Validité:</strong> ${formatDate(devis.dateValidite)}</div>
            </div>
          </div>
        </div>
        
        <!-- Informations client -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin: 0 0 10px 0; font-size: 14px;">DESTINATAIRE</h3>
          <div style="font-size: 11px; line-height: 1.5;">
            <div style="font-weight: bold; margin-bottom: 5px;">${clientInfo.name || devis.clientName || 'Client'}</div>
            <div>${clientInfo.email || devis.clientEmail || ''}</div>
            <div>${clientInfo.phone || devis.clientPhone || ''}</div>
            <div>${devis.clientAddress || ''}</div>
          </div>
        </div>

        <!-- Tableau des prestations -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px;">
          <thead>
            <tr style="background: #333; color: white;">
              <th style="border: 1px solid #333; padding: 8px; text-align: left; font-weight: bold;">Description</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; width: 60px;">Qté</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; width: 70px;">Prix HT</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; width: 50px;">TVA</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; width: 70px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${devis.articles.map(article => {
              const price = parseFloat(article.unitPrice || 0);
              const qty = parseFloat(article.quantity || 0);
              const total = price * qty;
              return `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 8px;">${article.description || ''}</td>
                  <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${qty} ${article.unit || ''}</td>
                  <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${price.toFixed(2)} €</td>
                  <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${article.tvaRate || 20}%</td>
                  <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold;">${total.toFixed(2)} €</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Total -->
        <div style="text-align: right; margin-bottom: 30px;">
          <div style="display: inline-block; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 2px solid #007bff;">
            <div style="font-size: 16px; font-weight: bold; color: #333;">
              Total TTC: ${totalTTC.toFixed(2)} €
            </div>
          </div>
        </div>

        <!-- Conditions -->
        <div style="margin-top: 40px; font-size: 10px; color: #666;">
          <div style="margin-bottom: 20px;">
            <strong>Conditions :</strong><br>
            • Devis valable jusqu'au ${devis.dateValidite ? formatDate(devis.dateValidite) : "date à définir"}<br>
            • Règlement à 30 jours fin de mois<br>
            • TVA non applicable, art. 293 B du CGI (si applicable)
          </div>
          
          <div style="text-align: center; margin-top: 50px;">
            <div style="font-style: italic; margin-bottom: 25px;">
              Bon pour accord - Date et signature du client :
            </div>
            <div style="border-bottom: 2px solid #000; width: 200px; margin: 0 auto;"></div>
          </div>
        </div>
      </div>
    `;
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