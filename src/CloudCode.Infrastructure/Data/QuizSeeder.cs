using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CloudCode.Infrastructure.Data;

public static class QuizSeeder
{
    public static async Task SeedQuestionsAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (await db.QuizQuestions.AnyAsync()) return;

        var questions = new List<QuizQuestion>
        {
            // ── Python ───────────────────────────────────────────────────────
            new() { Category = QuizCategory.Python, Difficulty = QuizDifficulty.Easy,
                Text = "Quelle est la valeur de len([1, 2, 3]) ?",
                OptionA = "0", OptionB = "2", OptionC = "3", OptionD = "4",
                CorrectOption = 2, Explanation = "len() retourne le nombre d'éléments de la liste." },

            new() { Category = QuizCategory.Python, Difficulty = QuizDifficulty.Easy,
                Text = "Lequel de ces types est immuable (immutable) en Python ?",
                OptionA = "list", OptionB = "dict", OptionC = "tuple", OptionD = "set",
                CorrectOption = 2, Explanation = "Les tuples ne peuvent pas être modifiés après création." },

            new() { Category = QuizCategory.Python, Difficulty = QuizDifficulty.Medium,
                Text = "Quel est le résultat de [x**2 for x in range(3)] ?",
                OptionA = "[0, 1, 4]", OptionB = "[1, 4, 9]", OptionC = "[0, 1, 2]", OptionD = "[1, 2, 3]",
                CorrectOption = 0, Explanation = "range(3) donne 0,1,2. 0²=0, 1²=1, 2²=4." },

            new() { Category = QuizCategory.Python, Difficulty = QuizDifficulty.Medium,
                Text = "Que permet *args dans une fonction Python ?",
                OptionA = "Un nombre variable d'arguments positionnels", OptionB = "Des arguments nommés uniquement",
                OptionC = "Des valeurs par défaut", OptionD = "Des annotations de type",
                CorrectOption = 0, Explanation = "*args collecte les arguments positionnels supplémentaires dans un tuple." },

            new() { Category = QuizCategory.Python, Difficulty = QuizDifficulty.Hard,
                Text = "Quelle est la complexité temporelle moyenne d'un lookup dans un dictionnaire Python ?",
                OptionA = "O(1)", OptionB = "O(n)", OptionC = "O(log n)", OptionD = "O(n²)",
                CorrectOption = 0, Explanation = "Les dicts Python utilisent une table de hachage — lookup O(1) en moyenne." },

            new() { Category = QuizCategory.Python, Difficulty = QuizDifficulty.Hard,
                Text = "Que fait __slots__ dans une classe Python ?",
                OptionA = "Restreint les attributs d'instance autorisés", OptionB = "Définit des méthodes de classe",
                OptionC = "Active l'héritage multiple", OptionD = "Crée des propriétés automatiques",
                CorrectOption = 0, Explanation = "__slots__ empêche la création de __dict__ par instance, réduisant la mémoire." },

            // ── JavaScript ───────────────────────────────────────────────────
            new() { Category = QuizCategory.JavaScript, Difficulty = QuizDifficulty.Easy,
                Text = "Que retourne typeof null en JavaScript ?",
                OptionA = "'null'", OptionB = "'object'", OptionC = "'undefined'", OptionD = "'boolean'",
                CorrectOption = 1, Explanation = "Bug historique de JS : typeof null === 'object' depuis ES1." },

            new() { Category = QuizCategory.JavaScript, Difficulty = QuizDifficulty.Easy,
                Text = "Quelle méthode ajoute un élément à la fin d'un tableau ?",
                OptionA = "push()", OptionB = "pop()", OptionC = "shift()", OptionD = "unshift()",
                CorrectOption = 0, Explanation = "push() ajoute à la fin, pop() retire depuis la fin." },

            new() { Category = QuizCategory.JavaScript, Difficulty = QuizDifficulty.Medium,
                Text = "Quel est le résultat de 0.1 + 0.2 === 0.3 ?",
                OptionA = "true", OptionB = "false", OptionC = "NaN", OptionD = "undefined",
                CorrectOption = 1, Explanation = "Erreur de virgule flottante IEEE 754 : 0.1 + 0.2 ≈ 0.30000000000000004." },

            new() { Category = QuizCategory.JavaScript, Difficulty = QuizDifficulty.Medium,
                Text = "Que fait l'opérateur ?. (optional chaining) ?",
                OptionA = "Accès sécurisé : retourne undefined si la propriété n'existe pas",
                OptionB = "Assignation nullish", OptionC = "OU logique", OptionD = "Égalité stricte",
                CorrectOption = 0, Explanation = "obj?.prop retourne undefined au lieu de throw si obj est null/undefined." },

            new() { Category = QuizCategory.JavaScript, Difficulty = QuizDifficulty.Hard,
                Text = "Différence entre == et === en JavaScript ?",
                OptionA = "=== vérifie type ET valeur, == fait de la coercition de type",
                OptionB = "Aucune différence", OptionC = "== est plus strict", OptionD = "=== ne fonctionne que sur les objets",
                CorrectOption = 0, Explanation = "=== est la comparaison stricte sans coercition. == convertit les types." },

            new() { Category = QuizCategory.JavaScript, Difficulty = QuizDifficulty.Hard,
                Text = "Qu'est-ce qu'une closure en JavaScript ?",
                OptionA = "Une fonction qui accède aux variables de sa portée externe même après son retour",
                OptionB = "Une méthode de classe", OptionC = "Une fonction async", OptionD = "Une arrow function",
                CorrectOption = 0, Explanation = "La closure capture les variables du scope lexical même quand la fonction parente a terminé." },

            // ── Algorithms ───────────────────────────────────────────────────
            new() { Category = QuizCategory.Algorithms, Difficulty = QuizDifficulty.Easy,
                Text = "Quelle est la complexité de la recherche binaire ?",
                OptionA = "O(n)", OptionB = "O(log n)", OptionC = "O(n²)", OptionD = "O(1)",
                CorrectOption = 1, Explanation = "La recherche binaire divise le tableau par 2 à chaque étape." },

            new() { Category = QuizCategory.Algorithms, Difficulty = QuizDifficulty.Easy,
                Text = "Quel algorithme de tri a un pire cas O(n²) ?",
                OptionA = "Merge Sort", OptionB = "Bubble Sort", OptionC = "Heap Sort", OptionD = "Radix Sort",
                CorrectOption = 1, Explanation = "Bubble Sort est O(n²) dans tous les cas sauf le meilleur (liste triée) qui est O(n)." },

            new() { Category = QuizCategory.Algorithms, Difficulty = QuizDifficulty.Medium,
                Text = "Quelle structure de données utilise le BFS (parcours en largeur) ?",
                OptionA = "Stack", OptionB = "Queue", OptionC = "Heap", OptionD = "Tree",
                CorrectOption = 1, Explanation = "BFS utilise une file (FIFO) pour traiter les nœuds niveau par niveau." },

            new() { Category = QuizCategory.Algorithms, Difficulty = QuizDifficulty.Medium,
                Text = "Qu'est-ce que la mémoïsation ?",
                OptionA = "Mise en cache des résultats d'appels de fonctions coûteux",
                OptionB = "Tri en mémoire", OptionC = "Garbage collection", OptionD = "Arithmétique de pointeurs",
                CorrectOption = 0, Explanation = "La mémoïsation stocke les résultats pour éviter de recalculer les mêmes entrées." },

            new() { Category = QuizCategory.Algorithms, Difficulty = QuizDifficulty.Hard,
                Text = "Quelle est la complexité en cas moyen du Quicksort ?",
                OptionA = "O(n²)", OptionB = "O(n log n)", OptionC = "O(n)", OptionD = "O(log n)",
                CorrectOption = 1, Explanation = "En cas moyen, Quicksort est O(n log n). Le pire cas (pivot mal choisi) est O(n²)." },

            new() { Category = QuizCategory.Algorithms, Difficulty = QuizDifficulty.Hard,
                Text = "Le Master Theorem est utilisé pour...",
                OptionA = "Analyser les récurrences des algorithmes diviser-pour-régner",
                OptionB = "Prouver NP-complétude", OptionC = "Chemins les plus courts", OptionD = "Programmation dynamique",
                CorrectOption = 0, Explanation = "T(n) = aT(n/b) + f(n) — le Master Theorem donne la complexité asymptotique." },

            // ── Data Structures ──────────────────────────────────────────────
            new() { Category = QuizCategory.DataStructures, Difficulty = QuizDifficulty.Easy,
                Text = "Dans une stack (pile), quelle opération ajoute un élément ?",
                OptionA = "push", OptionB = "enqueue", OptionC = "insert", OptionD = "append",
                CorrectOption = 0, Explanation = "push ajoute au sommet de la pile (LIFO)." },

            new() { Category = QuizCategory.DataStructures, Difficulty = QuizDifficulty.Easy,
                Text = "Un nœud d'arbre binaire a au maximum combien d'enfants ?",
                OptionA = "1", OptionB = "2", OptionC = "3", OptionD = "Illimité",
                CorrectOption = 1, Explanation = "Par définition, un arbre binaire a au plus 2 enfants par nœud (gauche et droit)." },

            new() { Category = QuizCategory.DataStructures, Difficulty = QuizDifficulty.Medium,
                Text = "Complexité d'insertion dans un BST équilibré ?",
                OptionA = "O(1)", OptionB = "O(log n)", OptionC = "O(n)", OptionD = "O(n²)",
                CorrectOption = 1, Explanation = "Un BST équilibré (AVL, Red-Black) garantit une hauteur O(log n)." },

            new() { Category = QuizCategory.DataStructures, Difficulty = QuizDifficulty.Medium,
                Text = "Quelle structure est la plus efficace pour une priority queue ?",
                OptionA = "Array", OptionB = "Linked List", OptionC = "Heap", OptionD = "Stack",
                CorrectOption = 2, Explanation = "Un Heap (tas) offre O(log n) pour insert/extract-min, O(1) pour peek." },

            new() { Category = QuizCategory.DataStructures, Difficulty = QuizDifficulty.Hard,
                Text = "Quelle est la complexité spatiale d'une hash table avec n éléments ?",
                OptionA = "O(1)", OptionB = "O(n)", OptionC = "O(log n)", OptionD = "O(n²)",
                CorrectOption = 1, Explanation = "Une hash table stocke n paires clé-valeur, donc O(n) espace." },

            new() { Category = QuizCategory.DataStructures, Difficulty = QuizDifficulty.Hard,
                Text = "Dans une skip list, le nombre de niveaux attendu est ?",
                OptionA = "O(1)", OptionB = "O(log n)", OptionC = "O(n)", OptionD = "O(n log n)",
                CorrectOption = 1, Explanation = "Avec une probabilité 1/2 par niveau, on obtient O(log n) niveaux en espérance." },

            // ── General CS ───────────────────────────────────────────────────
            new() { Category = QuizCategory.GeneralCS, Difficulty = QuizDifficulty.Easy,
                Text = "RAM signifie ?",
                OptionA = "Randomly Accessed Machine", OptionB = "Random Access Memory",
                OptionC = "Read-Access Module", OptionD = "Real Address Memory",
                CorrectOption = 1, Explanation = "RAM = Random Access Memory, la mémoire vive de l'ordinateur." },

            new() { Category = QuizCategory.GeneralCS, Difficulty = QuizDifficulty.Easy,
                Text = "HTTP signifie ?",
                OptionA = "HyperText Technical Protocol", OptionB = "HyperText Transfer Protocol",
                OptionC = "High Transfer Technology Protocol", OptionD = "Hyper Transfer Text Process",
                CorrectOption = 1, Explanation = "HTTP (HyperText Transfer Protocol) est le protocole fondamental du Web." },

            new() { Category = QuizCategory.GeneralCS, Difficulty = QuizDifficulty.Medium,
                Text = "Différence entre un processus et un thread ?",
                OptionA = "Les threads partagent la mémoire d'un processus ; les processus sont indépendants",
                OptionB = "Aucune différence", OptionC = "Les threads sont plus lourds", OptionD = "Les processus partagent la mémoire",
                CorrectOption = 0, Explanation = "Les threads d'un même processus partagent heap et data segment. Les processus ont des espaces mémoire séparés." },

            new() { Category = QuizCategory.GeneralCS, Difficulty = QuizDifficulty.Medium,
                Text = "SOLID est un acronyme pour ?",
                OptionA = "Single responsibility, Open/closed, Liskov, Interface segregation, Dependency inversion",
                OptionB = "Secure, Object, Linked, Integrated, Distributed",
                OptionC = "Simple, Open, Lightweight, Independent, Dynamic",
                OptionD = "Structured, Oriented, Linked, Interface, Dependency",
                CorrectOption = 0, Explanation = "SOLID = 5 principes de conception orientée objet pour un code maintenable." },

            new() { Category = QuizCategory.GeneralCS, Difficulty = QuizDifficulty.Hard,
                Text = "Le théorème CAP stipule qu'un système distribué ne peut garantir simultanément que 2 des 3 propriétés suivantes :",
                OptionA = "Consistency, Availability, Partition tolerance",
                OptionB = "Concurrency, Atomicity, Performance",
                OptionC = "Caching, Availability, Persistence",
                OptionD = "Consistency, Accuracy, Parallelism",
                CorrectOption = 0, Explanation = "CAP (Brewer 2000) : on choisit 2 parmi Cohérence, Disponibilité, Tolérance aux partitions." },

            new() { Category = QuizCategory.GeneralCS, Difficulty = QuizDifficulty.Hard,
                Text = "Différence entre TCP et UDP ?",
                OptionA = "TCP est orienté connexion et fiable ; UDP est sans connexion et plus rapide",
                OptionB = "Aucune différence", OptionC = "UDP est plus fiable", OptionD = "TCP est plus rapide",
                CorrectOption = 0, Explanation = "TCP garantit l'ordre et la livraison. UDP sacrifie ces garanties pour la vitesse (streaming, jeux)." },
        };

        db.QuizQuestions.AddRange(questions);
        await db.SaveChangesAsync();

        Console.WriteLine($"[QuizSeeder] {questions.Count} questions insérées.");
    }
}
