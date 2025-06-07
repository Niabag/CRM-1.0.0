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

  // ✅ FONCTION PDF COMPLÈTEMENT CORRIGÉE
  const handleDownloadPDF = async (devis) => {
    try {
      setLoading(true);
      
      console.log("🔍 Début génération PDF pour:", devis.title);
      
      // Importer dynamiquement les modules nécessaires
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      // ✅ CORRECTION: Créer un élément temporaire avec contenu complet
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.minHeight = '297mm'; // ✅ Hauteur minimale A4
      tempDiv.style.background = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '14px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000';
      document.body.appendChild(tempDiv);

      // ✅ Obtenir les informations du client
      const clientInfo = clients.find(c => c._id === devis.clientId) || {};
      
      // ✅ Calculer les totaux
      const totalTTC = calculateTTC(devis);
      const totalHT = devis.articles.reduce((sum, article) => {
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        return sum + (price * qty);
      }, 0);
      const totalTVA = totalTTC - totalHT;

      // ✅ Créer le contenu HTML complet
      const devisHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: white; color: black; min-height: 250mm;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 20px;">
            <div>
              <h2 style="margin: 0; color: #333; font-size: 24px;">${devis.entrepriseName || 'Entreprise'}</h2>
              <p style="margin: 5px 0;">${devis.entrepriseAddress || ''}</p>
              <p style="margin: 5px 0;">${devis.entrepriseCity || ''}</p>
              <p style="margin: 5px 0;">${devis.entreprisePhone || ''}</p>
              <p style="margin: 5px 0;">${devis.entrepriseEmail || ''}</p>
            </div>
            <div style="text-align: right;">
              <h1 style="margin: 0; font-size: 48px; color: #333; font-weight: bold;">DEVIS</h1>
              <p style="margin: 5px 0;"><strong>N°:</strong> ${devis._id || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(devis.dateDevis)}</p>
              <p style="margin: 5px 0;"><strong>Validité:</strong> ${formatDate(devis.dateValidite)}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; font-size: 18px;">Client</h3>
            <p style="margin: 5px 0; font-weight: bold; font-size: 16px;">${clientInfo.name || devis.clientName || 'Client'}</p>
            <p style="margin: 5px 0;">${clientInfo.email || devis.clientEmail || ''}</p>
            <p style="margin: 5px 0;">${clientInfo.phone || devis.clientPhone || ''}</p>
            <p style="margin: 5px 0;">${devis.clientAddress || ''}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #333; color: white;">
                <th style="border: 1px solid #ccc; padding: 12px; text-align: left; font-size: 14px;">Description</th>
                <th style="border: 1px solid #ccc; padding: 12px; text-align: center; font-size: 14px;">Qté</th>
                <th style="border: 1px solid #ccc; padding: 12px; text-align: center; font-size: 14px;">Prix HT</th>
                <th style="border: 1px solid #ccc; padding: 12px; text-align: center; font-size: 14px;">TVA</th>
                <th style="border: 1px solid #ccc; padding: 12px; text-align: center; font-size: 14px;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${devis.articles.map(article => {
                const price = parseFloat(article.unitPrice || 0);
                const qty = parseFloat(article.quantity || 0);
                const total = price * qty;
                return `
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 12px; font-size: 13px;">${article.description || ''}</td>
                    <td style="border: 1px solid #ccc; padding: 12px; text-align: center; font-size: 13px;">${qty} ${article.unit || ''}</td>
                    <td style="border: 1px solid #ccc; padding: 12px; text-align: center; font-size: 13px;">${price.toFixed(2)} €</td>
                    <td style="border: 1px solid #ccc; padding: 12px; text-align: center; font-size: 13px;">${article.tvaRate || 20}%</td>
                    <td style="border: 1px solid #ccc; padding: 12px; text-align: center; font-size: 13px; font-weight: bold;">${total.toFixed(2)} €</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div style="text-align: right; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 5px 0; font-size: 16px;"><strong>Total HT: ${totalHT.toFixed(2)} €</strong></p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Total TVA: ${totalTVA.toFixed(2)} €</strong></p>
            <p style="margin: 5px 0; font-size: 20px; color: #28a745;"><strong>Total TTC: ${totalTTC.toFixed(2)} €</strong></p>
          </div>

          <div style="margin-top: 50px;">
            <h4 style="color: #333; margin-bottom: 15px;">Conditions :</h4>
            <p style="margin: 5px 0;">• Devis valable jusqu'au ${formatDate(devis.dateValidite) || 'date à définir'}</p>
            <p style="margin: 5px 0;">• Règlement à 30 jours fin de mois</p>
            <p style="margin: 5px 0;">• TVA applicable selon la réglementation en vigueur</p>
          </div>

          <div style="margin-top: 60px; text-align: center; font-style: italic;">
            <p style="margin-bottom: 30px; font-size: 16px;"><strong>Bon pour accord - Date et signature :</strong></p>
            <div style="margin-top: 40px; border-bottom: 2px solid #000; width: 300px; margin-left: auto; margin-right: auto;"></div>
          </div>
        </div>
      `;

      tempDiv.innerHTML = devisHTML;

      console.log("📝 Contenu HTML créé, attente du rendu...");
      
      // Attendre que le contenu soit rendu
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("📷 Début capture canvas...");

      // ✅ Capturer avec des paramètres optimisés
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5, // ✅ Scale modéré pour qualité/performance
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: Math.max(tempDiv.scrollHeight, 1000), // ✅ Hauteur minimale garantie
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        windowHeight: 1600,
        logging: false
      });

      console.log("✅ Canvas créé:", canvas.width, 'x', canvas.height);

      // ✅ Vérifier que le canvas a une taille valide
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas invalide: dimensions nulles');
      }

      // Nettoyer l'élément temporaire
      document.body.removeChild(tempDiv);

      // Créer le PDF avec les bonnes dimensions
      const imgData = canvas.toDataURL('image/png', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculer les dimensions pour s'adapter à A4
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const imgWidth = pdfWidth - 20; // Marges de 10mm de chaque côté
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log("📄 Dimensions PDF:", imgWidth, 'x', imgHeight);
      
      // Si l'image est plus haute qu'une page, la diviser
      if (imgHeight > pdfHeight - 20) {
        console.log("📄 Division en plusieurs pages nécessaire");
        const pageHeight = pdfHeight - 20;
        let remainingHeight = imgHeight;
        let currentPosition = 0;
        let pageNumber = 0;
        
        while (remainingHeight > 0) {
          const currentHeight = Math.min(pageHeight, remainingHeight);
          
          if (pageNumber > 0) {
            pdf.addPage();
          }
          
          // Calculer la portion du canvas à utiliser
          const sourceY = (currentPosition * canvas.height) / imgHeight;
          const sourceHeight = (currentHeight * canvas.height) / imgHeight;
          
          // Créer un canvas temporaire pour cette portion
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          
          tempCtx.drawImage(
            canvas,
            0, sourceY,
            canvas.width, sourceHeight,
            0, 0,
            canvas.width, sourceHeight
          );
          
          const tempImgData = tempCanvas.toDataURL('image/png', 0.95);
          pdf.addImage(tempImgData, 'PNG', 10, 10, imgWidth, currentHeight);
          
          remainingHeight -= pageHeight;
          currentPosition += pageHeight;
          pageNumber++;
        }
      } else {
        // L'image tient sur une page
        console.log("📄 Une seule page nécessaire");
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      }

      // Télécharger le PDF
      const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devis._id}`;
      pdf.save(`${fileName}.pdf`);
      
      console.log("✅ PDF généré et téléchargé:", fileName);

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF: ' + error.message);
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
                      disabled={loading}
                    >
                      {loading ? "⏳" : "📄"} PDF
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