import numpy as np
from django.contrib import messages
from django.shortcuts import render, redirect
from django.http import HttpResponseRedirect,JsonResponse

def mdp(request):
    if request.method == 'POST':
        mdp = request.POST.get('mdp')
        motDePasse = "frequence"
        if mdp == motDePasse:
            return HttpResponseRedirect('/analyseFreq/')  # Redirigez vers la page souhaitée
        else:
            messages.error(request, 'Mot de passe incorrect')
            return render(request, 'analyseFreq/mdp.html')
    else:
        return render(request, 'analyseFreq/mdp.html')


# Variable globale pour le texte original
texte_original = "	Inymh ! Rz d'zbyfb lya eyrfkz oyfa mhsa ymzj efdykzozdb nzsaaf y pzrhpzn bhsa kza ozaaytza csags'y k'zbylz efdykz. Ezkfrfbybfhda. Mhsa mhsa pzoydpzj lzsb zbnz gsf mhsa y pfb gsz mhsa pzmfzj bnhsmzn kz rhnnftz pz k'zqyozd pz pzoyfd. Zb ifzd r'zbyfb ohf. Zd zeezb, k'zqyozd zbyfb df lksa df ohfda gsz rz gsz mhsa mzdzj pz eyfnz. Afdrznza ezkfrfbybfhda ysq chszsna, mhsa ymzj phdr ybbzfdb ky dhbz oyqfoykz ! dkk"
# texte_original = "Bravo ! Ce n'etait pas facile mais vous avez finalement reussi a decoder tous les messages jusqu'a l'etape finale. Felicitations. Vous vous demandez peut etre qui vous a dit que vous deviez trouver le corrige de l'examen de demain. Et bien c'etait moi. En effet, l'examen etait ni plus ni moins que ce que vous venez de faire. Sinceres felicitations aux joueurs, vous avez donc atteint la note maximale ! nll"
texte_target = " Bravo ! Ce n'etait pas facile mais vous avez finalement reussi a decoder tous les messages jusqu'a l'etape finale. Felicitations. Vous vous demandez peut etre qui vous a dit que vous deviez trouver le corrige de l'examen de demain. Et bien c'etait moi. En effet, l'examen etait ni plus ni moins que ce que vous venez de faire. Sinceres felicitations aux joueurs, vous avez donc atteint la note maximale ! nll"
def analyseFreq(request):
    # Récupérer le texte de la session ou utiliser le texte original
    texte = request.session.get('texte_modifie', texte_original)
    secret_code = None
    if request.method == 'POST':
        lettreAChanger = request.POST.get('letter', '')
        nouvelleLettre = request.POST.get('replacement', '')  # Renommé pour éviter la confusion

        if lettreAChanger and nouvelleLettre:
            texte = changeLettre(texte, lettreAChanger, nouvelleLettre)
            request.session['texte_modifie'] = texte  # Sauvegarder dans la session

        frequence = calculer_frequences(texte)
        freq_dict = transform_to_dict(frequence)
        if texte.strip() == texte_target.strip():
            secret_code = "TERMINUS"
        context = {
            'frequence': freq_dict,
            'texteDecod': texte,
            'secret_code': secret_code
        }

        return render(request, 'analyseFreq/analyseFreq.html', context)
    else:
        # Réinitialiser le texte si nécessaire
        request.session['texte_modifie'] = texte_original
        return render(request, 'analyseFreq/analyseFreq.html', {'texteDecod': texte_original, 'frequence' : transform_to_dict(calculer_frequences(texte_original)), 'secret_code': None})


# Correspondances lettres - fréquences
alphabet = {
    'a': 9.42, 'b': 1.02, 'c': 2.64, 'd': 3.39, 'e': 15.87, 'f': 0.95, 'g': 1.04, 'h': 0.77, 'i': 8.41, 'j': 0.89,
    'k': 0.01, 'l': 5.34, 'm': 3.24, 'n': 7.15, 'o': 5.14, 'p': 2.86, 'q': 1.06, 'r': 6.46, 's': 7.9, 't': 7.26,
    'u': 6.24, 'v': 2.15, 'w': 0.0001, 'x': 0.3, 'y': 0.24, 'z': 0.32
}
alphabet = dict(sorted(alphabet.items(), key=lambda item: item[1], reverse=True))
alphabet_trie = np.array([]) # alphabet trié par ordre de fréquences

# Transforme le dictionnaire en np.array
for cle, valeur in alphabet.items():
    alphabet_trie = np.append(alphabet_trie,[(cle, valeur)])

def calculer_frequences(chaine):
    # Initialiser un dictionnaire pour stocker les fréquences
    frequences = {}
    n = len(chaine)
    # Parcourir chaque caractère dans la chaîne
    for caractere in chaine.lower():
        # Ignorer les espaces
        if not caractere.isalpha():  # Ignorer les caractères non-alphabétiques
            continue
        frequences[caractere] = frequences.get(caractere, 0) + 1

    for c in frequences :
        frequences[c] = round(100*frequences[c]/n, 2)

    # Trier le dictionnaire :
    dictionnaire_trie = dict(sorted(frequences.items(), key=lambda item: item[1], reverse=True))
    
    freq_list = np.array([])
    for cle, valeur in dictionnaire_trie.items():
        freq_list = np.append(freq_list,[cle, valeur])

    # Retourner le np.array des fréquences
    return freq_list

def changeLettre(chaine, a, b):
    chaineMod = ""
    a_lower = a.lower()
    b_lower = b.lower()
    for letter in chaine:
        if not letter.isalpha():
            chaineMod += letter
        elif letter.lower() == a_lower:
            chaineMod += b_lower if letter.islower() else b.upper()
        elif letter.lower() == b_lower:
            chaineMod += a_lower if letter.islower() else a.upper()
        else:
            chaineMod += letter
    return chaineMod

def transform_to_dict(freq_list):
    return {freq_list[i]: float(freq_list[i + 1]) for i in range(0, len(freq_list), 2)}