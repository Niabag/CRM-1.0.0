import React from 'react';
import { Link } from 'react-router-dom';
import './home.scss';

const Home = () => {
  const features = [
    {
      icon: '👥',
      title: 'Gestion des Prospects',
      description: 'Organisez et suivez vos prospects efficacement avec un système de statuts avancé.'
    },
    {
      icon: '📊',
      title: 'Analytics Avancées',
      description: 'Visualisez vos performances avec des graphiques et statistiques détaillées.'
    },
    {
      icon: '📄',
      title: 'Devis Professionnels',
      description: 'Créez des devis personnalisés et professionnels en quelques clics.'
    },
    {
      icon: '💳',
      title: 'Cartes de Visite',
      description: 'Générez des cartes de visite digitales avec QR codes et actions personnalisées.'
    },
    {
      icon: '🔔',
      title: 'Notifications',
      description: 'Restez informé des nouvelles activités et interactions clients.'
    },
    {
      icon: '⚙️',
      title: 'Paramètres Flexibles',
      description: 'Configurez l\'application selon vos besoins spécifiques.'
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Inscription',
      description: 'Créez votre compte en quelques minutes et accédez à votre dashboard.'
    },
    {
      number: 2,
      title: 'Configuration',
      description: 'Personnalisez vos paramètres et importez vos données existantes.'
    },
    {
      number: 3,
      title: 'Gestion',
      description: 'Commencez à gérer vos prospects, créer des devis et analyser vos performances.'
    }
  ];

  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'Consultante',
      avatar: 'MD',
      content: 'CRM Pro a révolutionné ma façon de gérer mes clients. Interface intuitive et fonctionnalités complètes.'
    },
    {
      name: 'Pierre Martin',
      role: 'Entrepreneur',
      avatar: 'PM',
      content: 'Les cartes de visite digitales sont un vrai plus pour mon business. Mes clients adorent !'
    },
    {
      name: 'Sophie Laurent',
      role: 'Freelance',
      avatar: 'SL',
      content: 'La gestion des devis est parfaite. Je gagne un temps précieux dans mon quotidien.'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Gérez vos clients avec <span className="gradient-text">CRM Pro</span>
            </h1>
            <p className="hero-subtitle">
              La solution complète pour gérer vos prospects, créer des devis professionnels 
              et analyser vos performances. Tout en un seul endroit.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-primary large">
                <span>🚀</span> Commencer gratuitement
              </Link>
              <Link to="/login" className="btn-secondary large">
                <span>🔐</span> Se connecter
              </Link>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="preview-title">Dashboard CRM</div>
              </div>
              <div className="preview-stats">
                <div className="stat-card">
                  <span className="stat-number">127</span>
                  <span className="stat-label">Prospects</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">43</span>
                  <span className="stat-label">Devis</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">89%</span>
                  <span className="stat-label">Taux</span>
                </div>
              </div>
              <div className="preview-chart">
                <div className="chart-bars">
                  <div className="bar" style={{'--height': '60%'}}></div>
                  <div className="bar" style={{'--height': '80%'}}></div>
                  <div className="bar" style={{'--height': '45%'}}></div>
                  <div className="bar" style={{'--height': '90%'}}></div>
                  <div className="bar" style={{'--height': '70%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Fonctionnalités Puissantes</h2>
            <p>Tout ce dont vous avez besoin pour gérer efficacement votre activité</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>Comment ça marche ?</h2>
            <p>Démarrez en 3 étapes simples</p>
          </div>
          
          <div className="steps-container">
            {steps.map((step, index) => (
              <div key={index} className="step">
                <div className="step-number">{step.number}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>Ce que disent nos utilisateurs</h2>
            <p>Découvrez pourquoi ils nous font confiance</p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <p>"{testimonial.content}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Prêt à transformer votre gestion client ?</h2>
            <p>Rejoignez des centaines d'entrepreneurs qui utilisent déjà CRM Pro</p>
            <Link to="/register" className="btn-primary large">
              <span>🚀</span> Commencer maintenant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;