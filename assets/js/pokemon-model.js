// Define a classe Pokemon com propriedades para detalhes expandidos
class Pokemon {
    number; // Número do Pokémon
    name;   // Nome do Pokémon
    type;   // Tipo principal do Pokémon
    types = []; // Array de todos os tipos do Pokémon
    photo;  // URL da imagem oficial do Pokémon

    // Novas propriedades para a tela de detalhes
    species;    // Espécie do Pokémon
    height;     // Altura do Pokémon
    weight;     // Peso do Pokémon
    abilities = []; // Array de habilidades do Pokémon
    genderRate; // Taxa de gênero (para calcular proporção masculino/feminino)
    eggGroups = []; // Grupos de ovos
    eggCycle;   // Ciclo de ovo (para reprodução)
    
    stats = []; // Array de estatísticas base (HP, Attack, Defense, etc.)
    totalStat;  // Soma total das estatísticas base

    evolutionChainUrl; // URL da cadeia de evolução (será usada para buscar detalhes da evolução)
    evolutionChain = []; // Estrutura da cadeia de evolução (nome, imagem, etc.)

    moves = []; // Array de movimentos do Pokémon
}
