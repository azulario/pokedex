const pokemonList = document.getElementById('pokemonList');
const loadMoreButton = document.getElementById('loadMoreButton');
const pokemonDetailScreen = document.getElementById('pokemonDetailScreen');
const backButton = pokemonDetailScreen.querySelector('.back-button');
const pokemonDetailName = pokemonDetailScreen.querySelector('.pokemon-detail-name');
const pokemonDetailNumber = pokemonDetailScreen.querySelector('.pokemon-detail-number');
const pokemonDetailImage = pokemonDetailScreen.querySelector('.pokemon-detail-image');
const tabButtons = pokemonDetailScreen.querySelectorAll('.tab-button');
const tabPanes = pokemonDetailScreen.querySelectorAll('.tab-pane');

// Elementos da aba "About"
const detailSpecies = document.getElementById('detail-species');
const detailHeight = document.getElementById('detail-height');
const detailWeight = document.getElementById('detail-weight');
const detailAbilities = document.getElementById('detail-abilities');
const detailGender = document.getElementById('detail-gender');
const detailEggGroups = document.getElementById('detail-egg-groups');
const detailEggCycle = document.getElementById('detail-egg-cycle');

// Elementos da aba "Base Stats"
const statHp = document.getElementById('stat-hp');
const barHp = document.getElementById('bar-hp');
const statAttack = document.getElementById('stat-attack');
const barAttack = document.getElementById('bar-attack');
const statDefense = document.getElementById('stat-defense');
const barDefense = document.getElementById('bar-defense');
const statSpAtk = document.getElementById('stat-sp-atk');
const barSpAtk = document.getElementById('bar-sp-atk');
const statSpDef = document.getElementById('stat-sp-def');
const barSpDef = document.getElementById('bar-sp-def');
const statSpeed = document.getElementById('stat-speed');
const barSpeed = document.getElementById('bar-speed');
const statTotal = document.getElementById('stat-total');
const detailTypeDefenses = document.getElementById('detail-type-defenses');


const limit = 32;
let offset = 0;
const maxRecords = 151;

// Função auxiliar para capitalizar a primeira letra
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Função para carregar e renderizar os itens dos Pokémon na lista principal
function loadPokemonItems(offset, limit) {
    pokeAPI.getPokemons(offset, limit).then((pokemons = []) => {
        const newHtml = pokemons.map((pokemon) => {
            const formattedNumber = pokemon.number.toString().padStart(3, '0');
            const capitalizedName = capitalizeFirstLetter(pokemon.name);

            return `
                <li class="pokemon ${pokemon.type}" data-pokemon-id="${pokemon.number}">
                    <span class="number">#${formattedNumber}</span>
                    <span class="name">${capitalizedName}</span>
        
                    <div class="details">   
                        <ol class="types">
                            ${pokemon.types.map((type) => `<li class="type ${type}" >${capitalizeFirstLetter(type)}</li>`).join('')}
                        </ol>
        
                        <img src="${pokemon.photo}" 
                             alt="${capitalizedName}">
                    </div>
                </li>
            `;
        }).join('');
        
        pokemonList.innerHTML += newHtml;

        // Adiciona event listeners aos novos cards de Pokémon
        addPokemonCardClickListeners();
    });
}

// Função para preencher e exibir a tela de detalhes
function displayPokemonDetails(pokemon) {
    pokemonDetailName.textContent = capitalizeFirstLetter(pokemon.name);
    pokemonDetailNumber.textContent = `#${pokemon.number.toString().padStart(3, '0')}`;
    pokemonDetailImage.src = pokemon.photo;
    pokemonDetailImage.alt = capitalizeFirstLetter(pokemon.name);

    // Define a cor de fundo do cabeçalho da tela de detalhes com base no tipo principal
    const detailHeader = pokemonDetailScreen.querySelector('.detail-header');
    detailHeader.className = `detail-header ${pokemon.type}`; // Adiciona a classe do tipo

    // Preenche a aba "About"
    detailSpecies.textContent = pokemon.species;
    detailHeight.textContent = `${pokemon.height} m`;
    detailWeight.textContent = `${pokemon.weight} kg`;
    detailAbilities.textContent = pokemon.abilities.map(capitalizeFirstLetter).join(', ');

    // Lógica para gênero
    if (pokemon.genderRate === -1) { // Sem gênero
        detailGender.textContent = 'Genderless';
    } else {
        const malePercentage = (8 - pokemon.genderRate) * 12.5;
        const femalePercentage = pokemon.genderRate * 12.5;
        detailGender.textContent = `♂ ${malePercentage}% / ♀ ${femalePercentage}%`;
    }
    
    detailEggGroups.textContent = pokemon.eggGroups.map(capitalizeFirstLetter).join(', ');
    detailEggCycle.textContent = capitalizeFirstLetter(pokemon.eggCycle);

    // Preenche a aba "Base Stats"
    pokemon.stats.forEach(stat => {
        const statName = stat.name.replace('-', ''); // Remove hífens do nome do stat
        const statValueElement = document.getElementById(`stat-${statName}`);
        const statBarElement = document.getElementById(`bar-${statName}`);

        if (statValueElement) statValueElement.textContent = stat.base_stat;
        if (statBarElement) {
            // Calcula a porcentagem para a barra de progresso (ex: max 255 para stats)
            const percentage = (stat.base_stat / 255) * 100; 
            statBarElement.style.width = `${percentage}%`;
            // Define a cor da barra de progresso com base no tipo principal do Pokémon
            statBarElement.style.backgroundColor = `var(--${pokemon.type}-color)`; // Usar variável CSS
        }
    });
    statTotal.textContent = pokemon.totalStat;
    // detailTypeDefenses.textContent = 'Implementar defesas de tipo aqui'; // Isso exigiria mais lógica da API

    // Esconde a lista principal e mostra a tela de detalhes
    document.querySelector('.container').classList.add('hidden');
    pokemonDetailScreen.classList.remove('hidden');

    // Ativa a aba "About" por padrão ao abrir os detalhes
    tabButtons.forEach(button => button.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    document.querySelector('.tab-button[data-tab="about"]').classList.add('active');
    document.getElementById('about-tab').classList.add('active');
}

// Adiciona event listeners aos cards de Pokémon para abrir os detalhes
function addPokemonCardClickListeners() {
    document.querySelectorAll('.pokemon').forEach(card => {
        card.removeEventListener('click', handlePokemonCardClick); // Evita múltiplos listeners
        card.addEventListener('click', handlePokemonCardClick);
    });
}

function handlePokemonCardClick(event) {
    const pokemonId = event.currentTarget.dataset.pokemonId;
    if (pokemonId) {
        pokeAPI.getPokemonFullDetails(pokemonId)
            .then(pokemon => {
                displayPokemonDetails(pokemon);
            })
            .catch(error => {
                console.error('Erro ao buscar detalhes do Pokémon:', error);
                // Opcional: mostrar uma mensagem de erro para o usuário
            });
    }
}

// Lógica para alternar entre as abas
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;

        // Remove a classe 'active' de todos os botões e painéis
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // Adiciona a classe 'active' ao botão clicado e ao painel correspondente
        button.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');

        // Se for a aba de evolução, carregar a cadeia de evolução (exemplo simplificado)
        if (targetTab === 'evolution') {
            // Você precisará ter o pokemon completo disponível aqui, talvez armazenado globalmente
            // ou passado como parâmetro. Por enquanto, é um placeholder.
            // Ex: pokeAPI.getEvolutionChain(currentPokemon.evolutionChainUrl).then(chain => { /* renderizar */ });
        }
    });
});

// Listener para o botão de voltar na tela de detalhes
backButton.addEventListener('click', () => {
    document.querySelector('.container').classList.remove('hidden');
    pokemonDetailScreen.classList.add('hidden');
});

// Carrega os primeiros Pokémon ao iniciar a página
loadPokemonItems(offset, limit);
offset += limit; // Atualiza o offset para o próximo conjunto de Pokémon

// Listener do botão para carregar mais
loadMoreButton.addEventListener('click', () => {
    const recordNextPage = offset + limit;

    if (recordNextPage >= maxRecords) {
        const newLimit = maxRecords - offset;
        loadPokemonItems(offset, newLimit);
        loadMoreButton.parentElement.removeChild(loadMoreButton);
    } else {
        loadPokemonItems(offset, limit);
    }
    offset += limit; // Atualiza o offset APÓS a chamada de loadPokemonItems
});
