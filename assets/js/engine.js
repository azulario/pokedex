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
const typeDefensesList = document.getElementById('type-defenses-list'); // Novo elemento

// NOVOS ELEMENTOS PARA EVOLUÇÃO E MOVIMENTOS
const evolutionChainContent = document.getElementById('evolution-chain-content');
const movesListContent = document.getElementById('moves-list-content');

// Elementos para busca
const pokemonSearchInput = document.getElementById('pokemonSearchInput');
const searchButton = document.getElementById('searchButton');
const clearSearchButton = document.getElementById('clearSearchButton');

// Elementos para Lore
// REMOVIDOS: const generateLoreButton = document.getElementById('generateLoreButton');
// REMOVIDOS: const generatedLoreText = document.getElementById('generatedLoreText');

let currentDisplayedPokemon = null; // Variável global para armazenar o Pokémon atualmente exibido

const limit = 32;
let offset = 0;
const maxRecords = 151;
let isSearching = false; // Novo estado para controlar se a busca está ativa

// Função auxiliar para capitalizar a primeira letra
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Função para carregar e renderizar os itens dos Pokémon na lista principal
function loadPokemonItems(offset, limit, searchTerm = '') {
    pokemonList.innerHTML = '<p class="loading-message">Carregando Pokémon...</p>'; // Mensagem de carregamento
    loadMoreButton.classList.add('hidden'); // Esconde o botão enquanto carrega

    let fetchPromise;
    if (searchTerm) {
        // Se houver termo de busca, tenta buscar um único Pokémon
        fetchPromise = pokeAPI.getPokemonFullDetails(searchTerm.toLowerCase())
            .then(pokemon => [pokemon]) // Retorna um array com o Pokémon encontrado
            .catch(error => {
                console.error('Erro ao buscar Pokémon:', error);
                pokemonList.innerHTML = '<p class="error-message">Pokémon não encontrado!</p>';
                return []; // Retorna um array vazio em caso de erro
            });
    } else {
        // Caso contrário, carrega a lista normal
        fetchPromise = pokeAPI.getPokemons(offset, limit);
    }

    fetchPromise.then((pokemons = []) => {
        pokemonList.innerHTML = ''; // Limpa a mensagem de carregamento/erro
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

        if (!searchTerm && (offset + limit) < maxRecords) {
            loadMoreButton.classList.remove('hidden'); // Mostra o botão se não estiver em busca e houver mais registros
        } else {
            loadMoreButton.classList.add('hidden'); // Esconde o botão se estiver em busca ou não houver mais registros
        }
    });
}

// Função para preencher e exibir a tela de detalhes
async function displayPokemonDetails(pokemon) {
    currentDisplayedPokemon = pokemon; // Armazena o Pokémon globalmente

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

    // Preenche as defesas de tipo
    typeDefensesList.innerHTML = '<p class="loading-message">Carregando defesas de tipo...</p>';
    try {
        const defenses = await pokeAPI.getTypeDefenses(pokemon.types);
        let defensesHtml = '';
        if (defenses.double_damage_from.length > 0) {
            defensesHtml += `<li>Fraquezas (2x): <span class="weakness">${defenses.double_damage_from.map(capitalizeFirstLetter).join(', ')}</span></li>`;
        }
        if (defenses.half_damage_from.length > 0) {
            defensesHtml += `<li>Resistências (0.5x): <span class="resistance">${defenses.half_damage_from.map(capitalizeFirstLetter).join(', ')}</span></li>`;
        }
        if (defenses.no_damage_from.length > 0) {
            defensesHtml += `<li>Imunidades (0x): <span class="immunity">${defenses.no_damage_from.map(capitalizeFirstLetter).join(', ')}</span></li>`;
        }
        if (defensesHtml === '') {
            typeDefensesList.innerHTML = '<p class="no-data-message">Nenhuma defesa de tipo específica.</p>';
        } else {
            typeDefensesList.innerHTML = defensesHtml;
        }
    } catch (error) {
        console.error('Erro ao carregar defesas de tipo:', error);
        typeDefensesList.innerHTML = '<p class="error-message">Erro ao carregar defesas de tipo.</p>';
    }

    // Limpa o conteúdo das abas de Evolução e Movimentos ao abrir os detalhes
    // O conteúdo será carregado dinamicamente quando a aba for ativada
    if (evolutionChainContent) evolutionChainContent.innerHTML = '';
    if (movesListContent) movesListContent.innerHTML = '';
    // REMOVIDOS: generatedLoreText.classList.add('hidden'); // Esconde a lore ao abrir um novo Pokémon
    // REMOVIDOS: generatedLoreText.textContent = ''; // Limpa o texto da lore

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

        // Popula o conteúdo baseado na aba ativa
        if (targetTab === 'evolution') {
            if (currentDisplayedPokemon && currentDisplayedPokemon.evolutionChainUrl) {
                evolutionChainContent.innerHTML = '<p class="loading-message">Carregando cadeia de evolução...</p>'; // Indicador de carregamento
                pokeAPI.getEvolutionChain(currentDisplayedPokemon.evolutionChainUrl)
                    .then(chain => {
                        evolutionChainContent.innerHTML = ''; // Limpa a mensagem de carregamento
                        if (chain.length > 0) {
                            const evolutionHtml = chain.map((evo, index) => `
                                <div class="evolution-step">
                                    <img src="${evo.photo}" alt="${capitalizeFirstLetter(evo.name)}">
                                    <span class="capitalize">${evo.name}</span>
                                    ${evo.details ? `<span class="evolution-details">${capitalizeFirstLetter(evo.details)}</span>` : ''}
                                </div>
                                ${index < chain.length - 1 ? '<span class="evolution-arrow">→</span>' : ''}
                            `).join('');
                            evolutionChainContent.innerHTML = `<div class="evolution-chain-display">${evolutionHtml}</div>`;
                        } else {
                            evolutionChainContent.innerHTML = '<p class="no-data-message">Não há dados de evolução disponíveis.</p>';
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao carregar cadeia de evolução:', error);
                        evolutionChainContent.innerHTML = '<p class="error-message">Erro ao carregar cadeia de evolução.</p>';
                    });
            } else {
                evolutionChainContent.innerHTML = '<p class="no-data-message">Nenhuma cadeia de evolução disponível.</p>';
            }
        } else if (targetTab === 'moves') {
            if (currentDisplayedPokemon && currentDisplayedPokemon.moves.length > 0) {
                const movesHtml = currentDisplayedPokemon.moves.map(move => `
                    <li class="move-item capitalize">
                        ${move.replace('-', ' ')}
                    </li>
                `).join('');
                movesListContent.innerHTML = `<ul class="moves-list-grid">${movesHtml}</ul>`;
            } else {
                movesListContent.innerHTML = '<p class="no-data-message">Nenhum movimento disponível.</p>';
            }
        }
    });
});

// Listener para o botão de voltar na tela de detalhes
backButton.addEventListener('click', () => {
    document.querySelector('.container').classList.remove('hidden');
    pokemonDetailScreen.classList.add('hidden');
    // REMOVIDOS: generatedLoreText.classList.add('hidden'); // Esconde a lore ao voltar
    // REMOVIDOS: generatedLoreText.textContent = ''; // Limpa o texto da lore
    pokemonSearchInput.value = ''; // Limpa o campo de busca
    isSearching = false; // Reseta o estado de busca
    clearSearchButton.classList.add('hidden'); // Esconde o botão de limpar busca
    loadPokemonItems(0, limit); // Recarrega a lista inicial
});

// Lógica de busca
searchButton.addEventListener('click', () => {
    const searchTerm = pokemonSearchInput.value.trim();
    if (searchTerm) {
        isSearching = true;
        pokemonList.innerHTML = ''; // Limpa a lista atual
        loadPokemonItems(0, limit, searchTerm); // Carrega o Pokémon buscado
        loadMoreButton.classList.add('hidden'); // Esconde o botão "Load More"
        clearSearchButton.classList.remove('hidden'); // Mostra o botão de limpar busca
    } else {
        // Se o campo de busca estiver vazio, limpa a busca e recarrega a lista
        isSearching = false;
        clearSearchButton.classList.add('hidden');
        loadPokemonItems(0, limit);
    }
});

pokemonSearchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

clearSearchButton.addEventListener('click', () => {
    pokemonSearchInput.value = '';
    isSearching = false;
    clearSearchButton.classList.add('hidden');
    pokemonList.innerHTML = ''; // Limpa a lista atual
    loadPokemonItems(0, limit); // Recarrega a lista inicial
});


// REMOVIDA: Lógica para Gerar Lore com Gemini API
/*
generateLoreButton.addEventListener('click', async () => {
    if (!currentDisplayedPokemon) return;

    generateLoreButton.disabled = true;
    generatedLoreText.classList.remove('hidden');
    generatedLoreText.textContent = 'Gerando lore...'; // Indicador de carregamento

    try {
        const types = currentDisplayedPokemon.types.map(t => t).join(' e ');
        const prompt = `Gere uma descrição de lore curta, criativa e imaginativa (entre 50-70 palavras) para um Pokémon chamado ${currentDisplayedPokemon.name}, que é do tipo ${types}. Foque em suas características únicas e habitat.`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // API Key será fornecida pelo ambiente Canvas
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            generatedLoreText.textContent = text; // Define a lore gerada
        } else {
            generatedLoreText.textContent = 'Não foi possível gerar a lore para este Pokémon.';
        }
    } catch (err) {
        console.error("Erro ao gerar lore:", err);
        generatedLoreText.textContent = 'Erro ao gerar a lore. Tente novamente.';
    } finally {
        generateLoreButton.disabled = false;
    }
});
*/

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