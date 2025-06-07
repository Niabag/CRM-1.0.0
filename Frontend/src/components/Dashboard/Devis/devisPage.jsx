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
        
        if (filterClientId) {
          console.log("🎯 Récupération des devis pour le client:", filterClientId);
          data = await apiRequest(API_ENDPOINTS.DEVIS.BY_CLIENT(filterClientId));
        } else {
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
  }, [filterClientId]);

  useEffect(() => {
    if (initialDevisFromClient) {
      setCurrentDevis(initialDevisFromClient);
      const clientId = normalizeClientId(initialDevisFromClient.clientId);
      setFilterClientId(clientId);
    }
  }, [initialDevisFromClient]);

  useEffect(() => {
    if (selectedClientId) {
      setFilterClientId(selectedClientId);
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
      clientId: filterClientId || selectedClientId || ""
    };
    setCurrentDevis(newDevis);
  };

  const handleSave = async (updatedDevis, isEdit = false) => {
    const clientId = normalizeClientId(updatedDevis.clientId) || selectedClientId;
    
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
      
      const devisData = {
        ...updatedDevis,
        clientId: clientId
      };
      
      await apiRequest(url, {
        method,
        body: JSON.stringify(devisData),
      });

      let data;
      if (filterClientId) {
        data = await apiRequest(API_ENDPOINTS.DEVIS.BY_CLIENT(filterClientId));
      } else {
        data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
      }
      setDevisList(Array.isArray(data) ? data : []);

      alert("✅ Devis enregistré avec succès !");
      
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

  // ✅ NOUVELLE MÉTHODE: Génération PDF directe avec jsPDF (sans html2canvas)
  const handleDownloadPDF = async (devis) => {
    try {
      setLoading(true);
      
      console.log("🔍 Début génération PDF pour:", devis.title);
      
      // Importer jsPDF
      const { default: jsPDF } = await import('jspdf');

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

      // ✅ Créer le PDF directement avec jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configuration des polices et couleurs
      const primaryColor = [0, 123, 255]; // Bleu
      const textColor = [51, 51, 51]; // Gris foncé
      const lightGray = [248, 249, 250]; // Gris clair
      
      let yPosition = 20;
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // ✅ EN-TÊTE
      pdf.setFontSize(28);
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DEVIS', pageWidth - margin, yPosition, { align: 'right' });
      
      // Informations entreprise (gauche)
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(devis.entrepriseName || 'Entreprise', margin, yPosition);
      
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(devis.entrepriseAddress || '', margin, yPosition);
      yPosition += 5;
      pdf.text(devis.entrepriseCity || '', margin, yPosition);
      yPosition += 5;
      pdf.text(devis.entreprisePhone || '', margin, yPosition);
      yPosition += 5;
      pdf.text(devis.entrepriseEmail || '', margin, yPosition);

      // Informations devis (droite)
      yPosition = 35;
      pdf.setFontSize(10);
      pdf.text(`N°: ${devis._id?.slice(-8) || 'N/A'}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 5;
      pdf.text(`Date: ${formatDate(devis.dateDevis)}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 5;
      pdf.text(`Validité: ${formatDate(devis.dateValidite)}`, pageWidth - margin, yPosition, { align: 'right' });

      // ✅ LIGNE DE SÉPARATION
      yPosition += 10;
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(1);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);

      // ✅ INFORMATIONS CLIENT
      yPosition += 15;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('DESTINATAIRE', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textColor);
      pdf.text(clientInfo.name || devis.clientName || 'Client', margin, yPosition);
      
      yPosition += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(clientInfo.email || devis.clientEmail || '', margin, yPosition);
      yPosition += 5;
      pdf.text(clientInfo.phone || devis.clientPhone || '', margin, yPosition);
      if (devis.clientAddress) {
        yPosition += 5;
        pdf.text(devis.clientAddress, margin, yPosition);
      }

      // ✅ TABLEAU DES PRESTATIONS
      yPosition += 20;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('DÉTAIL DES PRESTATIONS', margin, yPosition);

      yPosition += 10;
      
      // En-têtes du tableau
      const tableHeaders = ['Description', 'Qté', 'Prix HT', 'TVA', 'Total HT'];
      const colWidths = [80, 20, 25, 20, 25]; // Largeurs des colonnes
      let xPosition = margin;
      
      // Fond de l'en-tête
      pdf.setFillColor(...textColor);
      pdf.rect(margin, yPosition - 2, contentWidth, 8, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255); // Blanc
      
      tableHeaders.forEach((header, index) => {
        pdf.text(header, xPosition + 2, yPosition + 3);
        xPosition += colWidths[index];
      });

      yPosition += 8;

      // ✅ LIGNES DU TABLEAU
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);

      devis.articles.forEach((article, index) => {
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        const total = price * qty;
        
        // Fond alterné
        if (index % 2 === 0) {
          pdf.setFillColor(...lightGray);
          pdf.rect(margin, yPosition - 2, contentWidth, 6, 'F');
        }
        
        xPosition = margin;
        
        // Description (avec retour à la ligne si nécessaire)
        const description = article.description || '';
        const splitDescription = pdf.splitTextToSize(description, colWidths[0] - 4);
        pdf.text(splitDescription, xPosition + 2, yPosition + 2);
        xPosition += colWidths[0];
        
        // Quantité
        pdf.text(`${qty} ${article.unit || ''}`, xPosition + 2, yPosition + 2);
        xPosition += colWidths[1];
        
        // Prix unitaire
        pdf.text(`${price.toFixed(2)} €`, xPosition + 2, yPosition + 2);
        xPosition += colWidths[2];
        
        // TVA
        pdf.text(`${article.tvaRate || 20}%`, xPosition + 2, yPosition + 2);
        xPosition += colWidths[3];
        
        // Total
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${total.toFixed(2)} €`, xPosition + 2, yPosition + 2);
        pdf.setFont('helvetica', 'normal');
        
        yPosition += Math.max(6, splitDescription.length * 4);
      });

      // ✅ TOTAUX
      yPosition += 15;
      
      // Cadre pour les totaux
      const totalBoxWidth = 80;
      const totalBoxX = pageWidth - margin - totalBoxWidth;
      
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(0.5);
      pdf.rect(totalBoxX, yPosition - 5, totalBoxWidth, 25);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total HT: ${totalHT.toFixed(2)} €`, totalBoxX + 5, yPosition);
      yPosition += 6;
      pdf.text(`Total TVA: ${totalTVA.toFixed(2)} €`, totalBoxX + 5, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text(`TOTAL TTC: ${totalTTC.toFixed(2)} €`, totalBoxX + 5, yPosition);

      // ✅ CONDITIONS
      yPosition += 25;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textColor);
      pdf.text('CONDITIONS :', margin, yPosition);
      
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`• Devis valable jusqu'au ${formatDate(devis.dateValidite) || 'date à définir'}`, margin, yPosition);
      yPosition += 5;
      pdf.text('• Règlement à 30 jours fin de mois', margin, yPosition);
      yPosition += 5;
      pdf.text('• TVA applicable selon la réglementation en vigueur', margin, yPosition);

      // ✅ SIGNATURE
      yPosition += 20;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bon pour accord - Date et signature :', margin, yPosition);
      
      yPosition += 15;
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(...textColor);
      pdf.line(margin, yPosition, margin + 80, yPosition);

      // ✅ Télécharger le PDF
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

  const filteredDevisList = filterClientId 
    ? devisList.filter(devis => {
        const devisClientId = normalizeClientId(devis.clientId);
        return devisClientId === filterClientId;
      })
    : devisList;

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

      {/* Aperçu du devis */}
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