import React, { useRef, memo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import EditableInput from './editableInput';
import './devisPreview.scss';

const DevisPreview = ({ devisData, onFieldChange, onAddArticle, onReset }) => {
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
    const ht = price * qty;
    const taux = item.tvaRate || "20";

    if (!isNaN(ht) && tauxTVA[taux]) {
      tauxTVA[taux].ht += ht;
      tauxTVA[taux].tva += ht * (parseFloat(taux) / 100);
    }
  });

  const totalHT = Object.values(tauxTVA).reduce((sum, t) => sum + t.ht, 0);
  const totalTVA = Object.values(tauxTVA).reduce((sum, t) => sum + t.tva, 0);
  const totalTTC = totalHT + totalTVA;

  const handleDownload = async () => {
    const previewElement = previewRef.current;
    previewElement.classList.add("pdf-mode");

    html2canvas(previewElement, { scale: 2 }).then((canvas) => {
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

      const fileName = devisData.title?.replace(/\s+/g, "-") || `devis-${devisData._id || "sans-id"}`;
      pdf.save(`${fileName}.pdf`);
    });
  };

  return (
    <div className="devis-preview">
      <div className="preview-toolbar">
        <button onClick={onAddArticle}>➕ Ajouter une ligne</button>
        <button onClick={onReset}>🔁 Réinitialiser</button>
        <button className="pdf-download-button" onClick={handleDownload}>📄 Télécharger en PDF</button>
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
            <EditableInput name="entrepriseName" value={devisData.entrepriseName} placeholder="Nom de l’entreprise" onChange={onFieldChange} />
            <EditableInput name="entrepriseAddress" value={devisData.entrepriseAddress} placeholder="Adresse" onChange={onFieldChange} />
            <EditableInput name="entrepriseCity" value={devisData.entrepriseCity} placeholder="Ville" onChange={onFieldChange} />
            <EditableInput name="entreprisePhone" value={devisData.entreprisePhone} placeholder="Téléphone" onChange={onFieldChange} />
            <EditableInput name="entrepriseEmail" value={devisData.entrepriseEmail} placeholder="Email" onChange={onFieldChange} />
          </div>
        </div>

        <div className="client-meta">
          <table>
            <tbody>
              <tr>
                <td>Date devis :</td>
                <td><EditableInput type="date" name="dateDevis" value={devisData.dateDevis} onChange={onFieldChange} /></td>
              </tr>
              <tr>
                <td>N° client :</td>
                <td>{devisData.clientId?._id || devisData.clientId || ""}</td>
              </tr>
              <tr>
                <td>N° Devis :</td>
                <td>{devisData._id || devisData.devisNumber || "À définir"}</td>
              </tr>
              <tr>
                <td>Date de validité :</td>
                <td><EditableInput type="date" name="dateValidite" value={devisData.dateValidite} onChange={onFieldChange} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="client-info">
          <EditableInput name="clientName" value={devisData.clientName} placeholder="Dénomination" onChange={onFieldChange} />
          <EditableInput name="clientStreet" value={devisData.clientStreet} placeholder="Adresse client" onChange={onFieldChange} />
          <EditableInput name="clientPostalCode" value={devisData.clientPostalCode} placeholder="Code Postal" onChange={onFieldChange} />
          <EditableInput name="clientCity" value={devisData.clientCity} placeholder="Ville" onChange={onFieldChange} />
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
            </tr>
          </thead>
          <tbody>
            {devisData.articles.map((article, index) => {
              const total = parseFloat(article.unitPrice || "0") * parseFloat(article.quantity || "0");
              return (
                <tr key={index}>
                  <td><EditableInput name="article-description" value={article.description} onChange={onFieldChange} index={index} /></td>
                  <td><EditableInput name="article-unit" value={article.unit} onChange={onFieldChange} index={index} /></td>
                  <td><EditableInput name="article-quantity" value={article.quantity} onChange={onFieldChange} index={index} /></td>
                  <td><EditableInput name="article-unitPrice" value={article.unitPrice} onChange={onFieldChange} index={index} /> €</td>
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
                  <td>{!isNaN(total) ? total.toFixed(2) : "0.00"} €</td>
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
              {Object.entries(tauxTVA).map(([rate, { ht, tva }]) => (
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
          <div>Date :</div>
          <div>Mention :</div>
          <div>Signature :</div>
        </div>
      </div>
    </div>
  );
};

export default memo(DevisPreview);
