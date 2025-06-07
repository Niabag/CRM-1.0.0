// Données de démonstration pour le frontend
export const mockProspects = [
  {
    id: 1,
    name: "Sophie Leblanc",
    email: "sophie.leblanc@gmail.com",
    phone: "06 12 34 56 78",
    company: "Boutique Mode & Style",
    status: "Nouveau",
    lastContact: "2024-01-15",
    notes: "Intéressée par un site e-commerce"
  },
  {
    id: 2,
    name: "Pierre Moreau",
    email: "pierre.moreau@hotmail.fr",
    phone: "06 98 76 54 32",
    company: "Restaurant Le Gourmet",
    status: "En cours",
    lastContact: "2024-01-20",
    notes: "Souhaite une application de commande en ligne"
  },
  {
    id: 3,
    name: "Camille Rousseau",
    email: "camille.rousseau@yahoo.fr",
    phone: "07 11 22 33 44",
    company: "Cabinet d'Avocat Rousseau",
    status: "Qualifié",
    lastContact: "2024-01-25",
    notes: "Besoin d'un site vitrine professionnel"
  },
  {
    id: 4,
    name: "Lucas Bernard",
    email: "lucas.bernard@outlook.com",
    phone: "06 55 66 77 88",
    company: "Garage Auto Plus",
    status: "Nouveau",
    lastContact: "2024-01-28",
    notes: "Système de gestion des rendez-vous"
  },
  {
    id: 5,
    name: "Emma Petit",
    email: "emma.petit@free.fr",
    phone: "07 99 88 77 66",
    company: "Salon de Beauté Emma",
    status: "En cours",
    lastContact: "2024-02-01",
    notes: "Site avec système de réservation"
  },
  {
    id: 6,
    name: "Thomas Durand",
    email: "thomas.durand@orange.fr",
    phone: "06 44 33 22 11",
    company: "Entreprise BTP Durand",
    status: "Qualifié",
    lastContact: "2024-02-03",
    notes: "Portfolio de réalisations"
  },
  {
    id: 7,
    name: "Léa Girard",
    email: "lea.girard@sfr.fr",
    phone: "07 77 66 55 44",
    company: "École de Danse Girard",
    status: "Nouveau",
    lastContact: "2024-02-05",
    notes: "Site avec planning des cours"
  },
  {
    id: 8,
    name: "Hugo Roux",
    email: "hugo.roux@laposte.net",
    phone: "06 33 44 55 66",
    company: "Photographe Professionnel",
    status: "En cours",
    lastContact: "2024-02-08",
    notes: "Galerie photo en ligne"
  },
  {
    id: 9,
    name: "Chloé Simon",
    email: "chloe.simon@gmail.com",
    phone: "07 22 33 44 55",
    company: "Agence Immobilière Simon",
    status: "Qualifié",
    lastContact: "2024-02-10",
    notes: "Plateforme de gestion immobilière"
  },
  {
    id: 10,
    name: "Antoine Michel",
    email: "antoine.michel@wanadoo.fr",
    phone: "06 66 77 88 99",
    company: "Consultant Marketing",
    status: "Nouveau",
    lastContact: "2024-02-12",
    notes: "Site personnel et blog"
  }
];

export const mockDevis = [
  {
    id: 1,
    title: "Site web vitrine - Boutique Mode",
    client: "Sophie Leblanc",
    amount: 2500,
    status: "En attente",
    date: "2024-01-15",
    validUntil: "2024-02-15"
  },
  {
    id: 2,
    title: "Application mobile - Restaurant",
    client: "Pierre Moreau",
    amount: 8500,
    status: "Accepté",
    date: "2024-01-20",
    validUntil: "2024-03-20"
  },
  {
    id: 3,
    title: "Site professionnel - Cabinet Avocat",
    client: "Camille Rousseau",
    amount: 3200,
    status: "En cours",
    date: "2024-01-25",
    validUntil: "2024-02-25"
  },
  {
    id: 4,
    title: "Système de gestion - Garage",
    client: "Lucas Bernard",
    amount: 4800,
    status: "En attente",
    date: "2024-01-28",
    validUntil: "2024-02-28"
  },
  {
    id: 5,
    title: "Site avec réservation - Salon",
    client: "Emma Petit",
    amount: 3800,
    status: "Refusé",
    date: "2024-02-01",
    validUntil: "2024-03-01"
  }
];

export const mockStats = {
  totalProspects: mockProspects.length,
  totalDevis: mockDevis.length,
  totalRevenue: mockDevis.reduce((sum, devis) => 
    devis.status === 'Accepté' ? sum + devis.amount : sum, 0
  ),
  conversionRate: Math.round(
    (mockDevis.filter(d => d.status === 'Accepté').length / mockDevis.length) * 100
  ),
  pendingDevis: mockDevis.filter(d => d.status === 'En attente').length,
  acceptedDevis: mockDevis.filter(d => d.status === 'Accepté').length
};

// Fonction pour générer des données aléatoires supplémentaires
export const generateRandomProspect = () => {
  const firstNames = ['Alexandre', 'Isabelle', 'Julien', 'Nathalie', 'Sébastien', 'Valérie', 'Maxime', 'Caroline'];
  const lastNames = ['Dubois', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia'];
  const companies = ['Tech Solutions', 'Consulting Pro', 'Digital Agency', 'Innovation Lab', 'Creative Studio'];
  const statuses = ['Nouveau', 'En cours', 'Qualifié'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const company = companies[Math.floor(Math.random() * companies.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id: Date.now(),
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: `06 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`,
    company: company,
    status: status,
    lastContact: new Date().toISOString().split('T')[0],
    notes: "Nouveau prospect généré automatiquement"
  };
};