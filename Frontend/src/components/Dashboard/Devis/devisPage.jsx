import { useEffect, useState } from "react";
import DevisPreview from "./devisPreview";
import { DEFAULT_DEVIS } from "./constants";
import "./devis.scss";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR");
};

const calculateTTC = (devis) => {
  return devis.articles.reduce((total, article) => {
    const price = parseFloat(article.unitPrice || 0);
    const qty = parseFloat(article.quantity || 0);
    const tva = parseFloat(article.tvaRate || 0);
    const ht = price * qty;
    return total + ht + (ht * tva / 100);
  }, 0);
};

const Devis = ({ clients, initialDevisFromClient = null }) => {
  const normalizeClientId = (c) => typeof c === "object" && c !== null ? c._id : c;

  const [devisList, setDevisList] = useState([]);
  const [currentDevis, setCurrentDevis] = useState(initialDevisFromClient || DEFAULT_DEVIS);
  const [filterClientId, setFilterClientId] = useState(normalizeClientId(initialDevisFromClient?.clientId));

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchDevis = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/devis", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setDevisList(data);
      } catch (err) {
        console.error("Erreur récupération des devis", err);
      }
    };
    fetchDevis();
  }, []);

  useEffect(() => {
    if (initialDevisFromClient) {
      setCurrentDevis(initialDevisFromClient);
      setFilterClientId(normalizeClientId(initialDevisFromClient.clientId));
    }
  }, [initialDevisFromClient]);

  const handleSelectDevis = (devis) => {
    const normalizedClientId = normalizeClientId(devis.clientId);
    const updatedDevis = {
      ...devis,
      clientId: normalizedClientId,
      articles: Array.isArray(devis.articles) ? devis.articles : [],
    };
    setCurrentDevis(updatedDevis);
    setFilterClientId(normalizedClientId);
  };

  const handleReset = () => {
    setCurrentDevis(DEFAULT_DEVIS);
    setFilterClientId(null);
  };

  const handleSave = async (updatedDevis, isEdit = false) => {
    const token = localStorage.getItem("token");
    const clientId = normalizeClientId(updatedDevis.clientId);

    try {
      const url = isEdit
        ? `http://localhost:5000/api/devis/${updatedDevis._id}`
        : "http://localhost:5000/api/devis";

      const method = isEdit ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...updatedDevis, clientId }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert("❌ Erreur lors de l'enregistrement du devis.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/devis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDevisList(data);

      alert("✅ Devis enregistré avec succès !");
      setCurrentDevis(DEFAULT_DEVIS);
      setFilterClientId(null);
    } catch (error) {
      alert("❌ Une erreur est survenue lors de l'enregistrement.");
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("❗ Supprimer ce devis ?");
    if (!confirm) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/devis/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Suppression échouée");

      setDevisList((prev) => prev.filter((d) => d._id !== id));
      alert("✅ Devis supprimé");
    } catch (err) {
      alert("❌ Erreur lors de la suppression du devis");
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
      articles: [...currentDevis.articles, { description: "", unitPrice: "", quantity: "1", unit: "", tvaRate: "20" }],
    };
    setCurrentDevis(updated);
  };

  const totalTTC = calculateTTC(currentDevis);

  return (
    <div className="devis-page">
      <div className="devis-list-section">
        <h3>Modifier/Télécharger un devis existant</h3>
        <div className="containerDevisListItems">
          {devisList
            .filter((devis) => devis.title && devis.title.trim() !== "")
            .map((devis) => (
              <div key={devis._id} className="devis-item">
                <div className="devis-info">
                  <div className="devis-sub">
                    📅 {formatDate(devis.dateDevis)} — 💰 {calculateTTC(devis).toFixed(2)} € TTC
                  </div>
                </div>
                <button onClick={() => handleSelectDevis(devis)}>✏️ Modifier</button>
                <button onClick={() => handleDelete(devis._id)}>🗑️ Supprimer</button>
              </div>
            ))}
        </div>
      </div>

      <div className="containerDevisPreview">
        {currentDevis && (
          <div className="devis-meta-header">
            <h2 className="devis-title">
              {currentDevis._id
                ? `✏️ Modification du devis du ${formatDate(currentDevis.dateDevis)} — Total TTC : ${totalTTC.toFixed(2)} €`
                : `🆕 Nouveau devis — Total TTC : ${totalTTC.toFixed(2)} €`}
            </h2>
          </div>
        )}

        <div className="actions">
          <button onClick={() => handleSave(currentDevis, !!currentDevis._id)}>
            💾 Enregistrer le devis
          </button>
          {currentDevis._id && (
            <button className="cancel-button" onClick={handleReset}>
              ❌ Annuler
            </button>
          )}
        </div>

        {currentDevis && (
          <DevisPreview
            devisData={currentDevis}
            totalTTC={totalTTC}
            onFieldChange={handleFieldChange}
            onAddArticle={handleAddArticle}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
};

export default Devis;