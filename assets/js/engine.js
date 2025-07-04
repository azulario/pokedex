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
        animatePokemonCards(); // Chama a função de animação para os cards

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
            // Define a variável CSS para a animação da barra de stats
            statBarElement.style.setProperty('--stat-percentage', `${(stat.base_stat / 255) * 100}%`);
            statBarElement.style.backgroundColor = `var(--${pokemon.type}-color)`; // Usar variável CSS
            animateStatBars(pokemon.stats); // Chama a animação das barras de stats
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

    // Esconde a lista principal e mostra a tela de detalhes
    document.querySelector('.container').classList.add('hidden');
    pokemonDetailScreen.classList.remove('hidden');

    // Ativa a aba "About" por padrão ao abrir os detalhes
    tabButtons.forEach(button => button.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    document.querySelector('.tab-button[data-tab="about"]').classList.add('active');
    document.getElementById('about-tab').classList.add('active');

    showPokemonDetails(pokemon); // Chama a função de animação para a tela de detalhes
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
                showErrorAnimation(pokemonList, 'Erro ao buscar detalhes do Pokémon.'); // Exibe erro
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
        animateTabChange(`${targetTab}-tab`); // Chama a animação de troca de abas

        // Popula o conteúdo baseado na aba ativa
        if (targetTab === 'evolution') {
            if (currentDisplayedPokemon && currentDisplayedPokemon.evolutionChainUrl) {
                const loadingInterval = showLoadingAnimation(evolutionChainContent); // Mostra loading
                pokeAPI.getEvolutionChain(currentDisplayedPokemon.evolutionChainUrl)
                    .then(chain => {
                        hideLoadingAnimation(evolutionChainContent, loadingInterval); // Esconde loading
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
                            animateEvolution(); // Anima a evolução
                        } else {
                            evolutionChainContent.innerHTML = '<p class="no-data-message">Não há dados de evolução disponíveis.</p>';
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao carregar cadeia de evolução:', error);
                        hideLoadingAnimation(evolutionChainContent, loadingInterval); // Esconde loading
                        showErrorAnimation(evolutionChainContent, 'Erro ao carregar cadeia de evolução.'); // Exibe erro
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
                animateMovements(); // Anima os movimentos
            } else {
                movesListContent.innerHTML = '<p class="no-data-message">Nenhum movimento disponível.</p>';
            }
        }
    });
});

// Listener para o botão de voltar na tela de detalhes
backButton.addEventListener('click', () => {
    closePokemonDetails(); // Chama a animação de fechamento
    // Aguarda a animação terminar antes de esconder a tela e recarregar a lista
    setTimeout(() => {
        document.querySelector('.container').classList.remove('hidden');
        pokemonDetailScreen.classList.add('hidden');
        pokemonSearchInput.value = ''; // Limpa o campo de busca
        isSearching = false; // Reseta o estado de busca
        clearSearchButton.classList.add('hidden'); // Esconde o botão de limpar busca
        loadPokemonItems(0, limit); // Recarrega a lista inicial
    }, 400); // Tempo da animação de fechamento
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
        animateSearch(); // Anima a busca
    } else {
        // Se o campo de busca estiver vazio, limpa a busca e recarrega a lista
        isSearching = false;
        clearSearchButton.classList.add('hidden');
        pokemonList.innerHTML = ''; // Limpa a lista atual
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


// ==========================================================================
// FUNÇÕES DE ANIMAÇÃO (MOVIDAS PARA CÁ DO CSS GLOBAL)
// ==========================================================================

// Função para animar a entrada de cards de Pokémon
function animatePokemonCards() {
    const cards = document.querySelectorAll('.pokemon');
    cards.forEach((card, index) => {
        // Adiciona delay escalonado para cada card
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Adiciona listener para hover
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Função para animar a transição da tela de detalhes
function showPokemonDetails(pokemonData) {
    const detailScreen = document.querySelector('.pokemon-detail-screen');
    
    // Remove classe de fechamento se existir
    detailScreen.classList.remove('closing');
    
    // Mostra a tela
    detailScreen.classList.remove('hidden');
    
    // Anima as barras de stats
    setTimeout(() => {
        animateStatBars(pokemonData.stats);
    }, 800);
    
    // Anima a imagem do Pokémon
    const pokemonImage = document.querySelector('.pokemon-detail-image');
    pokemonImage.style.animation = 'pokemonImageBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
}

// Função para fechar a tela de detalhes com animação
function closePokemonDetails() {
    const detailScreen = document.querySelector('.pokemon-detail-screen');
    
    // Adiciona classe de fechamento
    detailScreen.classList.add('closing');
    
    // Esconde após a animação
    setTimeout(() => {
        detailScreen.classList.add('hidden');
        detailScreen.classList.remove('closing');
    }, 400);
}

// Função para animar as barras de stats
function animateStatBars(stats) {
    const statBars = document.querySelectorAll('.stat-bar');
    
    statBars.forEach((bar, index) => {
        const statValue = stats[index]?.base_stat || 0;
        const percentage = Math.min((statValue / 255) * 100, 100); // 255 é o máximo teórico
        
        // Define a variável CSS para a animação
        bar.style.setProperty('--stat-percentage', `${percentage}%`);
        
        // Adiciona delay escalonado
        bar.style.animationDelay = `${index * 0.2}s`;
        
        // Força o recálculo da animação
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = `${percentage}%`;
        }, 50 + (index * 200));
    });
}

// Função para animar a troca de abas
function animateTabChange(activeTabId) {
    const tabPanes = document.querySelectorAll('.tab-pane');
    const activePane = document.getElementById(activeTabId);
    
    // Esconde todas as abas
    tabPanes.forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Mostra a aba ativa com animação
    setTimeout(() => {
        activePane.classList.add('active');
    }, 50);
}

// Função para animar elementos quando entram na viewport
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out';
                entry.target.style.opacity = '1';
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observa os cards de Pokémon
    const cards = document.querySelectorAll('.pokemon');
    cards.forEach(card => {
        observer.observe(card);
    });
}

// Função para adicionar efeito ripple aos botões
function addRippleEffect(button) {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 400);
    });
}

// Função para animar o carregamento de novos Pokémon
function animateNewPokemon() {
    const newCards = document.querySelectorAll('.pokemon:not(.animated)');
    
    newCards.forEach((card, index) => {
        card.classList.add('animated');
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('new-pokemon');
        
        // Remove a classe após a animação
        setTimeout(() => {
            card.classList.remove('new-pokemon');
        }, 600);
    });
}

// Função para animar a busca
function animateSearch() {
    const searchInput = document.getElementById('pokemonSearchInput');
    const searchResults = document.querySelector('.pokemons');
    
    // Adiciona efeito de loading
    searchResults.style.opacity = '0.5';
    searchResults.style.transform = 'translateY(10px)';
    
    // Simula delay de busca
    setTimeout(() => {
        searchResults.style.opacity = '1';
        searchResults.style.transform = 'translateY(0)';
    }, 300);
}

// Função para animar movimentos
function animateMovements() {
    const moveItems = document.querySelectorAll('.move-item');
    
    moveItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.05}s`;
        
        // Adiciona hover effect
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Função para animar evolução
function animateEvolution() {
    const evolutionSteps = document.querySelectorAll('.evolution-step');
    
    evolutionSteps.forEach((step, index) => {
        step.style.animationDelay = `${index * 0.3}s`;
        
        // Adiciona click effect
        step.addEventListener('click', function() {
            this.style.animation = 'evolutionStepAppear 0.6s ease-out';
        });
    });
}

// Função para smooth scroll
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Função para animar o loading
function showLoadingAnimation(element) {
    element.innerHTML = '<div class="loading-message">Carregando...</div>';
    
    // Adiciona pontos animados
    const dots = element.querySelector('.loading-message');
    let dotCount = 0;
    
    const interval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        dots.textContent = 'Carregando' + '.'.repeat(dotCount);
    }, 500);
    
    return interval;
}

// Função para parar o loading
function hideLoadingAnimation(element, interval) {
    if (interval) {
        clearInterval(interval);
    }
    element.innerHTML = '';
}

// Função para animar entrada de erro
function showErrorAnimation(element, message) {
    element.innerHTML = `<div class="error-message">${message}</div>`;
    
    const errorElement = element.querySelector('.error-message');
    errorElement.style.animation = 'errorShake 0.5s ease-in-out';
}

// Função para animar números (contador)
function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Função para adicionar efeito parallax
function addParallaxEffect() {
    const pokeball = document.querySelector('.headerpokeball');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (pokeball) {
            pokeball.style.transform = `translateY(${rate}px) rotate(${scrolled * 0.1}deg)`;
        }
    });
}

// Função para inicializar todas as animações
function initializeAnimations() {
    // Anima cards na entrada
    animatePokemonCards();
    
    // Adiciona observer para scroll
    animateOnScroll();
    
    // Adiciona efeito ripple nos botões
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        addRippleEffect(button);
    });
    
    // Anima busca
    // animateSearch(); // Esta animação é acionada no evento de clique/enter da busca
    
    // Adiciona parallax
    addParallaxEffect();
    
    // Adiciona listeners para abas (a animação é chamada no listener principal)
    
    console.log('Animações inicializadas!');
}

// Função para otimizar performance
function optimizeAnimations() {
    // Reduz animações em dispositivos com pouca bateria
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            if (battery.level < 0.2) {
                document.body.classList.add('low-battery');
            }
        });
    }
    
    // Pausa animações quando a aba não está visível
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.body.style.animationPlayState = 'paused';
        } else {
            document.body.style.animationPlayState = 'running';
        }
    });
}

// Inicializa as animações quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initializeAnimations();
    optimizeAnimations();
});