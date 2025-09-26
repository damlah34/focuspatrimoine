# focuspatrimoine
Gestion des fonctionnalités clients

## Configuration de l'authentification Supabase

1. Créez un projet sur [Supabase](https://supabase.com/) et activez l'authentification email/mot de passe.
2. Récupérez l'URL du projet ainsi que la clé `anon` dans les paramètres API.
3. Ajoutez un fichier `.env.local` (ou `.env`) à la racine du projet Vite avec les variables suivantes :

   ```bash
   VITE_SUPABASE_URL="https://<votre-projet>.supabase.co"
   VITE_SUPABASE_ANON_KEY="<votre_cle_anon>"
   ```

4. Redémarrez le serveur de développement pour prendre en compte les nouvelles variables.

Les utilisateurs créés dans Supabase auront désormais accès aux pages protégées de l'application.
