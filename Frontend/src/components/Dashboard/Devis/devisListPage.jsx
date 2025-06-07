import { useEffect, useState } from "react";
import { API_ENDPOINTS, apiRequest } from "../../../config/api";
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

const DevisListPage = ({ clients = [], onEditDevis, onCreateDevis }) => {
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupedDevis, setGroupedDevis] = useState({});
  const [orphanDevis, setOrphanDevis] = useState([]);
  
  // ✅ NOUVEAUX ÉTATS: Filtres et recherche comme la page prospects
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedDevis, setSelectedDevis] = useState([]);
  
  // ✅ NOUVEAUX ÉTATS: Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    fetchAllDevis();
  }, []);

  // ✅ NOUVEAU: Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // ✅ NOUVEAU: Réinitialiser la sélection quand on change de page
  useEffect(() => {
    setSelectedDevis([]);
  }, [currentPage]);

  const fetchAllDevis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
      const devisArray = Array.isArray(data) ? data : [];
      setDevisList(devisArray);
      
      // ✅ NOUVEAU: Séparer les devis valides et orphelins
      const validDevis = [];
      const orphanDevisList = [];
      
      devisArray.forEach(devis => {
        const clientId = typeof devis.clientId === "object" ? devis.clientId?._id : devis.clientId;
        
        if (clientId && clientId !== null) {
          const clientExists = clients.find(c => c._id === clientId);
          if (clientExists) {
            validDevis.push(devis);
          } else {
            orphanDevisList.push({
              ...devis,
              orphanReason: `Client supprimé (ID: ${clientId})`
            });
          }
        } else {
          orphanDevisList.push({
            ...devis,
            orphanReason: 'Aucun client associé'
          });
        }
      });

      // ✅ GROUPER LES DEVIS VALIDES PAR CLIENT
      const grouped = validDevis.reduce((acc, devis) => {
        const clientId = typeof devis.clientId === "object" ? devis.clientId._id : devis.clientId;
        const client = clients.find(c => c._id === clientId);
        
        if (client) {
          if (!acc[client.name]) {
            acc[client.name] = {
              client: client,
              devis: []
            };
          }
          acc[client.name].devis.push(devis);
        }
        return acc;
      }, {});
      
      setGroupedDevis(grouped);
      setOrphanDevis(orphanDevisList);
      
      console.log("📋 Devis groupés par client:", grouped);
      console.log("🔍 Devis valides:", validDevis.length);
      
      if (orphanDevisList.length > 0) {
        console.warn(`⚠️ ${orphanDevisList.length} devis orphelins trouvés:`, orphanDevisList);
      }
      
    } catch (err) {
      console.error("Erreur récupération des devis:", err);
      setError("Erreur lors de la récupération des devis");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU: Fonction pour obtenir tous les devis (valides + orphelins) pour les filtres
  const getAllDevis = () => {
    const validDevis = Object.values(groupedDevis).flatMap(group => group.devis);
    return [...validDevis, ...orphanDevis];
  };

  // ✅ NOUVEAU: Filtrer et trier les devis comme la page prospects
  const filteredDevis = getAllDevis()
    .filter(devis => {
      const client = clients.find(c => c._id === (typeof devis.clientId === "object" ? devis.clientId?._id : devis.clientId));
      const clientName = client?.name || "Client inconnu";
      
      const matchesSearch = devis.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           devis.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'orphan' && devis.orphanReason) ||
                           (statusFilter === 'valid' && !devis.orphanReason);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.title || "").localeCompare(b.title || "");
        case 'client':
          const clientA = clients.find(c => c._id === (typeof a.clientId === "object" ? a.clientId?._id : a.clientId))?.name || "";
          const clientB = clients.find(c => c._id === (typeof b.clientId === "object" ? b.clientId?._id : b.clientId))?.name || "";
          return clientA.localeCompare(clientB);
        case 'amount':
          return calculateTTC(b) - calculateTTC(a);
        case 'date':
        default:
          return new Date(b.dateDevis || 0) - new Date(a.dateDevis || 0);
      }
    });

  // ✅ NOUVEAU: Calculs de pagination
  const totalPages = Math.ceil(filteredDevis.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDevis = filteredDevis.slice(startIndex, endIndex);

  // ✅ NOUVEAU: Statistiques pour l'en-tête
  const allDevis = getAllDevis();
  const validDevisCount = allDevis.filter(d => !d.orphanReason).length;
  const orphanDevisCount = allDevis.filter(d => d.orphanReason).length;
  const totalRevenue = allDevis.reduce((sum, d) => sum + calculateTTC(d), 0);

  const handleDelete = async (id) => {
    const confirm = window.confirm("❗ Supprimer ce devis ?");
    if (!confirm) return;

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.DEVIS.DELETE(id), {
        method: "DELETE",
      });

      await fetchAllDevis();
      alert("✅ Devis supprimé");
      
      // ✅ NOUVEAU: Ajuster la page si nécessaire après suppression
      const newFilteredLength = filteredDevis.length - 1;
      const newTotalPages = Math.ceil(newFilteredLength / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert(`❌ Erreur lors de la suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU: Sélection des devis
  const handleSelectDevis = (devisId) => {
    setSelectedDevis(prev => 
      prev.includes(devisId) 
        ? prev.filter(id => id !== devisId)
        : [...prev, devisId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDevis.length === currentDevis.length) {
      setSelectedDevis([]);
    } else {
      setSelectedDevis(currentDevis.map(d => d._id));
    }
  };

  // ✅ NOUVEAU: Suppression en masse
  const handleBulkDelete = async () => {
    if (selectedDevis.length === 0) return;
    
    const confirmDelete = window.confirm(
      `❗ Supprimer ${selectedDevis.length} devis sélectionné(s) ?`
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await Promise.all(
        selectedDevis.map(id => 
          apiRequest(API_ENDPOINTS.DEVIS.DELETE(id), { method: "DELETE" })
        )
      );

      setSelectedDevis([]);
      await fetchAllDevis();
      alert(`✅ ${selectedDevis.length} devis supprimé(s)`);
      
      // ✅ NOUVEAU: Ajuster la page après suppression en masse
      const newFilteredLength = filteredDevis.length - selectedDevis.length;
      const newTotalPages = Math.ceil(newFilteredLength / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Erreur suppression en masse:", err);
      alert(`❌ Erreur lors de la suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU: Fonctions de navigation de pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // ✅ NOUVEAU: Générer les numéros de pages à afficher
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // ✅ NOUVELLE FONCTION: Associer un devis orphelin à un client
  const handleAssignClient = async (devisId) => {
    if (clients.length === 0) {
      alert("❌ Aucun client disponible. Créez d'abord des clients.");
      return;
    }

    const clientOptions = clients.map(c => `${c.name} (${c.email})`).join('\n');
    const selectedClientName = prompt(
      `Sélectionnez un client pour ce devis :\n\n${clientOptions}\n\nEntrez le nom exact du client :`
    );

    if (!selectedClientName) return;

    const selectedClient = clients.find(c => 
      c.name.toLowerCase() === selectedClientName.toLowerCase() ||
      selectedClientName.toLowerCase().includes(c.name.toLowerCase())
    );

    if (!selectedClient) {
      alert("❌ Client non trouvé. Vérifiez l'orthographe.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.DEVIS.UPDATE(devisId), {
        method: "PUT",
        body: JSON.stringify({ clientId: selectedClient._id }),
      });

      alert(`✅ Devis associé à ${selectedClient.name}`);
      await fetchAllDevis();
    } catch (err) {
      console.error("Erreur association client:", err);
      alert(`❌ Erreur lors de l'association: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (devis) => {
    try {
      setLoading(true);
      
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.background = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.color = 'black';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      document.body.appendChild(tempDiv);

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      let currentY = margin;

      const addSectionToPDF = async (htmlContent, isFirstPage = false) => {
        tempDiv.innerHTML = htmlContent;
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - margin && !isFirstPage) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 5;

        return imgHeight;
      };

      // Générer les sections du PDF
      await addSectionToPDF(generateHeaderHTML(devis), true);
      await addSectionToPDF(generatePartiesHTML(devis));
      await addSectionToPDF(generateMetadataHTML(devis));
      await addSectionToPDF(generateTableHeaderHTML());

      for (let i = 0; i < devis.articles.length; i++) {
        const article = devis.articles[i];
        const price = parseFloat(article.unitPrice || "0");
        const qty = parseFloat(article.quantity || "0");
        const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
        const bgColor = i % 2 === 0 ? '#ffffff' : '#f8f9fa';

        const rowHTML = `
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr style="background: ${bgColor};">
                <td style="padding: 1rem 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; width: 35%;">${article.description || ''}</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 10%;">${article.unit || ''}</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 10%;">${qty}</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 15%;">${price.toFixed(2)} €</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 10%;">${article.tvaRate || "20"}%</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 20%; font-weight: 600; color: #48bb78;">${total.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>
        `;

        await addSectionToPDF(rowHTML);
      }

      await addSectionToPDF(generateTotalsHTML(devis));
      await addSectionToPDF(generateConditionsHTML(devis));

      const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devis._id}`;
      pdf.save(`${fileName}.pdf`);

      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions de génération HTML (identiques à devisPage.jsx)
  const generateHeaderHTML = (devis) => `
    <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #e2e8f0;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          ${devis.logoUrl ? `<img src="${devis.logoUrl}" alt="Logo" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius: 8px;">` : ''}
        </div>
        <div style="flex: 1; text-align: right;">
          <h1 style="font-size: 3rem; font-weight: 700; margin: 0; color: #2d3748; letter-spacing: 2px;">DEVIS</h1>
        </div>
      </div>
    </div>
  `;

  const generatePartiesHTML = (devis) => {
    const clientInfo = clients.find(c => c._id === devis.clientId) || {};
    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">ÉMETTEUR</h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${devis.entrepriseName || 'Nom de l\'entreprise'}</div>
            <div>${devis.entrepriseAddress || 'Adresse'}</div>
            <div>${devis.entrepriseCity || 'Code postal et ville'}</div>
            <div>${devis.entreprisePhone || 'Téléphone'}</div>
            <div>${devis.entrepriseEmail || 'Email'}</div>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">DESTINATAIRE</h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${clientInfo.name || devis.clientName || 'Client orphelin'}</div>
            <div>${clientInfo.email || devis.clientEmail || 'Email non défini'}</div>
            <div>${clientInfo.phone || devis.clientPhone || 'Téléphone non défini'}</div>
            <div>${devis.clientAddress || 'Adresse non définie'}</div>
          </div>
        </div>
      </div>
    `;
  };

  const generateMetadataHTML = (devis) => {
    const clientInfo = clients.find(c => c._id === devis.clientId) || {};
    return `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 30px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date du devis :</div>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formatDate(devis.dateDevis)}</div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Numéro de devis :</div>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${devis._id || 'À définir'}</div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date de validité :</div>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formatDate(devis.dateValidite)}</div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Client :</div>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${clientInfo.name || devis.clientName || 'Client orphelin'}</div>
          </div>
        </div>
      </div>
    `;
  };

  const generateTableHeaderHTML = () => `
    <div style="margin-bottom: 10px;">
      <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.3rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">DÉTAIL DES PRESTATIONS</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); color: white;">
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 35%;">Description</th>
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">Unité</th>
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">Qté</th>
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 15%;">Prix unitaire HT</th>
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">TVA</th>
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 20%;">Total HT</th>
          </tr>
        </thead>
      </table>
    </div>
  `;

  const generateTotalsHTML = (devis) => {
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

    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 30px 0;">
        <div>
          <h4 style="margin: 0 0 1rem 0; color: #2d3748; font-weight: 600;">Récapitulatif TVA</h4>
          <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white;">
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Base HT</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Taux TVA</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Montant TVA</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(tauxTVA)
                .filter(([, { ht }]) => ht > 0)
                .map(([rate, { ht, tva }]) => `
                  <tr>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0;">${ht.toFixed(2)} €</td>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0;">${rate}%</td>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0;">${tva.toFixed(2)} €</td>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0;">${(ht + tva).toFixed(2)} €</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; align-self: end;">
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8f9fa; border-radius: 6px; font-weight: 500;">
            <span>Total HT :</span>
            <span>${totalHT.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8f9fa; border-radius: 6px; font-weight: 500;">
            <span>Total TVA :</span>
            <span>${totalTVA.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; font-weight: 700; font-size: 1.1rem; border-radius: 6px; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);">
            <span>Total TTC :</span>
            <span>${totalTTC.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    `;
  };

  const generateConditionsHTML = (devis) => `
    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea; margin-top: 30px;">
      <div style="margin-bottom: 2rem;">
        <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;"><strong>Conditions :</strong></p>
        <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• Devis valable jusqu'au ${formatDate(devis.dateValidite) || "date à définir"}</p>
        <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• Règlement à 30 jours fin de mois</p>
        <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• TVA non applicable, art. 293 B du CGI (si applicable)</p>
      </div>
      
      <div style="text-align: center;">
        <p style="font-style: italic; color: #718096; margin-bottom: 2rem;">
          <em>Bon pour accord - Date et signature du client :</em>
        </p>
        <div style="display: flex; justify-content: space-around; gap: 2rem;">
          <div style="flex: 1; padding: 1rem; border-bottom: 2px solid #2d3748; color: #4a5568; font-weight: 500;">
            <span>Date : _______________</span>
          </div>
          <div style="flex: 1; padding: 1rem; border-bottom: 2px solid #2d3748; color: #4a5568; font-weight: 500;">
            <span>Signature :</span>
          </div>
        </div>
      </div>
    </div>
  `;

  if (loading && devisList.length === 0) {
    return (
      <div className="loading-state">
        <div className="loading-spinner">⏳</div>
        <p>Chargement des devis...</p>
      </div>
    );
  }

  return (
    <div className="prospects-page">
      {/* ✅ NOUVEAU: En-tête avec titre et statistiques comme la page prospects */}
      <div className="prospects-header">
        <div className="header-content">
          <h1 className="page-title">📄 Mes Devis</h1>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{allDevis.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filteredDevis.length}</span>
              <span className="stat-label">Affichés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{selectedDevis.length}</span>
              <span className="stat-label">Sélectionnés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{validDevisCount}</span>
              <span className="stat-label">✅ Valides</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{orphanDevisCount}</span>
              <span className="stat-label">⚠️ Orphelins</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{totalRevenue.toFixed(0)} €</span>
              <span className="stat-label">💰 CA Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NOUVEAU: Barre de recherche et filtres comme la page prospects */}
      <div className="filters-section">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher par titre, client ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Statut :</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous</option>
              <option value="valid">✅ Valides</option>
              <option value="orphan">⚠️ Orphelins</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Trier par :</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="date">Plus récent</option>
              <option value="title">Titre A-Z</option>
              <option value="client">Client A-Z</option>
              <option value="amount">Montant décroissant</option>
            </select>
          </div>

          {selectedDevis.length > 0 && (
            <div className="bulk-actions">
              <button 
                onClick={handleBulkDelete}
                className="bulk-delete-btn"
                disabled={loading}
              >
                🗑️ Supprimer ({selectedDevis.length})
              </button>
            </div>
          )}
        </div>

        {/* ✅ NOUVEAU: Informations de pagination */}
        {filteredDevis.length > 0 && (
          <div className="pagination-info">
            <span>
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredDevis.length)} sur {filteredDevis.length} devis
              {totalPages > 1 && ` (Page ${currentPage} sur ${totalPages})`}
            </span>
          </div>
        )}
      </div>

      {/* ✅ NOUVEAU: Actions en masse */}
      {currentDevis.length > 0 && (
        <div className="bulk-select-bar">
          <label className="select-all-checkbox">
            <input
              type="checkbox"
              checked={selectedDevis.length === currentDevis.length && currentDevis.length > 0}
              onChange={handleSelectAll}
            />
            <span>Sélectionner tout sur cette page ({currentDevis.length})</span>
          </label>
        </div>
      )}

      {error && (
        <div className="error-state">{error}</div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Chargement...</p>
        </div>
      ) : filteredDevis.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>
            {searchTerm || statusFilter !== 'all' 
              ? "Aucun devis trouvé" 
              : "Aucun devis créé"
            }
          </h3>
          <p>
            {searchTerm || statusFilter !== 'all'
              ? "Essayez de modifier vos critères de recherche"
              : "Commencez par créer votre premier devis !"
            }
          </p>
          {onCreateDevis && (!searchTerm && statusFilter === 'all') && (
            <button onClick={onCreateDevis} className="cta-button">
              🆕 Créer un nouveau devis
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ✅ NOUVEAU: Grille des cartes devis avec sélection */}
          <div className="prospects-grid">
            {currentDevis.map((devisItem) => {
              const client = clients.find(c => c._id === (typeof devisItem.clientId === "object" ? devisItem.clientId?._id : devisItem.clientId));
              const isOrphan = !!devisItem.orphanReason;
              
              return (
                <div 
                  key={devisItem._id} 
                  className={`prospect-card ${selectedDevis.includes(devisItem._id) ? 'selected' : ''} ${isOrphan ? 'orphan-card' : ''}`}
                >
                  {/* ✅ NOUVEAU: Checkbox de sélection */}
                  <div className="card-select">
                    <input
                      type="checkbox"
                      checked={selectedDevis.includes(devisItem._id)}
                      onChange={() => handleSelectDevis(devisItem._id)}
                    />
                  </div>

                  {/* Avatar et indicateur */}
                  <div className="card-header">
                    <div className="prospect-avatar">
                      {devisItem.title ? devisItem.title.charAt(0).toUpperCase() : "D"}
                    </div>
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: isOrphan ? '#f56565' : '#48bb78' }}
                      title={isOrphan ? 'Devis orphelin' : 'Devis valide'}
                    >
                      {isOrphan ? '⚠️' : '✅'}
                    </div>
                  </div>

                  {/* Informations principales */}
                  <div className="card-content">
                    <h3 className="prospect-name">{devisItem.title || "Devis sans titre"}</h3>
                    
                    <div className="contact-info">
                      <div className="contact-item">
                        <span className="contact-icon">👤</span>
                        <span className="contact-text">{client?.name || "Client inconnu"}</span>
                      </div>
                      <div className="contact-item">
                        <span className="contact-icon">📅</span>
                        <span className="contact-text">{formatDate(devisItem.dateDevis)}</span>
                      </div>
                      <div className="contact-item">
                        <span className="contact-icon">💰</span>
                        <span className="contact-text">{calculateTTC(devisItem).toFixed(2)} € TTC</span>
                      </div>
                    </div>

                    {isOrphan && (
                      <div className="notes-preview">
                        <span className="notes-icon">⚠️</span>
                        <span className="notes-text">{devisItem.orphanReason}</span>
                      </div>
                    )}

                    {/* Statut en texte */}
                    <div className="status-text">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: isOrphan ? '#f56565' : '#48bb78',
                          color: 'white'
                        }}
                      >
                        {isOrphan ? '⚠️ Orphelin' : '✅ Valide'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="card-actions">
                    {isOrphan && (
                      <button 
                        onClick={() => handleAssignClient(devisItem._id)}
                        className="action-btn primary-action"
                        title="Associer à un client"
                      >
                        🔗
                      </button>
                    )}
                    
                    <button 
                      onClick={() => onEditDevis && onEditDevis(devisItem)}
                      className="action-btn edit-action"
                      title="Modifier le devis"
                    >
                      ✏️
                    </button>
                    
                    <button 
                      onClick={() => handleDownloadPDF(devisItem)}
                      className="action-btn primary-action"
                      title="Télécharger PDF"
                      disabled={loading}
                    >
                      📄
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(devisItem._id)}
                      className="action-btn delete-action"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Métadonnées */}
                  <div className="card-footer">
                    <span className="join-date">
                      Créé le {new Date(devisItem.date || Date.now()).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ NOUVEAU: Contrôles de pagination */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <div className="pagination-wrapper">
                {/* Bouton Précédent */}
                <button 
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="pagination-btn pagination-prev"
                  title="Page précédente"
                >
                  ← Précédent
                </button>

                {/* Numéros de pages */}
                <div className="pagination-numbers">
                  {currentPage > 3 && totalPages > 5 && (
                    <>
                      <button 
                        onClick={() => goToPage(1)}
                        className="pagination-number"
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="pagination-ellipsis">...</span>}
                    </>
                  )}

                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {currentPage < totalPages - 2 && totalPages > 5 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="pagination-ellipsis">...</span>}
                      <button 
                        onClick={() => goToPage(totalPages)}
                        className="pagination-number"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* Bouton Suivant */}
                <button 
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="pagination-btn pagination-next"
                  title="Page suivante"
                >
                  Suivant →
                </button>
              </div>

              {/* Informations de pagination détaillées */}
              <div className="pagination-details">
                <span>
                  Page {currentPage} sur {totalPages} • {filteredDevis.length} devis au total
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DevisListPage;