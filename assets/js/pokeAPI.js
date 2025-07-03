const pokeAPI = {}

// Função para converter os detalhes básicos da API para o objeto Pokemon
function convertPokeApiDetailtoPokemon(pokeDetail) {
    const pokemon = new Pokemon()
    pokemon.number = pokeDetail.id
    pokemon.name = pokeDetail.name

    const types = pokeDetail.types.map((typeSlot) => typeSlot.type.name)
    const [type] = types

    pokemon.types = types
    pokemon.type = type
    pokemon.photo = pokeDetail.sprites.other['official-artwork'].front_default
    
    // Novas propriedades a serem preenchidas pelos detalhes completos
    // Estas serão preenchidas por uma nova função de detalhes, mas já as inicializamos aqui
    pokemon.species = '';
    pokemon.height = 0;
    pokemon.weight = 0;
    pokemon.abilities = [];
    pokemon.genderRate = -1; // -1 indica que não há dados de gênero ou é desconhecido
    pokemon.eggGroups = [];
    pokemon.eggCycle = '';
    pokemon.stats = [];
    pokemon.totalStat = 0;
    pokemon.evolutionChainUrl = '';
    pokemon.moves = [];
    pokemon.typeDefenses = {};

    return pokemon
}

// Função para buscar os detalhes básicos de um Pokémon (usada na lista)
pokeAPI.getPokemonDetail = (pokemon) => {
    return fetch(pokemon.url)
    .then((response) => response.json())
    .then(convertPokeApiDetailtoPokemon)
}

// Função para buscar a lista de Pokémon (usada na lista principal)
pokeAPI.getPokemons = (offset = 0, limit = 10) => {
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`

    return fetch(url)
    .then((response) => response.json())
    .then((jsonBody) => jsonBody.results)
    .then((pokemons) => pokemons.map(pokeAPI.getPokemonDetail))
    .then((detailRequests) => Promise.all(detailRequests))
    .then((pokemonsDetails) => pokemonsDetails)
}

// ==========================================================================
// NOVAS FUNÇÕES PARA BUSCAR DETALHES COMPLETOS DO POKÉMON
// ==========================================================================

// Função para converter os detalhes completos da API para o objeto Pokemon
function convertPokeApiFullDetailtoPokemon(pokeDetail, speciesDetail) {
    const pokemon = new Pokemon(); // Cria uma nova instância de Pokemon

    // Preenche as propriedades básicas (já existentes)
    pokemon.number = pokeDetail.id;
    pokemon.name = pokeDetail.name;
    const types = pokeDetail.types.map((typeSlot) => typeSlot.type.name);
    pokemon.types = types;
    pokemon.type = types[0]; // Assume o primeiro tipo como o principal
    pokemon.photo = pokeDetail.sprites.other['official-artwork'].front_default;

    // Preenche as novas propriedades para a aba "About"
    pokemon.species = speciesDetail.genera.find(g => g.language.name === 'en')?.genus || ''; // Nome da espécie em inglês
    pokemon.height = pokeDetail.height / 10; // Convertendo de decímetros para metros
    pokemon.weight = pokeDetail.weight / 10; // Convertendo de hectogramas para quilogramas
    pokemon.abilities = pokeDetail.abilities.map(a => a.ability.name);
    pokemon.genderRate = speciesDetail.gender_rate; // Taxa de gênero (0-8, -1 para sem gênero)
    pokemon.eggGroups = speciesDetail.egg_groups.map(eg => eg.name);
    pokemon.eggCycle = speciesDetail.egg_groups[0]?.name || ''; // Pega o primeiro grupo de ovo como ciclo

    // Preenche as propriedades para a aba "Base Stats"
    let totalStats = 0;
    pokemon.stats = pokeDetail.stats.map(s => {
        totalStats += s.base_stat;
        return {
            name: s.stat.name,
            base_stat: s.base_stat
        };
    });
    pokemon.totalStat = totalStats;

    // Preenche a URL da cadeia de evolução para buscas futuras
    pokemon.evolutionChainUrl = speciesDetail.evolution_chain.url;

    // Preenche as propriedades para a aba "Moves"
    pokemon.moves = pokeDetail.moves.map(m => m.move.name);

    return pokemon;
}

// Função para buscar TODOS os detalhes de um Pokémon (para a tela de detalhes)
pokeAPI.getPokemonFullDetails = (idOrName) => {
    const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${idOrName}/`;
    const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${idOrName}/`;

    // Faz requisições paralelas para os detalhes do Pokémon e os detalhes da espécie
    return Promise.all([
        fetch(pokemonUrl).then(response => response.json()),
        fetch(speciesUrl).then(response => response.json())
    ])
    .then(([pokeDetail, speciesDetail]) => {
        // Converte os dados brutos da API para o nosso objeto Pokemon detalhado
        return convertPokeApiFullDetailtoPokemon(pokeDetail, speciesDetail);
    });
}

// Função para buscar a cadeia de evolução e incluir sprites e detalhes de evolução
pokeAPI.getEvolutionChain = async (evolutionChainUrl) => {
    const response = await fetch(evolutionChainUrl);
    const evolutionData = await response.json();

    const evolutionChain = [];
    let current = evolutionData.chain;

    // Função recursiva para percorrer a cadeia de evolução
    const traverseEvolution = async (chainLink) => {
        const pokemonName = chainLink.species.name;
        // Busca o sprite para cada Pokémon na cadeia
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}/`);
        const pokemonDetail = await pokemonResponse.json();
        const photo = pokemonDetail.sprites.other['official-artwork'].front_default;

        let evolutionDetails = '';
        if (chainLink.evolution_details && chainLink.evolution_details.length > 0) {
            const detail = chainLink.evolution_details[0]; // Pega o primeiro detalhe de evolução
            if (detail.trigger && detail.trigger.name) {
                evolutionDetails += `Evolui por: ${detail.trigger.name.replace('-', ' ')}`;
                if (detail.min_level) {
                    evolutionDetails += ` (Lv. ${detail.min_level})`;
                } else if (detail.item) {
                    evolutionDetails += ` (Item: ${detail.item.name.replace('-', ' ')})`;
                } else if (detail.trade_species) {
                    evolutionDetails += ` (Troca com ${detail.trade_species.name})`;
                }
                // Adicione mais condições para outros triggers se necessário
            }
        }

        evolutionChain.push({
            name: pokemonName,
            photo: photo,
            details: evolutionDetails // Adiciona os detalhes da evolução
        });

        // Chama recursivamente para cada caminho de evolução (lidando com múltiplas evoluções como Eevee)
        for (const nextEvolution of chainLink.evolves_to) {
            await traverseEvolution(nextEvolution);
        }
    };

    await traverseEvolution(current);
    return evolutionChain;
};

// Função para buscar as defesas de tipo
pokeAPI.getTypeDefenses = async (types) => {
    const damageRelations = {
        'double_damage_from': new Set(),
        'half_damage_from': new Set(),
        'no_damage_from': new Set()
    };

    for (const typeName of types) {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${typeName}/`);
        const data = await response.json();

        data.damage_relations.double_damage_from.forEach(t => damageRelations.double_damage_from.add(t.name));
        data.damage_relations.half_damage_from.forEach(t => damageRelations.half_damage_from.add(t.name));
        data.damage_relations.no_damage_from.forEach(t => damageRelations.no_damage_from.add(t.name));
    }

    // Remove redundâncias e conflitos (ex: se um tipo dá 2x e outro 0.5x, o resultado é 1x, então remove de ambos)
    // Lógica simplificada: se está em no_damage_from, ignora double/half
    // Se está em double e half, remove de ambos
    const finalDefenses = {
        'double_damage_from': new Set(),
        'half_damage_from': new Set(),
        'no_damage_from': new Set()
    };

    for (const type of damageRelations.double_damage_from) {
        if (!damageRelations.no_damage_from.has(type) && !damageRelations.half_damage_from.has(type)) {
            finalDefenses.double_damage_from.add(type);
        }
    }
    for (const type of damageRelations.half_damage_from) {
        if (!damageRelations.no_damage_from.has(type) && !damageRelations.double_damage_from.has(type)) {
            finalDefenses.half_damage_from.add(type);
        }
    }
    for (const type of damageRelations.no_damage_from) {
        finalDefenses.no_damage_from.add(type);
    }

    return {
        'double_damage_from': Array.from(finalDefenses.double_damage_from),
        'half_damage_from': Array.from(finalDefenses.half_damage_from),
        'no_damage_from': Array.from(finalDefenses.no_damage_from)
    };
};