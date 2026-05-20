// Script pour simuler un utilisateur premium (pour tests uniquement)
// À utiliser dans la console du navigateur ou dans un composant de développement

const simulatePremiumUser = () => {
  const premiumUser = {
    user: {
      id: 1,
      username: "test_premium",
      email: "premium@test.com",
      role: "user",
      is_premium: true, // ou subscription_type: "premium"
      is_verified: true,
      first_name: "Test",
      last_name: "Premium"
    },
    token: "fake_jwt_token_for_testing"
  };

  localStorage.setItem('user', JSON.stringify(premiumUser));
  console.log('✅ Utilisateur premium simulé créé !');
  console.log('Utilisateur:', premiumUser.user);
  console.log('Rechargez la page pour voir les changements.');
};

const simulateRegularUser = () => {
  const regularUser = {
    user: {
      id: 2,
      username: "test_regular",
      email: "regular@test.com",
      role: "user",
      is_premium: false,
      is_verified: true,
      first_name: "Test",
      last_name: "Regular"
    },
    token: "fake_jwt_token_for_testing"
  };

  localStorage.setItem('user', JSON.stringify(regularUser));
  console.log('✅ Utilisateur régulier simulé créé !');
  console.log('Utilisateur:', regularUser.user);
  console.log('Rechargez la page pour voir les changements.');
};

const clearUser = () => {
  localStorage.removeItem('user');
  console.log('✅ Utilisateur supprimé du localStorage');
  console.log('Rechargez la page pour voir les changements.');
};

// Exposer les fonctions globalement pour utilisation en console
if (typeof window !== 'undefined') {
  window.simulatePremiumUser = simulatePremiumUser;
  window.simulateRegularUser = simulateRegularUser;
  window.clearUser = clearUser;

  console.log(`
🎯 Utilitaires de test disponibles dans la console:

simulatePremiumUser()  - Crée un utilisateur premium fictif
simulateRegularUser()  - Crée un utilisateur régulier fictif
clearUser()           - Supprime l'utilisateur du localStorage

Exemple d'utilisation:
simulatePremiumUser()
Puis rechargez la page pour voir les liens IA Premium apparaître.
  `);
}

export { simulatePremiumUser, simulateRegularUser, clearUser };