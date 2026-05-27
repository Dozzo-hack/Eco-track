export default function Dashboard() {
  return (
    <div>
      <header className="page-header">
        <h1>Tableau de bord</h1>
        <p>Bienvenue, Admin. Voici les activités d'aujourd'hui.</p>
      </header>

      <div className="stats-grid">
        <div className="glass-card stat-item">
          <h3>Collectes</h3>
          <p className="stat-number">128</p>
        </div>
        {/* Ajoute tes autres stats ici */}
      </div>
    </div>
  );
}