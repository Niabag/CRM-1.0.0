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

  // ✅ FONCTION PDF CORRIGÉE - Toutes les colonnes visibles
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
        width: 1400px;
        background: white;
        z-index: 9999;
        padding: 30px;
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

      // ✅ CORRECTION: Tableau avec toutes les colonnes bien définies
      const tableHTML = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <thead>
            <tr style="background: #2d3748; color: white;">
              <th style="border: 1px solid #ccc; padding: 12px; text-align: left; width: 35%;">Description</th>
              <th style="border: 1px solid #ccc; padding: 12px; text-align: center; width: 10%;">Unité</th>
              <th style="border: 1px solid #ccc; padding: 12px; text-align: center; width: 10%;">Qté</th>
              <th style="border: 1px solid #ccc; padding: 12px; text-align: center; width: 15%;">Prix unitaire HT</th>
              <th style="border: 1px solid #ccc; padding: 12px; text-align: center; width: 10%;">TVA</th>
              <th style="border: 1px solid #ccc; padding: 12px; text-align: center; width: 20%;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${pdfDevis.articles.map((article, index) => {
              const price = parseFloat(article.unitPrice || "0");
              const qty = parseFloat(article.quantity || "0");
              const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
              
              return `
                <tr style="background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                  <td style="border: 1px solid #ccc; padding: 12px; text-align: left;">${article.description || ""}</td>
                  <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">${article.unit || ""}</td>
                  <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">${qty}</td>
                  <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">${price.toFixed(2)} €</td>
                  <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">${article.tvaRate || "20"}%</td>
                  <td style="border: 1px solid #ccc; padding: 12px; text-align: center; font-weight: bold; color: #48bb78;">${total.toFixed(2)} €</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      // Calculer les totaux
      const totalHT = pdfDevis.articles.reduce((sum, item) => {
        const price = parseFloat(item.unitPrice || 0);
        const qty = parseFloat(item.quantity || 0);
        return sum + (price * qty);
      }, 0);

      const totalTVA = pdfDevis.articles.reduce((sum, item) => {
        const price = parseFloat(item.unitPrice || 0);
        const qty = parseFloat(item.quantity || 0);
        const tva = parseFloat(item.tvaRate || 0);
        const ht = price * qty;
        return sum + (ht * tva / 100);
      }, 0);

      const totalTTC = totalHT + totalTVA;

      // Créer le HTML du devis complet
      tempContainer.innerHTML = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; color: #000; padding: 40px; line-height: 1.4;">
          
          <!-- En-tête du document -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #e2e8f0;">
            <div style="flex: 1;">
              ${pdfDevis.logoUrl ? `<img src="${pdfDevis.logoUrl}" alt="Logo entreprise" style="max-width: 200px; max-height: 100px; object-fit: contain;" />` : ''}
            </div>
            <div style="flex: 1; text-align: right;">
              <h1 style="font-size: 48px; font-weight: 700; margin: 0; color: #2d3748; letter-spacing: 2px;">DEVIS</h1>
            </div>
          </div>

          <!-- Informations des parties -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 16px; font-weight: 600; text-transform: uppercase;">Émetteur</h3>
              <div style="font-weight: 600; font-size: 16px; color: #2d3748; margin-bottom: 8px;">${pdfDevis.entrepriseName || ""}</div>
              <div style="margin-bottom: 5px;">${pdfDevis.entrepriseAddress || ""}</div>
              <div style="margin-bottom: 5px;">${pdfDevis.entrepriseCity || ""}</div>
              <div style="margin-bottom: 5px;">${pdfDevis.entreprisePhone || ""}</div>
              <div>${pdfDevis.entrepriseEmail || ""}</div>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 16px; font-weight: 600; text-transform: uppercase;">Destinataire</h3>
              <div style="font-weight: 600; font-size: 16px; color: #2d3748; margin-bottom: 8px;">${pdfDevis.clientName || clientInfo.name || ""}</div>
              <div style="margin-bottom: 5px;">${pdfDevis.clientEmail || clientInfo.email || ""}</div>
              <div style="margin-bottom: 5px;">${pdfDevis.clientPhone || clientInfo.phone || ""}</div>
              <div>${pdfDevis.clientAddress || ""}</div>
            </div>
          </div>

          <!-- Métadonnées du devis -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
              <div>
                <div style="font-weight: 600; font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Date du devis :</div>
                <div style="font-weight: 600;">${formatDate(pdfDevis.dateDevis)}</div>
              </div>
              <div>
                <div style="font-weight: 600; font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Numéro de devis :</div>
                <div style="background: rgba(255, 255, 255, 0.2); padding: 5px 10px; border-radius: 4px; font-weight: 600;">${pdfDevis._id || pdfDevis.devisNumber || "À définir"}</div>
              </div>
              <div>
                <div style="font-weight: 600; font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Date de validité :</div>
                <div style="font-weight: 600;">${formatDate(pdfDevis.dateValidite)}</div>
              </div>
              <div>
                <div style="font-weight: 600; font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Client ID :</div>
                <div style="background: rgba(255, 255, 255, 0.2); padding: 5px 10px; border-radius: 4px; font-weight: 600;">${pdfDevis.clientId || "N/A"}</div>
              </div>
            </div>
          </div>

          <!-- Section prestations -->
          <div style="margin-bottom: 40px;">
            <h3 style="margin: 0 0 20px 0; color: #2d3748; font-size: 18px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Détail des prestations</h3>
            ${tableHTML}
          </div>

          <!-- Récapitulatif des totaux -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
            <div style="width: 300px;">
              <div style="display: flex; justify-content: space-between; padding: 10px 15px; background: #f8f9fa; border-radius: 4px; margin-bottom: 5px;">
                <span style="font-weight: 500;">Total HT :</span>
                <span style="font-weight: 600;">${totalHT.toFixed(2)} €</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 15px; background: #f8f9fa; border-radius: 4px; margin-bottom: 5px;">
                <span style="font-weight: 500;">Total TVA :</span>
                <span style="font-weight: 600;">${totalTVA.toFixed(2)} €</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 15px; background: #48bb78; color: white; font-weight: 700; font-size: 16px; border-radius: 4px;">
                <span>Total TTC :</span>
                <span>${totalTTC.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <!-- Conditions et signature -->
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; border-left: 4px solid #667eea;">
            <div style="margin-bottom: 30px;">
              <p style="margin: 10px 0; color: #4a5568; line-height: 1.6;"><strong>Conditions :</strong></p>
              <p style="margin: 5px 0; color: #4a5568; line-height: 1.6;">• Devis valable jusqu'au ${pdfDevis.dateValidite ? formatDate(pdfDevis.dateValidite) : "date à définir"}</p>
              <p style="margin: 5px 0; color: #4a5568; line-height: 1.6;">• Règlement à 30 jours fin de mois</p>
              <p style="margin: 5px 0; color: #4a5568; line-height: 1.6;">• TVA non applicable, art. 293 B du CGI (si applicable)</p>
            </div>
            
            <div style="text-align: center;">
              <p style="font-style: italic; color: #718096; margin-bottom: 30px;">
                <em>Bon pour accord - Date et signature du client :</em>
              </p>
              <div style="display: flex; justify-content: space-around; gap: 40px;">
                <div style="flex: 1; padding: 20px; border-bottom: 2px solid #2d3748; color: #4a5568; font-weight: 500;">
                  <span>Date : _______________</span>
                </div>
                <div style="flex: 1; padding: 20px; border-bottom: 2px solid #2d3748; color: #4a5568; font-weight: 500;">
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
        width: 1400,
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