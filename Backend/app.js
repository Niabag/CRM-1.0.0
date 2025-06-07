const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import des configurations
const connectDB = require("./config/database");
const corsOptions = require("./config/cors");

// Import des routes
const userRoutes = require("./routes/userRoutes");
const clientRoutes = require("./routes/clientRoutes");
const devisRoutes = require("./routes/devisRoutes");

const app = express();

// ✅ Connexion à la base de données
connectDB();

// ✅ Middleware pour parser JSON avec limite augmentée
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ✅ Configuration CORS
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Gestion des requêtes preflight

// ✅ Routes de l'API
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/devis", devisRoutes);

// ✅ Route de vérification du serveur
app.get("/", (req, res) => {
  res.json({
    message: "✅ Backend CRM opérationnel 🚀",
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// ✅ Route de santé pour vérifier l'état du serveur
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ✅ Gestion des erreurs 404
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route non trouvée",
    path: req.originalUrl,
  });
});

// ✅ Middleware de gestion d'erreurs globales
app.use((error, req, res, next) => {
  console.error("❌ Erreur serveur:", error);
  res.status(500).json({
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

module.exports = app;