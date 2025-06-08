import React from 'react';
import { Link } from 'react-router-dom';
import './Error.scss';

const Error = () => {
  return (
    <div className="page-container">
      <div className="container-erorr">
        <h1 className="num-erorr">404</h1>
        <h2 className="description-erorr">
          Oups! La page que vous demandez n'existe pas.
        </h2>
        <Link className="styled-link-erorr" to="/">
          Retourner sur la page d'accueil
        </Link>
      </div>
    </div>
  );
};

export default Error;