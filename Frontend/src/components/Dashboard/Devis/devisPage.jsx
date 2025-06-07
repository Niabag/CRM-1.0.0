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

  // ✅ GÉNÉRATION PDF OPTIMISÉE - SANS COUPURES DE PAGE
  const handleDownloadPDF = async (devis) => {
    try {
      setLoading(true);
      
      // Importer jsPDF directement
      const { default: jsPDF } = await import('jspdf');
      
      // Créer le PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin;

      // ✅ FONCTION POUR VÉRIFIER L'ESPACE ET AJOUTER UNE PAGE
      const checkPageBreak = (neededHeight) => {
        if (currentY + neededHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
          return true;
        }
        return false;
      };

      // ✅ FONCTION POUR AJOUTER DU TEXTE AVEC GESTION DES PAGES
      const addText = (text, x, y, options = {}) => {
        const fontSize = options.fontSize || 10;
        const lineHeight = fontSize * 0.35;
        
        checkPageBreak(lineHeight);
        
        if (options.fontSize) pdf.setFontSize(options.fontSize);
        if (options.style) pdf.setFont('helvetica', options.style);
        
        pdf.text(text, x, currentY + lineHeight);
        currentY += lineHeight + (options.marginBottom || 2);
      };

      // Calculer les totaux
      const clientInfo = clients.find(c => c._id === devis.clientId) || {};
      
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

      // ✅ EN-TÊTE - TITRE DEVIS
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DEVIS', pageWidth - margin - 40, currentY + 20);
      currentY += 30;

      // ✅ INFORMATIONS ENTREPRISE ET CLIENT (2 COLONNES)
      checkPageBreak(60);
      const startY = currentY;
      
      // Colonne Émetteur
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ÉMETTEUR', margin, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(devis.entrepriseName || 'Nom de l\'entreprise', margin, currentY);
      currentY += 5;
      pdf.text(devis.entrepriseAddress || 'Adresse', margin, currentY);
      currentY += 5;
      pdf.text(devis.entrepriseCity || 'Code postal et ville', margin, currentY);
      currentY += 5;
      pdf.text(devis.entreprisePhone || 'Téléphone', margin, currentY);
      currentY += 5;
      pdf.text(devis.entrepriseEmail || 'Email', margin, currentY);

      // Colonne Destinataire
      const rightColumnX = pageWidth / 2 + 10;
      currentY = startY;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DESTINATAIRE', rightColumnX, currentY);
      currentY += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(clientInfo.name || devis.clientName || 'Nom du client', rightColumnX, currentY);
      currentY += 5;
      pdf.text(clientInfo.email || devis.clientEmail || 'Email du client', rightColumnX, currentY);
      currentY += 5;
      pdf.text(clientInfo.phone || devis.clientPhone || 'Téléphone du client', rightColumnX, currentY);
      currentY += 5;
      pdf.text(devis.clientAddress || 'Adresse du client', rightColumnX, currentY);

      currentY += 20;

      // ✅ MÉTADONNÉES DU DEVIS
      checkPageBreak(25);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date du devis: ${formatDate(devis.dateDevis)}`, margin, currentY);
      pdf.text(`Numéro: ${devis._id || 'À définir'}`, rightColumnX, currentY);
      currentY += 6;
      pdf.text(`Date de validité: ${formatDate(devis.dateValidite)}`, margin, currentY);
      pdf.text(`Client: ${clientInfo.name || 'Client non défini'}`, rightColumnX, currentY);
      currentY += 15;

      // ✅ TABLEAU DES PRESTATIONS
      checkPageBreak(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DÉTAIL DES PRESTATIONS', margin, currentY);
      currentY += 10;

      // En-têtes du tableau
      const tableHeaders = ['Description', 'Unité', 'Qté', 'Prix HT', 'TVA', 'Total HT'];
      const colWidths = [60, 15, 15, 25, 15, 25];
      let tableX = margin;

      checkPageBreak(15);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      // Dessiner les en-têtes
      tableHeaders.forEach((header, i) => {
        pdf.rect(tableX, currentY - 5, colWidths[i], 8);
        pdf.text(header, tableX + 2, currentY);
        tableX += colWidths[i];
      });
      currentY += 8;

      // Lignes du tableau
      pdf.setFont('helvetica', 'normal');
      devis.articles.forEach((article) => {
        checkPageBreak(8);
        
        const price = parseFloat(article.unitPrice || "0");
        const qty = parseFloat(article.quantity || "0");
        const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
        
        tableX = margin;
        const rowData = [
          article.description || '',
          article.unit || '',
          qty.toString(),
          `${price.toFixed(2)} €`,
          `${article.tvaRate || "20"}%`,
          `${total.toFixed(2)} €`
        ];
        
        rowData.forEach((data, i) => {
          pdf.rect(tableX, currentY - 5, colWidths[i], 8);
          // Tronquer le texte si trop long
          const maxLength = i === 0 ? 35 : 15;
          const text = data.length > maxLength ? data.substring(0, maxLength) + '...' : data;
          pdf.text(text, tableX + 2, currentY);
          tableX += colWidths[i];
        });
        currentY += 8;
      });

      currentY += 10;

      // ✅ RÉCAPITULATIF TVA ET TOTAUX
      checkPageBreak(50);
      
      // Tableau TVA (à gauche)
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Récapitulatif TVA', margin, currentY);
      currentY += 8;

      const tvaTableHeaders = ['Base HT', 'Taux TVA', 'Montant TVA', 'Total TTC'];
      const tvaColWidths = [25, 20, 25, 25];
      let tvaTableX = margin;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      // En-têtes TVA
      tvaTableHeaders.forEach((header, i) => {
        pdf.rect(tvaTableX, currentY - 5, tvaColWidths[i], 8);
        pdf.text(header, tvaTableX + 2, currentY);
        tvaTableX += tvaColWidths[i];
      });
      currentY += 8;

      // Lignes TVA
      pdf.setFont('helvetica', 'normal');
      Object.entries(tauxTVA)
        .filter(([, { ht }]) => ht > 0)
        .forEach(([rate, { ht, tva }]) => {
          tvaTableX = margin;
          const tvaRowData = [
            `${ht.toFixed(2)} €`,
            `${rate}%`,
            `${tva.toFixed(2)} €`,
            `${(ht + tva).toFixed(2)} €`
          ];
          
          tvaRowData.forEach((data, i) => {
            pdf.rect(tvaTableX, currentY - 5, tvaColWidths[i], 8);
            pdf.text(data, tvaTableX + 2, currentY);
            tvaTableX += tvaColWidths[i];
          });
          currentY += 8;
        });

      // Totaux finaux (à droite)
      const totalsX = pageWidth - margin - 60;
      let totalsY = currentY - (Object.entries(tauxTVA).filter(([, { ht }]) => ht > 0).length * 8) - 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total HT: ${totalHT.toFixed(2)} €`, totalsX, totalsY);
      totalsY += 6;
      pdf.text(`Total TVA: ${totalTVA.toFixed(2)} €`, totalsX, totalsY);
      totalsY += 6;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(`Total TTC: ${totalTTC.toFixed(2)} €`, totalsX, totalsY);

      currentY += 15;

      // ✅ CONDITIONS ET SIGNATURE
      checkPageBreak(40);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONDITIONS', margin, currentY);
      currentY += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`• Devis valable jusqu'au ${formatDate(devis.dateValidite) || "date à définir"}`, margin, currentY);
      currentY += 5;
      pdf.text('• Règlement à 30 jours fin de mois', margin, currentY);
      currentY += 5;
      pdf.text('• TVA non applicable, art. 293 B du CGI (si applicable)', margin, currentY);
      currentY += 15;

      // Signature
      checkPageBreak(25);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Bon pour accord - Date et signature du client :', margin, currentY);
      currentY += 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Date : _______________', margin, currentY);
      pdf.text('Signature :', pageWidth - margin - 60, currentY);

      // Télécharger le PDF
      const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devis._id}`;
      pdf.save(`${fileName}.pdf`);
      
      console.log("✅ PDF généré sans coupures de page");

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