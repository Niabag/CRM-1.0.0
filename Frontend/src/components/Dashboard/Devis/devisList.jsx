
// DevisList.jsx
const DevisList = ({ devisList, onSelect, onDelete, clientIdFilter }) => {
  console.log("🎯 clientIdFilter:", clientIdFilter);
console.log("📋 devisList:", devisList.map((d) => ({
  _id: d._id,
  title: d.title,
  clientId: typeof d.clientId === "object" ? d.clientId._id : d.clientId
})));

const filteredDevis = clientIdFilter
  ? devisList.filter((d) => {
      const dClientId = typeof d.clientId === "object" ? d.clientId._id : d.clientId;
      const match = dClientId === clientIdFilter;
      console.log(`🔍 Compare ${dClientId} === ${clientIdFilter} →`, match);
      return match;
    })
  : devisList;

  return (
    <div className="devis-list">
      <h3>Modifier/Telecharger un devis existant</h3>
      <ul>
        {filteredDevis.map((devis, index) => (
        <li key={devis._id}>
        {devis.title} – {devis.amount}€
        <button onClick={() => onSelect(devis)}>✏️ Modifier</button>
        <button onClick={() => onDelete(devis._id)}>🗑 Supprimer</button>
      </li>
        ))}
      </ul>
    </div>
  );
};

export default DevisList;