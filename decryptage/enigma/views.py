from django.shortcuts import render
from django.contrib import messages


def home(request):
    return render(request, "enigma/home.html")

def corrige_ds(request) :
     return render(request, "enigma/corrige_ds.html")

# Create your views here.
def decode(request):
    return render(request, 'enigma/decodage.html')

def verif_alphabet(chaine):
    # Convertir la chaîne en minuscules pour ignorer la casse
    chaine = chaine.lower()
    
    # Créer un ensemble (set) à partir de la chaîne pour obtenir des caractères uniques
    caracteres = set(chaine)
    
    # Enlever les caractères non alphabétiques de la chaîne
    caracteres = set(filter(str.isalpha, caracteres))
    
    # Vérifier si la longueur de l'ensemble de caractères est égale à 26 (pour les 26 lettres de l'alphabet)
    return len(caracteres) == 26

def submit(request):
    if request.method == 'GET':
        # Récupérer les données
        rotor1_conf = request.GET.get('rotor1')
        rotor2_conf = request.GET.get('rotor2')
        rotor3_conf = request.GET.get('rotor3')
        reflector_conf = request.GET.get('reflector')
        texte = request.GET.get('texte').lower()

        # Vous pouvez ici appeler votre fonction de décodage si nécessaire
        # Par exemple, decoded_message = enigma(...)

        context = {
            'rotor1_conf': rotor1_conf,
            'rotor2_conf': rotor2_conf,
            'rotor3_conf': rotor3_conf,
            'reflector_conf': reflector_conf,
            'texte': texte.lower(),
            'decoded_message': enigma(texte,rotor1_conf.lower(),rotor2_conf.lower(),rotor3_conf.lower(),reflector_conf,[0, 0, 0])
        }
        if(not(verif_alphabet(rotor1_conf)) or not(verif_alphabet(rotor2_conf)) or not(verif_alphabet(rotor3_conf))) :
            return render(request, 'enigma/decodage.html', context) 
        else :
            return render(request, 'enigma/submit.html', context)
    else:
        # Gérer les autres types de requêtes ou rediriger
        return render(request, 'enigma/decodage.html')
    
# Fonction de décodage
# rotor1 : ekmflgdqvzntowyhxuspaibrcj
# rotor2 : ajdksiruxblhwtmcqgznpyfvoe
# rotor3 : bdfhjlcprtxvznyeiwgakmusqo
# reflector : yruhqsldpxngokmiebfzcwvjat
def enigma(message, rotor1, rotor2, rotor3, reflector, rotor_positions):
    # Fonction pour avancer le rotor
    def avanceRotor(rotor):
        return rotor[1:] + rotor[0]

    # Fonction pour trouver l'indice d'une lettre dans l'alphabet
    def find_index(letter):
        return alphabet.index(letter)

    # Fonction pour coder une lettre avec un rotor
    def codeLettreRotor(index, rotor):
        return rotor[index]

    # Fonction pour réfléchir une lettre avec le réflecteur
    def reflectLettre(letter, reflector):
        index = alphabet.index(letter.lower())
        return reflector[index]

    # Initialisation
    alphabet = "abcdefghijklmnopqrstuvwxyz"
    rotor1_pos, rotor2_pos, rotor3_pos = rotor_positions
    coded_message = ""

    # Réglage initial des rotors
    rotor1 = rotor1[26-rotor1_pos:] + rotor1[:26-rotor1_pos]
    rotor2 = rotor2[26-rotor2_pos:] + rotor2[:26-rotor2_pos]
    rotor3 = rotor3[26-rotor3_pos:] + rotor3[:26-rotor3_pos]

    for letter in message:
        if not letter.isalpha():
            coded_message += letter
            continue

        # Convertir en minuscule pour le traitement
        letter = letter.lower()

        # Encodage à travers les rotors
        index = find_index(letter)
        letter = codeLettreRotor(index, rotor1)
        index = find_index(letter)
        letter = codeLettreRotor(index, rotor2)
        index = find_index(letter)
        letter = codeLettreRotor(index, rotor3)

        # Réflexion
        letter = reflectLettre(letter, reflector)

        # Encodage inverse à travers les rotors dans l'ordre inverse
        index = rotor3.index(letter)
        letter = alphabet[index]
        index = rotor2.index(letter)
        letter = alphabet[index]
        index = rotor1.index(letter)
        letter = alphabet[index]

        coded_message += letter

        # Avancer le rotor 1
        rotor1 = avanceRotor(rotor1)
        rotor1_pos = (rotor1_pos + 1) % 26

        # Avancer les autres rotors si nécessaire
        if rotor1_pos == 0:
            rotor2 = avanceRotor(rotor2)
            rotor2_pos = (rotor2_pos + 1) % 26
            if rotor2_pos == 0:
                rotor3 = avanceRotor(rotor3)
                rotor3_pos = (rotor3_pos + 1) % 26

    return coded_message
