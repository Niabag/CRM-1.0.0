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

  // ✅ FONCTION PDF AMÉLIORÉE - Utilise le rendu existant du devis
  const handleDownloadPDF = async (devis) => {
    try {
      // Importer dynamiquement les modules nécessaires
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      // Créer un conteneur temporaire avec le composant DevisPreview
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 1200px;
        background: white;
        z-index: 9999;
        padding: 20px;
        box-sizing: border-box;
      `;

      // Créer une version temporaire du devis pour le PDF
      const pdfDevis = {
        ...devis,
        articles: Array.isArray(devis.articles) ? devis.articles : [],
        clientId: normalizeClientId(devis.clientId)
      };

      // Obtenir les informations du client
      const clientInfo = clients.find(c => c._id === pdfDevis.clientId) || {};

      // Créer le HTML du devis en utilisant la même structure que DevisPreview
      tempContainer.innerHTML = `
        <div class="devis-preview pdf-mode" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; color: #000; padding: 3rem; border: 2px solid #e2e8f0; border-radius: 12px; min-height: 800px;">
          
          <!-- En-tête du document -->
          <div class="document-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 3px solid #e2e8f0;">
            <div class="logo-section" style="flex: 1;">
              ${pdfDevis.logoUrl ? `<img src="${pdfDevis.logoUrl}" alt="Logo entreprise" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);" />` : ''}
            </div>
            <div class="document-title" style="flex: 1; text-align: right;">
              <h1 style="font-size: 3rem; font-weight: 700; margin: 0; color: #2d3748; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1); letter-spacing: 2px;">DEVIS</h1>
            </div>
          </div>

          <!-- Informations des parties -->
          <div class="parties-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 3rem;">
            <div class="entreprise-section" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Émetteur</h3>
              <div class="info-group" style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${pdfDevis.entrepriseName || ""}</div>
                <div>${pdfDevis.entrepriseAddress || ""}</div>
                <div>${pdfDevis.entrepriseCity || ""}</div>
                <div>${pdfDevis.entreprisePhone || ""}</div>
                <div>${pdfDevis.entrepriseEmail || ""}</div>
              </div>
            </div>

            <div class="client-section" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Destinataire</h3>
              <div class="info-group" style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${pdfDevis.clientName || clientInfo.name || ""}</div>
                <div>${pdfDevis.clientEmail || clientInfo.email || ""}</div>
                <div>${pdfDevis.clientPhone || clientInfo.phone || ""}</div>
                <div>${pdfDevis.clientAddress || ""}</div>
              </div>
            </div>
          </div>

          <!-- Métadonnées du devis -->
          <div class="devis-metadata" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 3rem;">
            <div class="metadata-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div class="metadata-item" style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date du devis :</label>
                <span>${formatDate(pdfDevis.dateDevis)}</span>
              </div>
              <div class="metadata-item" style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Numéro de devis :</label>
                <span style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${pdfDevis._id || pdfDevis.devisNumber || "À définir"}</span>
              </div>
              <div class="metadata-item" style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date de validité :</label>
                <span>${formatDate(pdfDevis.dateValidite)}</span>
              </div>
              <div class="metadata-item" style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Client ID :</label>
                <span style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${pdfDevis.clientId || "N/A"}</span>
              </div>
            </div>
          </div>

          <!-- Section prestations -->
          <div class="prestations-section" style="margin-bottom: 3rem;">
            <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.3rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">Détail des prestations</h3>
            <table class="prestations-table" style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);">
              <thead>
                <tr style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); color: white;">
                  <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                  <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Unité</th>
                  <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Qté</th>
                  <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Prix unitaire HT</th>
                  <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">TVA</th>
                  <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Total HT</th>
                </tr>
              </thead>
              <tbody>
                ${pdfDevis.articles.map((article, index) => {
                  const price = parseFloat(article.unitPrice || "0");
                  const qty = parseFloat(article.quantity || "0");
                  const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
                  
                  return `
                    <tr style="background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                      <td style="padding: 1rem 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; vertical-align: middle; max-width: 300px;">${article.description || ""}</td>
                      <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">${article.unit || ""}</td>
                      <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">${article.quantity || ""}</td>
                      <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">${article.unitPrice || ""} €</td>
                      <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">${article.tvaRate || "20"}%</td>
                      <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; vertical-align: middle; font-weight: 600; color: #48bb78;">${total.toFixed(2)} €</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Récapitulatif des totaux -->
          <div class="totaux-section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem;">
            <div class="totaux-detail">
              <h4 style="margin: 0 0 1rem 0; color: #2d3748; font-weight: 600;">Récapitulatif TVA</h4>
              <!-- Calcul TVA ici si nécessaire -->
            </div>

            <div class="totaux-finaux" style="display: flex; flex-direction: column; gap: 0.75rem; align-self: end;">
              <div class="total-line" style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8f9fa; border-radius: 6px; font-weight: 500;">
                <span>Total HT :</span>
                <span>${pdfDevis.articles.reduce((sum, item) => {
                  const price = parseFloat(item.unitPrice || 0);
                  const qty = parseFloat(item.quantity || 0);
                  return sum + (price * qty);
                }, 0).toFixed(2)} €</span>
              </div>
              <div class="total-line" style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8f9fa; border-radius: 6px; font-weight: 500;">
                <span>Total TVA :</span>
                <span>${pdfDevis.articles.reduce((sum, item) => {
                  const price = parseFloat(item.unitPrice || 0);
                  const qty = parseFloat(item.quantity || 0);
                  const tva = parseFloat(item.tvaRate || 0);
                  const ht = price * qty;
                  return sum + (ht * tva / 100);
                }, 0).toFixed(2)} €</span>
              </div>
              <div class="final-total" style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; font-weight: 700; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3); border-radius: 6px;">
                <span>Total TTC :</span>
                <span>${calculateTTC(pdfDevis).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <!-- Conditions et signature -->
          <div class="conditions-section" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
            <div class="conditions-text" style="margin-bottom: 2rem;">
              <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;"><strong>Conditions :</strong></p>
              <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• Devis valable jusqu'au ${pdfDevis.dateValidite ? formatDate(pdfDevis.dateValidite) : "date à définir"}</p>
              <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• Règlement à 30 jours fin de mois</p>
              <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• TVA non applicable, art. 293 B du CGI (si applicable)</p>
            </div>
            
            <div class="signature-area" style="text-align: center;">
              <p class="signature-instruction" style="font-style: italic; color: #718096; margin-bottom: 2rem;">
                <em>Bon pour accord - Date et signature du client :</em>
              </p>
              <div class="signature-box" style="display: flex; justify-content: space-around; gap: 2rem;">
                <div class="signature-line" style="flex: 1; padding: 1rem; border-bottom: 2px solid #2d3748; color: #4a5568; font-weight: 500;">
                  <span>Date : _______________</span>
                </div>
                <div class="signature-line" style="flex: 1; padding: 1rem; border-bottom: 2px solid #2d3748; color: #4a5568; font-weight: 500;">
                  <span>Signature :</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(tempContainer);

      // Attendre que le contenu soit complètement rendu
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Générer le canvas avec des paramètres optimisés
      const canvas = await html2canvas(tempContainer, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 1200,
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