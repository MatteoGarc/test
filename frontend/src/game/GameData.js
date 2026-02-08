export const GameData = {
    // Liste de toutes les cartes
    cardIds: [
        '1', '23', '26', '37',
        '16', '45', '76',
        '13', '78', '11', '67',
        '74', '71', '56', '62',
        '58', '91', '14',
        '31', '4', '50', '75',
        '88', '55', '22', '21',
        '79', '10', '17', '19', '20',
        '25', '51', '59', '68', '72', '81',
        '82', '86', '89', '97', '99', '83',
        // Pièges
        '49', '77', '87', '84', '85', '61', '63', '64', '93', '94', '95', '44', '96', '69'
    ],

    // Inventaire de départ
    initialInventory: ['25'],

    // Pénalités
    penalties: {
        '49': 5, '77': 5, '87': 5,
        '84': 5, '85': 5,
        '61': 5, '63': 5, '64': 5,
        '93': 5, '94': 5, '95': 5, '44': 5,
        '96' : 10, '69' : 10
    },

    // Définitions des cartes avec Dépendances (requires)
    cards: {
        '25':{ name: "Le couloir", type: 'info', text: "Obtenir les cartes en tapant leur numéro en haut."},
        '59':{ name: "Sac", type: "info", text: "Obtenir les cartes en tapant leur numéro en haut.", requires: ['25']},

        //Puzzle Vigenère
        '17':{ name: "Tas de photo", type: "indice", text: "Un tas de photo avec un certain chat", requires: ['59']},
        '89':{ name: "Table de Vigenère", type: "indice", text: "Une table qui sert à décoder du Vigenère", requires: ['59']},
        '51':{
            name: "Code secret",
            type: "puzzle",
            solution: "SHORTHAIR",
            puzzleType: "Vigenere",
            // Grisage des indices
            linkedIds: ['17','89', '51'],
            rewards: [],
            milestone: "a décrypté le message du chat !",
            successMessage: "Vous savez quel casier fouiller! (SHORTHAIR)",
            hint: "Le nom du chat est ZAZU, peut-être que la table doit nous servir..",
            text: "Un morceau de papier avec un code crypté..",
            requires: ['17']

        },
        '81':{ name: 'Casier', type: 'info', text: "Un casier vérouillé par un cadnas", requires:['51']},

        // Puzzle XOR
        '99':{ name: "Portrait chat", type: "indice", text: "Un portrait de chat avec une plaque dessous..", requires: ['25']},
        '19':{ name: "Post-it", type: "indice", text: "Un post-it avec du binaire", requires: ['99']},
        '72':{
            name: 'Cadenas XOR',
            type: "puzzle",
            puzzleType: "cadenasXOR",
            solution: "SIAMOIS",
            rewards: ['20'],
            milestone: "a ouvert le cadenas binaire !",
            // Grisage des indices
            linkedIds: ['99', '19', '68', '82', '72'],
            successMessage: "Vous récupérez les clés pour le caiser et l'ouvrez",
            hint: 'Il faudrait convertir CHAT en binaire et certainement faire quelque chose du post-it..',
            text: 'Un cadenas vérouillé par un code à 6 lettres',
            requires: ['81']

        },
        '68':{ name: "Alphabet binaire", type: "indice", text: "Un alphabet de lettre binaire", requires: ['59']},
        '82':{ name: "Table XOR", type: "indice", text: "Un tableau représentant l'opération XOR", requires: ['81']},
        '20':{ name: 'Cadenas ouvert', type: 'info', text: "Le cadenas dévérouillé vous donne accès au casier", requires:["72"]},

        '97': { name: 'Casier ouvert', type: 'info', text: "Le casier a été ouvert vous donnant accès à son contenu", requires: ['20']},

        //Puzzle SHA256
        '10': {name: 'SHA256', type: 'indice', text:'Un convertisseur de texte pour SHA256', requires:['97']},
        '86': {
            name: 'Tablette',
            type: "puzzle",
            puzzleType: "tablette",
            solution: "Bilbo",
            rewards: ['1'],
            milestone: "a hacké la tablette sécurisée !",
            // Grisage des indices
            linkedIds: ['10', '97', '20', '25', '59', '86', '81'],
            successMessage: "Vous dévérouillez la tablette et vous donne le chemin vers le bureau",
            hint: 'Il est pas possible de brute force le mot de passe.. Il faut le comparer..',
            text: 'Une tablette vérouillé par un code',
            requires: ['97']

        },

        '1': { name: "la porte", type: 'info', text: "Obtenir les cartes en tapant leur numéro en haut." },
        '23': { name: "Lune", type: 'indice', text: "Une lune... à retenir", requires: ['1']  },

        // Puzzle Téléphone
        '26': {
            name: "Téléphone",
            type: 'puzzle',
            puzzleType: 't9',
            solution: '555886633',
            rewards: ['37'],
            milestone: "a rétabli la ligne téléphonique !",
            // On grise le téléphone et les indices (Lune + Livret)
            linkedIds: ['1', '23', '26'],
            successMessage: "Connexion établie ! La porte s'ouvre.",
            hint: "Regarde la carte 23 (LUNE). Sur un clavier : L=5, U=8...",
            text: "Un téléphone, mais quel numéro entrer ?",
            requires: ['1']
        },

        '37': {
            name: "Porte",
            type: 'machine',
            prompt: "Code de la porte (T9) ?",
            code: '555886633',
            linkedIds: ['37'],
            successMessage: "La porte s'ouvre !",
            text: "Fouiller et chercher tous les numéros.",
            requires: ['23', '26']
        },

        // Le Bureau (Zones)
        '16': { name: "Bureau", type: 'info', text: "Fouiller et chercher tous les numéros.", requires: ['37']  },
        '45': { name: "Armoire", type: 'info', text: "Chercher les numéros. Rotor 3 trouvé.", requires: ['37']  },
        '76': { name: "Bibliothèque", type: 'info', text: "Fouiller et chercher tous les numéros.", requires: ['37']  },

        // Objets du Bureau (Nécessitent d'avoir accès aux zones)
        '13': {
            name: "Tiroir Braille",
            type: 'puzzle',
            puzzleType: 'padlock', // Cadenas
            solution: '0818',
            rewards: ['11'],
            milestone: "a déverrouillé le tiroir Braille !",
            // Une fois ouvert, on grise le tiroir (13) et la table braille (78)
            linkedIds: ['13', '78'],
            successMessage: "Le cadenas s'ouvre !",
            hint: "Utilise la carte 78 (Table Braille) pour traduire les points.",
            text: "Un tiroir verrouillé par un cadenas à 4 chiffres.",
            requires: ['16']
        },
        '78': { name: "Table Braille", type: 'indice', requires: ['16'], text : 'Faut il des numéros ou des lettres ?' },
        '58': { name: "Lampe", type: 'indice', puzzleType: 'superpo', text: "Trouver la carte à superposer cette énigme.", requires: ['16'] },
        '56': {
            name: "Tiroir César",
            type: 'puzzle',
            puzzleType: "cesar",
            prompt: "Mot de passe ?",
            caesarLetters: ['G', 'L', 'K', 'I', 'K'],
            userShifts: [0, 0, 0, 0, 0],
            solution: 'VENUS',
            rewards: ['62'],
            milestone: "a décrypté le code César !",
            // Une fois ouvert, on grise le tiroir (56), le disque (71) et le livre (74)
            linkedIds: ['56', '71', '74'],
            successMessage: "Le code César est déchiffré ! Le cadenas s'ouvre.",
            requires: ['16'],
            text: "Un cadenas avec une combinaison à 5 lettres",
            hint: "Utilise la carte 71 (Chiffrement César) pour déchiffrer le message de la carte 74"
        },

        // Contenu Armoire (Nécessite 45)
        '91': { name: "Abat-jour", type: 'item', requires: ['45'], text : 'Cette carte sert de superposition.' },
        '71': { name: "Disque César", type: 'outil', requires: ['45'] },

        // Contenu Bibliothèque (Nécessite 76)
        '21': { name: "Rotor", type: 'item', requires: ['76'], text : 'Rotor 1 trouvé.' },
        '74': { name: "Livre Suspendu", type: 'indice', requires: ['76'], text: 'Il faut traduire ce texte.' },
        '14': { name: "Livre Animaux", type: 'indice', requires: ['76'] },
        '31': {
            name: "Livre Océan",
            type: 'puzzle',
            puzzleType: "pictogram",
            solution: "242",
            rewards: ['4'],
            milestone: "a trouvé la bonne page du livre !",
            // Une fois la page trouvé, on grise les cartes 31, 62 et 67
            linkedIds: ['31', '62', '67'],
            successMessage: "Vous arrivez à la bonne page du livre.",
            requires: ['76'],
            text: "Des pages ? Il faut un livre.",
            hint: "Les emojis de la carte 67 se retrouve sur la carte 62 avec des chiffres associés..."
        },

        // Suite des énigmes (Objets cachés)
        '11': { name: "Tiroir Ouvert", type: 'info', text: "Il y a une carte 67 (Lampe UV).", requires: ['13', '78']  },

        '67': { name: "Lampe UV", type: 'indice', text: "Il faut trouver le numéro de la page.", requires: ['11'], rewards: ['62'], },

        '62': { name: "Symboles", type: 'indice', requires: ['56', '74', '71', '67']  },

        '4': { name: "Page 242", type: 'indice', requires: ['31'], text : 'Des mots surligné. Lequel est intéressant?' },

        '50': {
            name: "Unité Centrale",
            type: 'puzzle',
            puzzleType: 'numpad',
            solution: '131426',
            rewards: ['88'],
            milestone: "a piraté l'unité centrale !",
            linkedIds: ['4', '50', '75'],
            successMessage: "Système déverrouillé ! L'écran s'allume.",
            hint: "Regarde le Télégraphe (79) et le Code Morse (75).",
            text: "Un boitier sécurisé. Il faut un code numérique.",
            requires: ['4']
        },

        '75': { name: "Code Morse", type: 'indice', requires: ['76']  },

        '79': {
            name: "Télégraphe",
            type: 'indice',
            text: "L'union des points fait la force.",
            requires: ['75']
        },

        '88': {
            name: "Mot de passe",
            type: 'puzzle',
            puzzleType: 'password',
            solution: "179401",
            rewards: ['55'],
            linkedIds: ['14', '16', '37', '58', '76', '88', '91'],
            successMessage: "Mot de passe correct ! L'ordinateur est déverrouillé.",
            hint: "Regardez les animaux (58) avec la carte 91 supperposée et les livres (14).",
            text: "Chercher les cartes pour trouver le mot de passe.",
            requires: ['76']
        },

        '55': {
            name: "Ordinateur",
            type: 'machine',
            prompt: "LOGIN (ID + MDP) :",
            code: '88179401',
            milestone: "a accédé au système principal !",
            // On grise TOUT ce qui a servi 
            linkedIds: ['55', '50', '88', '75', '4', '14', '31', '58', '91', '67', '62'],
            successMessage: "ACCÈS AUTORISÉ.",
            requires: ['88']
        },
        '83': {
            name: "TERMINAL DE FIN",
            type: 'puzzle',
            puzzleType: 'endcode',
            prompt: "ENTREZ LE CODE DE FIN :",
            code: 'TERMINUS', // Le code à trouver sur le site Django
            rewards: ['WIN'], // L'objet qui déclenche la victoire
            milestone: "a validé l'extraction finale !",
            linkedIds: ['83'],
            successMessage: "MISSION ACCOMPLIE.",
            text: "Entrez le code obtenu en décryptant pour valider la mission.",
            requires: ['22']
        },
        '22': { name: "VICTOIRE", type: 'info', text: "Récupérez la carte 83.", requires: ['55']  },

        // Pièges (Affichage)
        '49': { name: "ERREUR", type: 'error', text: "Mauvaise réponse. -5 Minutes.", requires: ['26', '23']  },
        '77': { name: "ERREUR", type: 'error', text: "Ce n'est pas le bon code. -5 Minutes.", requires: ['26', '23']  },
        '87': { name: "ERREUR", type: 'error', text: "Erreur de décodage. -5 Minutes.", requires: ['26', '23'] },
        '84': { name: "ERREUR", type: 'error', text: "Erreur Braille. -5 Minutes.", requires: ['50', '75', '4'] },
        '85': { name: "ERREUR", type: 'error', text: "Erreur Braille. -5 Minutes.", requires: ['50', '75', '4'] },
        '61': { name: "ERREUR", type: 'error', text: "Erreur César. -5 Minutes.", requires: ['56', '74', '71'] },
        '63': { name: "ERREUR", type: 'error', text: "Erreur César. -5 Minutes.", requires: ['56', '74', '71'] },
        '64': { name: "ERREUR", type: 'error', text: "Erreur César. -5 Minutes.", requires: ['56', '74', '71'] },
        '69': { name: "ERREUR", type: 'error', text: "Erreur Vigenère. -10 Minutes.", requires: ['51'] },
        '93': { name: "ERREUR", type: 'error', text: "Fausse piste. -5 Minutes.", requires: ['88', '58', '91', '14'] },
        '94': { name: "ERREUR", type: 'error', text: "Fausse piste. -5 Minutes.", requires: ['88', '58', '91', '14'] },
        '95': { name: "ERREUR", type: 'error', text: "Fausse piste. -5 Minutes.", requires: ['88', '58', '91', '14'] },
        '96': { name: "ERREUR", type: 'error', text: "Erreur Vigenère. -10 Minutes.", requires: ['51'] },
        '44': { name: "ERREUR", type: 'error', text: "Fausse piste. -5 Minutes." }
    }
};