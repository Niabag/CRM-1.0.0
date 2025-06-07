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

  // ✅ GÉNÉRATION PDF OPTIMISÉE - IDENTIQUE AU PREVIEW ET TIENT SUR UNE PAGE
  const handleDownloadPDF = async (devis) => {
    try {
      setLoading(true);
      
      console.log("🔍 Génération PDF optimisé identique au preview");
      
      const { default: jsPDF } = await import('jspdf');

      // ✅ Obtenir les informations du client
      const clientInfo = clients.find(c => c._id === devis.clientId) || {};
      
      // ✅ Calculer les totaux par taux de TVA (EXACTEMENT comme dans devisPreview.jsx)
      const tauxTVA = {
        "20": { ht: 0, tva: 0 },
        "10": { ht: 0, tva: 0 },
        "5.5": { ht: 0, tva: 0 },
      };

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

      const totalHT = Object.values(tauxTVA).reduce((sum, t) => sum + t.ht, 0);
      const totalTVA = Object.values(tauxTVA).reduce((sum, t) => sum + t.tva, 0);
      const totalTTC = totalHT + totalTVA;

      // ✅ Créer le PDF A4 optimisé
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configuration des couleurs EXACTES du CSS
      const primaryColor = [102, 126, 234]; // #667eea
      const textDark = [45, 55, 72]; // #2d3748
      const textGray = [113, 128, 150]; // #718096
      const backgroundLight = [248, 249, 250]; // #f8f9fa
      const successGreen = [72, 187, 120]; // #48bb78
      const borderColor = [226, 232, 240]; // #e2e8f0
      
      let yPos = 15;
      const pageWidth = 210;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // ✅ EN-TÊTE COMPACT - EXACTEMENT comme le preview
      // Logo (gauche)
      if (devis.logoUrl) {
        try {
          pdf.addImage(devis.logoUrl, 'JPEG', margin, yPos, 50, 25);
        } catch (e) {
          // Placeholder compact
          pdf.setFillColor(...backgroundLight);
          pdf.setDrawColor(...borderColor);
          pdf.rect(margin, yPos, 50, 25, 'FD');
          pdf.setFontSize(8);
          pdf.setTextColor(...textGray);
          pdf.text('📷 Logo', margin + 25, yPos + 15, { align: 'center' });
        }
      } else {
        // Placeholder compact
        pdf.setFillColor(...backgroundLight);
        pdf.setDrawColor(...borderColor);
        pdf.rect(margin, yPos, 50, 25, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(...textGray);
        pdf.text('📷 Logo', margin + 25, yPos + 15, { align: 'center' });
      }
      
      // Titre DEVIS (droite) - Plus compact
      pdf.setFontSize(36);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('DEVIS', pageWidth - margin, yPos + 18, { align: 'right' });

      // ✅ INFORMATIONS ÉMETTEUR ET DESTINATAIRE - Layout compact
      yPos = 50;
      
      const colWidth = (contentWidth - 10) / 2;
      
      // Émetteur (gauche)
      pdf.setFillColor(...backgroundLight);
      pdf.rect(margin, yPos, colWidth, 35, 'F');
      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, yPos, 2, 35, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('Émetteur', margin + 5, yPos + 7);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(devis.entrepriseName || 'Nom de l\'entreprise', margin + 5, yPos + 14);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textGray);
      pdf.text(devis.entrepriseAddress || 'Adresse', margin + 5, yPos + 19);
      pdf.text(devis.entrepriseCity || 'Ville', margin + 5, yPos + 23);
      pdf.text(devis.entreprisePhone || 'Téléphone', margin + 5, yPos + 27);
      pdf.text(devis.entrepriseEmail || 'Email', margin + 5, yPos + 31);

      // Destinataire (droite)
      const rightX = margin + colWidth + 10;
      pdf.setFillColor(...backgroundLight);
      pdf.rect(rightX, yPos, colWidth, 35, 'F');
      pdf.setFillColor(...primaryColor);
      pdf.rect(rightX, yPos, 2, 35, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('Destinataire', rightX + 5, yPos + 7);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(clientInfo.name || devis.clientName || 'Nom du client', rightX + 5, yPos + 14);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textGray);
      pdf.text(clientInfo.email || devis.clientEmail || 'Email', rightX + 5, yPos + 19);
      pdf.text(clientInfo.phone || devis.clientPhone || 'Téléphone', rightX + 5, yPos + 23);
      pdf.text(devis.clientAddress || 'Adresse', rightX + 5, yPos + 27);

      // ✅ MÉTADONNÉES COMPACTES
      yPos = 95;
      
      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, yPos, contentWidth, 15, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      pdf.text(`Date : ${formatDate(devis.dateDevis)}`, margin + 5, yPos + 6);
      pdf.text(`N° : ${devis._id?.slice(-8) || 'N/A'}`, margin + 5, yPos + 11);
      
      pdf.text(`Validité : ${formatDate(devis.dateValidite)}`, margin + colWidth, yPos + 6);
      pdf.text(`Client : ${clientInfo.name || 'N/A'}`, margin + colWidth, yPos + 11);

      // ✅ TABLEAU DES PRESTATIONS - Optimisé pour tenir sur une page
      yPos = 120;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('Détail des prestations', margin, yPos);

      yPos += 8;
      
      // En-têtes du tableau - Colonnes optimisées
      const tableHeaders = ['Description', 'Qté', 'Prix HT', 'TVA', 'Total HT'];
      const colWidths = [80, 20, 25, 20, 25];
      let xPos = margin;
      
      pdf.setFillColor(...textDark);
      pdf.rect(margin, yPos, contentWidth, 8, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      tableHeaders.forEach((header, index) => {
        const textAlign = index === 0 ? 'left' : 'center';
        const textX = index === 0 ? xPos + 2 : xPos + (colWidths[index] / 2);
        pdf.text(header, textX, yPos + 5, { align: textAlign });
        xPos += colWidths[index];
      });

      yPos += 8;

      // ✅ LIGNES DU TABLEAU - Compactes
      pdf.setTextColor(...textDark);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      const maxArticles = Math.min(devis.articles.length, 8); // Limiter pour tenir sur une page
      
      for (let i = 0; i < maxArticles; i++) {
        const article = devis.articles[i];
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        const total = price * qty;
        
        if (i % 2 === 0) {
          pdf.setFillColor(...backgroundLight);
          pdf.rect(margin, yPos, contentWidth, 6, 'F');
        }
        
        xPos = margin;
        
        // Description (tronquée si nécessaire)
        const description = (article.description || '').substring(0, 50);
        pdf.text(description, xPos + 2, yPos + 4);
        xPos += colWidths[0];
        
        // Quantité
        pdf.text(`${qty} ${article.unit || ''}`, xPos + (colWidths[1] / 2), yPos + 4, { align: 'center' });
        xPos += colWidths[1];
        
        // Prix unitaire
        pdf.text(`${price.toFixed(2)} €`, xPos + (colWidths[2] / 2), yPos + 4, { align: 'center' });
        xPos += colWidths[2];
        
        // TVA
        pdf.text(`${article.tvaRate || 20}%`, xPos + (colWidths[3] / 2), yPos + 4, { align: 'center' });
        xPos += colWidths[3];
        
        // Total
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...successGreen);
        pdf.text(`${total.toFixed(2)} €`, xPos + (colWidths[4] / 2), yPos + 4, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textDark);
        
        yPos += 6;
      }

      // ✅ RÉCAPITULATIF TVA ET TOTAUX - Layout compact en 2 colonnes
      yPos += 10;
      
      // Récapitulatif TVA (gauche)
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('Récapitulatif TVA', margin, yPos);
      
      yPos += 6;
      
      // Tableau TVA compact
      const tvaHeaders = ['Base HT', 'TVA', 'Montant', 'TTC'];
      const tvaColWidths = [20, 15, 20, 20];
      
      xPos = margin;
      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, yPos, 75, 6, 'F');
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      tvaHeaders.forEach((header, index) => {
        pdf.text(header, xPos + 1, yPos + 4);
        xPos += tvaColWidths[index];
      });
      
      yPos += 6;
      
      // Lignes TVA
      pdf.setTextColor(...textDark);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      
      Object.entries(tauxTVA)
        .filter(([, { ht }]) => ht > 0)
        .forEach(([rate, { ht, tva }], index) => {
          if (index % 2 === 0) {
            pdf.setFillColor(...backgroundLight);
            pdf.rect(margin, yPos, 75, 5, 'F');
          }
          
          xPos = margin;
          pdf.text(`${ht.toFixed(2)} €`, xPos + 1, yPos + 3);
          xPos += tvaColWidths[0];
          pdf.text(`${rate}%`, xPos + 1, yPos + 3);
          xPos += tvaColWidths[1];
          pdf.text(`${tva.toFixed(2)} €`, xPos + 1, yPos + 3);
          xPos += tvaColWidths[2];
          pdf.text(`${(ht + tva).toFixed(2)} €`, xPos + 1, yPos + 3);
          
          yPos += 5;
        });

      // Totaux finaux (droite) - Compact
      const totalsX = margin + 90;
      const totalsY = yPos - (Object.keys(tauxTVA).filter(k => tauxTVA[k].ht > 0).length * 5) - 6;
      
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(1);
      pdf.rect(totalsX, totalsY, 70, 20, 'FD');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textDark);
      pdf.text(`Total HT :`, totalsX + 3, totalsY + 6);
      pdf.text(`${totalHT.toFixed(2)} €`, totalsX + 67, totalsY + 6, { align: 'right' });
      
      pdf.text(`Total TVA :`, totalsX + 3, totalsY + 11);
      pdf.text(`${totalTVA.toFixed(2)} €`, totalsX + 67, totalsY + 11, { align: 'right' });
      
      // Total TTC en gras
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...successGreen);
      pdf.text(`Total TTC :`, totalsX + 3, totalsY + 17);
      pdf.text(`${totalTTC.toFixed(2)} €`, totalsX + 67, totalsY + 17, { align: 'right' });

      // ✅ CONDITIONS ET SIGNATURE - Compact en bas de page
      yPos = Math.max(yPos + 10, 250);
      
      pdf.setFillColor(...backgroundLight);
      pdf.rect(margin, yPos, contentWidth, 25, 'F');
      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, yPos, 2, 25, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('Conditions :', margin + 5, yPos + 6);
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textGray);
      pdf.text(`• Devis valable jusqu'au ${formatDate(devis.dateValidite) || 'date à définir'}`, margin + 5, yPos + 11);
      pdf.text('• Règlement à 30 jours fin de mois', margin + 5, yPos + 15);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Bon pour accord - Date et signature :', margin + 5, yPos + 21);
      
      // Zone de signature compacte
      pdf.setFont('helvetica', 'normal');
      pdf.text('Date : ________', margin + 100, yPos + 21);
      pdf.text('Signature :', margin + 140, yPos + 21);

      // ✅ Télécharger le PDF
      const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devis._id}`;
      pdf.save(`${fileName}.pdf`);
      
      console.log("✅ PDF optimisé généré - IDENTIQUE au preview et tient sur une page");

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