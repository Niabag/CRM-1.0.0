import React, { useState } from 'react';
import './devisPreview.scss';

const DevisPreview = ({ 
  devis, 
  onInputChange, 
  onArticleChange, 
  onRemoveArticle, 
  isEditable = false 
}) => {
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const calculateTVAByRate = () => {
    const tvaByRate = {};
    
    devis.articles?.forEach(article => {
      const rate = article.tva || 0;
      const base = (article.quantity || 0) * (article.unitPrice || 0);
      const tvaAmount = base * (rate / 100);
      
      if (!tvaByRate[rate]) {
        tvaByRate[rate] = { base: 0, tva: 0 };
      }
      
      tvaByRate[rate].base += base;
      tvaByRate[rate].tva += tvaAmount;
    });
    
    return tvaByRate;
  };

  const tvaByRate = calculateTVAByRate();

  return (
    <div className={`devis-preview ${!isEditable ? 'pdf-mode' : ''}`}>
      {isEditable && (
        <div className="preview-toolbar">
          <button onClick={() => window.print()} className="toolbar-btn pdf-btn">
            📄 Générer PDF
          </button>
        </div>
      )}

      <div className="preview-content">
        {/* En-tête du document */}
        <div className="document-header">
          <div className="logo-section">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="company-logo" />
            ) : isEditable ? (
              <div className="logo-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  📷 Ajouter un logo
                </label>
              </div>
            ) : (
              <div className="logo-placeholder">
                <span>LOGO</span>
              </div>
            )}
          </div>
          
          <div className="document-title">
            <h1>DEVIS</h1>
          </div>
        </div>

        {/* Informations des parties */}
        <div className="parties-info">
          <div className="entreprise-section">
            <h3>Émetteur</h3>
            <div className="info-group">
              {isEditable ? (
                <>
                  <input
                    type="text"
                    value={devis.companyName || ''}
                    onChange={(e) => onInputChange('companyName', e.target.value)}
                    placeholder="Nom de l'entreprise"
                    className="editable-input company-name"
                  />
                  <textarea
                    value={devis.companyAddress || ''}
                    onChange={(e) => onInputChange('companyAddress', e.target.value)}
                    placeholder="Adresse de l'entreprise"
                    className="editable-input"
                    rows="3"
                  />
                  <input
                    type="tel"
                    value={devis.companyPhone || ''}
                    onChange={(e) => onInputChange('companyPhone', e.target.value)}
                    placeholder="Téléphone"
                    className="editable-input"
                  />
                  <input
                    type="email"
                    value={devis.companyEmail || ''}
                    onChange={(e) => onInputChange('companyEmail', e.target.value)}
                    placeholder="Email"
                    className="editable-input"
                  />
                </>
              ) : (
                <>
                  <div className="company-name">{devis.companyName}</div>
                  <div>{devis.companyAddress}</div>
                  <div>{devis.companyPhone}</div>
                  <div>{devis.companyEmail}</div>
                </>
              )}
            </div>
          </div>

          <div className="client-section">
            <h3>Client</h3>
            <div className="info-group">
              {isEditable ? (
                <>
                  <input
                    type="text"
                    value={devis.clientName || ''}
                    onChange={(e) => onInputChange('clientName', e.target.value)}
                    placeholder="Nom du client"
                    className="editable-input client-name"
                  />
                  <input
                    type="email"
                    value={devis.clientEmail || ''}
                    onChange={(e) => onInputChange('clientEmail', e.target.value)}
                    placeholder="Email du client"
                    className="editable-input"
                  />
                  <textarea
                    value={devis.clientAddress || ''}
                    onChange={(e) => onInputChange('clientAddress', e.target.value)}
                    placeholder="Adresse du client&#10;Ligne 2&#10;Code postal Ville"
                    className="editable-input client-address"
                    rows="3"
                  />
                </>
              ) : (
                <>
                  <div className="client-name">{devis.clientName}</div>
                  <div>{devis.clientEmail}</div>
                  <div className="client-address">{devis.clientAddress}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Métadonnées du devis */}
        <div className="devis-metadata">
          <div className="metadata-grid">
            <div className="metadata-item">
              <label>N° Devis</label>
              {isEditable ? (
                <input
                  type="text"
                  value={devis.devisNumber || ''}
                  onChange={(e) => onInputChange('devisNumber', e.target.value)}
                  className="devis-number"
                />
              ) : (
                <div className="devis-number">{devis.devisNumber}</div>
              )}
            </div>
            
            <div className="metadata-item">
              <label>Date</label>
              {isEditable ? (
                <input
                  type="date"
                  value={devis.date || ''}
                  onChange={(e) => onInputChange('date', e.target.value)}
                  className="editable-input"
                />
              ) : (
                <div>{new Date(devis.date).toLocaleDateString('fr-FR')}</div>
              )}
            </div>
            
            <div className="metadata-item">
              <label>Validité</label>
              {isEditable ? (
                <input
                  type="date"
                  value={devis.validityDate || ''}
                  onChange={(e) => onInputChange('validityDate', e.target.value)}
                  className="editable-input"
                />
              ) : (
                <div>{devis.validityDate ? new Date(devis.validityDate).toLocaleDateString('fr-FR') : 'N/A'}</div>
              )}
            </div>
            
            <div className="metadata-item">
              <label>Client ID</label>
              {isEditable ? (
                <input
                  type="text"
                  value={devis.clientId || ''}
                  onChange={(e) => onInputChange('clientId', e.target.value)}
                  className="client-id"
                  placeholder="ID Client"
                />
              ) : (
                <div className="client-id">{devis.clientId || 'N/A'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Section prestations */}
        <div className="prestations-section">
          <h3>Prestations</h3>
          <table className="prestations-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qté</th>
                <th>Prix unitaire</th>
                <th>TVA</th>
                <th>Total HT</th>
                {isEditable && <th className="actions-column">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {devis.articles?.map((article, index) => (
                <tr key={index}>
                  <td className="description-cell">
                    {isEditable ? (
                      <input
                        type="text"
                        value={article.description || ''}
                        onChange={(e) => onArticleChange(index, 'description', e.target.value)}
                        className="editable-input"
                        placeholder="Description de la prestation"
                      />
                    ) : (
                      article.description
                    )}
                  </td>
                  <td>
                    {isEditable ? (
                      <input
                        type="number"
                        value={article.quantity || ''}
                        onChange={(e) => onArticleChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="editable-input"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      article.quantity
                    )}
                  </td>
                  <td>
                    {isEditable ? (
                      <input
                        type="number"
                        value={article.unitPrice || ''}
                        onChange={(e) => onArticleChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="editable-input"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      formatCurrency(article.unitPrice)
                    )}
                  </td>
                  <td>
                    {isEditable ? (
                      <>
                        <select
                          value={article.tva || 20}
                          onChange={(e) => onArticleChange(index, 'tva', parseFloat(e.target.value))}
                          className="tva-select"
                        >
                          <option value={0}>0%</option>
                          <option value={5.5}>5.5%</option>
                          <option value={10}>10%</option>
                          <option value={20}>20%</option>
                        </select>
                        <span className="tva-text-only">{article.tva || 20}%</span>
                      </>
                    ) : (
                      `${article.tva || 20}%`
                    )}
                  </td>
                  <td className="total-cell">
                    {formatCurrency((article.quantity || 0) * (article.unitPrice || 0))}
                  </td>
                  {isEditable && (
                    <td className="actions-column">
                      <button
                        onClick={() => onRemoveArticle(index)}
                        className="remove-article-btn"
                        disabled={devis.articles.length <= 1}
                        title="Supprimer cet article"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section totaux */}
        <div className="totaux-section">
          <div className="totaux-detail">
            <h4>Détail TVA</h4>
            <table className="tva-table">
              <thead>
                <tr>
                  <th>Taux</th>
                  <th>Base HT</th>
                  <th>Montant TVA</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tvaByRate).map(([rate, amounts]) => (
                  <tr key={rate}>
                    <td>{rate}%</td>
                    <td>{formatCurrency(amounts.base)}</td>
                    <td>{formatCurrency(amounts.tva)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totaux-finaux">
            <div className="total-line">
              <span>Total HT:</span>
              <span>{formatCurrency(devis.totalHT)}</span>
            </div>
            <div className="total-line">
              <span>Total TVA:</span>
              <span>{formatCurrency(devis.totalTVA)}</span>
            </div>
            <div className="total-line final-total">
              <span>Total TTC:</span>
              <span>{formatCurrency(devis.totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* Conditions et signature */}
        <div className="conditions-section">
          <div className="conditions-text">
            <h4>Conditions</h4>
            {isEditable ? (
              <textarea
                value={devis.conditions || ''}
                onChange={(e) => onInputChange('conditions', e.target.value)}
                className="editable-input"
                rows="4"
                placeholder="Conditions générales de vente..."
              />
            ) : (
              <p>{devis.conditions}</p>
            )}
          </div>

          <div className="signature-area">
            <p className="signature-instruction">
              Pour acceptation, merci de retourner ce devis signé et daté
            </p>
            <div className="signature-box">
              <div className="signature-line">Bon pour accord, le :</div>
              <div className="signature-line">Signature :</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevisPreview;