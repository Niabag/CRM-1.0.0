const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "RANDOM_TOKEN_SECRET";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation des données
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: "Tous les champs sont requis" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Le mot de passe doit contenir au moins 6 caractères" 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: "Un utilisateur avec cet email existe déjà" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password: hashedPassword 
    });
    
    await newUser.save();

    console.log("✅ Nouvel utilisateur créé:", newUser.email);
    res.status(201).json({ 
      message: "Utilisateur inscrit avec succès",
      userId: newUser._id 
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'inscription:", error);
    res.status(500).json({ 
      message: "Erreur lors de l'inscription" 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email et mot de passe requis" 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ 
        message: "Identifiants incorrects" 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Identifiants incorrects" 
      });
    }

    const token = jwt.sign(
      { userId: user._id }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log("✅ Connexion réussie pour:", user.email);
    res.status(200).json({ 
      userId: user._id, 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("❌ Erreur lors de la connexion:", error);
    res.status(500).json({ 
      message: "Erreur lors de la connexion" 
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ 
        message: "Utilisateur non trouvé" 
      });
    }

    res.status(200).json({
      userId: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'utilisateur:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération de l'utilisateur" 
    });
  }
};