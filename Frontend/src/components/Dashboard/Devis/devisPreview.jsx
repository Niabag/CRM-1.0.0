import React, { useRef, memo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import EditableInput from './editableInput';
import './devisPreview.scss';

const DevisPreview = ({ 
  devisData, 
  onFieldChange, 
  onAddArticle, 
  onRemoveArticle,
  onReset, 
  clients = [] 
}) => {
  const previewRef = useRef();

  if (!devisData || !Array.isArray(devisData.articles)) {
    return <div className="devis-preview error-message">⚠️ Données du devis invalides ou incomplètes.</div>;
  }

  const tauxTVA = {
    "20": { ht: 0, tva: 0 },
    "10": { ht: 0, tva: 0 },
    "5.5": { ht: 0, tva: 0 },
  };

  devisData.articles.forEach((item) => {
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

  const handleDownload = async () => {
    try {
      const previewElement = previewRef.current;
      if (!previewElement) {
        alert("❌ Erreur lors de la génération du PDF");
        return;
      }

      previewElement.classList.add("pdf-mode");

      const canvas = await html2canvas(previewElement, { 
        scale: 2,
        useCORS: true,
        allowTaint: true 
      });
      
      previewElement.classList.remove("pdf-mode");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const margin = 10;
      const contentWidth = imgWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgHeight);
        heightLeft -= 297;
      }

      const fileName = devisData.title?.replace(/\s+/g, "-") || `devis-${devisData._id || "nouveau"}`;
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      alert("❌ Erreur lors de la génération du PDF");
    }
  };

  const getClientInfo = () => {
    if (devisData.clientId && clients.length > 0) {
      const client = clients.find(c => c._id === devisData.clientId);
      return client || {};
    }
    return {};
  };

  const clientInfo = getClientInfo();

  return (
    <div className="devis-preview">
      <div className="preview-toolbar">
        <button onClick={onAddArticle}>➕ Ajouter une ligne</button>
        <button onClick={onReset}>🔄 Réinitialiser</button>
        <button className="pdf-download-button" onClick={handleDownload}>
          📄 Télécharger en PDF
        </button>
      </div>

      <div className="preview-content" ref={previewRef}>
        <div className="logo-and-company">
          <div className="logo">
            {devisData.logoUrl ? (
              <img src={devisData.logoUrl} alt="logo" />
            ) : (
              <label className="logo-upload">
                📷 Ajout logo
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => onFieldChange("logoUrl", reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="company">
            <EditableInput 
              name="entrepriseName" 
              value={devisData.entrepriseName || ""} 
              placeholder="Nom de l'entreprise" 
              onChange={onFieldChange} 
            />
            <EditableInput 
              name="entrepriseAddress" 
              value={devisData.entrepriseAddress || ""} 
              placeholder="Adresse" 
              onChange={onFieldChange} 
            />
            <EditableInput 
              name="entrepriseCity" 
              value={devisData.entrepriseCity || ""} 
              placeholder="Ville" 
              onChange={onFieldChange} 
            />
            <EditableInput 
              name="entreprisePhone" 
              value={devisData.entreprisePhone || ""} 
              placeholder="Téléphone" 
              onChange={onFieldChange} 
            />
            <EditableInput 
              name="entrepriseEmail" 
              value={devisData.entrepriseEmail || ""} 
              placeholder="Email" 
              onChange={onFieldChange} 
            />
          </div>
        </div>

        <div className="client-meta">
          <table>
            <tbody>
              <tr>
                <td>Date devis :</td>
                <td>
                  <EditableInput 
                    type="date" 
                    name="dateDevis" 
                    value={devisData.dateDevis || ""} 
                    onChange={onFieldChange} 
                  />
                </td>
              </tr>
              <tr>
                <td>N° client :</td>
                <td>{devisData.clientId || ""}</td>
              </tr>
              <tr>
                <td>N° Devis :</td>
                <td>{devisData._id || devisData.devisNumber || "À définir"}</td>
              </tr>
              <tr>
                <td>Date de validité :</td>
                <td>
                  <EditableInput 
                    type="date" 
                    name="dateValidite" 
                    value={devisData.dateValidite || ""} 
                    onChange={onFieldChange} 
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="client-info">
          <EditableInput 
            name="clientName" 
            value={devisData.clientName || clientInfo.name || ""} 
            placeholder="Nom du client" 
            onChange={onFieldChange} 
          />
          <EditableInput 
            name="clientEmail" 
            value={devisData.clientEmail || clientInfo.email || ""} 
            placeholder="Email du client" 
            onChange={onFieldChange} 
          />
          <EditableInput 
            name="clientPhone" 
            value={devisData.clientPhone || clientInfo.phone || ""} 
            placeholder="Téléphone du client" 
            onChange={onFieldChange} 
          />
          <EditableInput 
            name="clientAddress" 
            value={devisData.clientAddress || ""} 
            placeholder="Adresse du client" 
            onChange={onFieldChange} 
          />
        </div>

        <div className="header">
          <h1>DEVIS</h1>
        </div>

        <table className="devis-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Unité</th>
              <th>Qté</th>
              <th>Prix unitaire</th>
              <th>TVA</th>
              <th>Total HT</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {devisData.articles.map((article, index) => {
              const price = parseFloat(article.unitPrice || "0");
              const qty = parseFloat(article.quantity || "0");
              const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
              
              return (
                <tr key={index}>
                  <td>
                    <EditableInput 
                      name="article-description" 
                      value={article.description || ""} 
                      onChange={onFieldChange} 
                      index={index} 
                      placeholder="Description"
                    />
                  </td>
                  <td>
                    <EditableInput 
                      name="article-unit" 
                      value={article.unit || ""} 
                      onChange={onFieldChange} 
                      index={index} 
                      placeholder="u"
                    />
                  </td>
                  <td>
                    <EditableInput 
                      name="article-quantity" 
                      value={article.quantity || ""} 
                      onChange={onFieldChange} 
                      index={index} 
                      type="number"
                      placeholder="1"
                    />
                  </td>
                  <td>
                    <EditableInput 
                      name="article-unitPrice" 
                      value={article.unitPrice || ""} 
                      onChange={onFieldChange} 
                      index={index} 
                      type="number"
                      placeholder="0"
                    /> €
                  </td>
                  <td>
                    <span className="tva-text-only">{article.tvaRate || "20"}%</span>
                    <select
                      className="tva-select"
                      name="article-tvaRate"
                      value={article.tvaRate || "20"}
                      onChange={(e) => onFieldChange("article-tvaRate", e.target.value, index)}
                    >
                      <option value="20">20%</option>
                      <option value="10">10%</option>
                      <option value="5.5">5.5%</option>
                    </select>
                  </td>
                  <td>{total.toFixed(2)} €</td>
                  <td className="actions-column">
                    <button 
                      className="remove-article-btn"
                      onClick={() => onRemoveArticle && onRemoveArticle(index)}
                      title="Supprimer cette ligne"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="totals-boxes">
          <table className="tva-breakdown">
            <thead>
              <tr><th>Total HT</th><th>Taux TVA</th><th>Total TVA</th><th>Total TTC</th></tr>
            </thead>
            <tbody>
              {Object.entries(tauxTVA)
                .filter(([, { ht }]) => ht > 0)
                .map(([rate, { ht, tva }]) => (
                <tr key={rate}>
                  <td>{ht.toFixed(2)} €</td>
                  <td>{rate}%</td>
                  <td>{tva.toFixed(2)} €</td>
                  <td>{(ht + tva).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="total-summary">
            <tbody>
              <tr><td><strong>Total HT :</strong></td><td>{totalHT.toFixed(2)} €</td></tr>
              <tr><td><strong>Total TVA :</strong></td><td>{totalTVA.toFixed(2)} €</td></tr>
              <tr><td><strong>Total TTC :</strong></td><td>{totalTTC.toFixed(2)} €</td></tr>
            </tbody>
          </table>
        </div>

        <div className="signature">
          <i>Veuillez retourner le devis signé, daté avec la mention : "Bon pour accord"</i>
        </div>

        <div className="signature-line">
          <div>Date : _______________</div>
          <div>Mention : _______________</div>
          <div>Signature : _______________</div>
        </div>
      </div>
    </div>
  );
};

export default memo(DevisPreview);