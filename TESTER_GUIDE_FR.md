# Otantist — Guide de test

Merci d'être parmi les premiers testeurs d'Otantist. Ce guide couvre tout ce que l'application peut faire et comment la tester. Veuillez le lire avant votre première connexion.

---

## Qu'est-ce qu'Otantist?

Otantist est une application de messagerie privée conçue pour les personnes neurodivergentes. Elle est construite autour du confort et de la sécurité — vous contrôlez comment et quand vous communiquez.

Il s'agit d'une version bêta. Certaines choses peuvent ne pas être terminées, et vos commentaires aident à orienter ce qui sera développé ensuite.

---

## Comptes de test

Tous les comptes de test utilisent le même mot de passe : **`Password123!`**

| Courriel          | Rôle        | Notes                                                      |
| ----------------- | ----------- | ---------------------------------------------------------- |
| `marie@test.com`  | Utilisateur | Français, profil complété                                  |
| `alex@test.com`   | Utilisateur | Anglais, profil complété, a bloqué Sam                     |
| `sam@test.com`    | Utilisateur | Anglais, profil partiel (arrêté à l'étape sensorielle)     |
| `jordan@test.com` | Utilisateur | Anglais, profil complété                                   |
| `mod@test.com`    | Modérateur  | Redirige vers /moderation à la connexion                   |
| `admin@test.com`  | Super admin | Redirige vers /admin à la connexion                        |
| `parent@test.com` | Parent      | Gère Léo, Emma, Noah; redirige vers /parent à la connexion |
| `minor@test.com`  | Mineur      | Léo — compte géré par un parent                            |
| `minor2@test.com` | Mineur      | Emma — compte géré par un parent                           |
| `minor3@test.com` | Mineur      | Noah — compte géré (relation tuteur légal)                 |

**Codes d'invitation :** `BETA2024`, `TESTCODE`

---

## Ce dont vous aurez besoin

- Un **code d'invitation** (voir ci-dessus, ou celui fourni par la personne qui vous a invité)
- Une **adresse courriel** à laquelle vous avez accès (pour la vérification)
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)

L'application est disponible à : **https://otantist-web.vercel.app**

---

## Créer votre compte

1. Allez sur l'application et cliquez sur **S'inscrire**
2. Entrez votre adresse courriel, choisissez un mot de passe et entrez votre code d'invitation
3. Vérifiez votre courriel pour un lien de vérification et cliquez dessus
4. Lisez et acceptez les conditions d'utilisation
5. Complétez la configuration de votre profil (5 courtes étapes — vous pouvez sauvegarder et revenir plus tard si nécessaire)

Une fois terminé, vous arriverez sur votre tableau de bord principal.

---

## Configuration de votre profil (intégration)

La configuration comporte 5 étapes. Vous pouvez tout modifier plus tard dans les Paramètres.

| Étape         | Ce que vous faites                                                       |
| ------------- | ------------------------------------------------------------------------ |
| Profil        | Choisir un nom d'affichage et un groupe d'âge                            |
| Communication | Définir votre ton préféré et votre style de messagerie                   |
| Sensoriel     | Ajuster les animations et l'intensité des couleurs                       |
| Disponibilité | Définir les heures où vous êtes disponible pour recevoir des messages    |
| Sujets        | Ajouter des amorces de conversation, des sujets à éviter et des conseils |

**Champs obligatoires :** Nom d'affichage + groupe d'âge (étape Profil), ton préféré + au moins un mode de communication (étape Communication). Tout le reste est facultatif.

---

## Votre tableau de bord principal

Après la configuration, vous arrivez sur le **tableau de bord de messagerie**. Il comporte deux parties :

- **Barre latérale gauche** — votre liste de conversations
- **Panneau droit** — la conversation ouverte

En haut se trouve la barre d'outils avec votre nom, votre niveau d'énergie et des liens rapides.

---

## Énergie sociale

L'énergie sociale indique aux autres à quel point vous êtes disponible en ce moment. Vous la réglez vous-même à l'aide des cercles colorés dans la barre d'outils :

- **Haute** (vert) — content de discuter
- **Moyenne** (jaune) — disponible mais pas totalement
- **Basse** (rouge) — préfère ne pas être contacté en ce moment

C'est facultatif. Vous pouvez la changer à tout moment ou la laisser telle quelle. Les autres utilisateurs peuvent voir votre niveau d'énergie actuel.

---

## Mode calme

Le mode calme met en pause tous les messages entrants pour que vous ne soyez pas interrompu. Les messages qui vous sont envoyés pendant que le mode calme est activé seront retenus et livrés lorsque vous le désactiverez.

- Activez-le ou désactivez-le avec le **bouton en forme de lune** dans la barre d'outils
- Une **bannière violette** apparaît en haut de l'écran lorsque le mode calme est actif
- Votre liste de conversations apparaîtra estompée lorsque le mode calme est activé

---

## Bilan quotidien

Lorsque vous ouvrez le tableau de bord chaque jour, un court bilan apparaît. Il pose deux questions :

- Comment est votre **énergie sociale** en ce moment? (haute, moyenne ou basse)
- Voulez-vous commencer avec le **mode calme activé**?

Cela prend environ 5 secondes. Vous pouvez le passer si vous préférez. Le bilan n'apparaît qu'une fois par jour.

---

## Démarrer une conversation

1. Cliquez sur **Nouvelle conversation** dans la barre latérale gauche
2. Recherchez la personne avec qui vous souhaitez discuter par son nom
3. Écrivez un premier message si vous le souhaitez
4. Cliquez sur **Démarrer la conversation**

Vous ne pouvez envoyer des messages qu'aux personnes ayant terminé la configuration de leur profil.

---

## Dans une conversation

### Comment parler à quelqu'un

Cliquez sur le **bouton d'information** à côté du nom de la personne en haut de la conversation. Cela affiche ses préférences de communication — son ton préféré, les sujets qu'elle apprécie, les choses à éviter et les conseils qu'elle a partagés.

### Statut des messages

Chaque message affiche un petit indicateur :

- **En attente** — en attente de livraison (le destinataire a le mode calme activé ou est en dehors de ses heures de disponibilité)
- **Envoyé** — envoyé avec succès
- **Livré** — reçu par l'appareil de l'autre personne
- **Lu** — l'autre personne l'a lu

### Supprimer un message

Cliquez sur **Supprimer** sur n'importe quel message pour le retirer de votre vue. L'autre personne peut toujours le voir. C'est intentionnel — cela préserve la conversation pour l'autre personne.

### Masquer une conversation

Cliquez sur **Masquer la conversation** pour la retirer de votre barre latérale. Pour voir vos conversations masquées, cliquez sur **l'icône d'œil** dans l'en-tête de la barre latérale. Depuis la vue des conversations masquées, vous pouvez cliquer sur **Afficher** à côté de n'importe quelle conversation pour la restaurer. Les conversations masquées réapparaissent aussi automatiquement si l'autre personne vous envoie un nouveau message.

---

## Minuterie de session

La minuterie de session est un rappel doux pour prendre des pauses. Elle ne vous bloque pas.

- Choisissez une durée depuis la barre de minuterie en haut : **Désactivée**, 15, 20, 25 ou 30 minutes
- La minuterie démarre automatiquement lorsque vous envoyez votre premier message
- Quand le temps est presque écoulé, la barre devient **ambrée** (5 minutes restantes) puis **rouge** (1 minute restante)
- Lorsque la session se termine, un écran doux apparaît avec un rappel de prendre une pause
- Cliquez sur **Je suis prêt·e à continuer** quand vous êtes prêt

La minuterie se réinitialise lorsque vous fermez l'écran. La durée choisie est sauvegardée.

---

## Paramètres

Cliquez sur votre **nom** dans la barre d'outils pour ouvrir les Paramètres. Vous pouvez modifier n'importe quelle partie de votre profil :

- **Profil** — nom d'affichage, groupe d'âge, visibilité
- **Communication** — ton, modes de messagerie, rythme
- **Sensoriel** — animations, intensité des couleurs
- **Disponibilité** — vos heures pour chaque jour de la semaine
- **Amorces de conversation** — bons sujets, sujets à éviter, conseils pour les autres
- **Langue** — français ou anglais

Chaque section s'enregistre indépendamment.

---

## Langue

L'application est entièrement disponible en **français** et en **anglais**. Utilisez le bouton de langue (FR / EN) dans la barre d'outils pour changer à tout moment. Votre choix est sauvegardé.

---

## Bloquer et signaler

### Bloquer

Si quelqu'un vous met mal à l'aise, vous pouvez le bloquer. Ouvrez votre conversation avec cette personne et cliquez sur **Bloquer l'utilisateur**. Cela va :

- L'empêcher de vous envoyer des messages
- Archiver votre conversation avec cette personne

Vous pouvez débloquer quelqu'un à tout moment depuis la **liste des utilisateurs bloqués** dans la barre d'outils.

### Signaler

Pour signaler un utilisateur ou un message spécifique, cliquez sur le bouton **Signaler** dans la conversation. Vous pouvez choisir une raison (harcèlement, contenu inapproprié, spam, problème de sécurité ou autre) et ajouter des détails. Les signalements sont envoyés à l'équipe de modération pour examen.

---

## Pour les parents

### Lier le compte d'un enfant

Pour lier le compte d'un enfant au vôtre :

1. Connectez-vous à votre compte et allez dans **Paramètres** (cliquez sur votre nom dans la barre d'outils)
2. Faites défiler vers le bas — trouvez la section **« Lier un mineur »**
3. Cliquez sur **« Générer un code de liaison »** — vous obtiendrez **deux codes** :
   - Un **code d'invitation** (comme `INV-ABCDEF`) — votre enfant en a besoin pour s'inscrire
   - Un **code de liaison** (comme `LINK-ABCD1234`) — votre enfant l'entre lors de la configuration de son profil
4. Donnez les deux codes à votre enfant
5. Votre enfant crée son propre compte en utilisant le **code d'invitation**, sélectionne **14-17** comme groupe d'âge lors de la configuration, et entre le **code de liaison** lorsqu'il y est invité
6. Son compte devient géré par un parent et lié au vôtre

Chaque paire de codes ne peut être utilisée qu'une seule fois et expire après 7 jours. Vous pouvez générer de nouveaux codes à tout moment.

### Tableau de bord parent

Si votre compte est lié à un membre géré (mineur), vous verrez un bouton **Parent** dans la barre d'outils. Cela vous amène au tableau de bord parent où vous pouvez :

- Voir votre ou vos membres gérés avec leur relation et statut
- Consulter les indicateurs d'activité des 30 derniers jours (niveaux d'énergie, utilisation du mode calme, nombre de messages)
- Consulter et confirmer les alertes (gravité : information, avertissement, urgent)

**Confidentialité :** Le contenu des messages de votre membre est privé. Les indicateurs montrent des tendances uniquement (par exemple, combien de temps le mode calme était actif), pas les messages individuels. Les comptes de mineurs ne peuvent pas envoyer de messages aux comptes d'adultes et n'apparaissent pas dans le répertoire des utilisateurs pour les adultes.

**Pour tester :** Connectez-vous avec `parent@test.com`. Vous verrez Léo comme membre géré avec des indicateurs et des alertes pré-remplis.

---

## Pour les modérateurs

Les comptes de modérateurs sont utilisés par l'équipe Otantist pour examiner les signalements et le contenu signalé.

### Ce que les modérateurs peuvent faire

- Consulter la **file de modération** — éléments signalés par les utilisateurs ou détectés par le système
- Filtrer par statut (en attente, en examen, résolu) et priorité (basse, moyenne, haute, urgente)
- Examiner les détails des éléments et le contenu associé
- Résoudre les éléments avec une action (rejeté, averti, supprimé, suspendu) et des notes optionnelles
- Voir les statistiques de modération (nombre en attente, en examen, résolus, répartition par priorité)

### Comment ça fonctionne

- Un **badge** dans la barre d'outils affiche le nombre d'éléments en attente
- Le badge se met à jour toutes les 60 secondes et en temps réel lorsque de nouveaux signalements arrivent
- Les modérateurs ne peuvent pas recevoir de messages et n'apparaissent pas dans le répertoire des utilisateurs
- Les modérateurs ne passent pas par le processus d'intégration normal

**Pour tester :** Connectez-vous avec `mod@test.com`. Vous arriverez sur la page de modération avec des éléments de file pré-remplis.

---

## Pour les super admins

Les comptes super admin ont toutes les capacités des modérateurs en plus de la gestion des utilisateurs.

### Ce que les super admins peuvent faire

- Voir tous les utilisateurs dans un tableau avec recherche (courriel, nom, rôle, statut)
- Changer le rôle d'un utilisateur :
  - **Définir modérateur** — donne accès à la file de modération
  - **Définir admin** — donne un accès admin complet (à utiliser avec précaution)
  - **Définir utilisateur** — rétablit un modérateur ou admin en utilisateur régulier
- Les comptes de mineurs (gérés par un parent) ne peuvent pas voir leur rôle modifié
- **Créer et gérer les codes d'invitation** — définir un code, un nombre maximum d'utilisations et une date d'expiration optionnelle
- Voir tous les codes d'invitation existants avec leur nombre d'utilisations
- Accéder à la file de modération (identique aux modérateurs)

### Comment ça fonctionne

- Les super admins voient un lien **Admin** et un lien **Modération** dans la barre d'outils
- La page admin comporte une barre de recherche et un tableau de tous les utilisateurs avec des boutons de changement de rôle
- Sous le tableau des utilisateurs se trouve la section **Codes d'invitation** où vous pouvez créer de nouveaux codes et voir tous les codes existants
- Les changements de rôle nécessitent une boîte de dialogue de confirmation
- Les super admins ne passent pas par l'intégration, ne peuvent pas recevoir de messages et n'apparaissent pas dans le répertoire des utilisateurs

**Pour tester :** Connectez-vous avec `admin@test.com`. Vous arriverez sur la page admin. Essayez de promouvoir un utilisateur en modérateur, puis de le rétablir. Faites défiler vers le bas pour voir la section des codes d'invitation — essayez de créer un nouveau code et de le copier.

---

## Donner votre avis

Votre avis est la chose la plus utile que vous puissiez offrir à ce stade. Cliquez sur **l'icône de crayon** dans la barre d'outils pour ouvrir le formulaire de commentaires. Vous pouvez choisir une catégorie (général, rapport de bogue, demande de fonctionnalité ou problème sensoriel/confort) et écrire votre message.

Ce qui est particulièrement utile à entendre :

- Tout ce qui vous a semblé déroutant ou peu clair
- Tout ce qui vous a semblé inconfortable ou accablant
- Les fonctionnalités que vous auriez souhaitées
- Les choses qui ont bien fonctionné et qui vous ont semblé appropriées

---

## Aide

Cliquez sur le bouton **?** dans la barre d'outils pour ouvrir la page d'aide intégrée. Elle couvre toutes les fonctionnalités avec une navigation par sections et est disponible en français et en anglais.

---

## Note sur la confidentialité

- Vos messages sont stockés de manière sécurisée
- Votre profil n'est visible que par les autres utilisateurs inscrits
- Vous contrôlez votre visibilité dans les Paramètres
- L'équipe Otantist peut examiner le contenu signalé à des fins de modération uniquement

---

_Otantist Bêta — Merci de nous aider à construire quelque chose de mieux._
