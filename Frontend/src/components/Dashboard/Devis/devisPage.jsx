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

  // ✅ GÉNÉRATION PDF COMPLÈTE - Identique au preview
  const handleDownloadPDF = async (devis) => {
    try {
      setLoading(true);
      
      console.log("🔍 Début génération PDF pour:", devis.title);
      
      // Importer jsPDF
      const { default: jsPDF } = await import('jspdf');

      // ✅ Obtenir les informations du client
      const clientInfo = clients.find(c => c._id === devis.clientId) || {};
      
      // ✅ Calculer les totaux par taux de TVA (comme dans le preview)
      const tauxTVA = {
        "20": { ht: 0, tva: 0 },
        "10": { ht: 0, tva: 0 },
        "5.5": { ht: 0, tva: 0 },
        "2.1": { ht: 0, tva: 0 }
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

      // ✅ Créer le PDF avec le même design que le preview
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configuration des couleurs (identiques au preview)
      const primaryColor = [102, 126, 234]; // #667eea
      const secondaryColor = [118, 75, 162]; // #764ba2
      const textColor = [45, 55, 72]; // #2d3748
      const grayColor = [113, 128, 150]; // #718096
      const lightGray = [248, 249, 250]; // #f8f9fa
      
      let yPosition = 25;
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // ✅ EN-TÊTE AVEC LOGO ET TITRE (comme dans le preview)
      // Logo section (gauche)
      if (devis.logoUrl) {
        try {
          // Si il y a un logo, l'afficher
          pdf.addImage(devis.logoUrl, 'JPEG', margin, yPosition - 5, 50, 25);
        } catch (e) {
          // Si erreur avec le logo, afficher un placeholder
          pdf.setFillColor(...lightGray);
          pdf.rect(margin, yPosition - 5, 50, 25, 'F');
          pdf.setFontSize(8);
          pdf.setTextColor(...grayColor);
          pdf.text('Logo', margin + 20, yPosition + 8);
        }
      } else {
        // Placeholder pour logo
        pdf.setFillColor(...lightGray);
        pdf.rect(margin, yPosition - 5, 50, 25, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(...grayColor);
        pdf.text('📷 Logo', margin + 20, yPosition + 8);
      }
      
      // Titre DEVIS (droite)
      pdf.setFontSize(36);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textColor);
      pdf.text('DEVIS', pageWidth - margin, yPosition + 10, { align: 'right' });

      // ✅ INFORMATIONS ÉMETTEUR ET DESTINATAIRE (comme dans le preview)
      yPosition = 60;
      
      // Émetteur (gauche)
      pdf.setFillColor(...lightGray);
      pdf.rect(margin, yPosition, (contentWidth / 2) - 5, 50, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textColor);
      pdf.text('Émetteur', margin + 5, yPosition + 8);
      
      yPosition += 15;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(devis.entrepriseName || 'Nom de l\'entreprise', margin + 5, yPosition);
      
      yPosition += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(devis.entrepriseAddress || 'Adresse', margin + 5, yPosition);
      yPosition += 4;
      pdf.text(devis.entrepriseCity || 'Code postal et ville', margin + 5, yPosition);
      yPosition += 4;
      pdf.text(devis.entreprisePhone || 'Téléphone', margin + 5, yPosition);
      yPosition += 4;
      pdf.text(devis.entrepriseEmail || 'Email', margin + 5, yPosition);

      // Destinataire (droite)
      const rightColumnX = margin + (contentWidth / 2) + 5;
      yPosition = 60;
      
      pdf.setFillColor(...lightGray);
      pdf.rect(rightColumnX, yPosition, (contentWidth / 2) - 5, 50, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textColor);
      pdf.text('Destinataire', rightColumnX + 5, yPosition + 8);
      
      yPosition += 15;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(clientInfo.name || devis.clientName || 'Nom du client', rightColumnX + 5, yPosition);
      
      yPosition += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(clientInfo.email || devis.clientEmail || 'Email du client', rightColumnX + 5, yPosition);
      yPosition += 4;
      pdf.text(clientInfo.phone || devis.clientPhone || 'Téléphone du client', rightColumnX + 5, yPosition);
      yPosition += 4;
      pdf.text(devis.clientAddress || 'Adresse du client', rightColumnX + 5, yPosition);

      // ✅ MÉTADONNÉES DU DEVIS (comme dans le preview)
      yPosition = 125;
      
      // Fond dégradé simulé
      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, yPosition, contentWidth, 20, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      const metadataItems = [
        `Date du devis: ${formatDate(devis.dateDevis)}`,
        `N° de devis: ${devis._id?.slice(-8) || 'À définir'}`,
        `Date de validité: ${formatDate(devis.dateValidite)}`,
        `Client: ${clientInfo.name || 'N/A'}`
      ];
      
      let metaX = margin + 5;
      metadataItems.forEach((item, index) => {
        if (index === 2) {
          yPosition += 6;
          metaX = margin + 5;
        }
        pdf.text(item, metaX, yPosition + 8);
        metaX += (contentWidth / 2);
      });

      // ✅ TABLEAU DES PRESTATIONS (identique au preview)
      yPosition = 155;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textColor);
      pdf.text('Détail des prestations', margin, yPosition);

      yPosition += 10;
      
      // En-têtes du tableau
      const tableHeaders = ['Description', 'Unité', 'Qté', 'Prix unitaire HT', 'TVA', 'Total HT'];
      const colWidths = [60, 15, 15, 30, 15, 25];
      let xPosition = margin;
      
      // Fond de l'en-tête
      pdf.setFillColor(...textColor);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      tableHeaders.forEach((header, index) => {
        pdf.text(header, xPosition + 1, yPosition + 5);
        xPosition += colWidths[index];
      });

      yPosition += 8;

      // ✅ LIGNES DU TABLEAU
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      devis.articles.forEach((article, index) => {
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        const total = price * qty;
        
        // Fond alterné
        if (index % 2 === 0) {
          pdf.setFillColor(...lightGray);
          pdf.rect(margin, yPosition, contentWidth, 6, 'F');
        }
        
        xPosition = margin;
        
        // Description
        const description = article.description || '';
        const splitDescription = pdf.splitTextToSize(description, colWidths[0] - 2);
        pdf.text(splitDescription, xPosition + 1, yPosition + 4);
        xPosition += colWidths[0];
        
        // Unité
        pdf.text(article.unit || 'u', xPosition + 1, yPosition + 4);
        xPosition += colWidths[1];
        
        // Quantité
        pdf.text(qty.toString(), xPosition + 1, yPosition + 4);
        xPosition += colWidths[2];
        
        // Prix unitaire
        pdf.text(`${price.toFixed(2)} €`, xPosition + 1, yPosition + 4);
        xPosition += colWidths[3];
        
        // TVA
        pdf.text(`${article.tvaRate || 20}%`, xPosition + 1, yPosition + 4);
        xPosition += colWidths[4];
        
        // Total
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${total.toFixed(2)} €`, xPosition + 1, yPosition + 4);
        pdf.setFont('helvetica', 'normal');
        
        yPosition += Math.max(6, splitDescription.length * 3);
      });

      // ✅ RÉCAPITULATIF TVA ET TOTAUX (comme dans le preview)
      yPosition += 15;
      
      // Récapitulatif TVA (gauche)
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textColor);
      pdf.text('Récapitulatif TVA', margin, yPosition);
      
      yPosition += 8;
      
      // Tableau TVA
      const tvaTableHeaders = ['Base HT', 'Taux TVA', 'Montant TVA', 'Total TTC'];
      const tvaColWidths = [20, 20, 25, 25];
      
      xPosition = margin;
      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, yPosition, 90, 6, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      tvaTableHeaders.forEach((header, index) => {
        pdf.text(header, xPosition + 1, yPosition + 4);
        xPosition += tvaColWidths[index];
      });
      
      yPosition += 6;
      
      // Lignes TVA
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'normal');
      
      Object.entries(tauxTVA)
        .filter(([, { ht }]) => ht > 0)
        .forEach(([rate, { ht, tva }], index) => {
          if (index % 2 === 0) {
            pdf.setFillColor(...lightGray);
            pdf.rect(margin, yPosition, 90, 5, 'F');
          }
          
          xPosition = margin;
          pdf.text(`${ht.toFixed(2)} €`, xPosition + 1, yPosition + 3);
          xPosition += tvaColWidths[0];
          pdf.text(`${rate}%`, xPosition + 1, yPosition + 3);
          xPosition += tvaColWidths[1];
          pdf.text(`${tva.toFixed(2)} €`, xPosition + 1, yPosition + 3);
          xPosition += tvaColWidths[2];
          pdf.text(`${(ht + tva).toFixed(2)} €`, xPosition + 1, yPosition + 3);
          
          yPosition += 5;
        });

      // Totaux finaux (droite)
      const totalBoxWidth = 70;
      const totalBoxX = pageWidth - margin - totalBoxWidth;
      const totalBoxY = yPosition - (Object.keys(tauxTVA).filter(k => tauxTVA[k].ht > 0).length * 5) - 6;
      
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(1);
      pdf.rect(totalBoxX, totalBoxY, totalBoxWidth, 25);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textColor);
      pdf.text(`Total HT: ${totalHT.toFixed(2)} €`, totalBoxX + 5, totalBoxY + 8);
      pdf.text(`Total TVA: ${totalTVA.toFixed(2)} €`, totalBoxX + 5, totalBoxY + 14);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text(`TOTAL TTC: ${totalTTC.toFixed(2)} €`, totalBoxX + 5, totalBoxY + 22);

      // ✅ CONDITIONS ET SIGNATURE (comme dans le preview)
      yPosition += 20;
      
      pdf.setFillColor(...lightGray);
      pdf.rect(margin, yPosition, contentWidth, 35, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textColor);
      pdf.text('Conditions :', margin + 5, yPosition + 8);
      
      yPosition += 12;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`• Devis valable jusqu'au ${formatDate(devis.dateValidite) || 'date à définir'}`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text('• Règlement à 30 jours fin de mois', margin + 5, yPosition);
      yPosition += 4;
      pdf.text('• TVA non applicable, art. 293 B du CGI (si applicable)', margin + 5, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(...grayColor);
      pdf.text('Bon pour accord - Date et signature du client :', margin + 5, yPosition);
      
      yPosition += 8;
      pdf.text('Date : _______________', margin + 20, yPosition);
      pdf.text('Signature :', margin + 100, yPosition);

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