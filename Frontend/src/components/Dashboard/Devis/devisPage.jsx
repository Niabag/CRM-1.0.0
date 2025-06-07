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

  // ✅ GÉNÉRATION PDF PARFAITEMENT IDENTIQUE AU PREVIEW
  const handleDownloadPDF = async (devis) => {
    try {
      setLoading(true);
      
      console.log("🔍 Début génération PDF identique au preview pour:", devis.title);
      
      // Importer jsPDF
      const { default: jsPDF } = await import('jspdf');

      // ✅ Obtenir les informations du client (exactement comme dans le preview)
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

      // ✅ Créer le PDF avec le MÊME DESIGN EXACT que devisPreview.jsx
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configuration des couleurs EXACTES du CSS
      const primaryGradientStart = [102, 126, 234]; // #667eea
      const primaryGradientEnd = [118, 75, 162]; // #764ba2
      const textDark = [45, 55, 72]; // #2d3748
      const textGray = [113, 128, 150]; // #718096
      const backgroundLight = [248, 249, 250]; // #f8f9fa
      const backgroundGray = [233, 236, 239]; // #e9ecef
      const borderGray = [226, 232, 240]; // #e2e8f0
      const successGreen = [72, 187, 120]; // #48bb78
      
      let yPosition = 20;
      const pageWidth = 210;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // ✅ EN-TÊTE EXACTEMENT COMME LE PREVIEW
      // Logo section (gauche) - EXACTEMENT comme dans devisPreview.jsx
      if (devis.logoUrl) {
        try {
          pdf.addImage(devis.logoUrl, 'JPEG', margin, yPosition, 60, 30);
        } catch (e) {
          // Placeholder exactement comme dans le CSS
          pdf.setFillColor(...backgroundLight);
          pdf.setDrawColor(...borderGray);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(margin, yPosition, 60, 30, 3, 3, 'FD');
          pdf.setFontSize(10);
          pdf.setTextColor(...textGray);
          pdf.text('📷 Cliquez pour ajouter un logo', margin + 30, yPosition + 18, { align: 'center' });
        }
      } else {
        // Placeholder EXACTEMENT comme dans le CSS
        pdf.setFillColor(...backgroundLight);
        pdf.setDrawColor(...borderGray);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(margin, yPosition, 60, 30, 3, 3, 'FD');
        pdf.setFontSize(10);
        pdf.setTextColor(...textGray);
        pdf.text('📷 Cliquez pour ajouter un logo', margin + 30, yPosition + 18, { align: 'center' });
      }
      
      // Titre DEVIS (droite) - EXACTEMENT comme dans le CSS
      pdf.setFontSize(48);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('DEVIS', pageWidth - margin, yPosition + 20, { align: 'right' });

      // ✅ INFORMATIONS ÉMETTEUR ET DESTINATAIRE - EXACTEMENT comme le preview
      yPosition = 65;
      
      // Émetteur (gauche) - Design EXACT du CSS
      pdf.setFillColor(...backgroundLight);
      pdf.roundedRect(margin, yPosition, (contentWidth / 2) - 5, 55, 3, 3, 'F');
      
      // Bordure gauche colorée comme dans le CSS
      pdf.setFillColor(...primaryGradientStart);
      pdf.rect(margin, yPosition, 2, 55, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('Émetteur', margin + 8, yPosition + 10);
      
      yPosition += 18;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text(devis.entrepriseName || 'Nom de l\'entreprise', margin + 8, yPosition);
      
      yPosition += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textGray);
      pdf.text(devis.entrepriseAddress || 'Adresse', margin + 8, yPosition);
      yPosition += 5;
      pdf.text(devis.entrepriseCity || 'Code postal et ville', margin + 8, yPosition);
      yPosition += 5;
      pdf.text(devis.entreprisePhone || 'Téléphone', margin + 8, yPosition);
      yPosition += 5;
      pdf.text(devis.entrepriseEmail || 'Email', margin + 8, yPosition);

      // Destinataire (droite) - Design EXACT du CSS
      const rightColumnX = margin + (contentWidth / 2) + 5;
      yPosition = 65;
      
      pdf.setFillColor(...backgroundLight);
      pdf.roundedRect(rightColumnX, yPosition, (contentWidth / 2) - 5, 55, 3, 3, 'F');
      
      // Bordure gauche colorée comme dans le CSS
      pdf.setFillColor(...primaryGradientStart);
      pdf.rect(rightColumnX, yPosition, 2, 55, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('Destinataire', rightColumnX + 8, yPosition + 10);
      
      yPosition += 18;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text(clientInfo.name || devis.clientName || 'Nom du client', rightColumnX + 8, yPosition);
      
      yPosition += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textGray);
      pdf.text(clientInfo.email || devis.clientEmail || 'Email du client', rightColumnX + 8, yPosition);
      yPosition += 5;
      pdf.text(clientInfo.phone || devis.clientPhone || 'Téléphone du client', rightColumnX + 8, yPosition);
      yPosition += 5;
      pdf.text(devis.clientAddress || 'Adresse du client', rightColumnX + 8, yPosition);

      // ✅ MÉTADONNÉES DU DEVIS - EXACTEMENT comme dans le CSS
      yPosition = 135;
      
      // Fond dégradé simulé EXACTEMENT comme dans le CSS
      pdf.setFillColor(...primaryGradientStart);
      pdf.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      // Grid layout EXACTEMENT comme dans le CSS
      const metadataY = yPosition + 8;
      pdf.text(`Date du devis : ${formatDate(devis.dateDevis)}`, margin + 8, metadataY);
      pdf.text(`Numéro de devis : ${devis._id?.slice(-8) || 'À définir'}`, margin + 8 + (contentWidth / 2), metadataY);
      
      const metadataY2 = yPosition + 16;
      pdf.text(`Date de validité : ${formatDate(devis.dateValidite)}`, margin + 8, metadataY2);
      pdf.text(`Client : ${clientInfo.name || devis.clientName || 'N/A'}`, margin + 8 + (contentWidth / 2), metadataY2);

      // ✅ TABLEAU DES PRESTATIONS - EXACTEMENT comme dans le CSS
      yPosition = 175;
      
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('Détail des prestations', margin, yPosition);

      yPosition += 10;
      
      // En-têtes du tableau EXACTEMENT comme dans le CSS
      const tableHeaders = ['Description', 'Unité', 'Qté', 'Prix unitaire HT', 'TVA', 'Total HT'];
      const colWidths = [65, 15, 15, 30, 15, 25];
      let xPosition = margin;
      
      // Fond de l'en-tête EXACTEMENT comme dans le CSS
      pdf.setFillColor(...textDark);
      pdf.rect(margin, yPosition, contentWidth, 10, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      tableHeaders.forEach((header, index) => {
        const textAlign = index === 0 ? 'left' : 'center';
        const textX = index === 0 ? xPosition + 2 : xPosition + (colWidths[index] / 2);
        pdf.text(header, textX, yPosition + 6, { align: textAlign });
        xPosition += colWidths[index];
      });

      yPosition += 10;

      // ✅ LIGNES DU TABLEAU - EXACTEMENT comme dans le CSS
      pdf.setTextColor(...textDark);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);

      devis.articles.forEach((article, index) => {
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        const total = price * qty;
        
        // Fond alterné EXACTEMENT comme dans le CSS
        if (index % 2 === 0) {
          pdf.setFillColor(...backgroundLight);
          pdf.rect(margin, yPosition, contentWidth, 8, 'F');
        }
        
        xPosition = margin;
        
        // Description (alignée à gauche)
        const description = article.description || '';
        const splitDescription = pdf.splitTextToSize(description, colWidths[0] - 4);
        pdf.text(splitDescription, xPosition + 2, yPosition + 5);
        xPosition += colWidths[0];
        
        // Unité (centrée)
        pdf.text(article.unit || 'u', xPosition + (colWidths[1] / 2), yPosition + 5, { align: 'center' });
        xPosition += colWidths[1];
        
        // Quantité (centrée)
        pdf.text(qty.toString(), xPosition + (colWidths[2] / 2), yPosition + 5, { align: 'center' });
        xPosition += colWidths[2];
        
        // Prix unitaire (centré)
        pdf.text(`${price.toFixed(2)} €`, xPosition + (colWidths[3] / 2), yPosition + 5, { align: 'center' });
        xPosition += colWidths[3];
        
        // TVA (centrée)
        pdf.text(`${article.tvaRate || 20}%`, xPosition + (colWidths[4] / 2), yPosition + 5, { align: 'center' });
        xPosition += colWidths[4];
        
        // Total (centré et en gras comme dans le CSS)
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...successGreen);
        pdf.text(`${total.toFixed(2)} €`, xPosition + (colWidths[5] / 2), yPosition + 5, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textDark);
        
        yPosition += Math.max(8, splitDescription.length * 4);
      });

      // ✅ RÉCAPITULATIF TVA ET TOTAUX - EXACTEMENT comme dans le CSS
      yPosition += 15;
      
      // Layout en 2 colonnes EXACTEMENT comme dans le CSS
      const leftColumnWidth = contentWidth * 0.6;
      const rightColumnWidth = contentWidth * 0.4;
      const rightColumnX = margin + leftColumnWidth + 10;
      
      // Récapitulatif TVA (gauche) - EXACTEMENT comme dans le CSS
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('Récapitulatif TVA', margin, yPosition);
      
      yPosition += 8;
      
      // Tableau TVA EXACTEMENT comme dans le CSS
      const tvaTableHeaders = ['Base HT', 'Taux TVA', 'Montant TVA', 'Total TTC'];
      const tvaColWidths = [25, 20, 25, 25];
      
      xPosition = margin;
      pdf.setFillColor(...primaryGradientStart);
      pdf.rect(margin, yPosition, leftColumnWidth - 10, 8, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      tvaTableHeaders.forEach((header, index) => {
        pdf.text(header, xPosition + 2, yPosition + 5);
        xPosition += tvaColWidths[index];
      });
      
      yPosition += 8;
      
      // Lignes TVA EXACTEMENT comme dans le CSS
      pdf.setTextColor(...textDark);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      Object.entries(tauxTVA)
        .filter(([, { ht }]) => ht > 0)
        .forEach(([rate, { ht, tva }], index) => {
          if (index % 2 === 0) {
            pdf.setFillColor(...backgroundLight);
            pdf.rect(margin, yPosition, leftColumnWidth - 10, 6, 'F');
          }
          
          xPosition = margin;
          pdf.text(`${ht.toFixed(2)} €`, xPosition + 2, yPosition + 4);
          xPosition += tvaColWidths[0];
          pdf.text(`${rate}%`, xPosition + 2, yPosition + 4);
          xPosition += tvaColWidths[1];
          pdf.text(`${tva.toFixed(2)} €`, xPosition + 2, yPosition + 4);
          xPosition += tvaColWidths[2];
          pdf.text(`${(ht + tva).toFixed(2)} €`, xPosition + 2, yPosition + 4);
          
          yPosition += 6;
        });

      // Totaux finaux (droite) - EXACTEMENT comme dans le CSS
      const totalBoxY = yPosition - (Object.keys(tauxTVA).filter(k => tauxTVA[k].ht > 0).length * 6) - 8;
      
      // Fond et bordure EXACTEMENT comme dans le CSS
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...primaryGradientStart);
      pdf.setLineWidth(1);
      pdf.roundedRect(rightColumnX, totalBoxY, rightColumnWidth, 30, 3, 3, 'FD');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textDark);
      pdf.text(`Total HT :`, rightColumnX + 5, totalBoxY + 8);
      pdf.text(`${totalHT.toFixed(2)} €`, rightColumnX + rightColumnWidth - 5, totalBoxY + 8, { align: 'right' });
      
      pdf.text(`Total TVA :`, rightColumnX + 5, totalBoxY + 15);
      pdf.text(`${totalTVA.toFixed(2)} €`, rightColumnX + rightColumnWidth - 5, totalBoxY + 15, { align: 'right' });
      
      // Total TTC en gras et coloré EXACTEMENT comme dans le CSS
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...successGreen);
      pdf.text(`Total TTC :`, rightColumnX + 5, totalBoxY + 24);
      pdf.text(`${totalTTC.toFixed(2)} €`, rightColumnX + rightColumnWidth - 5, totalBoxY + 24, { align: 'right' });

      // ✅ CONDITIONS ET SIGNATURE - EXACTEMENT comme dans le CSS
      yPosition += 25;
      
      // Fond EXACTEMENT comme dans le CSS
      pdf.setFillColor(...backgroundLight);
      pdf.roundedRect(margin, yPosition, contentWidth, 40, 3, 3, 'F');
      
      // Bordure gauche colorée comme dans le CSS
      pdf.setFillColor(...primaryGradientStart);
      pdf.rect(margin, yPosition, 2, 40, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textDark);
      pdf.text('Conditions :', margin + 8, yPosition + 10);
      
      yPosition += 15;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textGray);
      pdf.text(`• Devis valable jusqu'au ${formatDate(devis.dateValidite) || 'date à définir'}`, margin + 8, yPosition);
      yPosition += 5;
      pdf.text('• Règlement à 30 jours fin de mois', margin + 8, yPosition);
      yPosition += 5;
      pdf.text('• TVA non applicable, art. 293 B du CGI (si applicable)', margin + 8, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(...textGray);
      pdf.text('Bon pour accord - Date et signature du client :', margin + 8, yPosition);
      
      // Zone de signature EXACTEMENT comme dans le CSS
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text('Date : _______________', margin + 20, yPosition);
      pdf.text('Signature :', margin + 100, yPosition);
      
      // Ligne de signature
      pdf.setDrawColor(...textGray);
      pdf.setLineWidth(0.5);
      pdf.line(margin + 120, yPosition + 2, margin + 160, yPosition + 2);

      // ✅ Télécharger le PDF
      const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devis._id}`;
      pdf.save(`${fileName}.pdf`);
      
      console.log("✅ PDF généré IDENTIQUE au preview:", fileName);

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