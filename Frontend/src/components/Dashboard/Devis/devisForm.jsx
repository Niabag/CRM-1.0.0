// DevisForm.jsx
import { useEffect, useState } from "react";
import { DEFAULT_DEVIS } from "./constants";

const DevisForm = ({ clients, initialDevis, onSave, onCancel, onUpdate }) => {
  const [devis, setDevis] = useState(initialDevis || DEFAULT_DEVIS);
  const isEdit = Boolean(initialDevis?._id);

  useEffect(() => {
    if (initialDevis) setDevis(initialDevis);
  }, [initialDevis]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...devis, [name]: value };
    setDevis(updated);
    onUpdate?.(updated);
  };

  const handleArticleChange = (index, field, value) => {
    const updatedArticles = [...devis.articles];
    updatedArticles[index][field] = value;
    const updated = { ...devis, articles: updatedArticles };
    setDevis(updated);
    onUpdate?.(updated);
  };

  const handleAddArticle = () => {
    const updated = {
      ...devis,
      articles: [...devis.articles, { description: "", unitPrice: "", quantity: "", unit: "" }],
    };
    setDevis(updated);
    onUpdate?.(updated);
  };

  const handleRemoveArticle = (index) => {
    const updatedArticles = devis.articles.filter((_, i) => i !== index);
    const updated = { ...devis, articles: updatedArticles };
    setDevis(updated);
    onUpdate?.(updated);
  };

  const handleSubmit = () => {
    if (!devis.clientId) {
      alert("❌ Veuillez sélectionner un client pour ce devis.");
      return;
    }

    const totalHT = devis.articles.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice || 0);
      const qty = parseFloat(item.quantity || 0);
      return sum + price * qty;
    }, 0);

    onSave({ ...devis, amount: totalHT }, isEdit);
  };

  return (
    <div className="devis-form">
      <h3>
  {isEdit
    ? `Modification du devis : ${devis.title || "Sans titre"}`
    : "Créer un Devis"}
</h3>


      <h4>Informations de l'entreprise</h4>
      <input name="entrepriseName" value={devis.entrepriseName} onChange={handleChange} placeholder="Nom de l’entreprise" />
      <input name="entrepriseAddress" value={devis.entrepriseAddress} onChange={handleChange} placeholder="Adresse" />
      <input name="entrepriseCity" value={devis.entrepriseCity} onChange={handleChange} placeholder="Ville et code postal" />
      <input name="entreprisePhone" value={devis.entreprisePhone} onChange={handleChange} placeholder="Téléphone" />
      <input name="entrepriseEmail" value={devis.entrepriseEmail} onChange={handleChange} placeholder="Email" />

      <input type="file" accept="image/*" onChange={(e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = { ...devis, logoUrl: reader.result };
      setDevis(updated);
      onUpdate?.(updated);
    };
    reader.readAsDataURL(file);
  }
}} />

      <input name="title" value={devis.title} onChange={handleChange} placeholder="Titre" />
      <select name="clientId" value={devis.clientId} onChange={handleChange}>
        <option value="">-- Client --</option>
        {clients.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
      <input type="date" name="dateDevis" value={devis.dateDevis} onChange={handleChange} />
      <input type="date" name="dateValidite" value={devis.dateValidite} onChange={handleChange} />
      <select name="tvaRate" value={devis.tvaRate} onChange={handleChange}>
        <option value="20">20%</option>
        <option value="10">10%</option>
        <option value="5.5">5.5%</option>
        <option value="2.1">2.1%</option>
      </select>

      <h4>Prestations</h4>
      {devis.articles.map((item, index) => (
        <div key={index} className="article-form">
          <input type="text" placeholder="Description" value={item.description} onChange={(e) => handleArticleChange(index, "description", e.target.value)} />
          <input type="number" placeholder="Prix unitaire" value={item.unitPrice} onChange={(e) => handleArticleChange(index, "unitPrice", e.target.value)} />
          <input type="number" placeholder="Quantité" value={item.quantity} onChange={(e) => handleArticleChange(index, "quantity", e.target.value)} />
          <input type="text" placeholder="Unité" value={item.unit} onChange={(e) => handleArticleChange(index, "unit", e.target.value)} />
          <button onClick={() => handleRemoveArticle(index)}>🗑️</button>
        </div>
      ))}
      <button onClick={handleAddArticle}>➕ Ajouter un article</button>
      <button onClick={handleSubmit}>💾 Enregistrer</button>
      {isEdit && <button onClick={onCancel}>Annuler</button>}
    </div>
  );
};

export default DevisForm;